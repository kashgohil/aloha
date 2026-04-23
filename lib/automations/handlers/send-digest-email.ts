import "server-only";

import { and, desc, eq, gte, isNull } from "drizzle-orm";
import { db } from "@/db";
import { postDeliveries, posts, subscribers } from "@/db/schema";
import { sendEmail } from "@/lib/email/send";
import {
  COLORS,
  displayHeading,
  divider,
  escape,
  escapeAttr,
  paragraph,
  renderLayout,
} from "@/lib/email/layout";
import { unsubscribeUrl } from "@/lib/email/unsubscribe";
import { captureException } from "@/lib/logger";
import {
  registerAction,
  type ActionContext,
  type ActionResult,
} from "../registry";

// Config from `weekly_digest` template:
//   { subject, audience: "all" | "verified" }
// Subscribers don't have a verification concept in schema today, so both
// values resolve to "all active subscribers" and we surface that in the
// output so the run log stays honest.

const DIGEST_WINDOW_DAYS = 7;
const MAX_POSTS_IN_DIGEST = 25;
const MAX_CONTENT_PREVIEW = 400;

type DigestPost = {
  id: string;
  content: string;
  publishedAt: Date;
  primaryUrl: string | null;
  platforms: string[];
};

async function loadWeekPosts(userId: string): Promise<DigestPost[]> {
  const since = new Date(Date.now() - DIGEST_WINDOW_DAYS * 86_400_000);

  const rows = await db
    .select({
      id: posts.id,
      content: posts.content,
      publishedAt: posts.publishedAt,
      platforms: posts.platforms,
    })
    .from(posts)
    .where(
      and(
        eq(posts.createdByUserId, userId),
        eq(posts.status, "published"),
        gte(posts.publishedAt, since),
        isNull(posts.deletedAt),
      ),
    )
    .orderBy(desc(posts.publishedAt))
    .limit(MAX_POSTS_IN_DIGEST);

  if (rows.length === 0) return [];

  const deliveries = await db
    .select({
      postId: postDeliveries.postId,
      platform: postDeliveries.platform,
      remoteUrl: postDeliveries.remoteUrl,
      status: postDeliveries.status,
    })
    .from(postDeliveries)
    .where(eq(postDeliveries.status, "published"));

  const urlByPost = new Map<string, string>();
  for (const d of deliveries) {
    if (!d.remoteUrl) continue;
    if (!urlByPost.has(d.postId)) urlByPost.set(d.postId, d.remoteUrl);
  }

  return rows
    .filter((r) => r.publishedAt)
    .map((r) => ({
      id: r.id,
      content: r.content,
      publishedAt: r.publishedAt as Date,
      platforms: r.platforms,
      primaryUrl: urlByPost.get(r.id) ?? null,
    }));
}

function truncate(body: string): string {
  if (body.length <= MAX_CONTENT_PREVIEW) return body;
  return `${body.slice(0, MAX_CONTENT_PREVIEW).trimEnd()}…`;
}

function renderDigest(args: {
  subject: string;
  posts: DigestPost[];
  subscriberId: string;
  subscriberEmail: string;
}): { html: string; text: string } {
  const unsubHref = unsubscribeUrl(args.subscriberId);

  const items = args.posts
    .map((p) => {
      const preview = truncate(p.content).replace(/\n/g, "<br />");
      const meta = `${p.platforms.join(", ")} · ${p.publishedAt.toISOString().slice(0, 10)}`;
      const link = p.primaryUrl
        ? `<p style="margin:8px 0 0 0;font-size:13px;"><a href="${escapeAttr(p.primaryUrl)}" style="color:${COLORS.primary};">View on ${escape(p.platforms[0] ?? "platform")}</a></p>`
        : "";
      return `
        <div style="margin:0 0 22px 0;">
          <div style="font-size:12px;line-height:1.5;color:${COLORS.inkSoft};text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">${escape(meta)}</div>
          <div style="font-size:15px;line-height:1.6;color:${COLORS.ink};">${escape(preview)}</div>
          ${link}
        </div>`;
    })
    .join("\n");

  const html = renderLayout({
    preheader: `${args.posts.length} posts from the past week`,
    body: `
      ${displayHeading(escape(args.subject))}
      ${paragraph(`Here's what went out this week — ${args.posts.length} ${args.posts.length === 1 ? "post" : "posts"}.`)}
      ${divider()}
      ${items}
      ${divider()}
      ${paragraph(
        `<a href="${escape(unsubHref)}" style="color:rgba(26,22,18,0.55);">Unsubscribe</a>`,
        { muted: true },
      )}
    `,
  });

  const textParts = args.posts.map((p) => {
    const head = `${p.platforms.join(", ")} · ${p.publishedAt.toISOString().slice(0, 10)}`;
    const link = p.primaryUrl ? `\n${p.primaryUrl}` : "";
    return `${head}\n${truncate(p.content)}${link}`;
  });
  const text = [
    args.subject,
    "",
    `Here's what went out this week — ${args.posts.length} ${args.posts.length === 1 ? "post" : "posts"}.`,
    "",
    textParts.join("\n\n---\n\n"),
    "",
    `Unsubscribe: ${unsubHref}`,
  ].join("\n");

  return { html, text };
}

registerAction(
  "send_digest_email",
  async ({ userId, step }: ActionContext): Promise<ActionResult> => {
    const cfg = step.config ?? {};
    const subject = typeof cfg.subject === "string" ? cfg.subject.trim() : "";
    if (!subject) {
      return {
        output: { skipped: true, reason: "send_digest_email requires a subject" },
      };
    }
    const audience = cfg.audience === "verified" ? "verified" : "all";

    const weekPosts = await loadWeekPosts(userId);
    if (weekPosts.length === 0) {
      return {
        output: {
          skipped: true,
          reason: "No published posts in the last 7 days — nothing to digest",
        },
      };
    }

    const recipients = await db
      .select({
        id: subscribers.id,
        email: subscribers.email,
      })
      .from(subscribers)
      .where(
        and(eq(subscribers.createdByUserId, userId), isNull(subscribers.unsubscribedAt)),
      );

    if (recipients.length === 0) {
      return {
        output: { skipped: true, reason: "No active subscribers to send to" },
      };
    }

    let sent = 0;
    const failures: Array<{ email: string; error: string }> = [];

    for (const recipient of recipients) {
      try {
        const { html, text } = renderDigest({
          subject,
          posts: weekPosts,
          subscriberId: recipient.id,
          subscriberEmail: recipient.email,
        });
        await sendEmail({
          to: recipient.email,
          subject,
          html,
          text,
        });
        sent += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        failures.push({ email: recipient.email, error: message });
        await captureException(err, {
          tags: { source: "automations.send_digest_email" },
          extra: { userId, email: recipient.email },
        });
      }
    }

    return {
      output: {
        sent,
        failed: failures.length,
        totalRecipients: recipients.length,
        postsIncluded: weekPosts.length,
        // Schema has no subscriber verification concept today — both
        // audience modes resolve to the same set. Surface that honestly
        // so this isn't a silent divergence from the template UI.
        audience,
        audienceFilterApplied: false,
        ...(failures.length > 0 ? { failures: failures.slice(0, 10) } : {}),
      },
    };
  },
);
