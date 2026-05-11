import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt, isNotNull, lte } from "drizzle-orm";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { env } from "@/lib/env";
import { captureException } from "@/lib/logger";
import { QSTASH_MAX_DELAY_SECONDS, enqueuePostDelivery } from "@/lib/qstash";

// Hourly sweep that hands posts off to QStash once their scheduledAt
// falls inside QStash's max-delay window (7 days on our plan). At launch
// time the campaign action skips any beat beyond that window because
// `publishJSON` would reject it with a `maxDelay exceeded` error; those
// far-future posts wait here in `scheduled` state without an in-flight
// QStash message. The sweep keys idempotency on the deduplication id
// inside `enqueuePostDelivery`, so calling it on the same (post,
// scheduledAt) twice within QStash's 90-day dedup retention is a no-op.

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
          gt(posts.scheduledAt, now),
          lte(posts.scheduledAt, horizon),
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
