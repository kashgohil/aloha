import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray, lt, lte } from "drizzle-orm";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
import { env } from "@/lib/env";
import { captureException } from "@/lib/logger";

// Hourly rollover for approved campaigns. Drives the time-based portion of
// the lifecycle so the dashboard chip stays honest without a write at
// approve-time covering the whole window:
//
//   scheduled → running   when rangeStart has passed
//   scheduled / running → complete   when rangeEnd has passed
//
// Paused and archived campaigns are left alone — those states are user-
// controlled. The approve / resume actions plant the initial status using
// the same `computeLifecycleStatus` table, so this cron is the steady-state
// reconciler for campaigns that cross a boundary while sitting still.

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  let started = 0;
  let completed = 0;
  const errors: Array<{ id: string; error: string }> = [];

  try {
    const completedRows = await db
      .update(campaigns)
      .set({ status: "complete", updatedAt: now })
      .where(
        and(
          inArray(campaigns.status, ["scheduled", "running"]),
          lt(campaigns.rangeEnd, now),
        ),
      )
      .returning({ id: campaigns.id });
    completed = completedRows.length;

    const startedRows = await db
      .update(campaigns)
      .set({ status: "running", updatedAt: now })
      .where(
        and(
          eq(campaigns.status, "scheduled"),
          lte(campaigns.rangeStart, now),
        ),
      )
      .returning({ id: campaigns.id });
    started = startedRows.length;
  } catch (err) {
    await captureException(err, {
      tags: { source: "cron.campaign-rollover" },
    });
    errors.push({
      id: "rollover",
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return NextResponse.json({
    ok: errors.length === 0,
    at: now.toISOString(),
    started,
    completed,
    errors,
  });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
