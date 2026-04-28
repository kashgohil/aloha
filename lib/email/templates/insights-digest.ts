import {
  COLORS,
  displayHeading,
  divider,
  escape,
  paragraph,
  primaryButton,
  renderLayout,
} from "../layout";
import { env } from "@/lib/env";
import type {
  InsightSuggestion,
  InsightsTopPost,
} from "@/lib/analytics/insights";

const APP = env.APP_URL.replace(/\/$/, "");

function previewLine(content: string, max = 140): string {
  const trimmed = content.trim();
  if (!trimmed) return "(empty post)";
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

function platformLabel(platform: string): string {
  if (!platform) return "Other";
  return platform === "twitter" ? "X" : platform[0].toUpperCase() + platform.slice(1);
}

function topPostBlock(post: InsightsTopPost, index: number): string {
  const url = post.postId ? `${APP}/app/posts/${post.postId}` : null;
  const meta = `${platformLabel(post.platform)} · ${post.impressions.toLocaleString()} impressions · ${post.engagement.toLocaleString()} interactions`;
  const link = url
    ? `<a href="${escape(url)}" style="color:${COLORS.ink};text-decoration:none;">Open in Aloha →</a>`
    : "";
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 18px 0;">
    <tr>
      <td valign="top" style="padding:0 14px 0 0;width:28px;font-size:13px;color:${COLORS.inkSoft};font-weight:500;">${index + 1}.</td>
      <td valign="top">
        <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${COLORS.inkSoft};margin-bottom:4px;">${escape(meta)}</div>
        <div style="font-size:14.5px;line-height:1.55;color:${COLORS.ink};">${escape(previewLine(post.content))}</div>
        ${link ? `<div style="margin-top:6px;font-size:13px;">${link}</div>` : ""}
      </td>
    </tr>
  </table>`;
}

function suggestionBlock(s: InsightSuggestion): string {
  const cta = s.href
    ? `<div style="margin-top:6px;font-size:13px;"><a href="${escape(`${APP}${s.href}`)}" style="color:${COLORS.primary};text-decoration:none;">Open Aloha →</a></div>`
    : "";
  return `<div style="margin:0 0 14px 0;padding:14px 16px;background:rgba(251,230,207,0.4);border:1px solid ${COLORS.border};border-radius:12px;">
    <div style="font-size:14.5px;line-height:1.45;color:${COLORS.ink};font-weight:500;">${escape(s.headline)}</div>
    <div style="margin-top:6px;font-size:12.5px;line-height:1.55;color:${COLORS.inkMuted};">${escape(s.rationale)}</div>
    ${cta}
  </div>`;
}

export type InsightsDigestRender = {
  subject: string;
  html: string;
  text: string;
};

// Renders the weekly digest. Returns null when the data is too thin to
// be worth sending — caller treats that as "skip this week" rather than
// emailing a half-empty email that erodes trust in the digest.
export function insightsDigestEmail(args: {
  workspaceName: string;
  topPosts: InsightsTopPost[];
  suggestions: InsightSuggestion[];
  postCount: number;
}): InsightsDigestRender | null {
  if (args.topPosts.length === 0 && args.suggestions.length === 0) {
    return null;
  }

  const topHtml =
    args.topPosts.length > 0
      ? `${displayHeading(`Last week's three to learn from.`)}
         ${args.topPosts.map(topPostBlock).join("")}`
      : "";

  const suggestionHtml =
    args.suggestions.length > 0
      ? `${args.topPosts.length > 0 ? divider() : ""}
         ${displayHeading(`What to do more of.`)}
         ${args.suggestions.map(suggestionBlock).join("")}`
      : "";

  const insightsUrl = `${APP}/app/insights`;
  const closing = `${divider()}
    ${paragraph(
      `See the same data — plus a few more cuts — at <a href="${escape(insightsUrl)}" style="color:${COLORS.primary};text-decoration:none;">/app/insights</a>. Or hit reply to tell me what would actually be useful.`,
      { muted: true },
    )}
    ${primaryButton("Open dashboard", `${APP}/app/dashboard`)}`;

  const body = `${paragraph(
    `Quick retro on <strong style="font-weight:500;">${escape(args.workspaceName)}</strong> — what shipped, what landed, and what to try next.`,
  )}
    ${topHtml}
    ${suggestionHtml}
    ${closing}`;

  const text = renderText(args);
  return {
    subject: `Aloha weekly: what worked for ${args.workspaceName}`,
    html: renderLayout({
      preheader:
        args.topPosts[0]?.content
          ? previewLine(args.topPosts[0].content, 90)
          : `Weekly retro for ${args.workspaceName}.`,
      body,
    }),
    text,
  };
}

function renderText(args: {
  workspaceName: string;
  topPosts: InsightsTopPost[];
  suggestions: InsightSuggestion[];
}): string {
  const lines: string[] = [];
  lines.push(`Weekly retro for ${args.workspaceName}`);
  lines.push("");
  if (args.topPosts.length > 0) {
    lines.push("Last week's three to learn from:");
    args.topPosts.forEach((p, i) => {
      lines.push(
        `  ${i + 1}. [${platformLabel(p.platform)}] ${previewLine(p.content, 100)}`,
      );
      lines.push(
        `     ${p.impressions.toLocaleString()} impressions · ${p.engagement.toLocaleString()} interactions`,
      );
      if (p.postId) lines.push(`     ${APP}/app/posts/${p.postId}`);
    });
    lines.push("");
  }
  if (args.suggestions.length > 0) {
    lines.push("What to do more of:");
    args.suggestions.forEach((s) => {
      lines.push(`  - ${s.headline}`);
      lines.push(`    ${s.rationale}`);
      if (s.href) lines.push(`    ${APP}${s.href}`);
    });
    lines.push("");
  }
  lines.push(`Full view: ${APP}/app/insights`);
  return lines.join("\n");
}
