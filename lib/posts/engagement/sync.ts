import { db } from "@/db";
import {
  postDeliveries,
  postEngagementSnapshots,
  postSyncCursors,
  posts,
} from "@/db/schema";
import { captureException } from "@/lib/logger";
import { and, desc, eq } from "drizzle-orm";
import { fetchBlueskyPostMetrics } from "./bluesky";
import { fetchInstagramPostMetrics } from "./instagram";
import { fetchLinkedInPostMetrics } from "./linkedin";
import { fetchMastodonPostMetrics } from "./mastodon";
import { fetchPinterestPostMetrics } from "./pinterest";
import { fetchThreadsPostMetrics } from "./threads";
import { fetchXPostMetrics } from "./x";
import type { NormalizedSnapshot } from "./types";

type Platform =
  | "bluesky"
  | "twitter"
  | "mastodon"
  | "instagram"
  | "pinterest"
  | "linkedin"
  | "threads";

const SUPPORTED: readonly Platform[] = [
  "bluesky",
  "twitter",
  "mastodon",
  "instagram",
  "pinterest",
  "linkedin",
  "threads",
];

const FETCHERS: Record<
  Platform,
  (workspaceId: string, remotePostId: string) => Promise<NormalizedSnapshot>
> = {
  bluesky: fetchBlueskyPostMetrics,
  twitter: fetchXPostMetrics,
  mastodon: fetchMastodonPostMetrics,
  instagram: fetchInstagramPostMetrics,
  pinterest: fetchPinterestPostMetrics,
  linkedin: fetchLinkedInPostMetrics,
  threads: fetchThreadsPostMetrics,
};

function isSupported(platform: string): platform is Platform {
  return (SUPPORTED as readonly string[]).includes(platform);
}

export async function syncPostDeliveryMetrics(
  deliveryId: string,
): Promise<{ captured: boolean }> {
  const [row] = await db
    .select({
      id: postDeliveries.id,
      platform: postDeliveries.platform,
      remotePostId: postDeliveries.remotePostId,
      status: postDeliveries.status,
      workspaceId: posts.workspaceId,
    })
    .from(postDeliveries)
    .innerJoin(posts, eq(posts.id, postDeliveries.postId))
    .where(eq(postDeliveries.id, deliveryId))
    .limit(1);

  if (!row || !row.remotePostId || !isSupported(row.platform)) {
    return { captured: false };
  }

  let snapshot: NormalizedSnapshot;
  try {
    snapshot = await FETCHERS[row.platform](row.workspaceId, row.remotePostId);
  } catch (err) {
    await captureException(err, {
      tags: { source: "post.engagement.sync", platform: row.platform },
      extra: { deliveryId: row.id, remotePostId: row.remotePostId },
    });
    throw err;
  }

  // Dedupe: if the latest row has the same six counters, skip the insert
  // and just bump the cursor. Keeps the append-only table from growing
  // when nothing actually moved between refreshes.
  const [latest] = await db
    .select({
      likes: postEngagementSnapshots.likes,
      reposts: postEngagementSnapshots.reposts,
      replies: postEngagementSnapshots.replies,
      views: postEngagementSnapshots.views,
      bookmarks: postEngagementSnapshots.bookmarks,
      profileClicks: postEngagementSnapshots.profileClicks,
    })
    .from(postEngagementSnapshots)
    .where(eq(postEngagementSnapshots.deliveryId, row.id))
    .orderBy(desc(postEngagementSnapshots.capturedAt))
    .limit(1);

  const unchanged =
    latest &&
    latest.likes === snapshot.likes &&
    latest.reposts === snapshot.reposts &&
    latest.replies === snapshot.replies &&
    latest.views === snapshot.views &&
    latest.bookmarks === snapshot.bookmarks &&
    latest.profileClicks === snapshot.profileClicks;

  if (!unchanged) {
    await db.insert(postEngagementSnapshots).values({
      deliveryId: row.id,
      likes: snapshot.likes,
      reposts: snapshot.reposts,
      replies: snapshot.replies,
      views: snapshot.views,
      bookmarks: snapshot.bookmarks,
      profileClicks: snapshot.profileClicks,
    });
  }

  await db
    .insert(postSyncCursors)
    .values({
      deliveryId: row.id,
      kind: "snapshot",
      cursor: null,
      lastSyncedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [postSyncCursors.deliveryId, postSyncCursors.kind],
      set: {
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      },
    });

  return { captured: true };
}
