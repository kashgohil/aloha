import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { users, workspaceMembers, workspaces } from "@/db/schema";
import { sendEmail } from "@/lib/email/send";
import { computeWeeklyInsights } from "@/lib/analytics/insights";
import { insightsDigestEmail } from "@/lib/email/templates/insights-digest";
import { requireActiveWorkspaceId } from "@/lib/workspaces/resolve";
import { captureException } from "@/lib/logger";
import {
  registerAction,
  type ActionContext,
  type ActionResult,
} from "../registry";

// Config from `send_insights_digest`:
//   {} — no params for v1; the schedule node controls cadence and the
//        recipient set is derived from workspace owners + admins.
//
// Skips silently when there's not enough data — better to send no email
// than a half-empty one that erodes trust in the digest.

// Owners + admins receive the digest. Editors/reviewers/viewers are
// excluded; the email is creator-facing analytics, not a team ping.
// Filtered against per-user opt-out in the dispatcher below.
async function loadDigestRecipients(workspaceId: string): Promise<
  { userId: string; email: string }[]
> {
  const rows = await db
    .select({
      userId: users.id,
      email: users.email,
      role: workspaceMembers.role,
      optedIn: users.notifyInsightsDigestByEmail,
    })
    .from(workspaceMembers)
    .innerJoin(users, eq(users.id, workspaceMembers.userId))
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        inArray(workspaceMembers.role, ["owner", "admin"]),
      ),
    );

  return rows
    .filter((r) => r.optedIn && r.email)
    .map((r) => ({ userId: r.userId, email: r.email }));
}

registerAction(
  "send_insights_digest",
  async ({ userId }: ActionContext): Promise<ActionResult> => {
    const workspaceId = await requireActiveWorkspaceId(userId);

    const [workspaceRow] = await db
      .select({ id: workspaces.id, name: workspaces.name })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);
    if (!workspaceRow) {
      return {
        output: { skipped: true, reason: "Workspace not found" },
      };
    }

    const insights = await computeWeeklyInsights(workspaceId);
    const rendered = insightsDigestEmail({
      workspaceName: workspaceRow.name,
      topPosts: insights.topPosts,
      suggestions: insights.suggestions,
      postCount: insights.postCount,
    });

    if (!rendered) {
      return {
        output: {
          skipped: true,
          reason:
            "Not enough signal — no top posts and no suggestions for the lookback window",
          postCount: insights.postCount,
          rangeStart: insights.rangeStart.toISOString(),
        },
      };
    }

    const recipients = await loadDigestRecipients(workspaceId);
    if (recipients.length === 0) {
      return {
        output: {
          skipped: true,
          reason:
            "No opted-in admins or owners — every recipient has the digest off",
        },
      };
    }

    const failures: { email: string; error: string }[] = [];
    let sent = 0;
    for (const r of recipients) {
      try {
        await sendEmail({
          to: r.email,
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
        });
        sent += 1;
      } catch (err) {
        failures.push({
          email: r.email,
          error: err instanceof Error ? err.message : String(err),
        });
        captureException(err, {
          tags: { handler: "send_insights_digest" },
          extra: { recipient: r.email, workspaceId },
        });
      }
    }

    return {
      output: {
        sent,
        failed: failures.length,
        totalRecipients: recipients.length,
        topPostCount: insights.topPosts.length,
        suggestionCount: insights.suggestions.length,
        postCount: insights.postCount,
        rangeStart: insights.rangeStart.toISOString(),
        rangeEnd: insights.rangeEnd.toISOString(),
        failures,
      },
    };
  },
);
