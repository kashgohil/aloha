"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { postNotes, posts } from "@/db/schema";
import { assertTransition, type PostStatus } from "@/lib/posts/transitions";
import {
  notifyPostApproved,
  notifyPostCommentAdded,
} from "@/lib/posts/review-notifications";
import { verifyShareToken } from "@/lib/posts/share-tokens";

// Server actions used by the public review surface at `/r/[token]`. Each
// authenticates via the share token rather than a workspace session —
// the token IS the authorization. Identity comes from the typed name +
// email captured on first visit. All actions revalidate the public route
// (so the page re-renders with the new note / approval state) and the
// internal post-detail path (so the workspace UI stays in sync if the
// reviewer is watching).

const MAX_BODY_LENGTH = 4000;
const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 254;
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeIdentity(input: { reviewerName: string; reviewerEmail: string }) {
  const name = input.reviewerName.trim().slice(0, MAX_NAME_LENGTH);
  const email = input.reviewerEmail.trim().toLowerCase().slice(0, MAX_EMAIL_LENGTH);
  if (!name) throw new Error("Please tell us your name.");
  if (!EMAIL_RX.test(email)) throw new Error("That email looks off — double-check it.");
  return { name, email };
}

function revalidate(token: string, postId: string) {
  revalidatePath(`/r/${token}`);
  revalidatePath(`/app/posts/${postId}`);
}

export async function addNoteByToken(args: {
  token: string;
  reviewerName: string;
  reviewerEmail: string;
  body: string;
  parentNoteId?: string | null;
}) {
  const verified = await verifyShareToken(args.token);
  if (!verified) throw new Error("This link no longer works.");

  const trimmed = args.body.trim();
  if (!trimmed) throw new Error("Comment cannot be empty");
  if (trimmed.length > MAX_BODY_LENGTH) {
    throw new Error(`Comment exceeds ${MAX_BODY_LENGTH} characters`);
  }
  const identity = sanitizeIdentity(args);

  if (args.parentNoteId) {
    const [parent] = await db
      .select({ id: postNotes.id })
      .from(postNotes)
      .where(
        and(
          eq(postNotes.id, args.parentNoteId),
          eq(postNotes.postId, verified.postId),
        ),
      )
      .limit(1);
    if (!parent) throw new Error("Parent comment not found");
  }

  await db.insert(postNotes).values({
    postId: verified.postId,
    authorUserId: null,
    externalAuthor: identity,
    body: trimmed,
    mentions: [],
    parentNoteId: args.parentNoteId ?? null,
  });

  await notifyPostCommentAdded({
    postId: verified.postId,
    actor: { kind: "external", name: identity.name, email: identity.email },
    body: trimmed,
  });

  revalidate(args.token, verified.postId);
  return { success: true };
}

export async function approvePostByToken(args: {
  token: string;
  reviewerName: string;
  reviewerEmail: string;
}) {
  const verified = await verifyShareToken(args.token);
  if (!verified) throw new Error("This link no longer works.");
  if (verified.permissions !== "comment_approve") {
    throw new Error("This link can leave comments but not approve.");
  }

  const identity = sanitizeIdentity(args);

  const [post] = await db
    .select({ id: posts.id, status: posts.status })
    .from(posts)
    .where(eq(posts.id, verified.postId))
    .limit(1);
  if (!post) throw new Error("Post not found");
  assertTransition(post.status as PostStatus, "approved");

  const now = new Date();
  await db
    .update(posts)
    .set({
      status: "approved",
      approvedAt: now,
      approvedBy: null,
      externalApproverIdentity: identity,
      updatedAt: now,
    })
    .where(eq(posts.id, verified.postId));

  await notifyPostApproved({
    postId: verified.postId,
    actor: { kind: "external", name: identity.name, email: identity.email },
  });

  revalidate(args.token, verified.postId);
  return { success: true };
}

export async function requestChangesByToken(args: {
  token: string;
  reviewerName: string;
  reviewerEmail: string;
  body: string;
}) {
  const verified = await verifyShareToken(args.token);
  if (!verified) throw new Error("This link no longer works.");
  if (verified.permissions !== "comment_approve") {
    throw new Error("This link can leave comments but not request changes.");
  }

  const trimmed = args.body.trim();
  if (!trimmed) {
    throw new Error("Tell the team what needs to change so they have something to act on.");
  }
  if (trimmed.length > MAX_BODY_LENGTH) {
    throw new Error(`Note exceeds ${MAX_BODY_LENGTH} characters`);
  }
  const identity = sanitizeIdentity(args);

  const [post] = await db
    .select({ id: posts.id, status: posts.status })
    .from(posts)
    .where(eq(posts.id, verified.postId))
    .limit(1);
  if (!post) throw new Error("Post not found");
  // Only meaningful out of `in_review` or `approved`. From other stages
  // there's nothing to step back from — block early so the public UI
  // doesn't accidentally reset a published post.
  if (!(["in_review", "approved"] as const).includes(post.status as never)) {
    throw new Error("This post isn't in review.");
  }
  assertTransition(post.status as PostStatus, "draft");

  // The note + the status reset together in a single transaction so the
  // audit trail can't be left half-written if either step fails.
  await db.transaction(async (tx) => {
    await tx.insert(postNotes).values({
      postId: verified.postId,
      authorUserId: null,
      externalAuthor: identity,
      body: trimmed,
      mentions: [],
      parentNoteId: null,
    });
    await tx
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
      .where(eq(posts.id, verified.postId));
  });

  // The "request changes" event reuses the comment notification fan-out
  // because functionally that's what it is — a high-priority note that
  // also kicks the post back to draft. The author + earlier commenters
  // all need to know.
  await notifyPostCommentAdded({
    postId: verified.postId,
    actor: { kind: "external", name: identity.name, email: identity.email },
    body: trimmed,
  });

  revalidate(args.token, verified.postId);
  return { success: true };
}

