import "server-only";

import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { subscribers } from "@/db/schema";
import { sendEmail } from "@/lib/email/send";
import {
  displayHeading,
  paragraph,
  renderLayout,
  escape,
} from "@/lib/email/layout";
import { unsubscribeUrl } from "@/lib/email/unsubscribe";
import { captureException } from "@/lib/logger";
import {
  registerAction,
  type ActionContext,
  type ActionResult,
} from "../registry";

type Recipient = {
  subscriberId: string | null;
  email: string;
  name: string | null;
};

function textToHtmlParagraphs(body: string): string {
  return body
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => paragraph(escape(chunk).replace(/\n/g, "<br />")))
    .join("\n");
}

function renderAutomationEmail(args: {
  subject: string;
  body: string;
  recipient: Recipient;
}): { html: string; text: string } {
  const greeting = args.recipient.name?.split(" ")[0]
    ? `Hey ${args.recipient.name.split(" ")[0]},`
    : "Hey,";
  const unsubHref = args.recipient.subscriberId
    ? unsubscribeUrl(args.recipient.subscriberId)
    : null;

  const html = renderLayout({
    preheader: args.subject,
    body: `
      ${displayHeading(escape(args.subject))}
      ${paragraph(escape(greeting))}
      ${textToHtmlParagraphs(args.body)}
      ${
        unsubHref
          ? paragraph(
              `<a href="${escape(unsubHref)}" style="color:rgba(26,22,18,0.55);">Unsubscribe</a>`,
              { muted: true },
            )
          : ""
      }
    `,
  });

  const text = [
    greeting,
    "",
    args.body.trim(),
    unsubHref ? `\nUnsubscribe: ${unsubHref}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return { html, text };
}

async function resolveRecipients(
  userId: string,
  trigger: Record<string, unknown>,
  snapshot: Record<string, unknown>,
): Promise<Recipient[]> {
  // 1) Trigger-carried single recipient (subscriber_joined, etc.).
  const triggerSubscriberId =
    typeof trigger.subscriberId === "string" ? trigger.subscriberId : null;
  const triggerEmail =
    typeof trigger.email === "string" ? trigger.email : null;

  if (triggerSubscriberId) {
    const [row] = await db
      .select({
        id: subscribers.id,
        email: subscribers.email,
        name: subscribers.name,
        unsubscribedAt: subscribers.unsubscribedAt,
      })
      .from(subscribers)
      .where(
        and(eq(subscribers.id, triggerSubscriberId), eq(subscribers.createdByUserId, userId)),
      )
      .limit(1);
    if (!row || row.unsubscribedAt) return [];
    return [{ subscriberId: row.id, email: row.email, name: row.name }];
  }

  if (triggerEmail) {
    const [row] = await db
      .select({
        id: subscribers.id,
        email: subscribers.email,
        name: subscribers.name,
        unsubscribedAt: subscribers.unsubscribedAt,
      })
      .from(subscribers)
      .where(and(eq(subscribers.email, triggerEmail), eq(subscribers.createdByUserId, userId)))
      .limit(1);
    if (row?.unsubscribedAt) return [];
    // If no subscriber row exists, still send — direct-address case — but
    // without an unsubscribe link (we'd have nothing to key it off).
    return [
      {
        subscriberId: row?.id ?? null,
        email: triggerEmail,
        name: row?.name ?? null,
      },
    ];
  }

  // 2) Upstream fan-out: find_stale_subscribers → send_email pattern.
  for (const value of Object.values(snapshot)) {
    if (!value || typeof value !== "object") continue;
    const ids = (value as { subscriberIds?: unknown }).subscriberIds;
    if (!Array.isArray(ids) || ids.length === 0) continue;
    const subscriberIds = ids.filter(
      (x): x is string => typeof x === "string",
    );
    if (subscriberIds.length === 0) continue;

    const rows = await db
      .select({
        id: subscribers.id,
        email: subscribers.email,
        name: subscribers.name,
      })
      .from(subscribers)
      .where(
        and(
          eq(subscribers.createdByUserId, userId),
          inArray(subscribers.id, subscriberIds),
          isNull(subscribers.unsubscribedAt),
        ),
      );
    return rows.map((r) => ({
      subscriberId: r.id,
      email: r.email,
      name: r.name,
    }));
  }

  return [];
}

registerAction(
  "send_email",
  async ({ step, userId, trigger, snapshot }: ActionContext): Promise<ActionResult> => {
    const cfg = step.config ?? {};
    const subject = typeof cfg.subject === "string" ? cfg.subject.trim() : "";
    const body = typeof cfg.body === "string" ? cfg.body.trim() : "";
    if (!subject || !body) {
      return {
        output: {
          skipped: true,
          reason: "send_email requires non-empty subject and body in config",
        },
      };
    }

    const recipients = await resolveRecipients(userId, trigger, snapshot);
    if (recipients.length === 0) {
      return {
        output: {
          skipped: true,
          reason: "No deliverable recipients resolved from trigger or upstream steps",
        },
      };
    }

    let sent = 0;
    const failures: Array<{ email: string; error: string }> = [];

    for (const recipient of recipients) {
      try {
        const { html, text } = renderAutomationEmail({ subject, body, recipient });
        await sendEmail({ to: recipient.email, subject, html, text });
        sent += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        failures.push({ email: recipient.email, error: message });
        await captureException(err, {
          tags: { source: "automations.send_email" },
          extra: { userId, email: recipient.email },
        });
      }
    }

    return {
      output: {
        sent,
        failed: failures.length,
        totalResolved: recipients.length,
        // Only surface failures (not the success list) — keeps the run-log
        // compact when a campaign fans out to thousands.
        ...(failures.length > 0 ? { failures: failures.slice(0, 10) } : {}),
      },
    };
  },
);
