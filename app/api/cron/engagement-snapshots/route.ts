import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNotNull, lte } from "drizzle-orm";
import { db } from "@/db";
import { postDeliveries } from "@/db/schema";
import { env } from "@/lib/env";
import { syncPostDeliveryMetrics } from "@/lib/posts/engagement/sync";
import { captureException } from "@/lib/logger";

// Engagement snapshot decay-curve sweep. Each delivery has a
// `nextMetricSyncAt` set at publish time and advanced by the snapshot
// helper after each successful sync (lib/posts/engagement/schedule.ts).
// Curve: t+1h, +6h, +24h, +72h, +7d, +30d, then stop. Manual refreshes
// also flow through the same advance, so a user clicking Refresh
// effectively consumes the next due tick.
//
// Bounded per tick to keep the request inside Vercel's timeout and to
// avoid hammering rate limits if a backlog accumulates.

const BATCH_LIMIT = 100;
const CONCURRENCY = 8;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const due = await db
    .select({ id: postDeliveries.id })
    .from(postDeliveries)
    .where(
      and(
        eq(postDeliveries.status, "published"),
        isNotNull(postDeliveries.nextMetricSyncAt),
        lte(postDeliveries.nextMetricSyncAt, new Date()),
      ),
    )
    .limit(BATCH_LIMIT);

  let captured = 0;
  let skipped = 0;
  let failed = 0;
  const errors: Array<{ id: string; error: string }> = [];

  // Simple worker pool — bounded fan-out so we don't spike rate limits
  // when a cohort all comes due together.
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, due.length) }, async () => {
      while (cursor < due.length) {
        const idx = cursor++;
        const { id } = due[idx];
        try {
          const result = await syncPostDeliveryMetrics(id);
          if (result.captured) captured += 1;
          else skipped += 1;
        } catch (err) {
          failed += 1;
          const message = err instanceof Error ? err.message : String(err);
          errors.push({ id, error: message.slice(0, 200) });
          await captureException(err, {
            tags: { source: "cron.engagement_snapshots" },
            extra: { deliveryId: id },
          });
        }
      }
    }),
  );

  return NextResponse.json({
    due: due.length,
    captured,
    skipped,
    failed,
    errors: errors.slice(0, 10),
  });
}
