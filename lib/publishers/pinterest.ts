// Posts pins to Pinterest via the v5 API.
// Supports: standard pins with image and destination link.
// Requires scopes: pins:read,pins:write,boards:read,boards:write,user_accounts:read

import type { PostMedia } from "@/db/schema";
import { categorizeHttpStatus, PublishError } from "./errors";
import { forceRefresh, getFreshToken, type ProviderAccount } from "./tokens";

export type PinterestPostResult = {
	remotePostId: string;
	remoteUrl: string;
};

type PinterestUser = {
	id: string;
	username: string;
};

type PinterestBoard = {
	id: string;
	name: string;
};

async function getUserAccount(account: ProviderAccount): Promise<PinterestUser> {
	const res = await fetch("https://api.pinterest.com/v5/user_account", {
		headers: { Authorization: `Bearer ${account.accessToken}` },
	});
	if (!res.ok) {
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`Pinterest user_account failed (${res.status}): ${await res.text().catch(() => "")}`,
		);
	}
	const data = (await res.json()) as PinterestUser;
	return data;
}

async function getOrCreateBoard(
	account: ProviderAccount,
	boardName = "Aloha Pins",
): Promise<PinterestBoard> {
	const listRes = await fetch(
		`https://api.pinterest.com/v5/boards?query=${encodeURIComponent(boardName)}&page_size=1`,
		{
			headers: { Authorization: `Bearer ${account.accessToken}` },
		},
	);

	if (listRes.ok) {
		const listData = (await listRes.json()) as { items: PinterestBoard[] };
		if (listData.items && listData.items.length > 0) {
			return listData.items[0];
		}
	}

	const createRes = await fetch("https://api.pinterest.com/v5/boards", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${account.accessToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			name: boardName,
			description: "Pins scheduled via Aloha",
			visibility: "PUBLIC",
		}),
	});

	if (!createRes.ok) {
		throw new PublishError(
			categorizeHttpStatus(createRes.status),
			`Pinterest create board failed (${createRes.status}): ${await createRes.text().catch(() => "")}`,
		);
	}

	const created = (await createRes.json()) as PinterestBoard;
	return created;
}

async function uploadMedia(
	account: ProviderAccount,
	media: PostMedia,
): Promise<string> {
	const bin = await fetch(media.url);
	if (!bin.ok) {
		throw new PublishError(
			"transient",
			`Could not fetch media (${bin.status}) from ${media.url}`,
		);
	}
	const bytes = await bin.arrayBuffer();

	const uploadRes = await fetch("https://api.pinterest.com/v5/media", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${account.accessToken}`,
			"Content-Type": media.mimeType,
			"Media-Type": media.mimeType,
		},
		body: bytes,
	});

	if (!uploadRes.ok) {
		throw new PublishError(
			categorizeHttpStatus(uploadRes.status),
			`Pinterest media upload failed (${uploadRes.status}): ${await uploadRes.text().catch(() => "")}`,
		);
	}

	const uploadData = (await uploadRes.json()) as { media_id: string };
	return uploadData.media_id;
}

async function createPin(
	account: ProviderAccount,
	boardId: string,
	title: string,
	description: string,
	mediaId: string | null,
	link: string | null,
): Promise<{ pinId: string; pinUrl: string }> {
	const pinData: Record<string, unknown> = {
		board_id: boardId,
		title: title.slice(0, 100),
		description: description.slice(0, 500),
	};

	if (mediaId) {
		pinData.media_source = {
			source_type: "media_id",
			media_id: mediaId,
		};
	}

	if (link) {
		pinData.link = link;
	}

	const res = await fetch("https://api.pinterest.com/v5/pins", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${account.accessToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(pinData),
	});

	if (!res.ok) {
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`Pinterest create pin failed (${res.status}): ${await res.text().catch(() => "")}`,
		);
	}

	const pin = (await res.json()) as { id: string };
	return {
		pinId: pin.id,
		pinUrl: `https://www.pinterest.com/pin/${pin.id}/`,
	};
}

export async function publishToPinterest(args: {
	workspaceId: string;
	text: string;
	media?: PostMedia[];
	link?: string | null;
	// Explicit title/description override the auto-derive-from-text
	// behavior. Studio Pin form always sets these; legacy fanout flow
	// passes only `text` and relies on the 100/500 char slice fallback.
	title?: string;
	description?: string;
}): Promise<PinterestPostResult> {
	let account = await getFreshToken(args.workspaceId, "pinterest");

	const user = await getUserAccount(account);
	account.providerAccountId = user.username;

	const board = await getOrCreateBoard(account);

	const title = args.title?.trim() || args.text.slice(0, 100);
	const description = args.description?.trim() || args.text.slice(0, 500);

	let mediaId: string | null = null;
	if (args.media && args.media.length > 0) {
		try {
			mediaId = await uploadMedia(account, args.media[0]);
		} catch (err) {
			if (err instanceof PublishError && err.category === "needs_reauth") {
				account = await forceRefresh(args.workspaceId, "pinterest");
				mediaId = await uploadMedia(account, args.media[0]);
			} else {
				throw err;
			}
		}
	}

	try {
		const result = await createPin(
			account,
			board.id,
			title,
			description,
			mediaId,
			args.link ?? null,
		);
		return {
			remotePostId: result.pinId,
			remoteUrl: result.pinUrl,
		};
	} catch (err) {
		if (err instanceof PublishError && err.category === "needs_reauth") {
			account = await forceRefresh(args.workspaceId, "pinterest");
			const result = await createPin(
				account,
				board.id,
				title,
				description,
				mediaId,
				args.link ?? null,
			);
			return {
				remotePostId: result.pinId,
				remoteUrl: result.pinUrl,
			};
		}
		throw err;
	}
}
