// Posts videos to TikTok via the Content Posting API.
//
// Required OAuth scopes: `video.upload`, `video.publish`. Existing
// connections using only `user.info.basic` will get 403 / 401 from the
// publish endpoint — the dispatcher surfaces that as `needs_reauth` so
// the user is prompted to reconnect with the right scopes.
//
// Mode: PULL_FROM_URL — TikTok fetches the file from our hosted media
// URL. The asset must be publicly reachable (which the /api/upload
// outputs already are).

import type { PostMedia } from "@/db/schema";
import { categorizeHttpStatus, PublishError } from "./errors";
import { getFreshToken, type ProviderAccount } from "./tokens";

export type TikTokPostResult = {
	remotePostId: string;
	remoteUrl: string;
};

export type TikTokPrivacyLevel =
	| "PUBLIC_TO_EVERYONE"
	| "MUTUAL_FOLLOW_FRIENDS"
	| "FOLLOWER_OF_CREATOR"
	| "SELF_ONLY";

async function postJson(
	account: ProviderAccount,
	url: string,
	body: unknown,
): Promise<Response> {
	return fetch(url, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${account.accessToken}`,
			"Content-Type": "application/json; charset=UTF-8",
		},
		body: JSON.stringify(body),
	});
}

async function pollPublishStatus(
	account: ProviderAccount,
	publishId: string,
): Promise<{ status: string; postId?: string }> {
	for (let i = 0; i < 30; i++) {
		const res = await postJson(
			account,
			"https://open.tiktokapis.com/v2/post/publish/status/fetch/",
			{ publish_id: publishId },
		);
		const json = (await res.json().catch(() => null)) as {
			data?: { status?: string; publicaly_available_post_id?: string[] };
		} | null;
		const status = json?.data?.status ?? "UNKNOWN";
		if (status === "PUBLISH_COMPLETE") {
			return {
				status,
				postId: json?.data?.publicaly_available_post_id?.[0],
			};
		}
		if (status === "FAILED") {
			throw new PublishError(
				"invalid_content",
				"TikTok rejected the video during processing.",
			);
		}
		await new Promise((r) => setTimeout(r, 2000));
	}
	// Timed out waiting for PUBLISH_COMPLETE. Treat as transient — the
	// post may still finish in the background, but we don't have an id
	// to record yet. Returning here lets the caller mark the delivery as
	// transient/failed rather than fabricate a success.
	throw new PublishError(
		"transient",
		"TikTok publish did not finish in time.",
	);
}

export async function publishToTikTok(args: {
	workspaceId: string;
	title: string;
	video: PostMedia;
	privacyLevel: TikTokPrivacyLevel;
	disableComment?: boolean;
	disableDuet?: boolean;
	disableStitch?: boolean;
	// Branded-content disclosures. TikTok rejects the publish if either
	// toggle is set without the right creator info, so the editor only
	// flips these when the user explicitly opts in.
	brandContentToggle?: boolean;
	brandOrganicToggle?: boolean;
	coverTimestampMs?: number;
}): Promise<TikTokPostResult> {
	if (!args.video.mimeType.startsWith("video/")) {
		throw new PublishError(
			"invalid_content",
			"TikTok posts require a video file.",
		);
	}
	const account = await getFreshToken(args.workspaceId, "tiktok");

	const initRes = await postJson(
		account,
		"https://open.tiktokapis.com/v2/post/publish/video/init/",
		{
			post_info: {
				title: args.title.slice(0, 2200),
				privacy_level: args.privacyLevel,
				disable_comment: args.disableComment ?? false,
				disable_duet: args.disableDuet ?? false,
				disable_stitch: args.disableStitch ?? false,
				video_cover_timestamp_ms: args.coverTimestampMs ?? 1000,
				brand_content_toggle: args.brandContentToggle ?? false,
				brand_organic_toggle: args.brandOrganicToggle ?? false,
			},
			source_info: {
				source: "PULL_FROM_URL",
				video_url: args.video.url,
			},
		},
	);

	if (!initRes.ok) {
		const detail = await initRes.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(initRes.status),
			`TikTok publish init failed (${initRes.status}): ${detail.slice(0, 400)}`,
		);
	}

	const initJson = (await initRes.json()) as {
		data?: { publish_id?: string };
		error?: { code?: string; message?: string };
	};
	if (initJson.error?.code && initJson.error.code !== "ok") {
		throw new PublishError(
			"invalid_content",
			`TikTok publish init rejected: ${initJson.error.message ?? initJson.error.code}`,
		);
	}
	const publishId = initJson.data?.publish_id;
	if (!publishId) {
		throw new PublishError(
			"transient",
			"TikTok publish init returned no publish_id",
		);
	}

	const result = await pollPublishStatus(account, publishId);
	const postId = result.postId ?? publishId;
	return {
		remotePostId: postId,
		remoteUrl: result.postId
			? `https://www.tiktok.com/video/${result.postId}`
			: "https://www.tiktok.com/",
	};
}
