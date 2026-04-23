"use server";

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  ideas,
  posts,
  type ChannelOverride,
  type DraftMeta,
  type PostMedia,
} from "@/db/schema";
import { revalidatePath } from "next/cache";
import { Client } from "@upstash/qstash";
import { env } from "@/lib/env";
import { requireContext } from "@/lib/current-context";
import { unpublishPost } from "@/lib/unpublishers";
import { publishPost } from "@/lib/publishers";
import { assertTransition, type PostStatus } from "@/lib/posts/transitions";

const qstashClient = new Client({
  token: env.QSTASH_TOKEN,
  baseUrl: env.QSTASH_URL,
});

export type ComposerPayload = {
  content: string;
  platforms: string[];
  media?: PostMedia[];
  channelContent?: Record<string, ChannelOverride>;
  // When the composer was seeded from an idea, the client threads the idea
  // id back so we can stamp provenance on the post and flip the idea to
  // `drafted`. Advisory — posts without a source work fine.
  sourceIdeaId?: string | null;
  // Structured scaffolding from Muse (hook, key points, CTA, alt hooks,
  // hashtags, media suggestion, rationale). Passed through on save; the
  // composer sidebar reads it on open. Undefined means "don't touch" on
  // update; null clears.
  draftMeta?: DraftMeta | null;
};

async function flipIdeaToDrafted(
  workspaceId: string,
  ideaId: string | null | undefined,
) {
  if (!ideaId) return;
  // Only move from `new` → `drafted`. Respect manual `archived` or already
  // `drafted` states — we don't want to un-archive by accident.
  await db
    .update(ideas)
    .set({ status: "drafted", updatedAt: new Date() })
    .where(
      and(
        eq(ideas.id, ideaId),
        eq(ideas.workspaceId, workspaceId),
        eq(ideas.status, "new"),
      ),
    );
}

export async function saveDraft(payload: ComposerPayload) {
  const ctx = await requireContext();

  try {
    const [row] = await db
      .insert(posts)
      .values({
        createdByUserId: ctx.user.id,
        workspaceId: ctx.workspace.id,
        content: payload.content,
        platforms: payload.platforms,
        media: payload.media ?? [],
        channelContent: sanitizeOverrides(
          payload.channelContent,
          payload.platforms,
        ),
        status: "draft",
        sourceIdeaId: payload.sourceIdeaId ?? null,
        draftMeta: payload.draftMeta ?? null,
      })
      .returning({ id: posts.id });

    await flipIdeaToDrafted(ctx.workspace.id, payload.sourceIdeaId);

    revalidatePath("/app/dashboard");
    revalidatePath("/app/calendar");
    revalidatePath("/app/ideas");

    return { success: true, postId: row.id };
  } catch (error) {
    console.error("Save Draft Error:", error);
    throw new Error("Failed to save draft");
  }
}

// Flip an approved post into the scheduled queue. Strict one-step-forward:
// only works on posts already in `approved`. Enqueues QStash at the given
// time; the handler re-reads status + scheduledAt before firing, so older
// messages from rescheduling no-op safely.
export async function schedulePost(postId: string, scheduledAt: Date) {
  const ctx = await requireContext();

  if (scheduledAt.getTime() <= Date.now()) {
    throw new Error("Pick a future time to schedule for.");
  }

  const existing = await loadOwnedPost(postId, ctx.workspace.id);
  assertTransition(existing.status as PostStatus, "scheduled");

  await db
    .update(posts)
    .set({
      status: "scheduled",
      scheduledAt,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, postId));

  const delay = Math.max(
    0,
    Math.floor((scheduledAt.getTime() - Date.now()) / 1000),
  );
  await qstashClient.publishJSON({
    url: `${env.APP_URL}/api/qstash`,
    body: {
      postId,
      intendedScheduledAt: scheduledAt.toISOString(),
    },
    delay,
  });

  revalidatePostPaths(postId);
  return { success: true, postId };
}

// Publish-now path. Unlike schedulePost, this does the dispatch inline so
// the caller (composer) can await a concrete published/failed summary
// before navigating — otherwise the redirect lands on the post page while
// QStash still has the job queued, and the user sees a "scheduled" state
// for a beat. Accepts an optional existing postId to support publishing
// an existing draft/scheduled post without creating a duplicate row.
// Publish an approved post immediately. Flips status to `scheduled` with
// scheduledAt=now so the publisher infra (which keys off scheduled) picks
// it up inline. Requires the post to be in `approved` — strict one-step-
// forward with the `scheduled → published` step collapsed into one call.
export async function publishPostNow(postId: string) {
  const ctx = await requireContext();

  const existing = await loadOwnedPost(postId, ctx.workspace.id);
  assertTransition(existing.status as PostStatus, "published");

  const now = new Date();

  try {
    await db
      .update(posts)
      .set({
        status: "scheduled",
        scheduledAt: now,
        updatedAt: now,
      })
      .where(eq(posts.id, postId));

    const summary = await publishPost(postId);

    revalidatePostPaths(postId);
    return { success: true, postId, summary };
  } catch (error) {
    console.error("Publish Now Error:", error);
    throw new Error("Failed to publish post");
  }
}

// Content-only update. Keeps status untouched — status changes happen
// exclusively through the dedicated transition actions (submitForReview,
// approvePost, backToDraft, schedulePost, publishPostNow). Content edits
// are only permitted while the post is still a draft; once it's been
// submitted for review, the post is frozen and must be moved back to
// draft to receive further edits. For rescheduling a scheduled post, use
// `reschedulePost`.
export async function updatePost(postId: string, payload: ComposerPayload) {
  const ctx = await requireContext();

  const existing = await loadOwnedPost(postId, ctx.workspace.id);
  if (existing.status !== "draft") {
    throw new Error(
      "Post is locked. Move it back to draft to edit its content.",
    );
  }

  try {
    await db
      .update(posts)
      .set({
        content: payload.content,
        platforms: payload.platforms,
        media: payload.media ?? [],
        channelContent: sanitizeOverrides(
          payload.channelContent,
          payload.platforms,
        ),
        // `undefined` means "leave alone"; null clears; a value overwrites.
        ...(payload.draftMeta !== undefined
          ? { draftMeta: payload.draftMeta }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId));

    revalidatePostPaths(postId);
    return { success: true, postId };
  } catch (error) {
    console.error("Update Post Error:", error);
    throw new Error("Failed to update post");
  }
}

// Lightweight reschedule — bumps `scheduledAt` and queues a fresh QStash
// message for the new time. Rejects if the post is already published or a
// draft (drafts need to go through `updatePost` with full payload since
// they might be flipping status for the first time). Older QStash messages
// still fire on their original time but no-op because the handler
// re-checks status + scheduledAt.
export async function reschedulePost(postId: string, scheduledAt: Date) {
  const ctx = await requireContext();

  const [existing] = await db
    .select({
      id: posts.id,
      status: posts.status,
    })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.workspaceId, ctx.workspace.id)))
    .limit(1);
  if (!existing) throw new Error("Post not found");
  if (existing.status === "published") {
    throw new Error("Published posts can't be rescheduled.");
  }
  if (existing.status !== "scheduled") {
    throw new Error("Only scheduled posts can be rescheduled from here.");
  }

  if (scheduledAt.getTime() <= Date.now()) {
    throw new Error("Pick a future time to reschedule to.");
  }

  await db
    .update(posts)
    .set({ scheduledAt, updatedAt: new Date() })
    .where(eq(posts.id, postId));

  const delay = Math.max(
    0,
    Math.floor((scheduledAt.getTime() - Date.now()) / 1000),
  );
  await qstashClient.publishJSON({
    url: `${env.APP_URL}/api/qstash`,
    body: {
      postId,
      intendedScheduledAt: scheduledAt.toISOString(),
    },
    delay,
  });

  revalidatePath("/app/dashboard");
  revalidatePath("/app/calendar");
  revalidatePath(`/app/posts/${postId}`);
  revalidatePath("/app/posts");

  return { success: true };
}

// Deletes a post. Two modes:
//
//   - mode: "local"   → soft deletes the post by setting status to 'deleted'
//                       and setting deletedAt timestamp. The post will be
//                       permanently removed after 30 days automatically, or
//                       can be permanently deleted immediately from the
//                       deleted tab. Remote copies on platforms are untouched.
//                       Safe for drafts, scheduled, failed posts.
//
//   - mode: "remote"  → calls each platform's delete API for every
//                       published delivery, then flips the post row to
//                       `deleted` (kept as a tombstone so history /
//                       analytics don't vanish). Only valid for posts that
//                       have at least one published delivery.
//
// Irreversible — callers should gate behind a confirm dialog.
export async function deletePost(
  postId: string,
  mode: "local" | "remote",
) {
  const ctx = await requireContext();

  const [existing] = await db
    .select({
      id: posts.id,
      status: posts.status,
    })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.workspaceId, ctx.workspace.id)))
    .limit(1);
  if (!existing) throw new Error("Post not found");

  if (mode === "remote") {
    if (existing.status !== "published") {
      throw new Error(
        "Only published posts can be deleted from their platforms.",
      );
    }
    // Unpublish from platforms first
    const summary = await unpublishPost(postId);
    // Then soft delete the post
    await db
      .update(posts)
      .set({
        status: "deleted",
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId));
    revalidatePath("/app/dashboard");
    revalidatePath("/app/calendar");
    revalidatePath("/app/ideas");
    revalidatePath("/app/posts");
    return { success: summary.allOk, mode, results: summary.results };
  }

  // Local delete — soft delete by setting status to 'deleted' and deletedAt
  await db
    .update(posts)
    .set({
      status: "deleted",
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(posts.id, postId));
  revalidatePath("/app/dashboard");
  revalidatePath("/app/calendar");
  revalidatePath("/app/ideas");
  revalidatePath("/app/posts");
  return { success: true, mode, results: [] as const };
}

// Permanently deletes a post that has already been soft deleted.
// This is irreversible and removes the row completely from the database.
export async function permanentDeletePost(postId: string) {
  const ctx = await requireContext();

  const [existing] = await db
    .select({
      id: posts.id,
      status: posts.status,
    })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.workspaceId, ctx.workspace.id)))
    .limit(1);
  if (!existing) throw new Error("Post not found");
  if (existing.status !== "deleted") {
    throw new Error("Only deleted posts can be permanently deleted.");
  }

  // Permanently delete the row. post_deliveries cascades via FK.
  await db.delete(posts).where(eq(posts.id, postId));
  revalidatePath("/app/dashboard");
  revalidatePath("/app/calendar");
  revalidatePath("/app/ideas");
  revalidatePath("/app/posts");
  return { success: true };
}

// Bulk delete multiple posts in one call. Two modes:
//
//   - "local"     → soft delete (status='deleted', deletedAt set). Works for
//                   any owned post; remote copies on platforms are untouched.
//                   Matches the per-row "Remove from Aloha only" / "Delete post"
//                   flows. Published posts included in the set keep their live
//                   copies — users wanting to unpublish from platforms use the
//                   per-row action.
//   - "permanent" → hard delete rows. Only valid when every selected post is
//                   already in `deleted` state (the UI only offers this on the
//                   deleted tab).
//
// Returns the count actually affected so the caller can tell the user
// "Deleted 4 posts" accurately.
export async function bulkDeletePosts(
  postIds: string[],
  mode: "local" | "permanent",
) {
  const ctx = await requireContext();
  if (postIds.length === 0) return { success: true, count: 0 };

  const owned = await db
    .select({ id: posts.id, status: posts.status })
    .from(posts)
    .where(
      and(
        eq(posts.workspaceId, ctx.workspace.id),
        inArray(posts.id, postIds),
      ),
    );
  const ownedIds = owned.map((r) => r.id);
  if (ownedIds.length === 0) return { success: true, count: 0 };

  if (mode === "permanent") {
    const allDeleted = owned.every((r) => r.status === "deleted");
    if (!allDeleted) {
      throw new Error("Only deleted posts can be permanently deleted.");
    }
    await db.delete(posts).where(inArray(posts.id, ownedIds));
  } else {
    await db
      .update(posts)
      .set({
        status: "deleted",
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(inArray(posts.id, ownedIds));
  }

  revalidatePath("/app/dashboard");
  revalidatePath("/app/calendar");
  revalidatePath("/app/ideas");
  revalidatePath("/app/posts");
  return { success: true, count: ownedIds.length };
}

// Keep only entries that actually differ from base and target a selected
// platform — avoids dead overrides lingering in JSONB.
function sanitizeOverrides(
  overrides: Record<string, ChannelOverride> | undefined,
  platforms: string[],
): Record<string, ChannelOverride> {
  if (!overrides) return {};
  const out: Record<string, ChannelOverride> = {};
  for (const platform of platforms) {
    const o = overrides[platform];
    if (!o) continue;
    const entry: ChannelOverride = {};
    if (typeof o.content === "string") entry.content = o.content;
    if (Array.isArray(o.media)) entry.media = o.media;
    if (entry.content !== undefined || entry.media !== undefined) {
      out[platform] = entry;
    }
  }
  return out;
}

async function loadOwnedPost(postId: string, workspaceId: string) {
  const [row] = await db
    .select({
      id: posts.id,
      status: posts.status,
    })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.workspaceId, workspaceId)))
    .limit(1);
  if (!row) throw new Error("Post not found");
  return row;
}

function revalidatePostPaths(postId?: string) {
  revalidatePath("/app/dashboard");
  revalidatePath("/app/calendar");
  revalidatePath("/app/posts");
  if (postId) revalidatePath(`/app/posts/${postId}`);
}

// Move a draft into review. Strict one-step-forward transition. Stamps
// who submitted it and when so the Kanban card / detail view can show
// "Submitted for review by X · 2h ago" once workspaces exist.
export async function submitForReview(postId: string) {
  const ctx = await requireContext();

  const existing = await loadOwnedPost(postId, ctx.workspace.id);
  assertTransition(existing.status as PostStatus, "in_review");

  const now = new Date();
  await db
    .update(posts)
    .set({
      status: "in_review",
      submittedForReviewAt: now,
      submittedBy: ctx.user.id,
      updatedAt: now,
    })
    .where(eq(posts.id, postId));

  revalidatePostPaths(postId);
  return { success: true };
}

// Approve a post that's in review. Does not schedule or publish — leaves
// the post in `approved` state so the author can pick schedule-or-publish
// from the composer.
export async function approvePost(postId: string) {
  const ctx = await requireContext();

  const existing = await loadOwnedPost(postId, ctx.workspace.id);
  assertTransition(existing.status as PostStatus, "approved");

  const now = new Date();
  await db
    .update(posts)
    .set({
      status: "approved",
      approvedAt: now,
      approvedBy: ctx.user.id,
      updatedAt: now,
    })
    .where(eq(posts.id, postId));

  revalidatePostPaths(postId);
  return { success: true };
}

// Backward reset from `in_review` or `approved` back to `draft`. Clears
// the review audit fields so a re-submission gets a fresh timestamp and
// reviewer identity. Deliberately does NOT preserve the prior stage —
// the flow is always draft → in_review → approved, so after a reset the
// author re-submits to advance again.
export async function backToDraft(postId: string) {
  const ctx = await requireContext();

  const existing = await loadOwnedPost(postId, ctx.workspace.id);
  assertTransition(existing.status as PostStatus, "draft");

  await db
    .update(posts)
    .set({
      status: "draft",
      submittedForReviewAt: null,
      submittedBy: null,
      approvedAt: null,
      approvedBy: null,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, postId));

  revalidatePostPaths(postId);
  return { success: true };
}
