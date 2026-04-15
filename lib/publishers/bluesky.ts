import { eq } from "drizzle-orm";
import type { PostMedia } from "@/db/schema";
import { AtpAgent } from "@atproto/api";
import { db } from "@/db";
import { blueskyCredentials } from "@/db/schema";
import { PublishError } from "./errors";

export type BlueskyPostResult = {
	remotePostId: string;
	remoteUrl: string;
};

type BlueskyCredentials = {
	handle: string;
	appPassword: string;
	did?: string | null;
};

async function getBlueskyCredentials(userId: string): Promise<BlueskyCredentials> {
	const [row] = await db
		.select({
			handle: blueskyCredentials.handle,
			appPassword: blueskyCredentials.appPassword,
			did: blueskyCredentials.did,
		})
		.from(blueskyCredentials)
		.where(eq(blueskyCredentials.userId, userId))
		.limit(1);

	if (!row) {
		throw new PublishError(
			"needs_reauth",
			"Bluesky account not connected. Please connect your Bluesky account.",
		);
	}

	return {
		handle: row.handle,
		appPassword: row.appPassword,
		did: row.did,
	};
}

async function createSession(credentials: BlueskyCredentials) {
	const agent = new AtpAgent({ service: "https://bsky.social" });
	await agent.login({
		identifier: credentials.handle,
		password: credentials.appPassword,
	});
	return agent;
}

async function uploadImage(
	agent: AtpAgent,
	media: PostMedia,
): Promise<{ ref: string; mimeType: string }> {
	const bin = await fetch(media.url);
	if (!bin.ok) {
		throw new PublishError(
			"transient",
			`Could not fetch media (${bin.status}) from ${media.url}`,
		);
	}
	const bytes = await bin.arrayBuffer();
	const uploaded = await agent.uploadBlob(new Uint8Array(bytes), {
		encoding: media.mimeType,
	}) as unknown as { data: { ref: { uri: string } } };
	return {
		ref: uploaded.data.ref.uri,
		mimeType: media.mimeType,
	};
}

async function createPost(
	agent: AtpAgent,
	text: string,
	images: Array<{ ref: string; mimeType: string }>,
): Promise<{ uri: string; cid: string }> {
	const embed = images.length > 0
		? {
			$type: "app.bsky.embed.images",
			images: images.map((img) => ({
				$type: "app.bsky.embed.images#image",
				ref: { $link: img.ref },
				mimeType: img.mimeType,
			})),
		}
		: undefined;

	const result = await agent.post({
		text,
		embed,
	});

	return {
		uri: result.uri,
		cid: result.cid,
	};
}

export async function publishToBluesky(args: {
	userId: string;
	text: string;
	media?: PostMedia[];
}): Promise<BlueskyPostResult> {
	const credentials = await getBlueskyCredentials(args.userId);
	const agent = await createSession(credentials);

	const uploadedImages = [];
	if (args.media && args.media.length > 0) {
		for (const m of args.media) {
			const img = await uploadImage(agent, m);
			uploadedImages.push(img);
		}
	}

	const { uri } = await createPost(agent, args.text, uploadedImages);

	const rkey = uri.split("/").pop() ?? uri;

	return {
		remotePostId: rkey,
		remoteUrl: `https://bsky.app/profile/${credentials.handle}/post/${rkey}`,
	};
}
