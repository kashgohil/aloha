import type { PostMedia } from "@/db/schema";
import { categorizeHttpStatus, PublishError } from "./errors";
import { forceRefresh, getFreshToken, type ProviderAccount } from "./tokens";

export type FacebookPostResult = {
	remotePostId: string;
	remoteUrl: string;
};

type FacebookPage = {
	id: string;
	name: string;
	access_token: string;
};

async function getUserPages(account: ProviderAccount): Promise<FacebookPage[]> {
	const res = await fetch(
		`https://graph.facebook.com/v19.0/me/accounts?access_token=${account.accessToken}`,
	);
	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`Facebook get pages failed (${res.status}): ${detail.slice(0, 400)}`,
		);
	}
	const json = (await res.json()) as { data?: FacebookPage[] };
	return json.data ?? [];
}

async function uploadPhoto(
	pageAccessToken: string,
	mediaUrl: string,
	mimeType: string,
	caption: string,
): Promise<string> {
	const form = new FormData();
	const bin = await fetch(mediaUrl);
	if (!bin.ok) {
		throw new PublishError(
			"transient",
			`Could not fetch uploaded media (${bin.status}) from ${mediaUrl}`,
		);
	}
	const blob = await bin.blob();
	form.append("url", blob, "upload");
	form.append("caption", caption);

	const res = await fetch(
		`https://graph.facebook.com/v19.0/me/photos?access_token=${pageAccessToken}`,
		{
			method: "POST",
			body: form,
		},
	);
	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`Facebook photo upload failed (${res.status}): ${detail.slice(0, 400)}`,
		);
	}
	const json = (await res.json()) as { id?: string; post_id?: string };
	return json.id ?? json.post_id ?? "";
}

async function createTextPost(
	pageAccessToken: string,
	pageId: string,
	text: string,
): Promise<{ id: string; url: string }> {
	const res = await fetch(
		`https://graph.facebook.com/v19.0/${pageId}/feed?access_token=${pageAccessToken}`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ message: text }),
		},
	);
	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`Facebook post failed (${res.status}): ${detail.slice(0, 400)}`,
		);
	}
	const json = (await res.json()) as { id?: string; post_id?: string };
	const id = json.id ?? json.post_id;
	if (!id) {
		throw new PublishError("transient", "Facebook post returned no id");
	}
	return { id, url: `https://www.facebook.com/${id}` };
}

export async function publishToFacebook(args: {
	workspaceId: string;
	text: string;
	media?: PostMedia[];
}): Promise<FacebookPostResult> {
	let account = await getFreshToken(args.workspaceId, "facebook");

	let pages: FacebookPage[];
	try {
		pages = await getUserPages(account);
	} catch (err) {
		if (err instanceof PublishError && err.category === "needs_reauth") {
			account = await forceRefresh(args.workspaceId, "facebook");
			pages = await getUserPages(account);
		} else {
			throw err;
		}
	}

	if (pages.length === 0) {
		throw new PublishError(
			"forbidden",
			"No Facebook Pages found. Connect a Page to publish.",
		);
	}

	const page = pages[0];
	const media = args.media ?? [];

	if (media.length === 0) {
		const post = await createTextPost(page.access_token, page.id, args.text);
		return { remotePostId: post.id, remoteUrl: post.url };
	}

	if (media.length === 1) {
		const photoId = await uploadPhoto(
			page.access_token,
			media[0].url,
			media[0].mimeType,
			args.text,
		);
		return {
			remotePostId: photoId,
			remoteUrl: `https://www.facebook.com/photo?fbid=${photoId}`,
		};
	}

	const photoIds: string[] = [];
	for (const m of media) {
		const photoId = await uploadPhoto(
			page.access_token,
			m.url,
			m.mimeType,
			"",
		);
		photoIds.push(photoId);
	}

	const attachedMedia = photoIds.map((pid) => ({ media_fbid: pid }));
	const res = await fetch(
		`https://graph.facebook.com/v19.0/${page.id}/feed?access_token=${page.access_token}`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				message: args.text,
				attached_media: attachedMedia,
			}),
		},
	);
	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`Facebook carousel post failed (${res.status}): ${detail.slice(0, 400)}`,
		);
	}
	const json = (await res.json()) as { id?: string };
	const id = json.id;
	if (!id) {
		throw new PublishError("transient", "Facebook carousel post returned no id");
	}
	return { remotePostId: id, remoteUrl: `https://www.facebook.com/${id}` };
}

// Resolve the first connected Page + its access token. Used by Reel
// publishing so it doesn't redo the same discovery loop as the feed
// publisher above.
async function resolveFacebookPage(workspaceId: string): Promise<{
	page: FacebookPage;
}> {
	let account = await getFreshToken(workspaceId, "facebook");
	let pages: FacebookPage[];
	try {
		pages = await getUserPages(account);
	} catch (err) {
		if (err instanceof PublishError && err.category === "needs_reauth") {
			account = await forceRefresh(workspaceId, "facebook");
			pages = await getUserPages(account);
		} else {
			throw err;
		}
	}
	if (pages.length === 0) {
		throw new PublishError(
			"forbidden",
			"No Facebook Pages found. Connect a Page to publish.",
		);
	}
	return { page: pages[0] };
}

// Publish a Reel to a Facebook Page using the resumable Reels upload
// flow: start → upload bytes → finish (with `video_state: PUBLISHED`).
export async function publishFacebookReel(args: {
	workspaceId: string;
	description: string;
	video: PostMedia;
}): Promise<FacebookPostResult> {
	if (!args.video.mimeType.startsWith("video/")) {
		throw new PublishError(
			"invalid_content",
			"Reels require a video file.",
		);
	}
	const { page } = await resolveFacebookPage(args.workspaceId);
	const pageAccessToken = page.access_token;

	// Pull the bytes once so we know the size up front.
	const bin = await fetch(args.video.url);
	if (!bin.ok) {
		throw new PublishError(
			"transient",
			`Could not fetch video (${bin.status}) from ${args.video.url}`,
		);
	}
	const bytes = await bin.arrayBuffer();
	const fileSize = bytes.byteLength;

	const startRes = await fetch(
		`https://graph.facebook.com/v19.0/${page.id}/video_reels?upload_phase=start&file_size=${fileSize}&access_token=${pageAccessToken}`,
		{ method: "POST" },
	);
	if (!startRes.ok) {
		const detail = await startRes.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(startRes.status),
			`Facebook Reel start failed (${startRes.status}): ${detail.slice(0, 400)}`,
		);
	}
	const startJson = (await startRes.json()) as {
		video_id?: string;
		upload_url?: string;
	};
	const videoId = startJson.video_id;
	const uploadUrl = startJson.upload_url;
	if (!videoId || !uploadUrl) {
		throw new PublishError(
			"transient",
			"Facebook Reel start returned no video_id / upload_url",
		);
	}

	const uploadRes = await fetch(uploadUrl, {
		method: "POST",
		headers: {
			Authorization: `OAuth ${pageAccessToken}`,
			offset: "0",
			file_size: String(fileSize),
			"Content-Type": "application/octet-stream",
		},
		body: bytes,
	});
	if (!uploadRes.ok) {
		const detail = await uploadRes.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(uploadRes.status),
			`Facebook Reel upload failed (${uploadRes.status}): ${detail.slice(0, 400)}`,
		);
	}

	const finishUrl = new URL(
		`https://graph.facebook.com/v19.0/${page.id}/video_reels`,
	);
	finishUrl.searchParams.set("upload_phase", "finish");
	finishUrl.searchParams.set("video_id", videoId);
	finishUrl.searchParams.set("video_state", "PUBLISHED");
	finishUrl.searchParams.set("description", args.description);
	finishUrl.searchParams.set("access_token", pageAccessToken);
	const finishRes = await fetch(finishUrl.toString(), { method: "POST" });
	if (!finishRes.ok) {
		const detail = await finishRes.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(finishRes.status),
			`Facebook Reel finish failed (${finishRes.status}): ${detail.slice(0, 400)}`,
		);
	}

	return {
		remotePostId: videoId,
		remoteUrl: `https://www.facebook.com/reel/${videoId}`,
	};
}