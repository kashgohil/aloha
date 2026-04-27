"use server";

import { and, asc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { postNotes, posts, users, workspaceMembers } from "@/db/schema";
import { requireContext } from "@/lib/current-context";
import {
  notifyPostCommentAdded,
  notifyPostMentions,
} from "@/lib/posts/review-notifications";

export type PostNote = {
  id: string;
  postId: string;
  authorUserId: string;
  authorName: string | null;
  authorImage: string | null;
  body: string;
  mentions: PostNoteMention[];
  createdAt: Date;
  updatedAt: Date;
  editedAt: Date | null;
  isMine: boolean;
  parentNoteId: string | null;
  replies: PostNote[];
};

export type PostNoteMention = {
  userId: string;
  name: string | null;
  email: string;
};

// Lightweight directory for the comment composer's typeahead. Returns
// every workspace member (including the current user — useful for
// testing mentions on your own posts). Role isn't filtered because
// "mention anyone on the team" is the product expectation.
export async function listMentionableMembers(): Promise<PostNoteMention[]> {
  const ctx = await requireContext();
  const rows = await db
    .select({
      userId: workspaceMembers.userId,
      name: users.name,
      email: users.email,
    })
    .from(workspaceMembers)
    .innerJoin(users, eq(users.id, workspaceMembers.userId))
    .where(eq(workspaceMembers.workspaceId, ctx.workspace.id))
    .orderBy(users.name);
  return rows;
}

const MAX_BODY_LENGTH = 4000;

async function assertPostAccess(postId: string, workspaceId: string) {
  const [post] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.workspaceId, workspaceId)))
    .limit(1);
  if (!post) throw new Error("Post not found");
}

export async function listNotes(postId: string): Promise<PostNote[]> {
  const ctx = await requireContext();
  await assertPostAccess(postId, ctx.workspace.id);

  const rows = await db
    .select({
      id: postNotes.id,
      postId: postNotes.postId,
      authorUserId: postNotes.authorUserId,
      authorName: users.name,
      authorImage: users.image,
      body: postNotes.body,
      mentions: postNotes.mentions,
      createdAt: postNotes.createdAt,
      updatedAt: postNotes.updatedAt,
      editedAt: postNotes.editedAt,
      parentNoteId: postNotes.parentNoteId,
    })
    .from(postNotes)
    .leftJoin(users, eq(users.id, postNotes.authorUserId))
    .where(eq(postNotes.postId, postId))
    .orderBy(asc(postNotes.createdAt));

  // Resolve each note's mention ids to display objects in one roundtrip.
  const allMentionIds = Array.from(
    new Set(rows.flatMap((r) => r.mentions ?? [])),
  );
  const mentionMap = new Map<string, PostNoteMention>();
  if (allMentionIds.length > 0) {
    const mentionRows = await db
      .select({
        userId: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(inArray(users.id, allMentionIds));
    for (const m of mentionRows) mentionMap.set(m.userId, m);
  }

  const byParent = new Map<string | null, typeof rows>();
  for (const row of rows) {
    const bucket = byParent.get(row.parentNoteId);
    if (bucket) bucket.push(row);
    else byParent.set(row.parentNoteId, [row]);
  }

  const build = (row: typeof rows[number]): PostNote => ({
    ...row,
    mentions: (row.mentions ?? [])
      .map((id) => mentionMap.get(id))
      .filter((m): m is PostNoteMention => Boolean(m)),
    isMine: row.authorUserId === ctx.user.id,
    parentNoteId: row.parentNoteId ?? null,
    replies: (byParent.get(row.id) ?? [])
      .slice()
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map(build),
  });

  return (byParent.get(null) ?? [])
    .slice()
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map(build);
}

export async function addNote(
  postId: string,
  body: string,
  mentionUserIds: string[] = [],
  parentNoteId?: string | null,
) {
  const ctx = await requireContext();

  const trimmed = body.trim();
  if (!trimmed) throw new Error("Comment cannot be empty");
  if (trimmed.length > MAX_BODY_LENGTH) {
    throw new Error(`Comment exceeds ${MAX_BODY_LENGTH} characters`);
  }

  await assertPostAccess(postId, ctx.workspace.id);

  if (parentNoteId) {
    const [parent] = await db
      .select({ id: postNotes.id })
      .from(postNotes)
      .where(
        and(
          eq(postNotes.id, parentNoteId),
          eq(postNotes.postId, postId),
        ),
      )
      .limit(1);
    if (!parent) throw new Error("Parent comment not found");
  }

  // Validate mentions against the workspace membership list. Silently
  // drop any id that isn't a member — keeps clients from inflating the
  // mention list with random ids.
  const uniqueIds = Array.from(new Set(mentionUserIds)).filter(Boolean);
  let validatedMentions: string[] = [];
  if (uniqueIds.length > 0) {
    const memberRows = await db
      .select({ userId: workspaceMembers.userId })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, ctx.workspace.id),
          inArray(workspaceMembers.userId, uniqueIds),
        ),
      );
    const memberSet = new Set(memberRows.map((r) => r.userId));
    validatedMentions = uniqueIds.filter((id) => memberSet.has(id));
  }

  const [row] = await db
    .insert(postNotes)
    .values({
      postId,
      authorUserId: ctx.user.id,
      body: trimmed,
      mentions: validatedMentions,
      parentNoteId: parentNoteId ?? null,
    })
    .returning();

  // Mentions fire first so notifyPostCommentAdded can skip the same
  // users (avoid double-ping).
  const mentionedNotified = await notifyPostMentions({
    postId,
    authorUserId: ctx.user.id,
    body: trimmed,
    mentionedUserIds: validatedMentions,
  });
  await notifyPostCommentAdded({
    postId,
    authorUserId: ctx.user.id,
    body: trimmed,
    excludeUserIds: mentionedNotified,
  });

  revalidatePath(`/app/posts/${postId}`);
  return row;
}

export async function editNote(noteId: string, body: string) {
  const ctx = await requireContext();

  const trimmed = body.trim();
  if (!trimmed) throw new Error("Comment cannot be empty");
  if (trimmed.length > MAX_BODY_LENGTH) {
    throw new Error(`Comment exceeds ${MAX_BODY_LENGTH} characters`);
  }

  const [existing] = await db
    .select({ postId: postNotes.postId, authorUserId: postNotes.authorUserId })
    .from(postNotes)
    .where(eq(postNotes.id, noteId))
    .limit(1);
  if (!existing) throw new Error("Comment not found");
  if (existing.authorUserId !== ctx.user.id) throw new Error("Forbidden");

  const now = new Date();
  await db
    .update(postNotes)
    .set({ body: trimmed, updatedAt: now, editedAt: now })
    .where(eq(postNotes.id, noteId));

  revalidatePath(`/app/posts/${existing.postId}`);
}

export async function deleteNote(noteId: string) {
  const ctx = await requireContext();

  const [existing] = await db
    .select({ postId: postNotes.postId, authorUserId: postNotes.authorUserId })
    .from(postNotes)
    .where(eq(postNotes.id, noteId))
    .limit(1);
  if (!existing) throw new Error("Comment not found");
  if (existing.authorUserId !== ctx.user.id) throw new Error("Forbidden");

  await db.delete(postNotes).where(eq(postNotes.id, noteId));

  revalidatePath(`/app/posts/${existing.postId}`);
}

