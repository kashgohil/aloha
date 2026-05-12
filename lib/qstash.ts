import "server-only";

import { Client } from "@upstash/qstash";
import { env } from "@/lib/env";

// Single QStash client for the whole app. Imports as a const because
// `env` is evaluated once at module-load and the SDK keeps no per-call
// state — a single instance is safe for concurrent use. Centralizing
// avoids the kind of drift we hit with `actions/campaigns.ts` once
// missing `baseUrl`, which silently routed campaign-launch messages to
// prod QStash even in dev.
export const qstashClient = new Client({
  token: env.QSTASH_TOKEN,
  baseUrl: env.QSTASH_URL,
});

// QStash caps a message's delay at 7 days on our plan (604800s). We keep
// a one-day buffer so an enqueue at the edge of the window can absorb
// clock skew + SDK round-trip without QStash rejecting it.
export const QSTASH_MAX_DELAY_SECONDS = 6 * 24 * 60 * 60;

// Enqueue a post for delivery at `scheduledAt`. Posts further out than
// QSTASH_MAX_DELAY_SECONDS are skipped here — the hourly sweep cron
// (`/api/cron/qstash-sweep`) re-checks them and enqueues them once they
// fall inside the window. `deduplicationId` keys on postId + the exact
// scheduled time, so re-running the sweep is a no-op and a reschedule
// to a different time produces a fresh message (the stale one no-ops
// via the worker's scheduledAt guard).
export async function enqueuePostDelivery(
  postId: string,
  scheduledAt: Date,
): Promise<{ enqueued: boolean; reason?: "too-far" }> {
  const delay = Math.max(
    0,
    Math.floor((scheduledAt.getTime() - Date.now()) / 1000),
  );
  if (delay > QSTASH_MAX_DELAY_SECONDS) {
    return { enqueued: false, reason: "too-far" };
  }
  await qstashClient.publishJSON({
    url: `${env.APP_URL}/api/qstash`,
    body: {
      postId,
      intendedScheduledAt: scheduledAt.toISOString(),
    },
    delay,
    deduplicationId: `post_${postId}_${scheduledAt.getTime()}`,
  });
  return { enqueued: true };
}
