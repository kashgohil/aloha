// Best-time-to-post aggregation. Reads `platform_insights` for a user,
// groups historical posts into (day-of-week × 2-hour bands) in the user's
// timezone, and returns the bands that beat the user's own baseline by the
// largest margin.
//
// Posture:
//   - Non-LLM. Pure math over cached metrics.
//   - Honest confidence gating — we refuse to surface windows from thin
//     data. Better no badge than a made-up one.
//   - Score metric prefers `impressions`; falls back to engagement sum
//     (likes + replies + reposts + quotes) when impressions aren't cached.
//   - Windows that don't beat the user's baseline are dropped — we only
//     recommend improvements, never sideways moves.

// Server-only module — imports the DB layer. Client code should instead
// import from `./best-time-format`, which has the types + formatter only.

import { and, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { platformInsights } from "@/db/schema";
import type { BestWindow } from "./best-time-format";

export type { BestWindow } from "./best-time-format";
export { DAY_LABELS, formatWindow } from "./best-time-format";

const LOOKBACK_DAYS = 90;
const MIN_POSTS_PER_PLATFORM = 8;
const MIN_SAMPLES_PER_BAND = 2;
const BAND_HOURS = 2;
const TOP_WINDOWS = 3;

export async function getBestWindowsForUser(
  userId: string,
  timezone: string,
): Promise<Record<string, BestWindow[]>> {
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
    )
    .limit(2000);

  // Group scored posts by platform.
  const byPlatform: Record<string, Array<{ score: number; posted: Date }>> = {};
  for (const r of rows) {
    if (!r.platformPostedAt) continue;
    const score = scoreFromMetrics(r.metrics);
    if (score <= 0) continue;
    (byPlatform[r.platform] ??= []).push({
      score,
      posted: r.platformPostedAt,
    });
  }

  const result: Record<string, BestWindow[]> = {};
  for (const [platform, items] of Object.entries(byPlatform)) {
    if (items.length < MIN_POSTS_PER_PLATFORM) continue;
    const windows = rankWindows(items, timezone);
    if (windows.length > 0) result[platform] = windows;
  }
  return result;
}

function scoreFromMetrics(metrics: Record<string, number | null>): number {
  const impressions = metrics.impressions;
  if (typeof impressions === "number" && impressions > 0) return impressions;
  // Fallback: engagement sum. Missing fields default to 0.
  const engagement =
    (metrics.likes ?? 0) +
    (metrics.replies ?? 0) +
    (metrics.reposts ?? 0) +
    (metrics.quotes ?? 0);
  return engagement > 0 ? engagement : 0;
}

function rankWindows(
  items: Array<{ score: number; posted: Date }>,
  timezone: string,
): BestWindow[] {
  const buckets = new Map<
    string,
    { dayOfWeek: number; bandIdx: number; scores: number[] }
  >();
  for (const it of items) {
    const { dayOfWeek, hour } = localDayAndHour(it.posted, timezone);
    const bandIdx = Math.floor(hour / BAND_HOURS);
    const key = `${dayOfWeek}-${bandIdx}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.scores.push(it.score);
    } else {
      buckets.set(key, { dayOfWeek, bandIdx, scores: [it.score] });
    }
  }

  const baseline = items.reduce((s, x) => s + x.score, 0) / items.length;
  if (baseline <= 0) return [];

  const windows: BestWindow[] = [];
  for (const b of buckets.values()) {
    if (b.scores.length < MIN_SAMPLES_PER_BAND) continue;
    const avg = b.scores.reduce((s, v) => s + v, 0) / b.scores.length;
    const deltaPct = Math.round(((avg - baseline) / baseline) * 100);
    if (deltaPct <= 0) continue;
    windows.push({
      dayOfWeek: b.dayOfWeek,
      hourStart: b.bandIdx * BAND_HOURS,
      hourEnd: b.bandIdx * BAND_HOURS + BAND_HOURS,
      samples: b.scores.length,
      deltaPct,
    });
  }

  windows.sort((a, b) => b.deltaPct - a.deltaPct);
  return windows.slice(0, TOP_WINDOWS);
}

// Resolves (day-of-week, hour) for a given UTC instant in the user's tz.
// `Intl.DateTimeFormat` is authoritative for tz offsets including DST;
// anchoring both parts to the same formatter avoids boundary drift.
function localDayAndHour(
  date: Date,
  timezone: string,
): { dayOfWeek: number; hour: number } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    hour: "numeric",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const hourPart = parts.find((p) => p.type === "hour")?.value ?? "0";
  // Intl sometimes reports hour "24" for midnight in some locales — normalize.
  const hourNum = Number(hourPart) % 24;
  return {
    dayOfWeek: DAY_MAP[weekday] ?? 0,
    hour: Number.isFinite(hourNum) ? hourNum : 0,
  };
}

const DAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};
