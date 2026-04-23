import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { publishPost } from "@/lib/publishers";
import {
  registerAction,
  type ActionContext,
  type ActionResult,
} from "../registry";
import { findPostIdInSnapshot } from "./post-context";

registerAction(
  "publish_post",
  async ({ userId, snapshot, trigger }: ActionContext): Promise<ActionResult> => {
    const postId = findPostIdInSnapshot(snapshot, trigger);
    if (!postId) {
      return {
        output: {
          skipped: true,
          reason: "No postId on trigger or upstream step output",
        },
      };
    }

    // Ownership + status guard: never publish another user's post, and
    // don't re-fire the dispatcher on a post that's already moved past
    // draft — QStash handles scheduled/published lifecycles and we'd
    // risk double-posting.
    const [row] = await db
      .select({
        id: posts.id,
        status: posts.status,
        deletedAt: posts.deletedAt,
      })
      .from(posts)
      .where(and(eq(posts.id, postId), eq(posts.createdByUserId, userId)))
      .limit(1);

    if (!row) {
      return {
        output: { skipped: true, reason: "Post not found or not owned by user", postId },
      };
    }
    if (row.deletedAt) {
      return { output: { skipped: true, reason: "Post was deleted", postId } };
    }
    if (row.status !== "draft") {
      return {
        output: {
          skipped: true,
          reason: `Post status is "${row.status}"; leaving it to its existing lifecycle`,
          postId,
        },
      };
    }

    const summary = await publishPost(postId);
    return {
      output: {
        postId,
        allOk: summary.allOk,
        anyOk: summary.anyOk,
        retryable: summary.retryable,
      },
    };
  },
);
