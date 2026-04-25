// Dispatcher: given a post ID, publish to every platform listed on the
// post, record per-platform results in post_deliveries, and update the
// post's top-level status. Called from the QStash worker.
//
// Partial success: if at least one platform publishes, the post is marked
// "published" with publishedAt set to the earliest success. Only an
// all-platforms-failed outcome is marked "failed".

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { captureException } from "@/lib/logger";
import {
	accounts,
	postDeliveries,
	posts,
	telegramCredentials,
	workspaces,
	type PostMedia,
} from "@/db/schema";
import { decideForPublish } from "@/lib/channel-state";
import { getForm } from "@/lib/channels/capabilities";
import { sendManualAssistReminderForDelivery } from "@/lib/manual-assist";
import { createNotification } from "@/lib/notifications";
import { dispatchEvent } from "@/lib/automations/dispatch";
import { PublishError } from "./errors";
import { publishToLinkedIn } from "./linkedin";
import { publishToX } from "./x";
import { publishToBluesky } from "./bluesky";
import { publishToMedium } from "./medium";
import { publishToFacebook } from "./facebook";
import { publishToInstagram } from "./instagram";
import { publishToThreads } from "./threads";
import { publishToMastodon } from "./mastodon";
import { publishToReddit } from "./reddit";
import { publishToPinterest } from "./pinterest";
import { publishToYouTube } from "./youtube";
import { publishToTelegram } from "./telegram";

type PlatformKey = "linkedin" | "twitter" | "bluesky" | "medium" | "facebook" | "instagram" | "threads" | "mastodon" | "reddit" | "pinterest" | "youtube" | "telegram";

const PUBLISHERS: Record<
	PlatformKey,
	(args: {
		workspaceId: string;
		text: string;
		media?: PostMedia[];
	}) => Promise<{ remotePostId: string; remoteUrl: string }>
> = {
	linkedin: publishToLinkedIn,
	twitter: publishToX,
	bluesky: publishToBluesky,
	medium: publishToMedium,
	facebook: publishToFacebook,
	instagram: publishToInstagram,
	threads: publishToThreads,
	mastodon: publishToMastodon,
	reddit: publishToReddit,
	pinterest: publishToPinterest,
	youtube: publishToYouTube,
	telegram: publishToTelegram,
};

function isSupportedPlatform(p: string): p is PlatformKey {
	return p === "linkedin" || p === "twitter" || p === "bluesky" || p === "medium" || p === "facebook" || p === "instagram" || p === "threads" || p === "mastodon" || p === "reddit" || p === "pinterest" || p === "youtube" || p === "telegram";
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

	// Refuse to publish from a frozen workspace. The owner is over their
	// seat allowance; the post stays in "scheduled" state so it'll retry
	// once the workspace thaws (seat added or another workspace deleted).
	// Worker-level guard covers both scheduled-tick and direct-invoke
	// paths, so action-layer checks aren't required at every call site.
	const [ws] = await db
		.select({ frozenAt: workspaces.frozenAt })
		.from(workspaces)
		.where(eq(workspaces.id, post.workspaceId))
		.limit(1);
	if (ws?.frozenAt) {
		return { allOk: false, anyOk: false, retryable: false };
	}

	const results: Array<{
		platform: string;
		ok: boolean;
		publishedAt: Date | null;
		errorCategory?: string;
		// Distinguishes "skipped because the channel is gated" from a genuine
		// failure — we don't want gated channels to flip the post to "failed".
		gated?: boolean;
	}> = [];

	for (const platform of post.platforms) {
		const delivery = await upsertDelivery(postId, platform);

		// Don't touch already-published deliveries. Re-runs (explicit retry,
		// re-drive after a channel un-gates, etc.) should leave successful
		// posts alone — re-posting would double-publish.
		if (delivery.status === "published") {
			results.push({
				platform,
				ok: true,
				publishedAt: delivery.publishedAt ?? null,
			});
			continue;
		}

		const decision = await decideForPublish(post.workspaceId, platform);
		if (decision.kind === "skip") {
			// Channel is in a gated state — record it on the delivery and move
			// on. A scheduled re-drive can pick it up once state flips.
			const nextStatus =
				decision.reason === "manual_assist"
					? "manual_assist"
					: "pending_review";
			await db
				.update(postDeliveries)
				.set({
					status: nextStatus,
					errorCode: null,
					errorMessage: null,
					updatedAt: new Date(),
				})
				.where(eq(postDeliveries.id, delivery.id));

			// Fire the reminder email for manual_assist. Failures here are
			// logged, not propagated — one failed email shouldn't abort the
			// dispatcher for other platforms on the same post.
			if (decision.reason === "manual_assist") {
				try {
					await sendManualAssistReminderForDelivery(postId, platform);
				} catch (err) {
					await captureException(err, {
						tags: { source: "publishers.manual-assist", platform },
						extra: { postId },
					});
					console.error(
						`[manual-assist] reminder failed for post ${postId} / ${platform}:`,
						err,
					);
				}
			}

			results.push({ platform, ok: false, publishedAt: null, gated: true });
			continue;
		}

		// Studio-mode posts route through the capability registry, which
		// has its own per-channel publishers — no need to gate on the
		// legacy `PUBLISHERS` map.
		if (!post.studioMode && !isSupportedPlatform(platform)) {
			await markDeliveryFailed(
				delivery.id,
				"unsupported_platform",
				`Publishing to "${platform}" is not implemented yet.`,
			);
			results.push({ platform, ok: false, publishedAt: null });
			continue;
		}

		try {
			let remotePostId: string;
			let remoteUrl: string;
			if (post.studioMode) {
				// Studio-mode posts are pinned to one channel; the dispatcher
				// only reaches this branch for that channel (save/schedule
				// enforce platforms === [studio_mode.channel]).
				if (post.studioMode.channel !== platform) {
					throw new PublishError(
						"forbidden",
						`Studio post pinned to ${post.studioMode.channel} but dispatching to ${platform}`,
					);
				}
				const form = getForm(platform, post.studioMode.form);
				if (!form) {
					throw new PublishError(
						"unsupported_platform",
						`No Studio capability registered for ${platform}/${post.studioMode.form}`,
					);
				}
				const result = await form.publish({
					workspaceId: post.workspaceId,
					payload: post.studioPayload ?? {},
				});
				remotePostId = result.remotePostId;
				remoteUrl = result.remoteUrl;
			} else {
				if (!isSupportedPlatform(platform)) {
					// Already gated above; this branch is unreachable but
					// the assertion narrows `platform` for `PUBLISHERS[platform]`.
					throw new PublishError(
						"unsupported_platform",
						`Publishing to "${platform}" is not implemented yet.`,
					);
				}
				const publisher = PUBLISHERS[platform];
				const override = post.channelContent?.[platform];
				const result = await publisher({
					workspaceId: post.workspaceId,
					text: override?.content ?? post.content,
					media: override?.media ?? post.media,
				});
				remotePostId = result.remotePostId;
				remoteUrl = result.remoteUrl;
			}
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
			await setReauthRequired(post.workspaceId, platform, false);
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
				await setReauthRequired(post.workspaceId, platform, true);
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
	const gatedOnly = !anyOk && results.every((r) => r.gated);
	const earliestSuccess = results
		.filter((r) => r.ok && r.publishedAt)
		.map((r) => r.publishedAt as Date)
		.sort((a, b) => a.getTime() - b.getTime())[0];

	// If every platform was gated, the post isn't "failed" — it's parked
	// waiting for state to resolve. Keep it "scheduled" so a re-drive picks
	// it up cleanly when the state flips.
	const nextPostStatus = anyOk
		? ("published" as const)
		: gatedOnly
			? ("scheduled" as const)
			: ("failed" as const);

	await db
		.update(posts)
		.set({
			status: nextPostStatus,
			publishedAt: earliestSuccess ?? null,
			updatedAt: new Date(),
		})
		.where(eq(posts.id, postId));

	// Notify on terminal outcomes only — gated-only is still in-flight and
	// will re-drive later, so emitting a notification now would be noise.
	if (nextPostStatus !== "scheduled") {
		const okChannels = results.filter((r) => r.ok).map((r) => r.platform);
		const failedChannels = results
			.filter((r) => !r.ok && !r.gated)
			.map((r) => r.platform);
		const kind =
			nextPostStatus === "published" && failedChannels.length === 0
				? "post_published"
				: nextPostStatus === "published"
					? "post_partial"
					: "post_failed";
		const snippet = post.content.replace(/\s+/g, " ").trim().slice(0, 80);
		const titleByKind = {
			post_published: `Published to ${okChannels.join(", ")}`,
			post_partial: `Partially published — ${failedChannels.join(", ")} failed`,
			post_failed: `Post failed to publish`,
		} as const;
		await createNotification({
			userId: post.createdByUserId,
			kind,
			title: titleByKind[kind],
			body: snippet ? `"${snippet}"` : null,
			url: `/app/posts/${postId}`,
			metadata: { postId, okChannels, failedChannels },
		});

		if (kind === "post_published" || kind === "post_partial") {
			dispatchEvent({
				triggerKind: "post_published",
				userId: post.createdByUserId,
				payload: { postId, okChannels, failedChannels },
			}).catch((err) =>
				console.error("[automations] post_published dispatch failed", err),
			);
		}
	}

	const genuineFailures = results.filter((r) => !r.ok && !r.gated);
	const retryable =
		!anyOk &&
		genuineFailures.length > 0 &&
		genuineFailures.every(
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

async function setReauthRequired(workspaceId: string, provider: string, value: boolean) {
	// Handle OAuth providers (accounts table)
	await db
		.update(accounts)
		.set({ reauthRequired: value })
		.where(
			and(eq(accounts.workspaceId, workspaceId), eq(accounts.provider, provider)),
		);

	// Handle custom credential providers
	if (provider === "telegram") {
		await db
			.update(telegramCredentials)
			.set({ reauthRequired: value })
			.where(eq(telegramCredentials.workspaceId, workspaceId));
	}
}
