// Posts updates (text + optional images) to a user's LinkedIn profile via
// the ugcPosts endpoint. Requires `w_member_social` on the access token.
// Images: up to 9 allowed by LinkedIn; we cap at 4 (composer limit).

import type { PostMedia } from "@/db/schema";
import { categorizeHttpStatus, PublishError } from "./errors";
import { forceRefresh, getFreshToken, type ProviderAccount } from "./tokens";

export type LinkedInPostResult = {
	remotePostId: string;
	remoteUrl: string;
};

type RegisterUploadResponse = {
	value: {
		asset: string;
		uploadMechanism: {
			"com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest": {
				uploadUrl: string;
			};
		};
	};
};

async function registerUpload(
	account: ProviderAccount,
	recipe:
		| "urn:li:digitalmediaRecipe:feedshare-image"
		| "urn:li:digitalmediaRecipe:feedshare-document" = "urn:li:digitalmediaRecipe:feedshare-image",
): Promise<{ asset: string; uploadUrl: string }> {
	const res = await fetch(
		"https://api.linkedin.com/v2/assets?action=registerUpload",
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${account.accessToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				registerUploadRequest: {
					owner: `urn:li:person:${account.providerAccountId}`,
					recipes: [recipe],
					serviceRelationships: [
						{
							identifier: "urn:li:userGeneratedContent",
							relationshipType: "OWNER",
						},
					],
				},
			}),
		},
	);
	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`LinkedIn registerUpload failed (${res.status}): ${detail.slice(0, 400)}`,
		);
	}
	const data = (await res.json()) as RegisterUploadResponse;
	return {
		asset: data.value.asset,
		uploadUrl:
			data.value.uploadMechanism[
				"com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
			].uploadUrl,
	};
}

async function uploadBinary(
	account: ProviderAccount,
	uploadUrl: string,
	mediaUrl: string,
	contentType: string,
): Promise<void> {
	const bin = await fetch(mediaUrl);
	if (!bin.ok) {
		throw new PublishError(
			"transient",
			`Could not fetch uploaded media (${bin.status}) from ${mediaUrl}`,
		);
	}
	const bytes = await bin.arrayBuffer();
	const res = await fetch(uploadUrl, {
		method: "PUT",
		headers: {
			Authorization: `Bearer ${account.accessToken}`,
			"Content-Type": contentType,
		},
		body: bytes,
	});
	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`LinkedIn binary upload failed (${res.status}): ${detail.slice(0, 400)}`,
		);
	}
}

async function uploadImages(
	account: ProviderAccount,
	media: PostMedia[],
): Promise<string[]> {
	const assets: string[] = [];
	for (const m of media) {
		const { asset, uploadUrl } = await registerUpload(account);
		await uploadBinary(account, uploadUrl, m.url, m.mimeType);
		assets.push(asset);
	}
	return assets;
}

async function callUgcPosts(
	account: ProviderAccount,
	text: string,
	assetUrns: string[],
): Promise<Response> {
	const authorUrn = `urn:li:person:${account.providerAccountId}`;
	const shareContent: Record<string, unknown> = {
		shareCommentary: { text },
		shareMediaCategory: assetUrns.length > 0 ? "IMAGE" : "NONE",
	};
	if (assetUrns.length > 0) {
		shareContent.media = assetUrns.map((urn) => ({
			status: "READY",
			media: urn,
		}));
	}
	const body = {
		author: authorUrn,
		lifecycleState: "PUBLISHED",
		specificContent: { "com.linkedin.ugc.ShareContent": shareContent },
		visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
	};
	return fetch("https://api.linkedin.com/v2/ugcPosts", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${account.accessToken}`,
			"X-Restli-Protocol-Version": "2.0.0",
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});
}

export async function publishToLinkedIn(args: {
	workspaceId: string;
	text: string;
	media?: PostMedia[];
}): Promise<LinkedInPostResult> {
	let account = await getFreshToken(args.workspaceId, "linkedin");
	const media = args.media ?? [];
	let assets: string[] = [];
	if (media.length > 0) {
		try {
			assets = await uploadImages(account, media);
		} catch (err) {
			// If the first asset call 401s, refresh once and retry the full set.
			if (err instanceof PublishError && err.category === "needs_reauth") {
				account = await forceRefresh(args.workspaceId, "linkedin");
				assets = await uploadImages(account, media);
			} else {
				throw err;
			}
		}
	}

	let res = await callUgcPosts(account, args.text, assets);

	// Stored expiry can lag reality — if LinkedIn rejects the token, force a
	// refresh once and retry before giving up.
	if (res.status === 401) {
		try {
			account = await forceRefresh(args.workspaceId, "linkedin");
			res = await callUgcPosts(account, args.text, assets);
		} catch (err) {
			throw err instanceof PublishError
				? err
				: new PublishError("needs_reauth", "LinkedIn token refresh failed", err);
		}
	}

	if (!res.ok) {
		const category = categorizeHttpStatus(res.status);
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			category,
			`LinkedIn publish failed (${res.status}): ${detail.slice(0, 400)}`,
		);
	}

	const urn = res.headers.get("x-restli-id") ?? res.headers.get("x-linkedin-id");
	if (!urn) {
		throw new PublishError(
			"transient",
			"LinkedIn publish returned no post URN",
		);
	}
	return {
		remotePostId: urn,
		remoteUrl: `https://www.linkedin.com/feed/update/${urn}/`,
	};
}

async function callUgcPostsDocument(
	account: ProviderAccount,
	text: string,
	assetUrn: string,
	title: string,
): Promise<Response> {
	const authorUrn = `urn:li:person:${account.providerAccountId}`;
	const body = {
		author: authorUrn,
		lifecycleState: "PUBLISHED",
		specificContent: {
			"com.linkedin.ugc.ShareContent": {
				shareCommentary: { text },
				shareMediaCategory: "DOCUMENT",
				media: [
					{
						status: "READY",
						media: assetUrn,
						title: { attributes: [], text: title.slice(0, 400) || "Document" },
					},
				],
			},
		},
		visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
	};
	return fetch("https://api.linkedin.com/v2/ugcPosts", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${account.accessToken}`,
			"X-Restli-Protocol-Version": "2.0.0",
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});
}

// Publish a LinkedIn document post (a.k.a. document carousel / PDF
// carousel). The caller uploads a PDF to the shared asset storage and
// hands us its URL + mime type; we register a document asset, push the
// bytes, then attach it to a UGC post with `shareMediaCategory: DOCUMENT`.
export async function publishLinkedInDocument(args: {
	workspaceId: string;
	text: string;
	title: string;
	document: PostMedia;
}): Promise<LinkedInPostResult> {
	if (args.document.mimeType !== "application/pdf") {
		throw new PublishError(
			"invalid_content",
			"LinkedIn document posts require a PDF.",
		);
	}
	let account = await getFreshToken(args.workspaceId, "linkedin");

	const upload = async () => {
		const { asset, uploadUrl } = await registerUpload(
			account,
			"urn:li:digitalmediaRecipe:feedshare-document",
		);
		await uploadBinary(
			account,
			uploadUrl,
			args.document.url,
			args.document.mimeType,
		);
		return asset;
	};

	let assetUrn: string;
	try {
		assetUrn = await upload();
	} catch (err) {
		if (err instanceof PublishError && err.category === "needs_reauth") {
			account = await forceRefresh(args.workspaceId, "linkedin");
			assetUrn = await upload();
		} else {
			throw err;
		}
	}

	let res = await callUgcPostsDocument(account, args.text, assetUrn, args.title);
	if (res.status === 401) {
		account = await forceRefresh(args.workspaceId, "linkedin");
		res = await callUgcPostsDocument(account, args.text, assetUrn, args.title);
	}
	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`LinkedIn document publish failed (${res.status}): ${detail.slice(0, 400)}`,
		);
	}

	const urn = res.headers.get("x-restli-id") ?? res.headers.get("x-linkedin-id");
	if (!urn) {
		throw new PublishError(
			"transient",
			"LinkedIn document publish returned no post URN",
		);
	}
	return {
		remotePostId: urn,
		remoteUrl: `https://www.linkedin.com/feed/update/${urn}/`,
	};
}
