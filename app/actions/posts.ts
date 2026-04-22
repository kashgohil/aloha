"use server";

import { and, eq, inArray } from "drizzle-orm";
import { auth } from "@/auth";
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
import { unpublishPost } from "@/lib/unpublishers";

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
  userId: string,
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
        eq(ideas.userId, userId),
        eq(ideas.status, "new"),
      ),
    );
}

export async function saveDraft(payload: ComposerPayload) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    await db.insert(posts).values({
      userId: session.user.id,
      content: payload.content,
      platforms: payload.platforms,
      media: payload.media ?? [],
      channelContent: sanitizeOverrides(payload.channelContent, payload.platforms),
      status: "draft",
      sourceIdeaId: payload.sourceIdeaId ?? null,
      draftMeta: payload.draftMeta ?? null,
    });

    await flipIdeaToDrafted(session.user.id, payload.sourceIdeaId);

    revalidatePath("/app/dashboard");
    revalidatePath("/app/calendar");
    revalidatePath("/app/ideas");

    return { success: true };
  } catch (error) {
    console.error("Save Draft Error:", error);
    throw new Error("Failed to save draft");
  }
}

export async function schedulePost(
  payload: ComposerPayload & { scheduledAt: Date },
) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    const results = await db
      .insert(posts)
      .values({
        userId: session.user.id,
        content: payload.content,
        platforms: payload.platforms,
        media: payload.media ?? [],
        channelContent: sanitizeOverrides(
          payload.channelContent,
          payload.platforms,
        ),
        status: "scheduled",
        scheduledAt: payload.scheduledAt,
        sourceIdeaId: payload.sourceIdeaId ?? null,
        draftMeta: payload.draftMeta ?? null,
      })
      .returning();

    const newPost = results[0];

    await flipIdeaToDrafted(session.user.id, payload.sourceIdeaId);

    const delay = Math.max(
      0,
      Math.floor((payload.scheduledAt.getTime() - Date.now()) / 1000),
    );

    await qstashClient.publishJSON({
      url: `${env.APP_URL}/api/qstash`,
      body: {
        postId: newPost.id,
        intendedScheduledAt: payload.scheduledAt.toISOString(),
      },
      delay,
    });

    revalidatePath("/app/dashboard");
    revalidatePath("/app/calendar");
    revalidatePath("/app/ideas");

    return { success: true, postId: newPost.id };
  } catch (error) {
    console.error("Schedule Post Error:", error);
    throw new Error("Failed to schedule post");
  }
}

// Updates an existing draft or scheduled post in place. Content / media /
// platforms / overrides are always updatable. `scheduledAt` + status flips
// handle the draft → scheduled conversion and reschedule paths:
//
//   - Draft + no scheduledAt arg           → stays a draft, fields updated.
//   - Draft + scheduledAt arg              → flips to scheduled, QStash queued.
//   - Scheduled + scheduledAt=null arg     → flips back to draft, old QStash
//                                            message ignored on fire (handler
//                                            checks status).
//   - Scheduled + new scheduledAt arg      → reschedules. A new QStash message
//                                            is queued for the new time; the
//                                            old one still fires at the old
//                                            time but no-ops because the
//                                            handler re-reads status +
//                                            scheduledAt and only publishes
//                                            when they're both still valid.
//
// Published posts are not editable — caller is expected to gate that in the
// UI; we reject it here as a belt-and-braces guard.
export async function updatePost(
  postId: string,
  payload: ComposerPayload & { scheduledAt?: Date | null },
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [existing] = await db
    .select({
      id: posts.id,
      userId: posts.userId,
      status: posts.status,
    })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.userId, session.user.id)))
    .limit(1);
  if (!existing) throw new Error("Post not found");
  if (existing.status === "published") {
    throw new Error("Published posts are read-only.");
  }

  const scheduleRequested =
    payload.scheduledAt !== undefined && payload.scheduledAt !== null;
  const nextStatus: "draft" | "scheduled" = scheduleRequested
    ? "scheduled"
    : "draft";

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
        status: nextStatus,
        scheduledAt: scheduleRequested ? payload.scheduledAt! : null,
        // `undefined` means "leave alone"; null clears; a value overwrites.
        ...(payload.draftMeta !== undefined
          ? { draftMeta: payload.draftMeta }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId));

    if (scheduleRequested && payload.scheduledAt) {
      const delay = Math.max(
        0,
        Math.floor((payload.scheduledAt.getTime() - Date.now()) / 1000),
      );
      await qstashClient.publishJSON({
        url: `${env.APP_URL}/api/qstash`,
        body: {
          postId,
          intendedScheduledAt: payload.scheduledAt.toISOString(),
        },
        delay,
      });
    }

    revalidatePath("/app/dashboard");
    revalidatePath("/app/calendar");
    revalidatePath("/app/ideas");

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
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [existing] = await db
    .select({
      id: posts.id,
      userId: posts.userId,
      status: posts.status,
    })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.userId, session.user.id)))
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
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [existing] = await db
    .select({
      id: posts.id,
      userId: posts.userId,
      status: posts.status,
    })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.userId, session.user.id)))
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
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [existing] = await db
    .select({
      id: posts.id,
      userId: posts.userId,
      status: posts.status,
    })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.userId, session.user.id)))
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
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (postIds.length === 0) return { success: true, count: 0 };

  const owned = await db
    .select({ id: posts.id, status: posts.status })
    .from(posts)
    .where(
      and(eq(posts.userId, session.user.id), inArray(posts.id, postIds)),
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
