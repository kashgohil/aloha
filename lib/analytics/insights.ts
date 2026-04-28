// Weekly Insights — the data layer behind the digest email + the
// in-app /app/insights page. Pure-SQL aggregations followed by a
// rule-based "what should you do more of?" pass.
//
// Suggestions are intentionally NOT LLM-generated. The data is sparse
// for new workspaces and the rules degrade gracefully (return fewer
// suggestions when signal is thin) — an LLM would hallucinate
// confidence we can't back up. Once usage volume justifies it we can
// add a Muse-voiced rewrite layer over these rules.

import { and, asc, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/db";
import { platformInsights, posts } from "@/db/schema";

const LOOKBACK_WEEKS = 4;
const MIN_POSTS_FOR_SUGGESTIONS = 6;
const MIN_PER_BUCKET = 2;

export type InsightsTopPost = {
  postId: string;
  platform: string;
  content: string;
  impressions: number;
  engagement: number;
  platformPostedAt: Date | null;
};

export type InsightSuggestion = {
  // Stable identifier for telemetry / dedupe across sends.
  kind: "best_time" | "best_tag" | "channel_gap";
  // Punchy headline shown in both the email + the in-app page.
  headline: string;
  // One-line "why we said this" so the user can sanity-check the data.
  rationale: string;
  // Optional CTA URL — e.g., "/app/composer?platform=linkedin" — when
  // there's a single obvious next click. Null when the suggestion is
  // observational rather than actionable.
  href: string | null;
};

export type WeeklyInsights = {
  workspaceId: string;
  rangeStart: Date;
  rangeEnd: Date;
  totalImpressions: number;
  totalEngagement: number;
  postCount: number;
  topPosts: InsightsTopPost[];
  suggestions: InsightSuggestion[];
};

type InsightsRow = {
  postId: string | null;
  platform: string;
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

export async function computeWeeklyInsights(
  workspaceId: string,
): Promise<WeeklyInsights> {
  const now = new Date();
  const rangeStart = new Date(
    now.getTime() - LOOKBACK_WEEKS * 7 * 86_400_000,
  );

  const insightsRows = await db
    .select({
      postId: platformInsights.postId,
      platform: platformInsights.platform,
      metrics: platformInsights.metrics,
      platformPostedAt: platformInsights.platformPostedAt,
    })
    .from(platformInsights)
    .where(
      and(
        eq(platformInsights.workspaceId, workspaceId),
        gte(platformInsights.platformPostedAt, rangeStart),
      ),
    )
    .orderBy(asc(platformInsights.platformPostedAt));

  const rows = insightsRows as InsightsRow[];

  const postIds = Array.from(
    new Set(rows.map((r) => r.postId).filter((id): id is string => Boolean(id))),
  );
  const postMeta = new Map<
    string,
    { content: string; tags: string[] }
  >();
  if (postIds.length > 0) {
    const postRows = await db
      .select({
        id: posts.id,
        content: posts.content,
      })
      .from(posts)
      .where(inArray(posts.id, postIds));
    // We pull tags via a second select since the `posts` schema doesn't
    // have a tags column today (tags live on `ideas`). Keeping the query
    // here as a placeholder for a future extension; for now `tags`
    // stays empty and the best-tag rule no-ops gracefully.
    for (const p of postRows) {
      postMeta.set(p.id, { content: p.content, tags: [] });
    }
  }

  const totalImpressions = rows.reduce((s, r) => s + impressionsOf(r.metrics), 0);
  const totalEngagement = rows.reduce((s, r) => s + engagementOf(r.metrics), 0);
  const postCount = rows.length;

  const topPosts = rankTopPosts(rows, postMeta);
  const suggestions = buildSuggestions(rows, postMeta);

  return {
    workspaceId,
    rangeStart,
    rangeEnd: now,
    totalImpressions,
    totalEngagement,
    postCount,
    topPosts,
    suggestions,
  };
}

function rankTopPosts(
  rows: InsightsRow[],
  meta: Map<string, { content: string; tags: string[] }>,
): InsightsTopPost[] {
  return rows
    .map((r) => {
      const impressions = impressionsOf(r.metrics);
      const engagement = engagementOf(r.metrics);
      const content = r.postId ? meta.get(r.postId)?.content ?? "" : "";
      return r.postId
        ? {
            postId: r.postId,
            platform: r.platform,
            content,
            impressions,
            engagement,
            platformPostedAt: r.platformPostedAt,
          }
        : null;
    })
    .filter((p): p is InsightsTopPost => p !== null)
    .filter((p) => p.impressions > 0 || p.engagement > 0)
    // Engagement-per-impression rather than raw — small accounts shouldn't
    // be told "this 4-impression post was your best" just because it
    // beat zeros.
    .sort((a, b) => {
      const aRate = a.impressions > 0 ? a.engagement / a.impressions : 0;
      const bRate = b.impressions > 0 ? b.engagement / b.impressions : 0;
      return bRate - aRate || b.engagement - a.engagement;
    })
    .slice(0, 3);
}

// Hour-of-day bucket → average engagement-per-post. Suggestion fires
// when one bucket's average is meaningfully above the workspace mean
// AND the bucket has enough samples to not be noise.
function buildSuggestions(
  rows: InsightsRow[],
  _meta: Map<string, { content: string; tags: string[] }>,
): InsightSuggestion[] {
  if (rows.length < MIN_POSTS_FOR_SUGGESTIONS) return [];

  const out: InsightSuggestion[] = [];

  // 1) Best time-of-day bucket (4-hour windows so we don't slice the
  // signal too thin). Quoted in UTC for now — when the digest runs we
  // pass the workspace timezone to the renderer; the underlying bucket
  // is timezone-agnostic.
  const byBucket = new Map<number, { engagement: number; posts: number }>();
  for (const r of rows) {
    if (!r.platformPostedAt) continue;
    const bucket = Math.floor(r.platformPostedAt.getUTCHours() / 4);
    const cur = byBucket.get(bucket) ?? { engagement: 0, posts: 0 };
    cur.engagement += engagementOf(r.metrics);
    cur.posts += 1;
    byBucket.set(bucket, cur);
  }
  const meanPerPost =
    rows.reduce((s, r) => s + engagementOf(r.metrics), 0) / rows.length || 0;
  let bestBucket: { bucket: number; rate: number; posts: number } | null = null;
  for (const [bucket, v] of byBucket) {
    if (v.posts < MIN_PER_BUCKET) continue;
    const rate = v.engagement / v.posts;
    if (rate > meanPerPost * 1.4 && (!bestBucket || rate > bestBucket.rate)) {
      bestBucket = { bucket, rate, posts: v.posts };
    }
  }
  if (bestBucket) {
    const startHour = bestBucket.bucket * 4;
    const endHour = startHour + 4;
    const lift = Math.round((bestBucket.rate / meanPerPost - 1) * 100);
    out.push({
      kind: "best_time",
      headline: `Posts going up between ${formatHour(startHour)} and ${formatHour(endHour)} are doing ${lift}% better.`,
      rationale: `Across ${bestBucket.posts} posts in that window, average engagement-per-post sits well above your overall mean.`,
      href: null,
    });
  }

  // 2) Channel cadence gap — for each channel with at least one post in
  // the window, compute days since last post. If it's been > 7 days AND
  // the channel's recent average outperforms the workspace mean, nudge
  // the user back into it.
  const lastPostByChannel = new Map<string, Date>();
  const channelEngagement = new Map<
    string,
    { engagement: number; posts: number }
  >();
  for (const r of rows) {
    if (!r.platformPostedAt) continue;
    const last = lastPostByChannel.get(r.platform);
    if (!last || r.platformPostedAt > last) {
      lastPostByChannel.set(r.platform, r.platformPostedAt);
    }
    const cur = channelEngagement.get(r.platform) ?? {
      engagement: 0,
      posts: 0,
    };
    cur.engagement += engagementOf(r.metrics);
    cur.posts += 1;
    channelEngagement.set(r.platform, cur);
  }
  const now = new Date();
  let bestGap: {
    platform: string;
    daysSince: number;
    multiplier: number;
  } | null = null;
  for (const [platform, last] of lastPostByChannel) {
    const daysSince = Math.floor(
      (now.getTime() - last.getTime()) / 86_400_000,
    );
    if (daysSince <= 7) continue;
    const v = channelEngagement.get(platform);
    if (!v || v.posts < 2) continue;
    const rate = v.engagement / v.posts;
    if (meanPerPost <= 0) continue;
    const multiplier = rate / meanPerPost;
    if (multiplier < 1.2) continue;
    if (!bestGap || multiplier > bestGap.multiplier) {
      bestGap = { platform, daysSince, multiplier };
    }
  }
  if (bestGap) {
    const lift = Math.round((bestGap.multiplier - 1) * 100);
    out.push({
      kind: "channel_gap",
      headline: `${capitalize(bestGap.platform)} has been quiet for ${bestGap.daysSince} days — it's one of your stronger channels.`,
      rationale: `Recent ${bestGap.platform} posts averaged ${lift}% above your overall engagement-per-post.`,
      href: `/app/composer?platform=${encodeURIComponent(bestGap.platform)}`,
    });
  }

  return out.slice(0, 3);
}

function formatHour(h: number): string {
  const wrapped = ((h % 24) + 24) % 24;
  if (wrapped === 0) return "midnight";
  if (wrapped === 12) return "noon";
  const meridian = wrapped < 12 ? "am" : "pm";
  const display = wrapped % 12 === 0 ? 12 : wrapped % 12;
  return `${display}${meridian}`;
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}
