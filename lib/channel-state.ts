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

import { and, eq, notInArray } from "drizzle-orm";
import { db } from "@/db";
import {
  accounts,
  blueskyCredentials,
  channelStates,
  mastodonCredentials,
} from "@/db/schema";
import { AUTH_ONLY_PROVIDERS } from "@/lib/auth-providers";
import { requireActiveWorkspaceId } from "@/lib/workspaces/resolve";
import type {
  EffectiveState,
  PublishMode,
} from "./channel-state-format";

export type { EffectiveState, PublishMode } from "./channel-state-format";

export type GatingStatus = "ready" | "pending_approval";

// Flip to "ready" as platform reviews/approvals land. See
// docs/ai-grand-plan.md §4.1 and docs/app-reviews/.
export const PLATFORM_GATING: Record<string, GatingStatus> = {
  twitter: "ready",
  linkedin: "ready",
  bluesky: "ready",
  mastodon: "ready",
  facebook: "pending_approval",
  instagram: "pending_approval",
  threads: "pending_approval",
  tiktok: "pending_approval",
  youtube: "pending_approval",
  reddit: "pending_approval",
  medium: "pending_approval",
  pinterest: "pending_approval",
};

export type ChannelStateRow = {
  publishMode: PublishMode;
  reviewStartedAt: Date | null;
  notes: string | null;
};

export async function loadChannelState(
  workspaceId: string,
  channel: string,
): Promise<ChannelStateRow> {
  const [row] = await db
    .select({
      publishMode: channelStates.publishMode,
      reviewStartedAt: channelStates.reviewStartedAt,
      notes: channelStates.notes,
    })
    .from(channelStates)
    .where(
      and(
        eq(channelStates.workspaceId, workspaceId),
        eq(channelStates.channel, channel),
      ),
    )
    .limit(1);
  if (row) return row;

  // First time we're asked about a gated channel for this user — seed a
  // `reviewStartedAt` anchor so the 14-day auto-flip clock can ever reach
  // its threshold. Without this seeding, channels would sit in
  // `review_pending` forever because `reviewStartedAt` stays null.
  // Idempotent via onConflictDoNothing — safe under concurrent reads.
  const gating = PLATFORM_GATING[channel] ?? "ready";
  if (gating === "pending_approval") {
    const now = new Date();
    await db
      .insert(channelStates)
      .values({
        workspaceId,
        channel,
        publishMode: "auto",
        reviewStartedAt: now,
      })
      .onConflictDoNothing({
        target: [channelStates.workspaceId, channelStates.channel],
      });
    return {
      publishMode: "auto",
      reviewStartedAt: now,
      notes: null,
    };
  }

  return {
    publishMode: "auto",
    reviewStartedAt: null,
    notes: null,
  };
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
  workspaceId: string,
  channel: string,
): Promise<PublishDecision> {
  const gating = PLATFORM_GATING[channel] ?? "ready";
  const override = await loadChannelState(workspaceId, channel);

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
  const workspaceId = await requireActiveWorkspaceId(userId);
  await db
    .insert(channelStates)
    .values({
      workspaceId,
      channel,
      publishMode: mode,
      reviewStartedAt:
        PLATFORM_GATING[channel] === "pending_approval" ? new Date() : null,
    })
    .onConflictDoUpdate({
      target: [channelStates.workspaceId, channelStates.channel],
      set: {
        publishMode: mode,
        updatedAt: new Date(),
      },
    });
}

// Bulk resolver for the composer and calendar: loads every channel's
// effective state for a user in one pass. Returns a map keyed by platform
// id so both surfaces can just look up and render.
export async function getEffectiveStatesForUser(
  userId: string,
): Promise<Record<string, EffectiveState>> {
  const workspaceId = await requireActiveWorkspaceId(userId);
  const [oauthRows, blueskyRow, mastodonRow, stateRows] = await Promise.all([
    db
      .select({ provider: accounts.provider })
      .from(accounts)
      .where(
        and(
          eq(accounts.workspaceId, workspaceId),
          notInArray(accounts.provider, AUTH_ONLY_PROVIDERS),
        ),
      ),
    db
      .select({ id: blueskyCredentials.id })
      .from(blueskyCredentials)
      .where(eq(blueskyCredentials.workspaceId, workspaceId))
      .limit(1),
    db
      .select({ id: mastodonCredentials.id })
      .from(mastodonCredentials)
      .where(eq(mastodonCredentials.workspaceId, workspaceId))
      .limit(1),
    db
      .select({
        channel: channelStates.channel,
        publishMode: channelStates.publishMode,
        reviewStartedAt: channelStates.reviewStartedAt,
        notes: channelStates.notes,
      })
      .from(channelStates)
      .where(eq(channelStates.workspaceId, workspaceId)),
  ]);

  const connected = new Set<string>(oauthRows.map((r) => r.provider));
  if (blueskyRow.length > 0) connected.add("bluesky");
  if (mastodonRow.length > 0) connected.add("mastodon");

  const overrides = new Map<string, ChannelStateRow>(
    stateRows.map((r) => [
      r.channel,
      {
        publishMode: r.publishMode,
        reviewStartedAt: r.reviewStartedAt,
        notes: r.notes,
      },
    ]),
  );

  // Seed missing rows for connected gated channels so the 14-day auto-flip
  // clock has an anchor. One batch insert per call; onConflictDoNothing
  // makes this race-safe.
  const toSeed: Array<{ channel: string }> = [];
  for (const channel of connected) {
    if (overrides.has(channel)) continue;
    if (PLATFORM_GATING[channel] === "pending_approval") {
      toSeed.push({ channel });
    }
  }
  if (toSeed.length > 0) {
    const now = new Date();
    await db
      .insert(channelStates)
      .values(
        toSeed.map((s) => ({
          workspaceId,
          channel: s.channel,
          publishMode: "auto" as const,
          reviewStartedAt: now,
        })),
      )
      .onConflictDoNothing({
        target: [channelStates.workspaceId, channelStates.channel],
      });
    for (const s of toSeed) {
      overrides.set(s.channel, {
        publishMode: "auto",
        reviewStartedAt: now,
        notes: null,
      });
    }
  }

  const result: Record<string, EffectiveState> = {};
  const defaultOverride: ChannelStateRow = {
    publishMode: "auto",
    reviewStartedAt: null,
    notes: null,
  };
  for (const channel of connected) {
    const override = overrides.get(channel) ?? defaultOverride;
    result[channel] = resolveEffectiveState(channel, true, override);
  }
  return result;
}
