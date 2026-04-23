// Dispatcher: given a post ID, call the per-platform delete API for every
// delivery currently in `published` state, flip those deliveries to
// `deleted`, and mark the parent post `deleted` once all deliveries are
// either deleted or were never published.
//
// Mirrors `publishPost` in shape: partial-success is real (X might delete,
// LinkedIn might 500), so per-delivery state is the source of truth and the
// parent post's status only flips when every delivery row agrees.

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { postDeliveries, posts } from "@/db/schema";
import { PublishError } from "@/lib/publishers/errors";
import { unpublishFromX } from "./x";
import { unpublishFromLinkedIn } from "./linkedin";
import { unpublishFromBluesky } from "./bluesky";
import { unpublishFromMastodon } from "./mastodon";
import { unpublishFromFacebook } from "./facebook";
import { unpublishFromThreads } from "./threads";
import { unpublishFromInstagram } from "./instagram";
import { unpublishFromReddit } from "./reddit";
import { unpublishFromPinterest } from "./pinterest";

// Medium + YouTube are deliberately absent. Medium's v1 API doesn't expose
// delete on the free tier; YouTube video delete is destructive enough
// (and scope-gated on `youtube.force-ssl`) that we'd rather not automate
// it until there's explicit product demand.
type UnpublisherKey =
	| "twitter"
	| "linkedin"
	| "bluesky"
	| "mastodon"
	| "facebook"
	| "threads"
	| "instagram"
	| "reddit"
	| "pinterest";

const UNPUBLISHERS: Record<
	UnpublisherKey,
	(args: { userId: string; remotePostId: string }) => Promise<void>
> = {
	twitter: unpublishFromX,
	linkedin: unpublishFromLinkedIn,
	bluesky: unpublishFromBluesky,
	mastodon: unpublishFromMastodon,
	facebook: unpublishFromFacebook,
	threads: unpublishFromThreads,
	instagram: unpublishFromInstagram,
	reddit: unpublishFromReddit,
	pinterest: unpublishFromPinterest,
};

const SUPPORTED: ReadonlySet<string> = new Set(Object.keys(UNPUBLISHERS));

function isSupported(p: string): p is UnpublisherKey {
	return SUPPORTED.has(p);
}

export type UnpublishSummary = {
	allOk: boolean;
	anyOk: boolean;
	// Per-platform outcome, so callers can surface "X deleted, LinkedIn
	// failed — retry?" without re-querying the deliveries.
	results: Array<{
		platform: string;
		ok: boolean;
		errorCategory?: string;
		errorMessage?: string;
	}>;
};

export async function unpublishPost(postId: string): Promise<UnpublishSummary> {
	const post = await db.query.posts.findFirst({ where: eq(posts.id, postId) });
	if (!post) throw new Error(`Post ${postId} not found`);

	const deliveries = await db
		.select()
		.from(postDeliveries)
		.where(
			and(
				eq(postDeliveries.postId, postId),
				inArray(postDeliveries.status, ["published"]),
			),
		);

	const results: UnpublishSummary["results"] = [];

	for (const delivery of deliveries) {
		if (!delivery.remotePostId) {
			// Shouldn't happen for a published delivery, but guard anyway — we
			// can't ask the platform to delete a post we don't have an id for.
			results.push({
				platform: delivery.platform,
				ok: false,
				errorCategory: "transient",
				errorMessage: "Missing remotePostId on published delivery.",
			});
			continue;
		}

		if (!isSupported(delivery.platform)) {
			results.push({
				platform: delivery.platform,
				ok: false,
				errorCategory: "unsupported_platform",
				errorMessage: `Unpublishing from "${delivery.platform}" is not implemented yet.`,
			});
			continue;
		}

		try {
			const unpublisher = UNPUBLISHERS[delivery.platform];
			await unpublisher({
				userId: post.createdByUserId,
				remotePostId: delivery.remotePostId,
			});
			await db
				.update(postDeliveries)
				.set({
					status: "deleted",
					deletedAt: new Date(),
					errorCode: null,
					errorMessage: null,
					updatedAt: new Date(),
				})
				.where(eq(postDeliveries.id, delivery.id));
			results.push({ platform: delivery.platform, ok: true });
		} catch (err) {
			const code = err instanceof PublishError ? err.category : "transient";
			const message = err instanceof Error ? err.message : String(err);
			// Keep delivery in `published` state so the user can retry. We
			// stamp the error onto the row so the UI can explain *why* the
			// delete failed without losing the successful-publish record.
			await db
				.update(postDeliveries)
				.set({
					errorCode: code,
					errorMessage: message.slice(0, 2000),
					updatedAt: new Date(),
				})
				.where(eq(postDeliveries.id, delivery.id));
			results.push({
				platform: delivery.platform,
				ok: false,
				errorCategory: code,
				errorMessage: message,
			});
		}
	}

	// Post flips to `deleted` only if every non-pending delivery ended up in
	// a terminal not-on-remote state. Drafts / gated deliveries were never
	// published, so they don't block the flip.
	const allDeliveries = await db
		.select({ status: postDeliveries.status })
		.from(postDeliveries)
		.where(eq(postDeliveries.postId, postId));
	const anyStillPublished = allDeliveries.some((d) => d.status === "published");
	if (!anyStillPublished) {
		await db
			.update(posts)
			.set({ status: "deleted", updatedAt: new Date() })
			.where(eq(posts.id, postId));
	}

	const anyOk = results.some((r) => r.ok);
	const allOk = results.every((r) => r.ok);
	return { allOk, anyOk, results };
}
