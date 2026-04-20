// Repeatability score. Answers "are your best posts flukes, or a pattern
// you can run again?" For each platform we look at posts in the top
// quartile by impressions; a post counts as "repeatable" if at least one
// other top-quartile post on the same platform landed in the same
// (day-of-week × 2-hour band). Gated behind an 8-week minimum history —
// anything shorter is too noisy to print honestly.

import { and, asc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { platformInsights } from "@/db/schema";

export const MIN_WEEKS = 8;
export const MIN_POSTS_PER_PLATFORM = 12;
const BAND_HOURS = 2;
const LOOKBACK_DAYS = 12 * 7;

export type RepeatabilityGate =
  | { state: "ready"; score: number; perPlatform: PlatformRepeatability[] }
  | { state: "warming"; weeksOfData: number; weeksNeeded: number };

export type PlatformRepeatability = {
  platform: string;
  score: number; // 0..1
  spikeCount: number;
  repeatedSpikes: number;
};

export async function getRepeatability(
  userId: string,
  timezone: string,
): Promise<RepeatabilityGate> {
  const [earliest] = await db
    .select({ at: platformInsights.platformPostedAt })
    .from(platformInsights)
    .where(eq(platformInsights.userId, userId))
    .orderBy(asc(platformInsights.platformPostedAt))
    .limit(1);

  const earliestAt = earliest?.at ?? null;
  const weeksOfData = earliestAt
    ? Math.floor(
        (Date.now() - earliestAt.getTime()) / (7 * 24 * 60 * 60 * 1000),
      )
    : 0;

  if (weeksOfData < MIN_WEEKS) {
    return { state: "warming", weeksOfData, weeksNeeded: MIN_WEEKS };
  }

  const cutoff = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      platform: platformInsights.platform,
      platformPostedAt: platformInsights.platformPostedAt,
      metrics: platformInsights.metrics,
    })
    .from(platformInsights)
    .where(
      and(
        eq(platformInsights.userId, userId),
        gte(platformInsights.platformPostedAt, cutoff),
      ),
    );

  const byPlatform = new Map<
    string,
    Array<{ score: number; band: string }>
  >();
  for (const r of rows) {
    if (!r.platformPostedAt) continue;
    const score = scoreOf(r.metrics);
    if (score <= 0) continue;
    const band = bandKey(r.platformPostedAt, timezone);
    const arr = byPlatform.get(r.platform) ?? [];
    arr.push({ score, band });
    byPlatform.set(r.platform, arr);
  }

  const perPlatform: PlatformRepeatability[] = [];
  let totalSpikes = 0;
  let totalRepeated = 0;
  for (const [platform, items] of byPlatform.entries()) {
    if (items.length < MIN_POSTS_PER_PLATFORM) continue;
    const sorted = [...items].sort((a, b) => b.score - a.score);
    const qCount = Math.max(2, Math.floor(sorted.length / 4));
    const spikes = sorted.slice(0, qCount);
    const bandCounts = new Map<string, number>();
    for (const s of spikes) {
      bandCounts.set(s.band, (bandCounts.get(s.band) ?? 0) + 1);
    }
    const repeated = spikes.filter((s) => (bandCounts.get(s.band) ?? 0) >= 2)
      .length;
    perPlatform.push({
      platform,
      score: spikes.length === 0 ? 0 : repeated / spikes.length,
      spikeCount: spikes.length,
      repeatedSpikes: repeated,
    });
    totalSpikes += spikes.length;
    totalRepeated += repeated;
  }

  if (perPlatform.length === 0) {
    // Have enough calendar time but not enough ranked data yet.
    return { state: "warming", weeksOfData, weeksNeeded: MIN_WEEKS };
  }

  return {
    state: "ready",
    score: totalSpikes === 0 ? 0 : totalRepeated / totalSpikes,
    perPlatform: perPlatform.sort((a, b) => b.score - a.score),
  };
}

function scoreOf(metrics: Record<string, number | null>): number {
  const imp = metrics.impressions;
  if (typeof imp === "number" && imp > 0) return imp;
  return (
    (metrics.likes ?? 0) +
    (metrics.replies ?? 0) +
    (metrics.reposts ?? 0) +
    (metrics.quotes ?? 0)
  );
}

function bandKey(at: Date, timezone: string): string {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    hour: "numeric",
    hour12: false,
  });
  const parts = fmt.formatToParts(at);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const hourStr = parts.find((p) => p.type === "hour")?.value ?? "0";
  const hour = Number(hourStr) % 24;
  const band = Math.floor(hour / BAND_HOURS);
  return `${weekday}-${band}`;
}
