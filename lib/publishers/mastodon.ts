import { eq } from "drizzle-orm";
import type { PostMedia } from "@/db/schema";
import { db } from "@/db";
import { mastodonCredentials } from "@/db/schema";
import { PublishError, categorizeHttpStatus } from "./errors";

export type MastodonPostResult = {
	remotePostId: string;
	remoteUrl: string;
};

type MastodonCredentials = {
	instanceUrl: string;
	accessToken: string;
	accountId: string;
	username: string;
};

export async function getMastodonCredentials(workspaceId: string): Promise<MastodonCredentials> {
	const [row] = await db
		.select({
			instanceUrl: mastodonCredentials.instanceUrl,
			accessToken: mastodonCredentials.accessToken,
			accountId: mastodonCredentials.accountId,
			username: mastodonCredentials.username,
		})
		.from(mastodonCredentials)
		.where(eq(mastodonCredentials.workspaceId, workspaceId))
		.limit(1);

	if (!row || !row.accessToken) {
		throw new PublishError(
			"needs_reauth",
			"Mastodon account not connected. Please connect your Mastodon account.",
		);
	}

	return {
		instanceUrl: row.instanceUrl,
		accessToken: row.accessToken,
		accountId: row.accountId,
		username: row.username,
	};
}

async function uploadMedia(
	instanceUrl: string,
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

	const form = new FormData();
	const filename = media.url.split("/").pop()?.split("?")[0] || "upload";
	form.append(
		"file",
		new Blob([bytes], { type: media.mimeType }),
		filename,
	);
	if (media.alt) form.append("description", media.alt);

	const res = await fetch(`${instanceUrl}/api/v2/media`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
		body: form,
	});

	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`Mastodon media upload failed (${res.status}): ${detail.slice(0, 300)}`,
		);
	}

	const json = (await res.json()) as { id: string };

	// v2/media returns 202 while processing. Statuses POST will 422 if the
	// attachment isn't ready yet, so poll briefly until the server reports
	// it's done (200 from /api/v1/media/:id).
	if (res.status === 202) {
		const deadline = Date.now() + 30_000;
		while (Date.now() < deadline) {
			await new Promise((r) => setTimeout(r, 1000));
			const check = await fetch(`${instanceUrl}/api/v1/media/${json.id}`, {
				headers: { Authorization: `Bearer ${accessToken}` },
			});
			if (check.status === 200) break;
			if (check.status !== 206) {
				const detail = await check.text().catch(() => "");
				throw new PublishError(
					categorizeHttpStatus(check.status),
					`Mastodon media processing failed (${check.status}): ${detail.slice(0, 300)}`,
				);
			}
		}
	}

	return json.id;
}

async function createStatus(
	instanceUrl: string,
	accessToken: string,
	username: string,
	text: string,
	mediaIds: string[],
	opts?: { spoilerText?: string; inReplyToId?: string },
): Promise<{ id: string; url: string }> {
	const body: Record<string, unknown> = {
		status: text,
		media_ids: mediaIds,
		visibility: "public",
	};
	if (opts?.spoilerText) body.spoiler_text = opts.spoilerText;
	if (opts?.inReplyToId) body.in_reply_to_id = opts.inReplyToId;
	const res = await fetch(`${instanceUrl}/api/v1/statuses`, {
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
			`Mastodon post failed (${res.status}): ${detail.slice(0, 300)}`,
		);
	}

	const json = (await res.json()) as { id: string; url: string };
	return { id: json.id, url: json.url };
}

export async function publishToMastodon(args: {
	workspaceId: string;
	text: string;
	media?: PostMedia[];
	spoilerText?: string;
}): Promise<MastodonPostResult> {
	const credentials = await getMastodonCredentials(args.workspaceId);

	const mediaIds: string[] = [];
	if (args.media && args.media.length > 0) {
		for (const m of args.media) {
			const id = await uploadMedia(credentials.instanceUrl, credentials.accessToken, m);
			mediaIds.push(id);
		}
	}

	const { id, url } = await createStatus(
		credentials.instanceUrl,
		credentials.accessToken,
		credentials.username,
		args.text,
		mediaIds,
		{ spoilerText: args.spoilerText },
	);

	return {
		remotePostId: id,
		remoteUrl: url,
	};
}

// Post a Mastodon thread by chaining replies via in_reply_to_id. Every
// part inherits the thread-level spoiler text so the CW applies across
// the whole chain (Mastodon clients treat per-status CWs independently).
// On mid-thread failure, delete already-posted statuses (latest-first).
export async function publishMastodonThread(args: {
	workspaceId: string;
	parts: { text: string; media?: PostMedia[] }[];
	spoilerText?: string;
}): Promise<MastodonPostResult> {
	if (args.parts.length === 0) {
		throw new PublishError("invalid_content", "Thread has no parts");
	}
	const credentials = await getMastodonCredentials(args.workspaceId);

	let inReplyToId: string | undefined;
	let headId: string | undefined;
	let headUrl: string | undefined;
	const posted: string[] = [];

	for (let i = 0; i < args.parts.length; i++) {
		const part = args.parts[i];
		try {
			const mediaIds: string[] = [];
			for (const m of part.media ?? []) {
				mediaIds.push(
					await uploadMedia(
						credentials.instanceUrl,
						credentials.accessToken,
						m,
					),
				);
			}
			const { id, url } = await createStatus(
				credentials.instanceUrl,
				credentials.accessToken,
				credentials.username,
				part.text,
				mediaIds,
				{ spoilerText: args.spoilerText, inReplyToId },
			);
			posted.push(id);
			if (!headId) {
				headId = id;
				headUrl = url;
			}
			inReplyToId = id;
		} catch (err) {
			for (const id of posted.slice().reverse()) {
				try {
					await fetch(
						`${credentials.instanceUrl}/api/v1/statuses/${id}`,
						{
							method: "DELETE",
							headers: {
								Authorization: `Bearer ${credentials.accessToken}`,
							},
						},
					);
				} catch {
					// swallow — compensation is opportunistic
				}
			}
			throw err;
		}
	}

	return { remotePostId: headId!, remoteUrl: headUrl! };
}