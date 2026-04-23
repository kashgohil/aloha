import "server-only";

import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  automationRuns,
  automations,
  type StoredFlowStep,
  type StoredStepResult,
} from "@/db/schema";

export type RunRow = typeof automationRuns.$inferSelect;

export async function getRecentRuns(
  automationId: string,
  limit = 50,
): Promise<RunRow[]> {
  return db
    .select()
    .from(automationRuns)
    .where(eq(automationRuns.automationId, automationId))
    .orderBy(desc(automationRuns.startedAt))
    .limit(limit);
}

export type RunStats = {
  total: number;
  success: number;
  failed: number;
  successRate: number | null;
};

export async function getRunStats(
  automationIds: string[],
  windowDays = 7,
): Promise<Map<string, RunStats>> {
  const map = new Map<string, RunStats>();
  if (automationIds.length === 0) return map;

  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      automationId: automationRuns.automationId,
      status: automationRuns.status,
      count: sql<number>`count(*)::int`,
    })
    .from(automationRuns)
    .where(
      and(
        inArray(automationRuns.automationId, automationIds),
        gte(automationRuns.startedAt, since),
      ),
    )
    .groupBy(automationRuns.automationId, automationRuns.status);

  for (const id of automationIds) {
    map.set(id, { total: 0, success: 0, failed: 0, successRate: null });
  }
  for (const r of rows) {
    const s = map.get(r.automationId)!;
    s.total += r.count;
    if (r.status === "success") s.success += r.count;
    if (r.status === "failed") s.failed += r.count;
  }
  for (const s of map.values()) {
    const finished = s.success + s.failed;
    s.successRate = finished > 0 ? s.success / finished : null;
  }
  return map;
}

export type RecordRunInput = {
  automationId: string;
  userId: string;
  status: "success" | "failed" | "skipped";
  trigger?: Record<string, unknown>;
  stepResults: StoredStepResult[];
  error?: string;
  startedAt?: Date;
  finishedAt?: Date;
};

// Single entry point for writing a run. The executor (PR future) and the dev
// Simulate button both funnel through here so success/failure bookkeeping
// stays in one place.
export async function recordRun(input: RecordRunInput): Promise<void> {
  const startedAt = input.startedAt ?? new Date();
  const finishedAt = input.finishedAt ?? new Date();

  await db.transaction(async (tx) => {
    const [owner] = await tx
      .select({ userId: automations.createdByUserId })
      .from(automations)
      .where(eq(automations.id, input.automationId))
      .limit(1);
    if (!owner || owner.userId !== input.userId) {
      throw new Error("Automation not found");
    }

    await tx.insert(automationRuns).values({
      automationId: input.automationId,
      status: input.status,
      trigger: input.trigger ?? null,
      stepResults: input.stepResults,
      error: input.error ?? null,
      startedAt,
      finishedAt,
    });

    await tx
      .update(automations)
      .set({
        runCount: sql`${automations.runCount} + 1`,
        lastRunAt: finishedAt,
        updatedAt: new Date(),
      })
      .where(eq(automations.id, input.automationId));
  });
}

// Build a synthetic run from a flow's steps. Used by the dev Simulate button
// to populate the runs panel before the real executor exists.
export function synthesizeStepResults(
  steps: StoredFlowStep[],
  outcome: "success" | "failed",
): { results: StoredStepResult[]; error?: string } {
  const now = Date.now();
  const results: StoredStepResult[] = [];
  let cursor = now;

  // First step always succeeds; if outcome is failure the last action fails.
  const failIdx = outcome === "failed" ? steps.length - 1 : -1;

  steps.forEach((step, i) => {
    const startedAt = new Date(cursor);
    const duration = 200 + Math.round(Math.random() * 600);
    cursor += duration;
    const finishedAt = new Date(cursor);
    const failed = i === failIdx;
    results.push({
      stepId: step.id,
      status: failed ? "failed" : "success",
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      error: failed ? "Simulated failure for observability preview" : undefined,
    });
  });

  return {
    results,
    error: outcome === "failed" ? "Simulated failure" : undefined,
  };
}
