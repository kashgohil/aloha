import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { captureException } from "@/lib/logger";
import {
  automationRuns,
  automations,
  type StoredFlowStep,
  type StoredStepResult,
} from "@/db/schema";
import { getActionHandler, getConditionHandler } from "./registry";
import { schedule as scheduleTick } from "./scheduler";
// Handler modules self-register via side effect. Real handlers are imported
// before the stubs module so duplicate registration throws during
// development if a handler + stub coexist (rather than silently masking).
import "./handlers/add-tag";
import "./handlers/approval-status";
import "./handlers/find-stale-subscribers";
import "./handlers/keyword-match";
import "./handlers/muse-draft-post";
import "./handlers/publish-post";
import "./handlers/rate-over-threshold";
import "./handlers/repost-top";
import "./handlers/save-as-draft";
import "./handlers/send-alert";
import "./handlers/send-broadcast";
import "./handlers/send-digest-email";
import "./handlers/send-email";
import "./handlers/send-insights-digest";
import "./handlers/stubs";

const MAX_STEPS_PER_RUN = 25;

type DelayResolution = { ms: number };

// Parse a delay step's `config` into a concrete milliseconds value. Two
// shapes are supported today: `{ minutes: N }` and `{ holdHours: N }`.
// Extend here as new delay templates land.
function resolveDelayMs(step: StoredFlowStep): DelayResolution {
  const cfg = step.config ?? {};
  if (typeof cfg.minutes === "string" || typeof cfg.minutes === "number") {
    const n = Number(cfg.minutes);
    if (Number.isFinite(n)) return { ms: n * 60_000 };
  }
  if (typeof cfg.holdHours === "string" || typeof cfg.holdHours === "number") {
    const n = Number(cfg.holdHours);
    if (Number.isFinite(n)) return { ms: n * 3_600_000 };
  }
  return { ms: 0 };
}

type ExecuteArgs = {
  runId: string;
  automationId: string;
  userId: string;
  steps: StoredFlowStep[];
  trigger: Record<string, unknown>;
  // Step id to start from. Defaults to the first non-trigger step. When a
  // delay run resumes, the cron endpoint passes the cursor that was stored
  // on pause.
  startStepId?: string;
  snapshot?: Record<string, unknown>;
  priorResults?: StoredStepResult[];
};

export async function executeRun({
  runId,
  automationId,
  userId,
  steps,
  trigger,
  startStepId,
  snapshot = {},
  priorResults = [],
}: ExecuteArgs): Promise<void> {
  const byId = new Map(steps.map((s) => [s.id, s]));
  const stepResults: StoredStepResult[] = [...priorResults];
  const accumulated: Record<string, unknown> = { ...snapshot };

  // Build the linear trunk (top-level, non-branch children). For resume we
  // walk from the supplied cursor; otherwise from the first non-trigger
  // trunk step (the trigger is logged once and never re-executed).
  const branchChildren = new Set<string>();
  for (const s of steps) {
    for (const id of s.branches?.yes ?? []) branchChildren.add(id);
    for (const id of s.branches?.no ?? []) branchChildren.add(id);
  }
  const trunk = steps.filter((s) => !branchChildren.has(s.id));

  let cursor = findCursor(trunk, steps, startStepId);
  let executed = 0;

  while (cursor) {
    if (executed++ >= MAX_STEPS_PER_RUN) {
      await markFailed(runId, stepResults, "Max steps per run exceeded");
      return;
    }

    const step = byId.get(cursor.stepId);
    if (!step) {
      await markFailed(runId, stepResults, `Step not found: ${cursor.stepId}`);
      return;
    }

    const startedAt = new Date();

    try {
      if (step.type === "trigger") {
        stepResults.push(okResult(step.id, startedAt));
        cursor = nextInTrunk(trunk, step.id);
        continue;
      }

      if (step.type === "delay") {
        const { ms } = resolveDelayMs(step);
        if (ms > 0) {
          const resumeAt = new Date(Date.now() + ms);
          const nextStep = nextInTrunk(trunk, step.id);
          stepResults.push(okResult(step.id, startedAt));
          // Schedule the resume tick before writing the row so the
          // messageId lands atomically. scheduleTick swallows failures
          // and returns null — the hourly cron will pick up any
          // waiting run whose resumeAt has passed.
          const scheduledMessageId = await scheduleTick({
            kind: "resume",
            id: runId,
            at: resumeAt,
          });
          await db
            .update(automationRuns)
            .set({
              status: "waiting",
              stepResults,
              snapshot: accumulated,
              resumeAt,
              cursor: nextStep?.stepId ?? null,
              scheduledMessageId,
            })
            .where(eq(automationRuns.id, runId));
          return;
        }
        stepResults.push(okResult(step.id, startedAt));
        cursor = nextInTrunk(trunk, step.id);
        continue;
      }

      if (step.type === "condition") {
        const handler = getConditionHandler(step.kind);
        if (!handler) {
          throw new Error(`No condition handler for "${step.kind}"`);
        }
        const raw = await handler({
          automationId,
          userId,
          trigger,
          snapshot: accumulated,
          step,
        });
        const matched = typeof raw === "boolean" ? raw : raw.matched;
        const details =
          typeof raw === "boolean" ? {} : (raw.details ?? {});
        const output = { matched, ...details };
        stepResults.push({
          stepId: step.id,
          status: "success",
          startedAt: startedAt.toISOString(),
          finishedAt: new Date().toISOString(),
          output,
        });
        accumulated[step.id] = output;

        const branchIds = matched ? step.branches?.yes : step.branches?.no;
        if (branchIds && branchIds.length > 0) {
          await runBranch(branchIds, byId, {
            automationId,
            userId,
            trigger,
            snapshot: accumulated,
            stepResults,
          });
        }
        cursor = nextInTrunk(trunk, step.id);
        continue;
      }

      // action
      const handler = getActionHandler(step.kind);
      if (!handler) {
        throw new Error(`No action handler for "${step.kind}"`);
      }
      const result = await handler({
        automationId,
        userId,
        trigger,
        snapshot: accumulated,
        step,
      });
      stepResults.push({
        stepId: step.id,
        status: "success",
        startedAt: startedAt.toISOString(),
        finishedAt: new Date().toISOString(),
        output: result.output,
      });
      if (result.output !== undefined) accumulated[step.id] = result.output;
      cursor = nextInTrunk(trunk, step.id);
    } catch (err) {
      await captureException(err, {
        tags: { source: "automations.executor", phase: "trunk" },
        extra: { runId, automationId, stepId: step.id, stepKind: step.kind },
      });
      const message = err instanceof Error ? err.message : String(err);
      stepResults.push({
        stepId: step.id,
        status: "failed",
        startedAt: startedAt.toISOString(),
        finishedAt: new Date().toISOString(),
        error: message,
      });
      await markFailed(runId, stepResults, message);
      return;
    }
  }

  // Clean finish: bump bookkeeping + flip run to success.
  await finalizeRun(runId, automationId, stepResults, "success", null);
}

async function runBranch(
  branchIds: string[],
  byId: Map<string, StoredFlowStep>,
  ctx: {
    automationId: string;
    userId: string;
    trigger: Record<string, unknown>;
    snapshot: Record<string, unknown>;
    stepResults: StoredStepResult[];
  },
): Promise<void> {
  for (const id of branchIds) {
    const step = byId.get(id);
    if (!step) continue;
    const startedAt = new Date();
    try {
      if (step.type === "action") {
        const handler = getActionHandler(step.kind);
        if (!handler) throw new Error(`No action handler for "${step.kind}"`);
        const result = await handler({
          automationId: ctx.automationId,
          userId: ctx.userId,
          trigger: ctx.trigger,
          snapshot: ctx.snapshot,
          step,
        });
        ctx.stepResults.push({
          stepId: step.id,
          status: "success",
          startedAt: startedAt.toISOString(),
          finishedAt: new Date().toISOString(),
          output: result.output,
        });
        if (result.output !== undefined) ctx.snapshot[step.id] = result.output;
      } else {
        // Nested delays/conditions inside branches are intentionally
        // unsupported in this cut — templates don't use them yet. Log and
        // skip so the run still completes.
        ctx.stepResults.push({
          stepId: step.id,
          status: "skipped",
          startedAt: startedAt.toISOString(),
          finishedAt: new Date().toISOString(),
          error: "Nested non-action branch children not supported yet",
        });
      }
    } catch (err) {
      await captureException(err, {
        tags: { source: "automations.executor", phase: "branch" },
        extra: { automationId: ctx.automationId, stepId: step.id, stepKind: step.kind },
      });
      const message = err instanceof Error ? err.message : String(err);
      ctx.stepResults.push({
        stepId: step.id,
        status: "failed",
        startedAt: startedAt.toISOString(),
        finishedAt: new Date().toISOString(),
        error: message,
      });
      throw err;
    }
  }
}

type TrunkCursor = { stepId: string };

function findCursor(
  trunk: StoredFlowStep[],
  all: StoredFlowStep[],
  startStepId: string | undefined,
): TrunkCursor | null {
  if (!startStepId) {
    const first = trunk[0];
    return first ? { stepId: first.id } : null;
  }
  const inTrunk = trunk.find((s) => s.id === startStepId);
  if (inTrunk) return { stepId: inTrunk.id };
  // Allow pointing at any step (e.g. a branch child) — caller is responsible.
  const anyStep = all.find((s) => s.id === startStepId);
  return anyStep ? { stepId: anyStep.id } : null;
}

function nextInTrunk(
  trunk: StoredFlowStep[],
  currentId: string,
): TrunkCursor | null {
  const idx = trunk.findIndex((s) => s.id === currentId);
  if (idx < 0 || idx >= trunk.length - 1) return null;
  return { stepId: trunk[idx + 1].id };
}

function okResult(stepId: string, startedAt: Date): StoredStepResult {
  return {
    stepId,
    status: "success",
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
  };
}

async function markFailed(
  runId: string,
  stepResults: StoredStepResult[],
  error: string,
): Promise<void> {
  const [row] = await db
    .select({ automationId: automationRuns.automationId })
    .from(automationRuns)
    .where(eq(automationRuns.id, runId))
    .limit(1);
  if (!row) return;
  await finalizeRun(runId, row.automationId, stepResults, "failed", error);
}

async function finalizeRun(
  runId: string,
  automationId: string,
  stepResults: StoredStepResult[],
  status: "success" | "failed",
  error: string | null,
): Promise<void> {
  const finishedAt = new Date();
  await db.transaction(async (tx) => {
    await tx
      .update(automationRuns)
      .set({
        status,
        stepResults,
        error,
        finishedAt,
        resumeAt: null,
        cursor: null,
        scheduledMessageId: null,
      })
      .where(eq(automationRuns.id, runId));
    await tx
      .update(automations)
      .set({ lastRunAt: finishedAt, updatedAt: new Date() })
      .where(eq(automations.id, automationId));
  });
}

// ── Entry points ─────────────────────────────────────────────────────────

// Start a fresh run for an automation. Writes the initial run row, then
// drives execution. Returns the run id so callers can poll if they want.
export async function startRun(args: {
  automationId: string;
  userId: string;
  steps: StoredFlowStep[];
  trigger: Record<string, unknown>;
}): Promise<string> {
  const [row] = await db
    .insert(automationRuns)
    .values({
      automationId: args.automationId,
      status: "running",
      trigger: args.trigger,
      stepResults: [],
      snapshot: {},
    })
    .returning({ id: automationRuns.id });

  // Bump runCount immediately so the list UI reflects activity even while
  // the run is still in-flight.
  await db
    .update(automations)
    .set({
      runCount: sqlIncrement(),
      lastRunAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(automations.id, args.automationId));

  await executeRun({
    runId: row.id,
    automationId: args.automationId,
    userId: args.userId,
    steps: args.steps,
    trigger: args.trigger,
  });
  return row.id;
}

// Resume a paused run. Called by the cron endpoint.
export async function resumeRun(args: {
  runId: string;
  automationId: string;
  userId: string;
  steps: StoredFlowStep[];
  cursor: string;
  snapshot: Record<string, unknown>;
  trigger: Record<string, unknown>;
  priorResults: StoredStepResult[];
}): Promise<void> {
  await db
    .update(automationRuns)
    .set({ status: "running", resumeAt: null, scheduledMessageId: null })
    .where(eq(automationRuns.id, args.runId));

  await executeRun({
    runId: args.runId,
    automationId: args.automationId,
    userId: args.userId,
    steps: args.steps,
    trigger: args.trigger,
    startStepId: args.cursor,
    snapshot: args.snapshot,
    priorResults: args.priorResults,
  });
}

// Small wrapper so the executor doesn't depend on the specific Drizzle sql
// import style used elsewhere in the file. Kept intentionally tiny.
import { sql } from "drizzle-orm";
function sqlIncrement() {
  return sql`${automations.runCount} + 1`;
}
