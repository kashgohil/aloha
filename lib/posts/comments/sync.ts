import { db } from "@/db";
import {
  postComments,
  postDeliveries,
  postSyncCursors,
  posts,
} from "@/db/schema";
import { captureException } from "@/lib/logger";
import { and, eq, lt, ne, notInArray, sql } from "drizzle-orm";
import { fetchBlueskyPostComments } from "./bluesky";
import { fetchInstagramPostComments } from "./instagram";
import { fetchLinkedInPostComments } from "./linkedin";
import { fetchMastodonPostComments } from "./mastodon";
import { fetchPinterestPostComments } from "./pinterest";
import { fetchThreadsPostComments } from "./threads";
import { fetchXPostComments } from "./x";
import type { CommentsFetchResult } from "./types";

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
  (
    userId: string,
    rootRemoteId: string,
    cursor: string | null,
  ) => Promise<CommentsFetchResult>
> = {
  bluesky: (u, r) => fetchBlueskyPostComments(u, r),
  twitter: (u, r, c) => fetchXPostComments(u, r, c),
  mastodon: (u, r) => fetchMastodonPostComments(u, r),
  instagram: (u, r, c) => fetchInstagramPostComments(u, r, c),
  pinterest: (u, r, c) => fetchPinterestPostComments(u, r, c),
  linkedin: (u, r, c) => fetchLinkedInPostComments(u, r, c),
  threads: (u, r, c) => fetchThreadsPostComments(u, r, c),
};

function isSupported(platform: string): platform is Platform {
  return (SUPPORTED as readonly string[]).includes(platform);
}

export async function syncPostDeliveryComments(
  deliveryId: string,
): Promise<{ synced: number; skipped: boolean }> {
  const [row] = await db
    .select({
      id: postDeliveries.id,
      platform: postDeliveries.platform,
      remotePostId: postDeliveries.remotePostId,
      status: postDeliveries.status,
      userId: posts.userId,
    })
    .from(postDeliveries)
    .innerJoin(posts, eq(posts.id, postDeliveries.postId))
    .where(eq(postDeliveries.id, deliveryId))
    .limit(1);

  if (!row) return { synced: 0, skipped: true };

  if (!row.remotePostId || !isSupported(row.platform)) {
    return { synced: 0, skipped: true };
  }

  const [cursorRow] = await db
    .select({ cursor: postSyncCursors.cursor })
    .from(postSyncCursors)
    .where(
      and(
        eq(postSyncCursors.deliveryId, row.id),
        eq(postSyncCursors.kind, "comments"),
      ),
    )
    .limit(1);

  let result: CommentsFetchResult;
  try {
    result = await FETCHERS[row.platform](
      row.userId,
      row.remotePostId,
      cursorRow?.cursor ?? null,
    );
  } catch (err) {
    await captureException(err, {
      tags: { source: "post.comments.sync", platform: row.platform },
      extra: { deliveryId: row.id, remotePostId: row.remotePostId },
    });
    throw err;
  }

  let synced = 0;
  if (result.comments.length > 0) {
    const rows = result.comments.map((c) => ({
      userId: row.userId,
      platform: row.platform,
      remoteId: c.remoteId,
      parentRemoteId: c.parentRemoteId,
      rootRemoteId: c.rootRemoteId,
      authorDid: c.authorDid,
      authorHandle: c.authorHandle,
      authorDisplayName: c.authorDisplayName,
      authorAvatarUrl: c.authorAvatarUrl,
      content: c.content,
      platformData: c.platformData,
      platformCreatedAt: c.platformCreatedAt,
    }));

    const inserted = await db
      .insert(postComments)
      .values(rows)
      .onConflictDoNothing()
      .returning({ id: postComments.id });
    synced = inserted.length;
  }

  // Orphan cleanup: replies whose parent wasn't re-fetched in this pass
  // and which are older than 30 days are dropped. The parent probably
  // got deleted upstream (or fell off pagination and isn't coming back),
  // so keeping the orphan forever just clutters the thread view.
  if (row.remotePostId) {
    const currentRemoteIds = await db
      .select({ remoteId: postComments.remoteId })
      .from(postComments)
      .where(
        and(
          eq(postComments.userId, row.userId),
          eq(postComments.platform, row.platform),
          eq(postComments.rootRemoteId, row.remotePostId),
        ),
      );
    const knownIds = currentRemoteIds.map((r) => r.remoteId);
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    await db
      .delete(postComments)
      .where(
        and(
          eq(postComments.userId, row.userId),
          eq(postComments.platform, row.platform),
          eq(postComments.rootRemoteId, row.remotePostId),
          ne(postComments.parentRemoteId, row.remotePostId),
          lt(postComments.platformCreatedAt, cutoff),
          knownIds.length > 0
            ? notInArray(postComments.parentRemoteId, knownIds)
            : sql`true`,
        ),
      );
  }

  await db
    .insert(postSyncCursors)
    .values({
      deliveryId: row.id,
      kind: "comments",
      cursor: result.newCursor,
      lastSyncedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [postSyncCursors.deliveryId, postSyncCursors.kind],
      set: {
        cursor: result.newCursor,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      },
    });

  return { synced, skipped: false };
}
