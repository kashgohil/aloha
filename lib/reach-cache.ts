import { unstable_cache } from "next/cache";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { platformInsights } from "@/db/schema";

export const reachTag = (userId: string) => `reach:${userId}`;

// Last-7-day reach rollup per platform. Source data refreshes nightly via
// the readback cron (lib/readback) — 1 hour TTL is comfortable, and the
// tag is invalidated by the cron after each run.
export function getReachLast7Days(userId: string) {
  return unstable_cache(
    async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return db
        .select({
          platform: platformInsights.platform,
          impressions: sql<string>`COALESCE(SUM(NULLIF(${platformInsights.metrics}->>'impressions', '')::bigint), 0)`,
          posts: sql<number>`COUNT(*)`,
        })
        .from(platformInsights)
        .where(
          and(
            eq(platformInsights.userId, userId),
            gte(platformInsights.platformPostedAt, sevenDaysAgo),
          ),
        )
        .groupBy(platformInsights.platform);
    },
    ["reach-last-7d", userId],
    { revalidate: 3600, tags: [reachTag(userId)] },
  )();
}
