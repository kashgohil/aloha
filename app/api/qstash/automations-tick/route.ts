import { Receiver } from "@upstash/qstash";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { env } from "@/lib/env";
import { captureException } from "@/lib/logger";
import { automationRuns, automations } from "@/db/schema";
import { resolveSteps } from "@/app/app/automations/_lib/steps";
import { resumeRun, startRun } from "@/lib/automations/executor";
import { materializeNextFireAt } from "@/lib/automations/schedule";
import { schedule, type TickBody } from "@/lib/automations/scheduler";

// Per-tick handler called by the delayed-message queue at the exact fire
// or resume time. Sits alongside the hourly reconciliation cron — the cron
// is the safety net for dropped/delayed messages, this path is the
// primary (precise-to-the-second) scheduler.
//
// Idempotency & stale-guard rules:
// - Skip if the target row's status no longer qualifies (paused, already
//   running, already finished). Both are expected after user edits or a
//   cron race.
// - Skip if `intendedAt` diverges from the row's current nextFireAt /
//   resumeAt by more than TOLERANCE_MS. Divergence means the user
//   rescheduled and a newer message is (or will be) in flight.

const TOLERANCE_MS = 5_000;

export async function POST(req: NextRequest) {
  const signature = req.headers.get("upstash-signature");
  if (!signature) {
    return new NextResponse("Missing signature", { status: 401 });
  }

  const receiver = new Receiver({
    currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
    nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
  });

  const body = await req.text();
  const valid = await receiver.verify({ signature, body }).catch(() => false);
  if (!valid) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let parsed: TickBody;
  try {
    parsed = JSON.parse(body) as TickBody;
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }
  if (!parsed?.kind || !parsed?.id || !parsed?.intendedAt) {
    return new NextResponse("Missing fields", { status: 400 });
  }

  try {
    if (parsed.kind === "fire") {
      return await handleFire(parsed);
    }
    if (parsed.kind === "resume") {
      return await handleResume(parsed);
    }
    return new NextResponse("Unknown kind", { status: 400 });
  } catch (err) {
    await captureException(err, {
      tags: { source: "qstash.automations-tick", kind: parsed.kind },
      extra: { id: parsed.id, intendedAt: parsed.intendedAt },
    });
    // 5xx triggers QStash retry — appropriate for transient DB errors.
    return new NextResponse("Handler error", { status: 500 });
  }
}

async function handleFire(tick: TickBody) {
  const [automation] = await db
    .select()
    .from(automations)
    .where(eq(automations.id, tick.id))
    .limit(1);

  if (!automation) {
    return NextResponse.json({ ok: true, skipped: "not-found" });
  }
  if (automation.status !== "active") {
    return NextResponse.json({ ok: true, skipped: "not-active" });
  }
  if (!automation.nextFireAt) {
    return NextResponse.json({ ok: true, skipped: "no-scheduled-fire" });
  }

  const intended = new Date(tick.intendedAt).getTime();
  const current = automation.nextFireAt.getTime();
  if (Math.abs(intended - current) > TOLERANCE_MS) {
    return NextResponse.json({ ok: true, skipped: "stale-schedule" });
  }

  const steps = resolveSteps(automation);
  const firedAt = new Date();
  await startRun({
    automationId: automation.id,
    userId: automation.createdByUserId,
    steps,
    trigger: { kind: "schedule", firedAt: firedAt.toISOString() },
  });

  // Advance nextFireAt and schedule the next message. If the automation
  // has no further fires (null), clear the scheduled id so a future
  // re-activation starts fresh.
  const next = materializeNextFireAt(steps, firedAt);
  const nextMessageId = next
    ? await schedule({ kind: "fire", id: automation.id, at: next })
    : null;
  await db
    .update(automations)
    .set({
      nextFireAt: next,
      scheduledMessageId: nextMessageId,
      updatedAt: new Date(),
    })
    .where(eq(automations.id, automation.id));

  return NextResponse.json({ ok: true, fired: automation.id });
}

async function handleResume(tick: TickBody) {
  const [run] = await db
    .select()
    .from(automationRuns)
    .where(eq(automationRuns.id, tick.id))
    .limit(1);

  if (!run) {
    return NextResponse.json({ ok: true, skipped: "not-found" });
  }
  if (run.status !== "waiting") {
    return NextResponse.json({ ok: true, skipped: "not-waiting" });
  }
  if (!run.resumeAt || !run.cursor) {
    return NextResponse.json({ ok: true, skipped: "no-resume-state" });
  }

  const intended = new Date(tick.intendedAt).getTime();
  const current = run.resumeAt.getTime();
  if (Math.abs(intended - current) > TOLERANCE_MS) {
    return NextResponse.json({ ok: true, skipped: "stale-resume" });
  }

  const [automation] = await db
    .select()
    .from(automations)
    .where(eq(automations.id, run.automationId))
    .limit(1);
  if (!automation || automation.status !== "active") {
    return NextResponse.json({ ok: true, skipped: "automation-not-active" });
  }

  await resumeRun({
    runId: run.id,
    automationId: automation.id,
    userId: automation.createdByUserId,
    steps: resolveSteps(automation),
    cursor: run.cursor,
    snapshot: run.snapshot ?? {},
    trigger: run.trigger ?? {},
    priorResults: run.stepResults,
  });

  return NextResponse.json({ ok: true, resumed: run.id });
}
