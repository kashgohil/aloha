import "server-only";
import { and, eq, ne, inArray, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import {
  postNotes,
  posts,
  users,
  workspaceMembers,
  workspaces,
} from "@/db/schema";
import { createNotification } from "@/lib/notifications";
import { sendEmail } from "@/lib/email/send";
import {
  postApprovedEmail,
  postAssignedEmail,
  postCommentEmail,
  postMentionEmail,
  postSubmittedEmail,
  type ReviewEmailRender,
} from "@/lib/email/templates/review-events";

// Per-event email preference column on `users`. Listed here so the email
// dispatcher can require an exact column name at the call site (cheap
// way to keep us honest if columns ever rename).
type EmailPref =
  | "notifyReviewSubmittedByEmail"
  | "notifyReviewApprovedByEmail"
  | "notifyReviewAssignedByEmail"
  | "notifyReviewCommentByEmail"
  | "notifyReviewMentionByEmail";

async function loadWorkspaceName(workspaceId: string): Promise<string> {
  const [row] = await db
    .select({ name: workspaces.name })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);
  return row?.name ?? "your workspace";
}

// Dispatches a review email to a single user *if* they have notifications
// enabled and the per-event toggle is on. Failures are swallowed (mirrors
// `createNotification`) so a flaky email send never blocks a status
// transition or notification fan-out.
async function dispatchReviewEmail(
  userId: string,
  pref: EmailPref,
  render: (email: string) => ReviewEmailRender | null,
): Promise<void> {
  try {
    const [row] = await db
      .select({
        email: users.email,
        notificationsEnabled: users.notificationsEnabled,
        pref: users[pref],
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!row || !row.email) return;
    if (!row.notificationsEnabled) return;
    if (!row.pref) return;
    const rendered = render(row.email);
    if (!rendered) return;
    await sendEmail({
      to: row.email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
  } catch (err) {
    console.error("[review-email] dispatch failed", { userId, pref, err });
  }
}

// Fan-out helpers for review-workflow notifications. Kept in one place
// so the server actions that fire them stay terse, and so the recipient
// logic has exactly one source of truth.

// Author of a notification-triggering action. Internal actors are
// workspace members (their name is read from `users.name`); external
// actors come in through public share links and supply their name +
// email directly. The discriminator keeps recipient filtering simple:
// only internal actors get filtered out of their own fan-out.
export type ReviewActor =
  | { kind: "user"; userId: string }
  | { kind: "external"; name: string; email: string };

async function actorDisplay(
  actor: ReviewActor,
  fallback: string,
): Promise<{ name: string; userId: string | null }> {
  if (actor.kind === "external") {
    return { name: actor.name || fallback, userId: null };
  }
  const [row] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, actor.userId))
    .limit(1);
  return { name: row?.name ?? fallback, userId: actor.userId };
}

const REVIEWER_ROLES = ["owner", "admin", "reviewer"] as const satisfies readonly (
  | "owner"
  | "admin"
  | "editor"
  | "reviewer"
  | "viewer"
)[];

async function loadPostSummary(postId: string): Promise<{
  id: string;
  workspaceId: string;
  content: string;
  createdByUserId: string;
  submittedBy: string | null;
  approvedBy: string | null;
  assignedReviewerId: string | null;
} | null> {
  const [row] = await db
    .select({
      id: posts.id,
      workspaceId: posts.workspaceId,
      content: posts.content,
      createdByUserId: posts.createdByUserId,
      submittedBy: posts.submittedBy,
      approvedBy: posts.approvedBy,
      assignedReviewerId: posts.assignedReviewerId,
    })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);
  return row ?? null;
}

function preview(content: string, max = 70): string {
  const trimmed = content.trim();
  if (!trimmed) return "(empty post)";
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

function postUrl(postId: string): string {
  return `/app/posts/${postId}`;
}

// Fires when a post enters `in_review`. If the post has an explicit
// assignee the notification goes only to them; otherwise it fans out to
// every reviewer+ in the workspace (skipping the submitter either way).
export async function notifyPostSubmitted(args: {
  postId: string;
  submittedBy: string;
}) {
  const post = await loadPostSummary(args.postId);
  if (!post) return;

  const [submitter] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, args.submittedBy))
    .limit(1);
  const submitterName = submitter?.name ?? "Someone";

  const recipientIds = new Set<string>();
  if (post.assignedReviewerId && post.assignedReviewerId !== args.submittedBy) {
    recipientIds.add(post.assignedReviewerId);
  } else {
    const reviewers = await db
      .select({ userId: workspaceMembers.userId })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, post.workspaceId),
          inArray(workspaceMembers.role, [...REVIEWER_ROLES]),
          ne(workspaceMembers.userId, args.submittedBy),
        ),
      );
    for (const r of reviewers) recipientIds.add(r.userId);
  }
  if (recipientIds.size === 0) return;

  const ids = Array.from(recipientIds);
  await Promise.all(
    ids.map((userId) =>
      createNotification({
        userId,
        kind: "post_submitted",
        title: `${submitterName} submitted a post for review`,
        body: preview(post.content),
        url: postUrl(post.id),
        metadata: { postId: post.id, submittedBy: args.submittedBy },
      }),
    ),
  );

  const workspaceName = await loadWorkspaceName(post.workspaceId);
  await Promise.all(
    ids.map((userId) =>
      dispatchReviewEmail(userId, "notifyReviewSubmittedByEmail", () =>
        postSubmittedEmail({
          submitterName,
          postId: post.id,
          postContent: post.content,
          workspaceName,
        }),
      ),
    ),
  );
}

// Fires when a post's assignee changes. Pings the new assignee unless
// they assigned it to themselves (self-assignment is implicit consent).
export async function notifyPostAssigned(args: {
  postId: string;
  assignedBy: string;
  assigneeId: string;
}) {
  if (args.assigneeId === args.assignedBy) return;
  const post = await loadPostSummary(args.postId);
  if (!post) return;

  const [assigner] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, args.assignedBy))
    .limit(1);
  const assignerName = assigner?.name ?? "Someone";

  await createNotification({
    userId: args.assigneeId,
    kind: "post_assigned",
    title: `${assignerName} assigned a post to you`,
    body: preview(post.content),
    url: postUrl(post.id),
    metadata: {
      postId: post.id,
      assignedBy: args.assignedBy,
    },
  });

  const workspaceName = await loadWorkspaceName(post.workspaceId);
  await dispatchReviewEmail(
    args.assigneeId,
    "notifyReviewAssignedByEmail",
    () =>
      postAssignedEmail({
        assignerName,
        postId: post.id,
        postContent: post.content,
        workspaceName,
      }),
  );
}

// Fires when a post is approved. Notifies the submitter (if different
// from the approver). If the post has no submitter recorded (e.g., the
// post moved straight past the submit step in some future flow), falls
// back to the post creator.
export async function notifyPostApproved(args: {
  postId: string;
  actor: ReviewActor;
}) {
  const post = await loadPostSummary(args.postId);
  if (!post) return;

  const { name: approverName, userId: actorUserId } = await actorDisplay(
    args.actor,
    "A reviewer",
  );
  const recipient = post.submittedBy ?? post.createdByUserId;
  // Internal actors don't notify themselves; external actors aren't a
  // workspace member, so the recipient is always notified.
  if (!recipient || (actorUserId && recipient === actorUserId)) return;

  await createNotification({
    userId: recipient,
    kind: "post_approved",
    title: `${approverName} approved your post`,
    body: preview(post.content),
    url: postUrl(post.id),
    metadata: {
      postId: post.id,
      approvedBy: actorUserId,
      externalApproverEmail:
        args.actor.kind === "external" ? args.actor.email : null,
    },
  });

  const workspaceName = await loadWorkspaceName(post.workspaceId);
  await dispatchReviewEmail(recipient, "notifyReviewApprovedByEmail", () =>
    postApprovedEmail({
      approverName,
      postId: post.id,
      postContent: post.content,
      workspaceName,
      isExternal: args.actor.kind === "external",
    }),
  );
}

// Fires `post_mention` to each user tagged in a comment body. Skips
// self-mentions. Runs before notifyPostCommentAdded so the mention
// helper can tell the comment helper which userIds already got a
// stronger mention ping and should NOT also get a generic comment
// one — avoids double-notifying the same person.
export async function notifyPostMentions(args: {
  postId: string;
  actor: ReviewActor;
  body: string;
  mentionedUserIds: string[];
}): Promise<Set<string>> {
  const notified = new Set<string>();
  if (args.mentionedUserIds.length === 0) return notified;

  const post = await loadPostSummary(args.postId);
  if (!post) return notified;

  const { name: authorName, userId: actorUserId } = await actorDisplay(
    args.actor,
    "Someone",
  );

  const workspaceName = await loadWorkspaceName(post.workspaceId);
  for (const userId of args.mentionedUserIds) {
    if (actorUserId && userId === actorUserId) continue;
    notified.add(userId);
    await createNotification({
      userId,
      kind: "post_mention",
      title: `${authorName} mentioned you in a comment`,
      body: preview(args.body),
      url: postUrl(post.id),
      metadata: {
        postId: post.id,
        authorUserId: actorUserId,
        externalAuthorEmail:
          args.actor.kind === "external" ? args.actor.email : null,
      },
    });
    await dispatchReviewEmail(userId, "notifyReviewMentionByEmail", () =>
      postMentionEmail({
        mentionerName: authorName,
        body: args.body,
        postId: post.id,
        workspaceName,
      }),
    );
  }
  return notified;
}

// Fires when someone leaves a comment on a post. Recipients: the post
// author + every earlier commenter on the same post, minus the user
// who just posted and anyone already notified via @mention. Dedupe is
// by userId.
export async function notifyPostCommentAdded(args: {
  postId: string;
  actor: ReviewActor;
  body: string;
  excludeUserIds?: Set<string>;
}) {
  const post = await loadPostSummary(args.postId);
  if (!post) return;

  const { name: authorName, userId: actorUserId } = await actorDisplay(
    args.actor,
    "Someone",
  );

  // Prior commenters on this post (excluding the new one when internal).
  // External actors have no userId so the filter degrades naturally.
  const earlier = await db
    .selectDistinct({ userId: postNotes.authorUserId })
    .from(postNotes)
    .where(
      and(
        eq(postNotes.postId, args.postId),
        actorUserId
          ? ne(postNotes.authorUserId, actorUserId)
          : isNotNull(postNotes.authorUserId),
      ),
    )
    .limit(50);

  const recipients = new Set<string>();
  if (post.createdByUserId && post.createdByUserId !== actorUserId) {
    recipients.add(post.createdByUserId);
  }
  for (const row of earlier) {
    if (row.userId && row.userId !== actorUserId) {
      recipients.add(row.userId);
    }
  }
  // Drop anyone already notified via a stronger `post_mention` — they
  // shouldn't get two pings for the same comment.
  if (args.excludeUserIds) {
    for (const id of args.excludeUserIds) recipients.delete(id);
  }
  if (recipients.size === 0) return;

  const ids = Array.from(recipients);
  await Promise.all(
    ids.map((userId) =>
      createNotification({
        userId,
        kind: "post_comment",
        title: `${authorName} commented on your post`,
        body: preview(args.body),
        url: postUrl(post.id),
        metadata: {
          postId: post.id,
          authorUserId: actorUserId,
          externalAuthorEmail:
            args.actor.kind === "external" ? args.actor.email : null,
        },
      }),
    ),
  );

  const workspaceName = await loadWorkspaceName(post.workspaceId);
  await Promise.all(
    ids.map((userId) =>
      dispatchReviewEmail(userId, "notifyReviewCommentByEmail", () =>
        postCommentEmail({
          commenterName: authorName,
          isExternal: args.actor.kind === "external",
          body: args.body,
          postId: post.id,
          postContent: post.content,
          workspaceName,
        }),
      ),
    ),
  );
}
