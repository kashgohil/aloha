import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { posts } from "@/db/schema";
import {
  registerCondition,
  type ConditionContext,
} from "../registry";
import { findPostIdInSnapshot } from "./post-context";

// Approval heuristic until a dedicated "approve draft" affordance exists.
// The weekly_muse_draft template inserts a draft, waits N hours, then asks
// "Approved?". We read that as: did the user engage with the draft during
// the hold window?
//
// Rules:
//  - No post found → not approved (no-op path: save_as_draft).
//  - Post deleted → not approved (explicit rejection).
//  - Post status moved to "scheduled" or "published" → the user already
//    handled it through the normal composer flow, so we must NOT publish
//    again in the yes-branch. Treat as not approved here so the automation
//    doesn't double-post; the user's own action wins.
//  - Post still "draft" AND the user has touched it since creation
//    (updatedAt appreciably after createdAt) → approved, publish it.
//  - Post still "draft" and untouched → not approved, save_as_draft path.
//
// The "meaningfully after" threshold is 60s to tolerate any same-request
// updatedAt refresh from the initial insert pipeline without flipping this
// to a true just because of clock skew.

const APPROVAL_TOUCH_THRESHOLD_MS = 60_000;

registerCondition(
  "approval_status",
  async ({ userId, snapshot, trigger }: ConditionContext): Promise<boolean> => {
    const postId = findPostIdInSnapshot(snapshot, trigger);
    if (!postId) return false;

    const [row] = await db
      .select({
        id: posts.id,
        status: posts.status,
        deletedAt: posts.deletedAt,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .where(and(eq(posts.id, postId), eq(posts.createdByUserId, userId)))
      .limit(1);

    if (!row) return false;
    if (row.deletedAt) return false;
    if (row.status !== "draft") return false;

    const delta = row.updatedAt.getTime() - row.createdAt.getTime();
    return delta >= APPROVAL_TOUCH_THRESHOLD_MS;
  },
);
