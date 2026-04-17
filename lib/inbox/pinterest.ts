// Fetches comments on the user's Pinterest pins for the inbox.
// Normalizes them as "reply" reason messages.

import { getFreshToken, forceRefresh } from "@/lib/publishers/tokens";
import type { SyncResult, NormalizedMessage } from "./types";

const MAX_PINS = 10;
const MAX_COMMENTS_PER_PIN = 20;

type PinterestUser = {
	id: string;
	username: string;
	full_name?: string;
	profile_image_url?: string;
};

type PinterestPin = {
	id: string;
	title?: string;
	description?: string;
	link?: string;
	creator?: { id: string; username: string };
	created_at?: string;
};

type PinterestComment = {
	id: string;
	pin_id: string;
	text: string;
	created_at: string;
	updated_at: string;
	commenter?: {
		id: string;
		username: string;
		full_name?: string;
		profile_image_url?: string;
	};
};

type PinsResponse = {
	items: PinterestPin[];
	page?: { next_cursor?: string };
};

type CommentsResponse = {
	items: PinterestComment[];
	page?: { next_cursor?: string };
};

async function fetchUserAccount(accessToken: string): Promise<PinterestUser> {
	const res = await fetch("https://api.pinterest.com/v5/user_account", {
		headers: { Authorization: `Bearer ${accessToken}` },
	});
	if (!res.ok) {
		throw new Error(`Pinterest user_account failed: ${res.status}`);
	}
	return res.json() as Promise<PinterestUser>;
}

async function fetchUserPins(
	accessToken: string,
	userId: string,
	bookmark?: string,
): Promise<{ pins: PinterestPin[]; nextBookmark: string | null }> {
	const params = new URLSearchParams({ page_size: String(MAX_PINS) });
	if (bookmark) params.set("bookmark", bookmark);

	const res = await fetch(
		`https://api.pinterest.com/v5/pins?${params}`,
		{
			headers: { Authorization: `Bearer ${accessToken}` },
		},
	);

	if (!res.ok) {
		throw new Error(`Pinterest pins list failed: ${res.status}`);
	}

	const data = (await res.json()) as PinsResponse;
	return {
		pins: data.items ?? [],
		nextBookmark: data.page?.next_cursor ?? null,
	};
}

async function fetchPinComments(
	accessToken: string,
	pinId: string,
	bookmark?: string,
): Promise<{ comments: PinterestComment[]; nextBookmark: string | null }> {
	const params = new URLSearchParams({ page_size: String(MAX_COMMENTS_PER_PIN) });
	if (bookmark) params.set("bookmark", bookmark);

	const res = await fetch(
		`https://api.pinterest.com/v5/pins/${pinId}/comments?${params}`,
		{
			headers: { Authorization: `Bearer ${accessToken}` },
		},
	);

	if (!res.ok) {
		throw new Error(`Pinterest comments failed: ${res.status}`);
	}

	const data = (await res.json()) as CommentsResponse;
	return {
		comments: data.items ?? [],
		nextBookmark: data.page?.next_cursor ?? null,
	};
}

export async function fetchPinterestInbox(
	userId: string,
	cursor: string | null,
): Promise<SyncResult> {
	let account = await getFreshToken(userId, "pinterest");

	let user: PinterestUser;
	try {
		user = await fetchUserAccount(account.accessToken);
	} catch (err) {
		if (String(err).includes("401")) {
			account = await forceRefresh(userId, "pinterest");
			user = await fetchUserAccount(account.accessToken);
		} else {
			throw err;
		}
	}

	const messages: NormalizedMessage[] = [];

	let pinBookmark = cursor ?? undefined;
	let pinsFetched = 0;

	while (pinsFetched < MAX_PINS) {
		let pins: PinterestPin[];
		try {
			const result = await fetchUserPins(account.accessToken, user.id, pinBookmark);
			pins = result.pins;
			pinBookmark = result.nextBookmark ?? undefined;
		} catch (err) {
			if (String(err).includes("401") && pinsFetched === 0) {
				account = await forceRefresh(userId, "pinterest");
				const result = await fetchUserPins(account.accessToken, user.id, pinBookmark);
				pins = result.pins;
				pinBookmark = result.nextBookmark ?? undefined;
			} else {
				break;
			}
		}

		if (pins.length === 0) break;

		for (const pin of pins) {
			let commentBookmark: string | undefined;
			let commentsFetched = 0;

			while (commentsFetched < MAX_COMMENTS_PER_PIN) {
				let comments: PinterestComment[];
				try {
					const result = await fetchPinComments(account.accessToken, pin.id, commentBookmark);
					comments = result.comments;
					commentBookmark = result.nextBookmark ?? undefined;
				} catch {
					break;
				}

				if (comments.length === 0) break;

				for (const comment of comments) {
					if (comment.commenter?.id === user.id) {
						continue;
					}

					messages.push({
						remoteId: comment.id,
						threadId: pin.id,
						parentId: null,
						reason: "reply",
						authorDid: comment.commenter?.id ?? comment.id,
						authorHandle: comment.commenter?.username ?? "unknown",
						authorDisplayName:
							comment.commenter?.full_name ?? comment.commenter?.username ?? null,
						authorAvatarUrl: comment.commenter?.profile_image_url ?? null,
						content: comment.text,
						platformData: {
							pinId: pin.id,
							pinTitle: pin.title,
							commentCreatedAt: comment.created_at,
						},
						platformCreatedAt: new Date(comment.created_at),
					});
				}

				commentsFetched++;
				if (!commentBookmark) break;
			}
		}

		pinsFetched++;
		if (!pinBookmark) break;
	}

	return {
		messages,
		newCursor: pinBookmark ?? null,
	};
}
