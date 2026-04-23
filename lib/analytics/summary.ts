// Analytics-page aggregations over platform_insights. Pure-SQL layer, no LLM.
// Kept separate from the nightly readback (lib/readback/*) so the page can
// recompute on every request without re-fetching platform APIs.

import { and, asc, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/db";
import { platformInsights, posts } from "@/db/schema";
import { requireActiveWorkspaceId } from "@/lib/workspaces/resolve";

export const WEEKS_WINDOW = 12;
export const MIN_POSTS_FOR_TOP_POSTS = 10;
export const MIN_WEEKS_FOR_REPEATABILITY = 8;

export type WeekBucket = { weekStart: Date; impressions: number; posts: number };

export type ChannelRow = {
  platform: string;
  impressions: number;
  posts: number;
  prevImpressions: number;
  prevPosts: number;
  deltaPct: number | null;
};

export type TopPost = {
  postId: string | null;
  remotePostId: string;
  platform: string;
  content: string | null;
  impressions: number;
  engagement: number;
  platformPostedAt: Date | null;
};

export type AnalyticsSummary = {
  totalImpressions: number;
  prevImpressions: number;
  deltaPct: number | null;
  totalEngagement: number;
  postCount: number;
  prevPostCount: number;
  weeks: WeekBucket[];
  channels: ChannelRow[];
  firstInsightAt: Date | null;
  weeksOfData: number;
  topPosts: TopPost[];
};

export async function getAnalyticsSummary(
  userId: string,
): Promise<AnalyticsSummary> {
  const workspaceId = await requireActiveWorkspaceId(userId);
  const now = new Date();
  const windowStart = weeksAgo(now, WEEKS_WINDOW);
  const prevStart = weeksAgo(now, WEEKS_WINDOW * 2);

  const rows = await db
    .select({
      platform: platformInsights.platform,
      remotePostId: platformInsights.remotePostId,
      postId: platformInsights.postId,
      metrics: platformInsights.metrics,
      platformPostedAt: platformInsights.platformPostedAt,
    })
    .from(platformInsights)
    .where(
      and(
        eq(platformInsights.workspaceId, workspaceId),
        gte(platformInsights.platformPostedAt, prevStart),
      ),
    );

  const [firstRow] = await db
    .select({ at: platformInsights.platformPostedAt })
    .from(platformInsights)
    .where(eq(platformInsights.workspaceId, workspaceId))
    .orderBy(asc(platformInsights.platformPostedAt))
    .limit(1);

  // Index post content for top-posts section. Only needed for post IDs
  // referenced by top candidates — but bulk fetching is cheaper than N+1.
  const postIds = Array.from(
    new Set(rows.map((r) => r.postId).filter((id): id is string => !!id)),
  );
  const postContentById = new Map<string, string>();
  if (postIds.length > 0) {
    const postRows = await db
      .select({ id: posts.id, content: posts.content })
      .from(posts)
      .where(inArray(posts.id, postIds));
    for (const p of postRows) postContentById.set(p.id, p.content);
  }

  const current = rows.filter(
    (r) => r.platformPostedAt && r.platformPostedAt >= windowStart,
  );
  const prior = rows.filter(
    (r) =>
      r.platformPostedAt &&
      r.platformPostedAt >= prevStart &&
      r.platformPostedAt < windowStart,
  );

  const weeks = bucketByWeek(current, windowStart, now);

  const channels = aggregateChannels(current, prior);

  const totals = {
    totalImpressions: sumImpressions(current),
    prevImpressions: sumImpressions(prior),
    totalEngagement: sumEngagement(current),
    postCount: current.length,
    prevPostCount: prior.length,
  };

  const topPosts = rankTopPosts(current, postContentById);

  const firstInsightAt = firstRow?.at ?? null;
  const weeksOfData = firstInsightAt
    ? Math.max(
        0,
        Math.floor(
          (now.getTime() - firstInsightAt.getTime()) /
            (7 * 24 * 60 * 60 * 1000),
        ),
      )
    : 0;

  return {
    ...totals,
    deltaPct: pctDelta(totals.totalImpressions, totals.prevImpressions),
    weeks,
    channels,
    firstInsightAt,
    weeksOfData,
    topPosts,
  };
}

type Row = {
  platform: string;
  remotePostId: string;
  postId: string | null;
  metrics: Record<string, number | null>;
  platformPostedAt: Date | null;
};

function impressionsOf(metrics: Record<string, number | null>): number {
  const v = metrics.impressions;
  return typeof v === "number" && v > 0 ? v : 0;
}

function engagementOf(metrics: Record<string, number | null>): number {
  return (
    (metrics.likes ?? 0) +
    (metrics.replies ?? 0) +
    (metrics.reposts ?? 0) +
    (metrics.quotes ?? 0) +
    (metrics.bookmarks ?? 0)
  );
}

function sumImpressions(rows: Row[]): number {
  return rows.reduce((s, r) => s + impressionsOf(r.metrics), 0);
}

function sumEngagement(rows: Row[]): number {
  return rows.reduce((s, r) => s + engagementOf(r.metrics), 0);
}

function pctDelta(curr: number, prev: number): number | null {
  if (prev <= 0) return null;
  return Math.round(((curr - prev) / prev) * 100);
}

function weeksAgo(from: Date, weeks: number): Date {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() - weeks * 7);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = (x.getUTCDay() + 6) % 7; // Monday-start
  x.setUTCDate(x.getUTCDate() - day);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function bucketByWeek(rows: Row[], start: Date, end: Date): WeekBucket[] {
  const buckets = new Map<number, WeekBucket>();
  const weekStart = startOfWeek(start);
  const weekEnd = startOfWeek(end);
  for (
    let t = weekStart.getTime();
    t <= weekEnd.getTime();
    t += 7 * 24 * 60 * 60 * 1000
  ) {
    buckets.set(t, { weekStart: new Date(t), impressions: 0, posts: 0 });
  }
  for (const r of rows) {
    if (!r.platformPostedAt) continue;
    const key = startOfWeek(r.platformPostedAt).getTime();
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.impressions += impressionsOf(r.metrics);
    bucket.posts += 1;
  }
  return Array.from(buckets.values()).sort(
    (a, b) => a.weekStart.getTime() - b.weekStart.getTime(),
  );
}

function aggregateChannels(current: Row[], prior: Row[]): ChannelRow[] {
  const map = new Map<
    string,
    { impressions: number; posts: number; prev: number; prevPosts: number }
  >();
  for (const r of current) {
    const entry = map.get(r.platform) ?? {
      impressions: 0,
      posts: 0,
      prev: 0,
      prevPosts: 0,
    };
    entry.impressions += impressionsOf(r.metrics);
    entry.posts += 1;
    map.set(r.platform, entry);
  }
  for (const r of prior) {
    const entry = map.get(r.platform) ?? {
      impressions: 0,
      posts: 0,
      prev: 0,
      prevPosts: 0,
    };
    entry.prev += impressionsOf(r.metrics);
    entry.prevPosts += 1;
    map.set(r.platform, entry);
  }
  return Array.from(map.entries())
    .map(([platform, v]) => ({
      platform,
      impressions: v.impressions,
      posts: v.posts,
      prevImpressions: v.prev,
      prevPosts: v.prevPosts,
      deltaPct: pctDelta(v.impressions, v.prev),
    }))
    .sort((a, b) => b.impressions - a.impressions);
}

function rankTopPosts(
  rows: Row[],
  contentById: Map<string, string>,
): TopPost[] {
  return rows
    .map((r) => {
      const impressions = impressionsOf(r.metrics);
      const engagement = engagementOf(r.metrics);
      return {
        postId: r.postId,
        remotePostId: r.remotePostId,
        platform: r.platform,
        content: r.postId ? (contentById.get(r.postId) ?? null) : null,
        impressions,
        engagement,
        platformPostedAt: r.platformPostedAt,
      };
    })
    .filter((p) => p.impressions > 0 || p.engagement > 0)
    .sort(
      (a, b) =>
        b.impressions - a.impressions || b.engagement - a.engagement,
    )
    .slice(0, 3);
}

