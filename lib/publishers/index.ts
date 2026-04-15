// Dispatcher: given a post ID, publish to every platform listed on the
// post, record per-platform results in post_deliveries, and update the
// post's top-level status. Called from the QStash worker.
//
// Partial success: if at least one platform publishes, the post is marked
// "published" with publishedAt set to the earliest success. Only an
// all-platforms-failed outcome is marked "failed".

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, postDeliveries, posts, type PostMedia } from "@/db/schema";
import { PublishError } from "./errors";
import { publishToLinkedIn } from "./linkedin";
import { publishToX } from "./x";

type PlatformKey = "linkedin" | "twitter";

const PUBLISHERS: Record<
	PlatformKey,
	(args: {
		userId: string;
		text: string;
		media?: PostMedia[];
	}) => Promise<{ remotePostId: string; remoteUrl: string }>
> = {
	linkedin: publishToLinkedIn,
	twitter: publishToX,
};

function isSupportedPlatform(p: string): p is PlatformKey {
	return p === "linkedin" || p === "twitter";
}

export type PublishSummary = {
	allOk: boolean;
	anyOk: boolean;
	// True only when everything that failed is retryable (rate_limited /
	// transient) AND no platform succeeded — so a QStash retry is safe and
	// worth doing. If anything already published, we never ask for a retry
	// (it would double-post).
	retryable: boolean;
};

export async function publishPost(postId: string): Promise<PublishSummary> {
	const post = await db.query.posts.findFirst({ where: eq(posts.id, postId) });
	if (!post) throw new Error(`Post ${postId} not found`);

	const results: Array<{
		platform: string;
		ok: boolean;
		publishedAt: Date | null;
		errorCategory?: string;
	}> = [];

	for (const platform of post.platforms) {
		const delivery = await upsertDelivery(postId, platform);

		if (!isSupportedPlatform(platform)) {
			await markDeliveryFailed(
				delivery.id,
				"unsupported_platform",
				`Publishing to "${platform}" is not implemented yet.`,
			);
			results.push({ platform, ok: false, publishedAt: null });
			continue;
		}

		try {
			const publisher = PUBLISHERS[platform];
			const { remotePostId, remoteUrl } = await publisher({
				userId: post.userId,
				text: post.content,
				media: post.media,
			});
			const publishedAt = new Date();
			await db
				.update(postDeliveries)
				.set({
					status: "published",
					remotePostId,
					remoteUrl,
					errorCode: null,
					errorMessage: null,
					publishedAt,
					attemptCount: delivery.attemptCount + 1,
					updatedAt: new Date(),
				})
				.where(eq(postDeliveries.id, delivery.id));
			// Clear any stale reauth flag — the token is proven working.
			await setReauthRequired(post.userId, platform, false);
			results.push({ platform, ok: true, publishedAt });
		} catch (err) {
			const code =
				err instanceof PublishError ? err.category : "transient";
			const message = err instanceof Error ? err.message : String(err);
			const status = code === "needs_reauth" ? "needs_reauth" : "failed";
			await db
				.update(postDeliveries)
				.set({
					status,
					errorCode: code,
					errorMessage: message.slice(0, 2000),
					attemptCount: delivery.attemptCount + 1,
					updatedAt: new Date(),
				})
				.where(eq(postDeliveries.id, delivery.id));
			if (code === "needs_reauth") {
				await setReauthRequired(post.userId, platform, true);
			}
			results.push({
				platform,
				ok: false,
				publishedAt: null,
				errorCategory: code,
			});
		}
	}

	const anyOk = results.some((r) => r.ok);
	const allOk = results.every((r) => r.ok);
	const earliestSuccess = results
		.filter((r) => r.ok && r.publishedAt)
		.map((r) => r.publishedAt as Date)
		.sort((a, b) => a.getTime() - b.getTime())[0];

	await db
		.update(posts)
		.set({
			status: anyOk ? "published" : "failed",
			publishedAt: earliestSuccess ?? null,
			updatedAt: new Date(),
		})
		.where(eq(posts.id, postId));

	const failures = results.filter((r) => !r.ok);
	const retryable =
		!anyOk &&
		failures.length > 0 &&
		failures.every(
			(r) =>
				r.errorCategory === "rate_limited" ||
				r.errorCategory === "transient",
		);

	return { allOk, anyOk, retryable };
}

async function upsertDelivery(postId: string, platform: string) {
	const [existing] = await db
		.select()
		.from(postDeliveries)
		.where(
			and(
				eq(postDeliveries.postId, postId),
				eq(postDeliveries.platform, platform),
			),
		)
		.limit(1);
	if (existing) return existing;

	const [created] = await db
		.insert(postDeliveries)
		.values({ postId, platform, status: "pending" })
		.returning();
	return created;
}

async function markDeliveryFailed(id: string, code: string, message: string) {
	await db
		.update(postDeliveries)
		.set({
			status: "failed",
			errorCode: code,
			errorMessage: message.slice(0, 2000),
			updatedAt: new Date(),
		})
		.where(eq(postDeliveries.id, id));
}

async function setReauthRequired(userId: string, provider: string, value: boolean) {
	await db
		.update(accounts)
		.set({ reauthRequired: value })
		.where(
			and(eq(accounts.userId, userId), eq(accounts.provider, provider)),
		);
}
