// Dispatcher: given a post ID, publish to every platform listed on the
// post, record per-platform results in post_deliveries, and update the
// post's top-level status. Called from the QStash worker.
//
// Partial success: if at least one platform publishes, the post is marked
// "published" with publishedAt set to the earliest success. Only an
// all-platforms-failed outcome is marked "failed".

import { and, eq, ne } from "drizzle-orm";
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
import { getFormPublisher } from "@/lib/channels/capabilities/publishers";
import { sendManualAssistReminderForDelivery } from "@/lib/manual-assist";
import { createNotification } from "@/lib/notifications";
import { dispatchEvent } from "@/lib/automations/dispatch";
import { isSnapshotSupported } from "@/lib/posts/engagement/supported";
import { PublishError } from "./errors";
import { publishLinkedInDocument, publishToLinkedIn } from "./linkedin";
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
	linkedin: async (args) => {
		// LinkedIn is the only channel that accepts PDFs (as document
		// carousels). Other channels strip PDFs upstream — see the
		// dispatch loop in publishPost — so by the time we get here, if
		// there's a PDF in args.media, the user intended it for us.
		// Document carousels go through a different LinkedIn endpoint
		// (`shareMediaCategory: DOCUMENT`). When the user attached a PDF,
		// route there; otherwise fall through to the standard image/text
		// publisher. Mixed PDF + image attachments aren't a thing on
		// LinkedIn, so the first PDF wins and other media is dropped with
		// a console warning rather than failing the publish.
		const media = args.media ?? [];
		const pdf = media.find((m) => m.mimeType === "application/pdf");
		if (pdf) {
			if (media.length > 1) {
				console.warn(
					"[linkedin] PDF attachment present alongside other media — only the PDF is sent.",
				);
			}
			// Title is required by the LinkedIn document API. Use the first
			// non-empty line of the post body, capped — keeps creators from
			// having to fill a separate field for what's effectively the
			// post's display name on the carousel preview.
			const title =
				args.text.split(/\r?\n/).find((l) => l.trim().length > 0)?.slice(
					0,
					100,
				) ?? "Document";
			return publishLinkedInDocument({
				workspaceId: args.workspaceId,
				text: args.text,
				title,
				document: pdf,
			});
		}
		return publishToLinkedIn(args);
	},
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

		// Per-channel dispatch: if the channel has a `form` set in
		// channelContent, route through the capability registry's form
		// publisher; otherwise fall back to the flat-text PUBLISHERS map.
		const override = post.channelContent?.[platform];
		const studioForm = override?.form;
		if (!studioForm && !isSupportedPlatform(platform)) {
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
			if (studioForm) {
				const form = getForm(platform, studioForm);
				if (!form) {
					throw new PublishError(
						"unsupported_platform",
						`No Studio capability registered for ${platform}/${studioForm}`,
					);
				}
				const publish = getFormPublisher(platform, studioForm);
				if (!publish) {
					throw new PublishError(
						"unsupported_platform",
						`No Studio publisher registered for ${platform}/${studioForm}`,
					);
				}
				const result = await publish({
					workspaceId: post.workspaceId,
					payload: override?.payload ?? {},
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
				const rawMedia = override?.media ?? post.media;
				// Strip PDFs for every channel except LinkedIn — they're only
				// supported as LinkedIn document carousels. Without this the
				// non-LinkedIn publishers would either reject the upload or
				// (worse) try to handle it as an image and post junk.
				const media =
					platform === "linkedin"
						? rawMedia
						: rawMedia.filter((m) => m.mimeType !== "application/pdf");
				const result = await publisher({
					workspaceId: post.workspaceId,
					text: override?.content ?? post.content,
					media,
				});
				remotePostId = result.remotePostId;
				remoteUrl = result.remoteUrl;
			}
			const publishedAt = new Date();
			// Schedule the first engagement snapshot ~1h out — see
			// lib/posts/engagement/schedule.ts for the full curve. Only set
			// when the platform is actually supported by the snapshot
			// fetchers; otherwise leave NULL so the cron skips it.
			const firstSnapshotAt = isSnapshotSupported(platform)
				? new Date(publishedAt.getTime() + 60 * 60 * 1000)
				: null;
			await db
				.update(postDeliveries)
				.set({
					status: "published",
					remotePostId,
					remoteUrl,
					errorCode: null,
					errorMessage: null,
					publishedAt,
					nextMetricSyncAt: firstSnapshotAt,
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
			// Concurrency guard: if a sibling run already flipped this row
			// to `published` (it raced ahead of us and LinkedIn now returns
			// DUPLICATE_POST to our call), don't overwrite the success
			// state. The delivery is live; our error is downstream noise.
			await db
				.update(postDeliveries)
				.set({
					status,
					errorCode: code,
					errorMessage: message.slice(0, 2000),
					attemptCount: delivery.attemptCount + 1,
					updatedAt: new Date(),
				})
				.where(
					and(
						eq(postDeliveries.id, delivery.id),
						ne(postDeliveries.status, "published"),
					),
				);
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
	// Race-safe upsert backed by the `post_deliveries_post_platform`
	// unique index. A naive SELECT-then-INSERT lets two concurrent
	// publishPost runs both observe "no row" and both insert; LinkedIn
	// then ships one and rejects the other with DUPLICATE_POST, leaving
	// the user with a "Failed" status on a post that's actually live.
	await db
		.insert(postDeliveries)
		.values({ postId, platform, status: "pending" })
		.onConflictDoNothing({
			target: [postDeliveries.postId, postDeliveries.platform],
		});

	const [row] = await db
		.select()
		.from(postDeliveries)
		.where(
			and(
				eq(postDeliveries.postId, postId),
				eq(postDeliveries.platform, platform),
			),
		)
		.limit(1);
	if (!row) {
		throw new Error(
			`postDeliveries row missing after upsert (${postId}/${platform})`,
		);
	}
	return row;
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
