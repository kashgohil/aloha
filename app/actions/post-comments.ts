"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { postDeliveries, posts } from "@/db/schema";
import { syncPostDeliveryComments } from "@/lib/posts/comments/sync";
import { syncPostDeliveryMetrics } from "@/lib/posts/engagement/sync";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Single entry point for the post detail page's Refresh button. Pulls
// comments + engagement snapshots for every delivery in parallel. Each
// delivery fires both syncs concurrently so a slow platform doesn't stall
// a fast one. Errors per call are swallowed into the failed count so a
// single bad channel doesn't kill the whole refresh.
export async function refreshPost(postId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [post] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.userId, session.user.id)))
    .limit(1);

  if (!post) throw new Error("Post not found");

  const deliveries = await db
    .select({ id: postDeliveries.id })
    .from(postDeliveries)
    .where(eq(postDeliveries.postId, postId));

  const work = deliveries.flatMap((d) => [
    syncPostDeliveryComments(d.id),
    syncPostDeliveryMetrics(d.id),
  ]);

  const results = await Promise.allSettled(work);

  let commentsSynced = 0;
  let snapshotsCaptured = 0;
  let failed = 0;
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === "rejected") {
      failed += 1;
      continue;
    }
    // Even indices are comment syncs, odd are metric syncs.
    if (i % 2 === 0) {
      commentsSynced += (r.value as { synced: number }).synced ?? 0;
    } else {
      if ((r.value as { captured: boolean }).captured) snapshotsCaptured += 1;
    }
  }

  revalidatePath(`/app/posts/${postId}`);
  return { commentsSynced, snapshotsCaptured, failed };
}

// Back-compat alias — existing clients may still import the old name.
export const refreshPostComments = refreshPost;
