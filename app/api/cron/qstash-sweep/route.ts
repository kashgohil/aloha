import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNotNull, isNull, lte } from "drizzle-orm";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { env } from "@/lib/env";
import { captureException } from "@/lib/logger";
import { QSTASH_MAX_DELAY_SECONDS, enqueuePostDelivery } from "@/lib/qstash";

// Hourly sweep that hands posts off to the delivery queue once their
// scheduledAt falls inside the provider's max-delay window (7 days on
// our QStash plan). Two cases land here:
//   1. Far-future posts that the action skipped at launch because the
//      delay exceeded the cap.
//   2. Overdue posts whose enqueue was lost — e.g. an approve/launch run
//      that flipped rows to `scheduled` in DB but then failed before
//      publish went out. Those get queued with delay=0 so the worker
//      publishes them on the next tick.
// Idempotency comes from `posts.enqueuedAt`: enqueuePostDelivery stamps
// it after a successful publish, and we filter on `IS NULL` here so
// already-dispatched rows are skipped. Reschedule clears the stamp.

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const horizon = new Date(now.getTime() + QSTASH_MAX_DELAY_SECONDS * 1000);
  let enqueued = 0;
  const errors: Array<{ id: string; error: string }> = [];

  try {
    const rows = await db
      .select({ id: posts.id, scheduledAt: posts.scheduledAt })
      .from(posts)
      .where(
        and(
          eq(posts.status, "scheduled"),
          isNotNull(posts.scheduledAt),
          lte(posts.scheduledAt, horizon),
          isNull(posts.enqueuedAt),
        ),
      );

    for (const r of rows) {
      if (!r.scheduledAt) continue;
      try {
        const res = await enqueuePostDelivery(r.id, r.scheduledAt);
        if (res.enqueued) enqueued += 1;
      } catch (err) {
        errors.push({
          id: r.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } catch (err) {
    await captureException(err, { tags: { source: "cron.qstash-sweep" } });
    errors.push({
      id: "sweep",
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return NextResponse.json({
    ok: errors.length === 0,
    at: now.toISOString(),
    enqueued,
    errors,
  });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
