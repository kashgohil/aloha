// Channel state machine for the §8 fallback flow.
//
// Each platform has a gating status ("ready" vs "pending_approval"). A user
// can override the mode per channel (auto / review_pending / manual_assist)
// via settings. The effective publish state is a function of:
//   - whether the account is connected
//   - the platform's gating status
//   - the user's override
//
// This module is the single source of truth the publisher dispatcher and the
// settings UI both consult. Flip a platform's gating to "ready" here when
// the corresponding platform review lands — no other code should care.

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { channelStates } from "@/db/schema";

export type GatingStatus = "ready" | "pending_approval";

// Flip to "ready" as platform reviews/approvals land. See
// docs/ai-grand-plan.md §4.1 and docs/app-reviews/.
export const PLATFORM_GATING: Record<string, GatingStatus> = {
  twitter: "ready",
  linkedin: "ready",
  bluesky: "ready",
  mastodon: "ready",
  medium: "ready",
  reddit: "ready",
  pinterest: "ready",
  facebook: "pending_approval",
  instagram: "pending_approval",
  threads: "pending_approval",
  tiktok: "pending_approval",
  youtube: "pending_approval",
};

export type PublishMode = "auto" | "review_pending" | "manual_assist";

export type EffectiveState =
  | "not_connected"
  | "connected_published"
  | "connected_review_pending"
  | "connected_manual_assist";

export type ChannelStateRow = {
  publishMode: PublishMode;
  reviewStartedAt: Date | null;
  notes: string | null;
};

export async function loadChannelState(
  userId: string,
  channel: string,
): Promise<ChannelStateRow> {
  const [row] = await db
    .select({
      publishMode: channelStates.publishMode,
      reviewStartedAt: channelStates.reviewStartedAt,
      notes: channelStates.notes,
    })
    .from(channelStates)
    .where(and(eq(channelStates.userId, userId), eq(channelStates.channel, channel)))
    .limit(1);
  return (
    row ?? {
      publishMode: "auto",
      reviewStartedAt: null,
      notes: null,
    }
  );
}

// Resolves the effective state for (user, channel, isConnected). The caller
// owns the connection check — usually derived from `accounts` or a
// per-platform credentials table — so this stays a pure combiner.
export function resolveEffectiveState(
  channel: string,
  isConnected: boolean,
  override: ChannelStateRow,
): EffectiveState {
  if (!isConnected) return "not_connected";

  const gating = PLATFORM_GATING[channel] ?? "ready";
  if (gating === "ready" && override.publishMode === "auto") {
    return "connected_published";
  }

  // Gated platform or explicit user override. Figure out which bucket.
  const mode: PublishMode =
    override.publishMode === "auto" ? defaultGatedMode(override) : override.publishMode;

  return mode === "manual_assist"
    ? "connected_manual_assist"
    : "connected_review_pending";
}

// For `auto` on a gated platform, default to `review_pending` for the first
// 14 days of gating, then flip to `manual_assist` so the product keeps being
// useful even if approval drags. See §8 — "Default: manual_assist for any
// channel stuck in review longer than 14 days."
const AUTO_FLIP_DAYS = 14;

function defaultGatedMode(row: ChannelStateRow): PublishMode {
  if (!row.reviewStartedAt) return "review_pending";
  const ageDays =
    (Date.now() - row.reviewStartedAt.getTime()) / (1000 * 60 * 60 * 24);
  return ageDays >= AUTO_FLIP_DAYS ? "manual_assist" : "review_pending";
}

// Publisher-facing decision for "should I publish right now?".
export type PublishDecision =
  | { kind: "go" }
  | { kind: "skip"; reason: "pending_review" | "manual_assist" };

export async function decideForPublish(
  userId: string,
  channel: string,
): Promise<PublishDecision> {
  const gating = PLATFORM_GATING[channel] ?? "ready";
  const override = await loadChannelState(userId, channel);

  if (gating === "ready" && override.publishMode === "auto") {
    return { kind: "go" };
  }

  const mode: PublishMode =
    override.publishMode === "auto" ? defaultGatedMode(override) : override.publishMode;

  if (mode === "manual_assist") return { kind: "skip", reason: "manual_assist" };
  if (mode === "review_pending") return { kind: "skip", reason: "pending_review" };
  return { kind: "go" };
}

// Called from the settings UI when a user picks a mode for a channel.
export async function setChannelPublishMode(
  userId: string,
  channel: string,
  mode: PublishMode,
): Promise<void> {
  await db
    .insert(channelStates)
    .values({
      userId,
      channel,
      publishMode: mode,
      reviewStartedAt:
        PLATFORM_GATING[channel] === "pending_approval" ? new Date() : null,
    })
    .onConflictDoUpdate({
      target: [channelStates.userId, channelStates.channel],
      set: {
        publishMode: mode,
        updatedAt: new Date(),
      },
    });
}
