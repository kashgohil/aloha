"use server";

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  ideas,
  posts,
  users,
  workspaceMembers,
  type ChannelOverride,
  type DraftMeta,
  type PostMedia,
} from "@/db/schema";
import { revalidatePath } from "next/cache";
import { Client } from "@upstash/qstash";
import { env } from "@/lib/env";
import { canPublish } from "@/lib/billing/trial";
import { ROLES } from "@/lib/workspaces/roles";
import { assertRole } from "@/lib/workspaces/assert-role";
import { unpublishPost } from "@/lib/unpublishers";
import { publishPost } from "@/lib/publishers";
import { assertTransition, type PostStatus } from "@/lib/posts/transitions";
import {
  notifyPostApproved,
  notifyPostAssigned,
  notifyPostSubmitted,
} from "@/lib/posts/review-notifications";
import { markDeliveryAsManuallyPublished } from "@/lib/posts/manual-completion";
import {
  formatGuidanceFor as channelFormatGuidanceFor,
  isValidFormat,
} from "@/lib/campaigns/channel-formats";

const qstashClient = new Client({
  token: env.QSTASH_TOKEN,
  baseUrl: env.QSTASH_URL,
});

export type ComposerPayload = {
  content: string;
  platforms: string[];
  media?: PostMedia[];
  // Per-channel customization. Each entry can carry content/media overrides
  // and (for channels in form/studio mode) a `form` + structured `payload`
  // the publisher dispatches via the capability registry.
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
  const ctx = await assertRole(ROLES.EDITOR);

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
  const ctx = await assertRole(ROLES.EDITOR);
  if (!(await canPublish(ctx.workspace.id, ctx.workspace.ownerUserId))) {
    throw new Error(
      "Trial ended — upgrade to schedule or publish posts.",
    );
  }

  if (scheduledAt.getTime() <= Date.now()) {
    throw new Error("Pick a future time to schedule for.");
  }

  const existing = await loadOwnedPost(postId, ctx.workspace.id);
  assertTransition(existing.status as PostStatus, "scheduled", ctx.role);

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
  const ctx = await assertRole(ROLES.EDITOR);
  if (!(await canPublish(ctx.workspace.id, ctx.workspace.ownerUserId))) {
    throw new Error(
      "Trial ended — upgrade to schedule or publish posts.",
    );
  }

  const existing = await loadOwnedPost(postId, ctx.workspace.id);
  assertTransition(existing.status as PostStatus, "published", ctx.role);

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
  const ctx = await assertRole(ROLES.EDITOR);

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
  const ctx = await assertRole(ROLES.EDITOR);
  if (!(await canPublish(ctx.workspace.id, ctx.workspace.ownerUserId))) {
    throw new Error(
      "Trial ended — upgrade to reschedule posts.",
    );
  }

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
  const ctx = await assertRole(ROLES.ADMIN);

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
  const ctx = await assertRole(ROLES.ADMIN);

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
  const ctx = await assertRole(ROLES.ADMIN);
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
// platform — avoids dead overrides lingering in JSONB. Preserves `form` +
// `payload` for channels in studio mode.
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
    if (typeof o.form === "string") entry.form = o.form;
    if (o.payload && typeof o.payload === "object") entry.payload = o.payload;
    if (
      entry.content !== undefined ||
      entry.media !== undefined ||
      entry.form !== undefined ||
      entry.payload !== undefined
    ) {
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
export async function submitForReview(
  postId: string,
  assigneeId?: string | null,
) {
  const ctx = await assertRole(ROLES.EDITOR);

  const existing = await loadOwnedPost(postId, ctx.workspace.id);
  assertTransition(existing.status as PostStatus, "in_review");

  // Validate the assignee (if provided) is a reviewer+ in this workspace.
  // Drop silently if not — the submit still succeeds, just unassigned.
  let validatedAssigneeId: string | null = null;
  if (assigneeId) {
    const [member] = await db
      .select({ role: workspaceMembers.role })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, ctx.workspace.id),
          eq(workspaceMembers.userId, assigneeId),
        ),
      )
      .limit(1);
    const reviewerRoles = ["owner", "admin", "reviewer"];
    if (member && reviewerRoles.includes(member.role)) {
      validatedAssigneeId = assigneeId;
    }
  }

  const now = new Date();
  await db
    .update(posts)
    .set({
      status: "in_review",
      submittedForReviewAt: now,
      submittedBy: ctx.user.id,
      assignedReviewerId: validatedAssigneeId,
      updatedAt: now,
    })
    .where(eq(posts.id, postId));

  // Fire-and-forget: notification failures shouldn't block the status
  // transition. Errors are logged inside createNotification.
  await notifyPostSubmitted({ postId, submittedBy: ctx.user.id });

  revalidatePostPaths(postId);
  return { success: true };
}

// Lists workspace members eligible to be assigned as reviewer on a
// post. Used by the assignee picker on the post detail page.
export type ReviewerOption = {
  userId: string;
  name: string | null;
  email: string;
  image: string | null;
};

export async function listReviewerOptions(): Promise<ReviewerOption[]> {
  const ctx = await assertRole(ROLES.EDITOR);
  const rows = await db
    .select({
      userId: workspaceMembers.userId,
      name: users.name,
      email: users.email,
      image: users.image,
    })
    .from(workspaceMembers)
    .innerJoin(users, eq(users.id, workspaceMembers.userId))
    .where(
      and(
        eq(workspaceMembers.workspaceId, ctx.workspace.id),
        inArray(workspaceMembers.role, ["owner", "admin", "reviewer"]),
      ),
    )
    .orderBy(users.name);
  return rows.map((r) => ({
    userId: r.userId,
    name: r.name,
    email: r.email,
    image: r.image,
  }));
}

// Assigns (or unassigns, with assigneeId=null) a post to a specific
// reviewer. Anyone ADMIN+ or the current assignee can reassign; the
// submitter (author) can also self-reassign to anyone in the reviewer
// pool. Validation lives server-side in one place so UI can stay simple.
export async function assignReviewer(
  postId: string,
  assigneeId: string | null,
) {
  const ctx = await assertRole(ROLES.EDITOR);

  const [post] = await db
    .select({
      id: posts.id,
      workspaceId: posts.workspaceId,
      status: posts.status,
      submittedBy: posts.submittedBy,
      assignedReviewerId: posts.assignedReviewerId,
    })
    .from(posts)
    .where(
      and(eq(posts.id, postId), eq(posts.workspaceId, ctx.workspace.id)),
    )
    .limit(1);
  if (!post) throw new Error("Post not found");

  const canAssign =
    ctx.role === "owner" ||
    ctx.role === "admin" ||
    ctx.user.id === post.submittedBy ||
    ctx.user.id === post.assignedReviewerId;
  if (!canAssign) {
    throw new Error("You can't reassign this post.");
  }

  let validated: string | null = null;
  if (assigneeId) {
    const [member] = await db
      .select({ role: workspaceMembers.role })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, ctx.workspace.id),
          eq(workspaceMembers.userId, assigneeId),
        ),
      )
      .limit(1);
    const reviewerRoles = ["owner", "admin", "reviewer"];
    if (!member || !reviewerRoles.includes(member.role)) {
      throw new Error("Pick a reviewer who's a member of this workspace.");
    }
    validated = assigneeId;
  }

  if (post.assignedReviewerId === validated) {
    return { success: true };
  }

  await db
    .update(posts)
    .set({ assignedReviewerId: validated, updatedAt: new Date() })
    .where(eq(posts.id, postId));

  if (validated) {
    await notifyPostAssigned({
      postId,
      assignedBy: ctx.user.id,
      assigneeId: validated,
    });
  }

  revalidatePostPaths(postId);
  return { success: true };
}

// Approve a post that's in review. Does not schedule or publish — leaves
// the post in `approved` state so the author can pick schedule-or-publish
// from the composer.
export async function approvePost(postId: string) {
  const ctx = await assertRole(ROLES.REVIEWER);

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

  await notifyPostApproved({
    postId,
    actor: { kind: "user", userId: ctx.user.id },
  });

  revalidatePostPaths(postId);
  return { success: true };
}

// Backward reset from `in_review` or `approved` back to `draft`. Clears
// the review audit fields so a re-submission gets a fresh timestamp and
// reviewer identity. Deliberately does NOT preserve the prior stage —
// the flow is always draft → in_review → approved, so after a reset the
// author re-submits to advance again.
export async function backToDraft(postId: string) {
  const ctx = await assertRole(ROLES.EDITOR);

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
      externalApproverIdentity: null,
      assignedReviewerId: null,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, postId));

  revalidatePostPaths(postId);
  return { success: true };
}

// Toggle the "evergreen" flag on a published post. Marked posts become
// eligible for the recycle automation, which clones them as a fresh
// draft on each cycle (respecting a cool-off so the same post doesn't
// resurface every run). Only meaningful for `published` posts; the
// automation filters there anyway, so we enforce the same constraint
// here to keep the UI honest.
export async function setEvergreen(postId: string, evergreen: boolean) {
  const ctx = await assertRole(ROLES.REVIEWER);

  const [post] = await db
    .select({
      id: posts.id,
      status: posts.status,
      evergreenMarkedAt: posts.evergreenMarkedAt,
    })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.workspaceId, ctx.workspace.id)))
    .limit(1);
  if (!post) throw new Error("Post not found");
  if (evergreen && post.status !== "published") {
    throw new Error("Only published posts can be marked evergreen.");
  }

  await db
    .update(posts)
    .set({
      evergreenMarkedAt: evergreen ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, postId));

  revalidatePostPaths(postId);
  return { success: true, evergreen };
}

// Mark a `manual_assist` delivery as published from the Aloha web UI.
// Counterpart to the extension's submit-detection report. REVIEWER+
// only — same gate as schedule/publish actions, since this is
// effectively claiming the post shipped on a connected platform.
export async function markDeliveryPosted(
  postId: string,
  platform: string,
) {
  const ctx = await assertRole(ROLES.REVIEWER);

  const result = await markDeliveryAsManuallyPublished({
    workspaceId: ctx.workspace.id,
    postId,
    platform,
    source: "manual_web",
  });

  if (!result.ok) {
    throw new Error(result.message);
  }

  revalidatePostPaths(postId);
  return {
    success: true,
    alreadyPublished: result.alreadyPublished ?? false,
    postStatusFlipped: result.postStatusFlipped ?? false,
  };
}

// Switch a draft post's format. Updates `draftMeta.format` and
// `draftMeta.formatGuidance` for the post's primary channel; the body is
// left intact so the user's edits aren't clobbered. Locked / published /
// scheduled posts are rejected — the post needs to be in draft to change
// format. Validates against the per-channel allowlist.
export async function setPostFormat(postId: string, format: string) {
  const ctx = await assertRole(ROLES.EDITOR);

  const [post] = await db
    .select({
      id: posts.id,
      status: posts.status,
      platforms: posts.platforms,
      draftMeta: posts.draftMeta,
    })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.workspaceId, ctx.workspace.id)))
    .limit(1);
  if (!post) throw new Error("Post not found");
  if (post.status !== "draft") {
    throw new Error("Move the post back to draft to change its format.");
  }
  const channel = post.platforms[0];
  if (!channel) throw new Error("Pick a channel before changing format.");
  if (!isValidFormat(channel, format)) {
    throw new Error(`'${format}' isn't valid for ${channel}.`);
  }

  const nextDraftMeta: DraftMeta = {
    ...(post.draftMeta ?? {}),
    format,
    formatGuidance: channelFormatGuidanceFor(channel, format),
  };

  await db
    .update(posts)
    .set({ draftMeta: nextDraftMeta, updatedAt: new Date() })
    .where(eq(posts.id, postId));

  revalidatePostPaths(postId);
  return { success: true, format };
}
