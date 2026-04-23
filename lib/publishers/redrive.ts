// Re-drive for `pending_review` deliveries. When a platform un-gates —
// either because platform review approved, or because the user flipped
// their override away from `review_pending` — any parked deliveries need
// to resume. Run daily via QStash; the dispatcher's `skip if already
// published` guard keeps retried posts from double-publishing.
//
// Scope rules:
//   - Only `pending_review` deliveries (manual_assist is handled by the
//     reminder flow, which fires at post-time, not re-drive).
//   - Only deliveries whose channel is now publish-ready for the owning
//     user (checked via `decideForPublish`).
//   - Only parent posts whose status is still "scheduled". Posts the
//     user failed or manually re-routed are left alone.

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { postDeliveries, posts } from "@/db/schema";
import { decideForPublish } from "@/lib/channel-state";
import { publishPost } from "./index";

export type RedriveOutcome = {
  postId: string;
  status: "ok" | "still_gated" | "failed" | "skipped";
  anyPublished?: boolean;
  error?: string;
};

export async function redrivePendingReview(): Promise<RedriveOutcome[]> {
  // One round-trip: every pending_review delivery, paired with its post's
  // status + userId so we can filter without a per-row join.
  const parked = await db
    .select({
      postId: postDeliveries.postId,
      platform: postDeliveries.platform,
      userId: posts.createdByUserId,
      postStatus: posts.status,
    })
    .from(postDeliveries)
    .innerJoin(posts, eq(postDeliveries.postId, posts.id))
    .where(eq(postDeliveries.status, "pending_review"));

  // Group by post. A post counts as "re-driveable" if at least one of its
  // pending deliveries now says "go".
  const byPost = new Map<
    string,
    {
      userId: string;
      postStatus: string;
      readyPlatforms: string[];
      stillGatedPlatforms: string[];
    }
  >();

  for (const row of parked) {
    if (row.postStatus !== "scheduled") continue;
    const decision = await decideForPublish(row.userId, row.platform);
    const entry = byPost.get(row.postId) ?? {
      userId: row.userId,
      postStatus: row.postStatus,
      readyPlatforms: [],
      stillGatedPlatforms: [],
    };
    if (decision.kind === "go") {
      entry.readyPlatforms.push(row.platform);
    } else {
      entry.stillGatedPlatforms.push(row.platform);
    }
    byPost.set(row.postId, entry);
  }

  const outcomes: RedriveOutcome[] = [];
  for (const [postId, entry] of byPost) {
    if (entry.readyPlatforms.length === 0) {
      outcomes.push({ postId, status: "still_gated" });
      continue;
    }
    try {
      const summary = await publishPost(postId);
      outcomes.push({
        postId,
        status: "ok",
        anyPublished: summary.anyOk,
      });
    } catch (err) {
      outcomes.push({
        postId,
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return outcomes;
}

// Useful for admin tooling / manual triggers — force a re-drive for a
// specific post without waiting for the scheduled run.
export async function redriveSinglePost(postId: string): Promise<RedriveOutcome> {
  const [post] = await db
    .select({ status: posts.status })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);
  if (!post) return { postId, status: "skipped", error: "Post not found." };
  if (post.status !== "scheduled") {
    return {
      postId,
      status: "skipped",
      error: `Post status is "${post.status}" — re-drive only runs on "scheduled".`,
    };
  }
  const pending = await db
    .select({ platform: postDeliveries.platform })
    .from(postDeliveries)
    .where(
      and(
        eq(postDeliveries.postId, postId),
        eq(postDeliveries.status, "pending_review"),
      ),
    );
  if (pending.length === 0) {
    return { postId, status: "skipped", error: "No pending_review deliveries." };
  }
  try {
    const summary = await publishPost(postId);
    return { postId, status: "ok", anyPublished: summary.anyOk };
  } catch (err) {
    return {
      postId,
      status: "failed",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
