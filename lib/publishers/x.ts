// Posts tweets (text + optional images) via the X v2 API.
//
// Scopes required: `tweet.write`, `users.read`, `offline.access`, and — if
// publishing images — `media.write`. If the user connected before we added
// media.write, their token will lack it and the media-upload call will 403;
// surface as needs_reauth so they re-link.
//
// Rate limits bite at the Free tier — Basic ($200/mo) is the realistic prod
// tier. We cap at 4 images (X limit; matches composer).

import type { PostMedia } from "@/db/schema";
import { categorizeHttpStatus, PublishError } from "./errors";
import { forceRefresh, getFreshToken, type ProviderAccount } from "./tokens";

export type XPostResult = {
	remotePostId: string;
	remoteUrl: string;
};

async function uploadMediaItem(
	account: ProviderAccount,
	media: PostMedia,
): Promise<string> {
	const bin = await fetch(media.url);
	if (!bin.ok) {
		throw new PublishError(
			"transient",
			`Could not fetch uploaded media (${bin.status}) from ${media.url}`,
		);
	}
	const blob = await bin.blob();
	const form = new FormData();
	form.append("media", new File([blob], "upload", { type: media.mimeType }));
	form.append("media_category", "tweet_image");

	const res = await fetch("https://api.x.com/2/media/upload", {
		method: "POST",
		headers: { Authorization: `Bearer ${account.accessToken}` },
		body: form,
	});
	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`X media upload failed (${res.status}): ${detail.slice(0, 400)}`,
		);
	}
	const json = (await res.json().catch(() => null)) as
		| { data?: { id?: string }; media_id_string?: string }
		| null;
	const id = json?.data?.id ?? json?.media_id_string;
	if (!id) {
		throw new PublishError("transient", "X media upload returned no id");
	}
	return id;
}

async function uploadMedia(
	account: ProviderAccount,
	media: PostMedia[],
): Promise<string[]> {
	const ids: string[] = [];
	for (const m of media) ids.push(await uploadMediaItem(account, m));
	return ids;
}

async function callCreateTweet(
	account: ProviderAccount,
	text: string,
	mediaIds: string[],
	replyToId?: string,
	poll?: { options: string[]; durationMinutes: number },
): Promise<Response> {
	const body: Record<string, unknown> = { text };
	if (mediaIds.length > 0) body.media = { media_ids: mediaIds };
	if (replyToId) body.reply = { in_reply_to_tweet_id: replyToId };
	if (poll) {
		body.poll = {
			options: poll.options,
			duration_minutes: poll.durationMinutes,
		};
	}
	return fetch("https://api.x.com/2/tweets", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${account.accessToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});
}

// Best-effort delete for thread compensation. Swallowed on failure — the
// user gets a notification anyway with a partial-thread warning, and
// surfacing a nested error would muddy the original root cause.
async function deleteTweet(
	account: ProviderAccount,
	tweetId: string,
): Promise<void> {
	try {
		await fetch(`https://api.x.com/2/tweets/${tweetId}`, {
			method: "DELETE",
			headers: { Authorization: `Bearer ${account.accessToken}` },
		});
	} catch {
		// ignore — compensation is opportunistic
	}
}

export async function publishToX(args: {
	workspaceId: string;
	text: string;
	media?: PostMedia[];
}): Promise<XPostResult> {
	let account = await getFreshToken(args.workspaceId, "twitter");
	const media = args.media ?? [];
	let mediaIds: string[] = [];
	if (media.length > 0) {
		try {
			mediaIds = await uploadMedia(account, media);
		} catch (err) {
			if (err instanceof PublishError && err.category === "needs_reauth") {
				account = await forceRefresh(args.workspaceId, "twitter");
				mediaIds = await uploadMedia(account, media);
			} else {
				throw err;
			}
		}
	}

	let res = await callCreateTweet(account, args.text, mediaIds);

	if (res.status === 401) {
		try {
			account = await forceRefresh(args.workspaceId, "twitter");
			res = await callCreateTweet(account, args.text, mediaIds);
		} catch (err) {
			throw err instanceof PublishError
				? err
				: new PublishError("needs_reauth", "X token refresh failed", err);
		}
	}

	if (!res.ok) {
		const category = categorizeHttpStatus(res.status);
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			category,
			`X publish failed (${res.status}): ${detail.slice(0, 400)}`,
		);
	}

	const json = (await res.json().catch(() => null)) as
		| { data?: { id?: string; text?: string } }
		| null;
	const id = json?.data?.id;
	if (!id) {
		throw new PublishError("transient", "X publish returned no tweet id");
	}
	return {
		remotePostId: id,
		remoteUrl: `https://x.com/i/web/status/${id}`,
	};
}

// Post a connected thread: each part is a tweet that replies to the
// previous part. On mid-thread failure, delete every tweet already
// posted in this run so the user isn't left with an orphaned partial
// thread — then surface the original error.
//
// Returns the head tweet's id / url (what subscribers see first).
export async function publishXThread(args: {
	workspaceId: string;
	parts: { text: string; media?: PostMedia[] }[];
}): Promise<XPostResult> {
	if (args.parts.length === 0) {
		throw new PublishError("invalid_content", "Thread has no parts");
	}
	let account = await getFreshToken(args.workspaceId, "twitter");
	const posted: string[] = [];
	let replyTo: string | undefined;
	let headId: string | undefined;

	for (let i = 0; i < args.parts.length; i++) {
		const part = args.parts[i];
		const media = part.media ?? [];
		let mediaIds: string[] = [];
		try {
			if (media.length > 0) {
				try {
					mediaIds = await uploadMedia(account, media);
				} catch (err) {
					if (err instanceof PublishError && err.category === "needs_reauth") {
						account = await forceRefresh(args.workspaceId, "twitter");
						mediaIds = await uploadMedia(account, media);
					} else {
						throw err;
					}
				}
			}

			let res = await callCreateTweet(account, part.text, mediaIds, replyTo);
			if (res.status === 401) {
				account = await forceRefresh(args.workspaceId, "twitter");
				res = await callCreateTweet(account, part.text, mediaIds, replyTo);
			}
			if (!res.ok) {
				const category = categorizeHttpStatus(res.status);
				const detail = await res.text().catch(() => "");
				throw new PublishError(
					category,
					`X thread part ${i + 1} failed (${res.status}): ${detail.slice(0, 400)}`,
				);
			}
			const json = (await res.json().catch(() => null)) as
				| { data?: { id?: string } }
				| null;
			const id = json?.data?.id;
			if (!id) {
				throw new PublishError("transient", "X thread part returned no id");
			}
			posted.push(id);
			if (!headId) headId = id;
			replyTo = id;
		} catch (err) {
			// Compensate: roll back anything we already posted. Iterate
			// latest-first so the thread tail disappears before its head.
			for (const id of posted.slice().reverse()) {
				await deleteTweet(account, id);
			}
			throw err;
		}
	}

	return {
		remotePostId: headId!,
		remoteUrl: `https://x.com/i/web/status/${headId!}`,
	};
}

// Post a tweet with a poll attached. X rejects polls with media on the
// same tweet, so `media` is intentionally absent from the signature.
export async function publishXPoll(args: {
	workspaceId: string;
	text: string;
	options: string[];
	durationMinutes: number;
}): Promise<XPostResult> {
	let account = await getFreshToken(args.workspaceId, "twitter");
	let res = await callCreateTweet(account, args.text, [], undefined, {
		options: args.options,
		durationMinutes: args.durationMinutes,
	});
	if (res.status === 401) {
		account = await forceRefresh(args.workspaceId, "twitter");
		res = await callCreateTweet(account, args.text, [], undefined, {
			options: args.options,
			durationMinutes: args.durationMinutes,
		});
	}
	if (!res.ok) {
		const category = categorizeHttpStatus(res.status);
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			category,
			`X poll publish failed (${res.status}): ${detail.slice(0, 400)}`,
		);
	}
	const json = (await res.json().catch(() => null)) as
		| { data?: { id?: string } }
		| null;
	const id = json?.data?.id;
	if (!id) {
		throw new PublishError("transient", "X poll publish returned no id");
	}
	return {
		remotePostId: id,
		remoteUrl: `https://x.com/i/web/status/${id}`,
	};
}
