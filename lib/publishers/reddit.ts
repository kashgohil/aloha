import type { PostMedia } from "@/db/schema";
import { categorizeHttpStatus, PublishError } from "./errors";
import { forceRefresh, getFreshToken, type ProviderAccount } from "./tokens";

export type RedditPostResult = {
	remotePostId: string;
	remoteUrl: string;
};

export type RedditCommentResult = {
	remotePostId: string;
	remoteUrl: string;
};

export type RedditDMResult = {
	remotePostId: string;
	remoteUrl: string;
};

async function getRedditUsername(accessToken: string): Promise<string> {
	const res = await fetch("https://oauth.reddit.com/api/v1/me", {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});
	if (!res.ok) {
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`Reddit userinfo failed (${res.status})`,
		);
	}
	const json = (await res.json()) as { name: string };
	return json.name;
}

async function uploadMedia(
	accessToken: string,
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

	const res = await fetch("https://oauth.reddit.com/api/media_upload.json", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": media.mimeType,
		},
		body: bytes,
	});

	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`Reddit media upload failed (${res.status}): ${detail.slice(0, 300)}`,
		);
	}

	const json = (await res.json()) as { id: string; src: string };
	return json.id;
}

async function createPost(
	accessToken: string,
	username: string,
	text: string,
	mediaIds: string[],
	subreddit?: string,
): Promise<{ id: string; url: string }> {
	const body: Record<string, unknown> = {
		api_type: "json",
		text,
		media_ids: mediaIds,
	};

	if (subreddit) {
		body.subreddit = subreddit;
		body.kind = "self";
	} else {
		body.kind = "self";
	}

	const res = await fetch("https://oauth.reddit.com/api/submit", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});

	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`Reddit post failed (${res.status}): ${detail.slice(0, 300)}`,
		);
	}

	const json = (await res.json()) as {
		json: {
			data: {
				id: string;
				url: string;
			};
		};
	};

	return {
		id: json.json.data.id,
		url: `https://www.reddit.com/user/${username}/comments/${json.json.data.id}`,
	};
}

async function createComment(
	accessToken: string,
	parentId: string,
	text: string,
): Promise<{ id: string; url: string }> {
	const res = await fetch("https://oauth.reddit.com/api/comment", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			api_type: "json",
			text,
			parent_id: parentId,
		}),
	});

	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`Reddit comment failed (${res.status}): ${detail.slice(0, 300)}`,
		);
	}

	const json = (await res.json()) as {
		json: {
			data: {
				id: string;
				parents: Record<string, { id: string; children: string[] }>;
			};
		};
	};

	const commentId = json.json.data.id;
	const parentData = Object.values(json.json.data.parents)[0];
	const postId = parentData?.id ?? commentId;

	return {
		id: commentId,
		url: `https://www.reddit.com/r/${postId}/_/${commentId}`,
	};
}

async function sendDM(
	accessToken: string,
	to: string,
	text: string,
): Promise<{ id: string }> {
	const res = await fetch("https://oauth.reddit.com/api/compose", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			api_type: "json",
			text,
			to,
		}),
	});

	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`Reddit DM failed (${res.status}): ${detail.slice(0, 300)}`,
		);
	}

	const json = (await res.json()) as {
		json: {
			data: {
				id: string;
			};
		};
	};

	return {
		id: json.json.data.id,
	};
}

export async function publishToReddit(args: {
	userId: string;
	text: string;
	media?: PostMedia[];
	subreddit?: string;
}): Promise<RedditPostResult> {
	let account: ProviderAccount;
	try {
		account = await getFreshToken(args.userId, "reddit");
	} catch (err) {
		if (err instanceof PublishError && err.category === "needs_reauth") {
			account = await forceRefresh(args.userId, "reddit");
		} else {
			throw err;
		}
	}

	const username = await getRedditUsername(account.accessToken);

	const mediaIds: string[] = [];
	if (args.media && args.media.length > 0) {
		for (const m of args.media) {
			const id = await uploadMedia(account.accessToken, m);
			mediaIds.push(id);
		}
	}

	const { id, url } = await createPost(
		account.accessToken,
		username,
		args.text,
		mediaIds,
		args.subreddit,
	);

	return {
		remotePostId: id,
		remoteUrl: url,
	};
}

export async function commentOnReddit(args: {
	userId: string;
	parentId: string;
	text: string;
}): Promise<RedditCommentResult> {
	let account: ProviderAccount;
	try {
		account = await getFreshToken(args.userId, "reddit");
	} catch (err) {
		if (err instanceof PublishError && err.category === "needs_reauth") {
			account = await forceRefresh(args.userId, "reddit");
		} else {
			throw err;
		}
	}

	const { id, url } = await createComment(
		account.accessToken,
		args.parentId,
		args.text,
	);

	return {
		remotePostId: id,
		remoteUrl: url,
	};
}

export async function sendRedditDM(args: {
	userId: string;
	to: string;
	text: string;
}): Promise<RedditDMResult> {
	let account: ProviderAccount;
	try {
		account = await getFreshToken(args.userId, "reddit");
	} catch (err) {
		if (err instanceof PublishError && err.category === "needs_reauth") {
			account = await forceRefresh(args.userId, "reddit");
		} else {
			throw err;
		}
	}

	const { id } = await sendDM(account.accessToken, args.to, args.text);

	return {
		remotePostId: id,
		remoteUrl: `https://www.reddit.com/message/messages/${id}`,
	};
}
