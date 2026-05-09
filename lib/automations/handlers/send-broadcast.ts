import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { broadcasts, sendingDomains } from "@/db/schema";
import { hasBroadcastEntitlement } from "@/lib/billing/broadcasts";
import { env } from "@/lib/env";
import { qstashClient } from "@/lib/qstash";
import { requireActiveWorkspaceId } from "@/lib/workspaces/resolve";
import {
  registerAction,
  type ActionContext,
  type ActionResult,
} from "../registry";

// Config from `auto_broadcast_on_verify`:
//   { subject, body, audience: "all" | "tagged" }
// The trigger (`domain_verified`) carries `{ domainId, domain }` — we reuse
// that domain for the From address. For non-trigger callers we fall back to
// the user's single verified domain, and skip cleanly if there's ambiguity
// (zero or multiple verified domains) so the automation never silently
// picks the wrong sender.

async function resolveSendingDomain(
  userId: string,
  trigger: Record<string, unknown>,
): Promise<{ id: string; domain: string } | { error: string }> {
  const triggerDomainId =
    typeof trigger.domainId === "string" ? trigger.domainId : null;

  if (triggerDomainId) {
    const [row] = await db
      .select({
        id: sendingDomains.id,
        domain: sendingDomains.domain,
        status: sendingDomains.status,
      })
      .from(sendingDomains)
      .where(
        and(eq(sendingDomains.id, triggerDomainId), eq(sendingDomains.createdByUserId, userId)),
      )
      .limit(1);
    if (!row) return { error: "Trigger's sending domain not found for user" };
    if (row.status !== "verified") {
      return { error: `Sending domain "${row.domain}" is not verified yet` };
    }
    return { id: row.id, domain: row.domain };
  }

  const verified = await db
    .select({ id: sendingDomains.id, domain: sendingDomains.domain })
    .from(sendingDomains)
    .where(
      and(eq(sendingDomains.createdByUserId, userId), eq(sendingDomains.status, "verified")),
    )
    .limit(2);

  if (verified.length === 0) {
    return { error: "No verified sending domain on file" };
  }
  if (verified.length > 1) {
    return {
      error:
        "Multiple verified sending domains — trigger must carry domainId to disambiguate",
    };
  }
  return verified[0];
}

registerAction(
  "send_broadcast",
  async ({ userId, step, trigger }: ActionContext): Promise<ActionResult> => {
    const entitled = await hasBroadcastEntitlement(userId);
    if (!entitled) {
      return {
        output: {
          skipped: true,
          reason: "Broadcast add-on not enabled for this workspace",
        },
      };
    }

    const cfg = step.config ?? {};
    const subject = typeof cfg.subject === "string" ? cfg.subject.trim() : "";
    const body = typeof cfg.body === "string" ? cfg.body.trim() : "";
    if (!subject || !body) {
      return {
        output: {
          skipped: true,
          reason: "send_broadcast requires subject and body in config",
        },
      };
    }

    const audience = cfg.audience === "tagged" ? "tagged" : "all";

    const domain = await resolveSendingDomain(userId, trigger);
    if ("error" in domain) {
      return { output: { skipped: true, reason: domain.error } };
    }

    // `hello@<domain>` mirrors the composer's default local-part. The
    // sender can edit the broadcast row before fan-out if they want a
    // different address, but the automation shouldn't require that.
    const fromAddress = `hello@${domain.domain}`;
    const audienceFilter: { tags?: string[] } =
      audience === "tagged" ? { tags: ["early"] } : {};

    const broadcastWorkspaceId = await requireActiveWorkspaceId(userId);
    const [row] = await db
      .insert(broadcasts)
      .values({
        createdByUserId: userId,
        workspaceId: broadcastWorkspaceId,
        subject,
        body,
        fromAddress,
        sendingDomainId: domain.id,
        audienceFilter,
        status: "sending",
      })
      .returning({ id: broadcasts.id });

    // Fan-out worker creates one broadcast_sends row per eligible
    // recipient, applies audienceFilter, and enqueues per-recipient sends.
    // Same path `sendBroadcastNow` uses — keeps the two entry points
    // behaviorally identical.
    await qstashClient.publishJSON({
      url: `${env.APP_URL}/api/qstash/broadcast-fanout`,
      body: { broadcastId: row.id },
    });

    return {
      output: {
        broadcastId: row.id,
        subject,
        audience,
        sendingDomain: domain.domain,
      },
    };
  },
);
