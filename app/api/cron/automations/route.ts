import { NextRequest, NextResponse } from "next/server";
import { and, eq, lte } from "drizzle-orm";
import { db } from "@/db";
import { captureException } from "@/lib/logger";
import { automationRuns, automations } from "@/db/schema";
import { env } from "@/lib/env";
import { resolveSteps } from "@/app/app/automations/_lib/steps";
import { resumeRun, startRun } from "@/lib/automations/executor";
import { materializeNextFireAt } from "@/lib/automations/schedule";

// Runs once a minute (see vercel.json). Two jobs:
//   1. Resume automation runs waiting on a delay whose timer has elapsed.
//   2. Start new runs for schedule-triggered automations that are due.
//
// Both are intentionally bounded per tick so a backlog doesn't blow the
// request timeout. Failed entries get surfaced in the response for easy
// observability from Vercel's cron history.

const BATCH_LIMIT = 50;

export async function GET(req: NextRequest) {
  const key = new URL(req.url).searchParams.get("key");
  if (!env.CRON_SECRET || key !== env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const resumed: string[] = [];
  const fired: string[] = [];
  const errors: Array<{ id: string; error: string }> = [];

  // ── Resume paused runs ──
  const waiting = await db
    .select()
    .from(automationRuns)
    .where(
      and(
        eq(automationRuns.status, "waiting"),
        lte(automationRuns.resumeAt, now),
      ),
    )
    .limit(BATCH_LIMIT);

  for (const run of waiting) {
    if (!run.cursor) continue;
    const [automation] = await db
      .select()
      .from(automations)
      .where(eq(automations.id, run.automationId))
      .limit(1);
    if (!automation || automation.status !== "active") continue;

    try {
      await resumeRun({
        runId: run.id,
        automationId: automation.id,
        userId: automation.userId,
        steps: resolveSteps(automation),
        cursor: run.cursor,
        snapshot: run.snapshot ?? {},
        trigger: run.trigger ?? {},
        priorResults: run.stepResults,
      });
      resumed.push(run.id);
    } catch (err) {
      await captureException(err, {
        tags: { source: "cron.automations", phase: "resume" },
        extra: { runId: run.id, automationId: automation.id },
      });
      errors.push({
        id: run.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // ── Fire due scheduled triggers ──
  const due = await db
    .select()
    .from(automations)
    .where(
      and(
        eq(automations.status, "active"),
        lte(automations.nextFireAt, now),
      ),
    )
    .limit(BATCH_LIMIT);

  for (const automation of due) {
    const steps = resolveSteps(automation);
    try {
      await startRun({
        automationId: automation.id,
        userId: automation.userId,
        steps,
        trigger: { kind: "schedule", firedAt: now.toISOString() },
      });
      fired.push(automation.id);
    } catch (err) {
      await captureException(err, {
        tags: { source: "cron.automations", phase: "fire" },
        extra: { automationId: automation.id },
      });
      errors.push({
        id: automation.id,
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      // Always advance nextFireAt so a failure doesn't stall the cadence.
      // `materializeNextFireAt` uses the trigger config so re-computing is
      // safe without any state.
      await db
        .update(automations)
        .set({ nextFireAt: materializeNextFireAt(steps, now) })
        .where(eq(automations.id, automation.id));
    }
  }

  return NextResponse.json({
    ok: true,
    at: now.toISOString(),
    resumed: resumed.length,
    fired: fired.length,
    errors,
  });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
