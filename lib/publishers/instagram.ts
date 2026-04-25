import type { PostMedia } from "@/db/schema";
import { categorizeHttpStatus, PublishError } from "./errors";
import { forceRefresh, getFreshToken, type ProviderAccount } from "./tokens";

export type InstagramPostResult = {
	remotePostId: string;
	remoteUrl: string;
};

type IgUser = {
	id: string;
	username: string;
};

async function getInstagramBusinessAccount(
	account: ProviderAccount,
): Promise<IgUser> {
	const res = await fetch(
		`https://graph.facebook.com/v19.0/me/accounts?access_token=${account.accessToken}`,
	);
	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`Facebook pages fetch failed (${res.status}): ${detail.slice(0, 400)}`,
		);
	}
	const pages = (await res.json()) as {
		data?: Array<{ id: string; name: string; access_token: string }>;
	};
	const page = pages.data?.[0];
	if (!page) {
		throw new PublishError(
			"forbidden",
			"No Facebook Page found. Instagram business requires a linked Page.",
		);
	}

	const igRes = await fetch(
		`https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`,
	);
	if (!igRes.ok) {
		const detail = await igRes.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(igRes.status),
			`Instagram business account fetch failed (${igRes.status}): ${detail.slice(0, 400)}`,
		);
	}
	const igData = (await igRes.json()) as {
		instagram_business_account?: { id: string; username: string };
	};
	const igAccount = igData.instagram_business_account;
	if (!igAccount) {
		throw new PublishError(
			"forbidden",
			"No Instagram business account linked. Convert to business/creator first.",
		);
	}
	return { id: igAccount.id, username: igAccount.username };
}

async function createMediaItem(
	igUserId: string,
	pageAccessToken: string,
	mediaUrl: string,
	mimeType: string,
	caption: string,
	isVideo: boolean,
): Promise<string> {
	const endpoint = isVideo
		? `https://graph.facebook.com/v19.0/${igUserId}/media_video`
		: `https://graph.facebook.com/v19.0/${igUserId}/media`;

	const form = new FormData();
	form.append("image_url", mediaUrl);
	form.append("caption", caption);

	const res = await fetch(`${endpoint}?access_token=${pageAccessToken}`, {
		method: "POST",
		body: form,
	});
	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`Instagram media creation failed (${res.status}): ${detail.slice(0, 400)}`,
		);
	}
	const json = (await res.json()) as { id?: string };
	const id = json.id;
	if (!id) {
		throw new PublishError("transient", "Instagram media creation returned no id");
	}
	return id;
}

async function publishMediaItem(
	igUserId: string,
	creationId: string,
	pageAccessToken: string,
): Promise<string> {
	const res = await fetch(
		`https://graph.facebook.com/v19.0/${igUserId}/media_publish?access_token=${pageAccessToken}`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ creation_id: creationId }),
		},
	);
	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`Instagram media publish failed (${res.status}): ${detail.slice(0, 400)}`,
		);
	}
	const json = (await res.json()) as { id?: string };
	return json.id ?? "";
}

async function createCarousel(
	igUserId: string,
	pageAccessToken: string,
	children: string[],
	caption: string,
): Promise<string> {
	const res = await fetch(
		`https://graph.facebook.com/v19.0/${igUserId}/media?access_token=${pageAccessToken}`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				media_type: "CAROUSEL",
				children: children.join(","),
				caption,
			}),
		},
	);
	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`Instagram carousel creation failed (${res.status}): ${detail.slice(0, 400)}`,
		);
	}
	const json = (await res.json()) as { id?: string };
	return json.id ?? "";
}

async function uploadImage(
	igUserId: string,
	pageAccessToken: string,
	mediaUrl: string,
	mimeType: string,
	caption: string,
): Promise<string> {
	const isVideo = mimeType.startsWith("video/");
	const creationId = await createMediaItem(
		igUserId,
		pageAccessToken,
		mediaUrl,
		mimeType,
		caption,
		isVideo,
	);

	if (isVideo) {
		let retries = 10;
		while (retries-- > 0) {
			const statusRes = await fetch(
				`https://graph.facebook.com/v19.0/${creationId}?fields=status_code&access_token=${pageAccessToken}`,
			);
			const status = (await statusRes.json()) as { status_code?: string };
			if (status.status_code === "FINISHED") break;
			await new Promise((r) => setTimeout(r, 2000));
		}
	}

	return creationId;
}

export async function publishToInstagram(args: {
	workspaceId: string;
	text: string;
	media?: PostMedia[];
}): Promise<InstagramPostResult> {
	let account = await getFreshToken(args.workspaceId, "instagram");

	let igUser: IgUser;
	let pageAccessToken: string;

	try {
		const res = await fetch(
			`https://graph.facebook.com/v19.0/me/accounts?access_token=${account.accessToken}`,
		);
		const pages = (await res.json()) as {
			data?: Array<{ id: string; access_token: string }>;
		};
		const page = pages.data?.[0];
		if (!page) {
			throw new PublishError(
				"forbidden",
				"No Facebook Page found. Instagram business requires a linked Page.",
			);
		}
		pageAccessToken = page.access_token;

		const igRes = await fetch(
			`https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`,
		);
		const igData = (await igRes.json()) as {
			instagram_business_account?: { id: string; username: string };
		};
		if (!igData.instagram_business_account) {
			throw new PublishError(
				"forbidden",
				"No Instagram business account linked.",
			);
		}
		igUser = {
			id: igData.instagram_business_account.id,
			username: igData.instagram_business_account.username,
		};
	} catch (err) {
		if (err instanceof PublishError && err.category === "needs_reauth") {
			account = await forceRefresh(args.workspaceId, "instagram");
			throw err;
		}
		throw err;
	}

	const media = args.media ?? [];

	if (media.length === 0) {
		throw new PublishError(
			"invalid_content",
			"Instagram posts require at least one image or video.",
		);
	}

	if (media.length === 1) {
		const creationId = await uploadImage(
			igUser.id,
			pageAccessToken,
			media[0].url,
			media[0].mimeType,
			args.text,
		);
		const postId = await publishMediaItem(
			igUser.id,
			creationId,
			pageAccessToken,
		);
		return {
			remotePostId: postId,
			remoteUrl: `https://www.instagram.com/p/${postId}/`,
		};
	}

	const children: string[] = [];
	for (const m of media.slice(0, 10)) {
		const childId = await uploadImage(
			igUser.id,
			pageAccessToken,
			m.url,
			m.mimeType,
			"",
		);
		children.push(childId);
	}

	const carouselId = await createCarousel(
		igUser.id,
		pageAccessToken,
		children,
		args.text,
	);
	const postId = await publishMediaItem(igUser.id, carouselId, pageAccessToken);
	return {
		remotePostId: postId,
		remoteUrl: `https://www.instagram.com/p/${postId}/`,
	};
}

// Resolve the Instagram business account + Page access token in one
// round-trip pair. Used by the Reel / Story publishers so they don't
// duplicate the discovery flow.
async function resolveInstagram(
	workspaceId: string,
): Promise<{ igUserId: string; pageAccessToken: string }> {
	let account = await getFreshToken(workspaceId, "instagram");
	const attempt = async () => {
		const res = await fetch(
			`https://graph.facebook.com/v19.0/me/accounts?access_token=${account.accessToken}`,
		);
		if (!res.ok) {
			throw new PublishError(
				categorizeHttpStatus(res.status),
				`Facebook pages fetch failed (${res.status})`,
			);
		}
		const pages = (await res.json()) as {
			data?: Array<{ id: string; access_token: string }>;
		};
		const page = pages.data?.[0];
		if (!page) {
			throw new PublishError(
				"forbidden",
				"No Facebook Page found. Instagram business requires a linked Page.",
			);
		}
		const igRes = await fetch(
			`https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`,
		);
		const igData = (await igRes.json()) as {
			instagram_business_account?: { id: string; username: string };
		};
		if (!igData.instagram_business_account) {
			throw new PublishError(
				"forbidden",
				"No Instagram business account linked.",
			);
		}
		return {
			igUserId: igData.instagram_business_account.id,
			pageAccessToken: page.access_token,
		};
	};
	try {
		return await attempt();
	} catch (err) {
		if (err instanceof PublishError && err.category === "needs_reauth") {
			account = await forceRefresh(workspaceId, "instagram");
			return attempt();
		}
		throw err;
	}
}

// Poll a media container until Instagram reports FINISHED processing.
// Video-based containers (Reels, Stories with video) aren't publishable
// until IG finishes ingestion.
async function waitForContainerReady(
	creationId: string,
	pageAccessToken: string,
	maxAttempts = 20,
	intervalMs = 2000,
): Promise<void> {
	for (let i = 0; i < maxAttempts; i++) {
		const res = await fetch(
			`https://graph.facebook.com/v19.0/${creationId}?fields=status_code&access_token=${pageAccessToken}`,
		);
		const json = (await res.json().catch(() => null)) as {
			status_code?: string;
		} | null;
		if (json?.status_code === "FINISHED") return;
		if (json?.status_code === "ERROR") {
			throw new PublishError(
				"invalid_content",
				"Instagram rejected the media during processing.",
			);
		}
		await new Promise((r) => setTimeout(r, intervalMs));
	}
	throw new PublishError(
		"transient",
		"Instagram media container did not finish processing in time.",
	);
}

export async function publishInstagramReel(args: {
	workspaceId: string;
	caption: string;
	video: PostMedia;
	shareToFeed?: boolean;
	coverUrl?: string;
}): Promise<InstagramPostResult> {
	if (!args.video.mimeType.startsWith("video/")) {
		throw new PublishError(
			"invalid_content",
			"Reels require a video file.",
		);
	}
	const { igUserId, pageAccessToken } = await resolveInstagram(args.workspaceId);

	const form = new FormData();
	form.append("media_type", "REELS");
	form.append("video_url", args.video.url);
	form.append("caption", args.caption);
	form.append("share_to_feed", String(args.shareToFeed ?? true));
	if (args.coverUrl) form.append("cover_url", args.coverUrl);

	const createRes = await fetch(
		`https://graph.facebook.com/v19.0/${igUserId}/media?access_token=${pageAccessToken}`,
		{ method: "POST", body: form },
	);
	if (!createRes.ok) {
		const detail = await createRes.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(createRes.status),
			`Instagram Reel creation failed (${createRes.status}): ${detail.slice(0, 400)}`,
		);
	}
	const creationJson = (await createRes.json()) as { id?: string };
	const creationId = creationJson.id;
	if (!creationId) {
		throw new PublishError("transient", "Instagram Reel creation returned no id");
	}

	await waitForContainerReady(creationId, pageAccessToken);
	const postId = await publishMediaItem(igUserId, creationId, pageAccessToken);
	return {
		remotePostId: postId,
		remoteUrl: `https://www.instagram.com/reel/${postId}/`,
	};
}

export async function publishInstagramStory(args: {
	workspaceId: string;
	media: PostMedia;
}): Promise<InstagramPostResult> {
	const { igUserId, pageAccessToken } = await resolveInstagram(args.workspaceId);
	const isVideo = args.media.mimeType.startsWith("video/");

	const form = new FormData();
	form.append("media_type", "STORIES");
	if (isVideo) {
		form.append("video_url", args.media.url);
	} else {
		form.append("image_url", args.media.url);
	}

	const createRes = await fetch(
		`https://graph.facebook.com/v19.0/${igUserId}/media?access_token=${pageAccessToken}`,
		{ method: "POST", body: form },
	);
	if (!createRes.ok) {
		const detail = await createRes.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(createRes.status),
			`Instagram Story creation failed (${createRes.status}): ${detail.slice(0, 400)}`,
		);
	}
	const creationJson = (await createRes.json()) as { id?: string };
	const creationId = creationJson.id;
	if (!creationId) {
		throw new PublishError("transient", "Instagram Story creation returned no id");
	}

	if (isVideo) await waitForContainerReady(creationId, pageAccessToken);
	const postId = await publishMediaItem(igUserId, creationId, pageAccessToken);
	// Stories don't have a canonical permalink; link to the profile as a
	// best-effort for the delivery row.
	return {
		remotePostId: postId,
		remoteUrl: `https://www.instagram.com/stories/`,
	};
}