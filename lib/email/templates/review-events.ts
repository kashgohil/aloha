import {
  displayHeading,
  paragraph,
  primaryButton,
  renderLayout,
  escape,
} from "../layout";
import { env } from "@/lib/env";

// Email companions to the in-app review notifications. Each maps 1:1 to a
// kind in `notifications.kind` so the user-facing message is consistent
// across surfaces. Kept terse on purpose — these are nudges, not digests.

const APP = env.APP_URL.replace(/\/$/, "");
const POST_URL = (postId: string) => `${APP}/app/posts/${postId}`;

function preview(content: string, max = 140): string {
  const trimmed = content.trim();
  if (!trimmed) return "(empty post)";
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

function bodyQuote(content: string): string {
  return `<blockquote style="margin:0 0 18px 0;padding:14px 16px;border-left:3px solid #cdc1a0;background:rgba(251,230,207,0.4);border-radius:8px;font-size:14.5px;line-height:1.55;color:#1a1612;">${escape(preview(content))}</blockquote>`;
}

export type ReviewEmailRender = { subject: string; html: string; text: string };

export function postSubmittedEmail(args: {
  submitterName: string;
  postId: string;
  postContent: string;
  workspaceName: string;
}): ReviewEmailRender {
  const url = POST_URL(args.postId);
  const subject = `${args.submitterName} submitted a post for review`;
  const body = `
    ${displayHeading(`A draft is waiting on your review.`)}
    ${paragraph(`<strong style="font-weight:500;">${escape(args.submitterName)}</strong> submitted a post in <strong style="font-weight:500;">${escape(args.workspaceName)}</strong> for review.`)}
    ${bodyQuote(args.postContent)}
    ${primaryButton("Review draft", url)}
  `;
  const text = `${args.submitterName} submitted a post for review in ${args.workspaceName}.

"${preview(args.postContent)}"

Review at: ${url}`;
  return {
    subject,
    html: renderLayout({
      preheader: `${args.submitterName} submitted a post in ${args.workspaceName}.`,
      body,
    }),
    text,
  };
}

export function postApprovedEmail(args: {
  approverName: string;
  postId: string;
  postContent: string;
  workspaceName: string;
  isExternal: boolean;
}): ReviewEmailRender {
  const url = POST_URL(args.postId);
  const who = args.isExternal
    ? `${args.approverName} (external reviewer)`
    : args.approverName;
  const subject = `${who} approved your post`;
  const body = `
    ${displayHeading(`Your post is approved.`)}
    ${paragraph(`<strong style="font-weight:500;">${escape(who)}</strong> approved your draft in <strong style="font-weight:500;">${escape(args.workspaceName)}</strong>.`)}
    ${bodyQuote(args.postContent)}
    ${primaryButton("Open post", url)}
    ${paragraph("From here you can schedule it or publish now.", { muted: true })}
  `;
  const text = `${who} approved your post in ${args.workspaceName}.

"${preview(args.postContent)}"

Open at: ${url}`;
  return {
    subject,
    html: renderLayout({
      preheader: `${who} approved your post in ${args.workspaceName}.`,
      body,
    }),
    text,
  };
}

export function postAssignedEmail(args: {
  assignerName: string;
  postId: string;
  postContent: string;
  workspaceName: string;
}): ReviewEmailRender {
  const url = POST_URL(args.postId);
  const subject = `${args.assignerName} assigned a post to you`;
  const body = `
    ${displayHeading(`A post needs your eyes.`)}
    ${paragraph(`<strong style="font-weight:500;">${escape(args.assignerName)}</strong> assigned a post to you in <strong style="font-weight:500;">${escape(args.workspaceName)}</strong>.`)}
    ${bodyQuote(args.postContent)}
    ${primaryButton("Review post", url)}
  `;
  const text = `${args.assignerName} assigned a post to you in ${args.workspaceName}.

"${preview(args.postContent)}"

Review at: ${url}`;
  return {
    subject,
    html: renderLayout({
      preheader: `${args.assignerName} assigned a post to you.`,
      body,
    }),
    text,
  };
}

export function postCommentEmail(args: {
  commenterName: string;
  isExternal: boolean;
  body: string;
  postId: string;
  postContent: string;
  workspaceName: string;
}): ReviewEmailRender {
  const url = POST_URL(args.postId);
  const who = args.isExternal
    ? `${args.commenterName} (external reviewer)`
    : args.commenterName;
  const subject = `${who} commented on your post`;
  const html = `
    ${displayHeading(`New comment on your post.`)}
    ${paragraph(`<strong style="font-weight:500;">${escape(who)}</strong> in <strong style="font-weight:500;">${escape(args.workspaceName)}</strong> wrote:`)}
    ${bodyQuote(args.body)}
    ${paragraph(`On the post:`, { muted: true })}
    ${bodyQuote(args.postContent)}
    ${primaryButton("Open thread", url)}
  `;
  const text = `${who} commented on your post in ${args.workspaceName}:

"${preview(args.body)}"

Open at: ${url}`;
  return {
    subject,
    html: renderLayout({
      preheader: `${who} commented: ${preview(args.body, 80)}`,
      body: html,
    }),
    text,
  };
}

export function postMentionEmail(args: {
  mentionerName: string;
  body: string;
  postId: string;
  workspaceName: string;
}): ReviewEmailRender {
  const url = POST_URL(args.postId);
  const subject = `${args.mentionerName} mentioned you`;
  const html = `
    ${displayHeading(`You were mentioned in a comment.`)}
    ${paragraph(`<strong style="font-weight:500;">${escape(args.mentionerName)}</strong> mentioned you in <strong style="font-weight:500;">${escape(args.workspaceName)}</strong>:`)}
    ${bodyQuote(args.body)}
    ${primaryButton("Open thread", url)}
  `;
  const text = `${args.mentionerName} mentioned you in ${args.workspaceName}:

"${preview(args.body)}"

Open at: ${url}`;
  return {
    subject,
    html: renderLayout({
      preheader: `${args.mentionerName}: ${preview(args.body, 80)}`,
      body: html,
    }),
    text,
  };
}
