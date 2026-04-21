import "server-only";

import { Client } from "@upstash/qstash";
import { env } from "@/lib/env";
import { captureException } from "@/lib/logger";

// Delayed-message scheduling for automation fires and delay-step resumes.
// Wraps QStash so the rest of the codebase doesn't import the vendor SDK
// directly. The hourly reconciliation cron is the safety net for any
// publish/cancel failure here — callers should not block the user on
// queue failures.

export type TickKind = "fire" | "resume";

export type TickBody = {
  kind: TickKind;
  // Automation id for "fire", run id for "resume".
  id: string;
  // ISO timestamp; the tick handler compares this to the row's current
  // nextFireAt/resumeAt to reject stale messages after reschedule.
  intendedAt: string;
};

let cached: Client | null = null;
function client(): Client {
  if (cached) return cached;
  cached = new Client({ token: env.QSTASH_TOKEN, baseUrl: env.QSTASH_URL });
  return cached;
}

function tickUrl(): string {
  return `${env.APP_URL}/api/qstash/automations-tick`;
}

export async function schedule(args: {
  kind: TickKind;
  id: string;
  at: Date;
}): Promise<string | null> {
  // notBefore expects unix seconds. Floor to avoid sub-second drift being
  // rounded up to "now" (QStash treats past notBefore as immediate, which
  // is fine but wastes a retry).
  const notBefore = Math.max(
    Math.floor(Date.now() / 1000),
    Math.floor(args.at.getTime() / 1000),
  );
  const body: TickBody = {
    kind: args.kind,
    id: args.id,
    intendedAt: args.at.toISOString(),
  };
  try {
    const res = await client().publishJSON({
      url: tickUrl(),
      body,
      notBefore,
    });
    return (res as { messageId?: string }).messageId ?? null;
  } catch (err) {
    await captureException(err, {
      tags: { source: "automations.scheduler", op: "schedule" },
      extra: { kind: args.kind, id: args.id, at: args.at.toISOString() },
    });
    return null;
  }
}

export async function cancel(messageId: string | null | undefined): Promise<void> {
  if (!messageId) return;
  try {
    await client().messages.cancel(messageId);
  } catch (err) {
    // Common and expected: the message already fired or was already
    // canceled. Log at debug level — nothing to recover.
    await captureException(err, {
      tags: { source: "automations.scheduler", op: "cancel" },
      extra: { messageId },
    });
  }
}
