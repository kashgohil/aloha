import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { posts } from "@/db/schema";
import {
  registerAction,
  type ActionContext,
  type ActionResult,
} from "../registry";
import { findPostIdInSnapshot } from "./post-context";

// `save_as_draft` sits in the "no" branch of weekly_muse_draft — the user
// didn't approve during the hold window, so we keep the generated post
// around as a draft they can revisit. The draft was already inserted by
// `muse_draft_post`, so this is a confirmation step rather than a mutation:
// verify the row still exists as a draft and record that in the run log.

registerAction(
  "save_as_draft",
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

    return {
      output: {
        postId,
        status: row.status,
        kept: row.status === "draft",
      },
    };
  },
);
