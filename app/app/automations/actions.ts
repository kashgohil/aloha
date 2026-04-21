"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { automations } from "@/db/schema";
import type { StoredFlowStep } from "@/db/schema";
import {
  TEMPLATES,
  templateIsComingSoon,
  templateRequiresMuse,
  type AutomationKind,
  type ConfigField,
} from "./_lib/templates";
import { requireMuseAccess } from "@/lib/billing/muse";
import { resolveSteps } from "./_lib/steps";
import { handlerFor } from "./_lib/handler-map";
import { materializeNextFireAt } from "@/lib/automations/schedule";
import { recordRun, synthesizeStepResults } from "@/lib/automations/runs";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

type BuilderPayload = Record<string, Record<string, unknown>>;

// Validate + coerce the client-submitted step values against the template's
// field schema. Unknown keys are dropped; required fields must be non-empty.
function validateStepValues(
  kind: AutomationKind,
  payload: BuilderPayload,
): StoredFlowStep[] {
  const template = TEMPLATES[kind];
  if (!template) throw new Error("Unknown automation template.");

  const idFor = (i: number) => `${kind}:${i}`;
  return template.nodes.map((node, i) => {
    const stepId = idFor(i);
    const raw = payload[stepId] ?? {};
    const config = coerceFields(node.fields, raw);
    return {
      id: stepId,
      type: node.type,
      kind: handlerFor(kind, i),
      title: node.title,
      detail: node.detail,
      config,
      branches: node.branches
        ? {
            yes: node.branches.yes?.map(idFor),
            no: node.branches.no?.map(idFor),
          }
        : undefined,
    };
  });
}

function coerceFields(
  fields: ConfigField[] | undefined,
  raw: Record<string, unknown>,
): Record<string, unknown> {
  if (!fields) return {};
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const v = raw[f.key];
    if (f.type === "text" || f.type === "textarea") {
      const s = typeof v === "string" ? v.trim() : "";
      if (!s && f.required) {
        throw new Error(`"${f.label}" is required.`);
      }
      if (s) out[f.key] = s;
      else if (f.default !== undefined) out[f.key] = f.default;
    } else if (f.type === "select") {
      const s = typeof v === "string" ? v : "";
      const valid = f.options.some((o) => o.value === s);
      out[f.key] = valid ? s : (f.default ?? f.options[0]?.value);
    } else if (f.type === "schedule") {
      const obj = (v ?? {}) as { day?: unknown; hour?: unknown };
      const day =
        typeof obj.day === "string" ? obj.day : (f.default?.day ?? "mon");
      const hourRaw =
        typeof obj.hour === "number"
          ? obj.hour
          : Number.isFinite(Number(obj.hour))
            ? Number(obj.hour)
            : (f.default?.hour ?? 9);
      const hour = Math.max(0, Math.min(23, Math.round(hourRaw)));
      out[f.key] = { day, hour };
    }
  }
  return out;
}

function parsePayload(formData: FormData): BuilderPayload {
  const raw = String(formData.get("payload") ?? "{}");
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as BuilderPayload;
  } catch {}
  return {};
}

export async function createAutomationFromBuilder(formData: FormData) {
  const userId = await requireUserId();
  const kind = String(formData.get("kind") ?? "") as AutomationKind;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required.");
  const template = TEMPLATES[kind];
  if (!template) throw new Error("Unknown automation template.");
  if (templateIsComingSoon(kind)) {
    throw new Error("This template isn't available yet — check back soon.");
  }
  if (templateRequiresMuse(kind)) await requireMuseAccess(userId);

  const steps = validateStepValues(kind, parsePayload(formData));

  const [row] = await db
    .insert(automations)
    .values({
      userId,
      kind,
      name,
      status: "draft",
      steps,
      nextFireAt: materializeNextFireAt(steps),
    })
    .returning({ id: automations.id });

  revalidatePath("/app/automations");
  redirect(`/app/automations?id=${row.id}`);
}

export async function updateAutomationFromBuilder(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  const kind = String(formData.get("kind") ?? "") as AutomationKind;
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) throw new Error("Missing id or name.");
  if (!TEMPLATES[kind]) throw new Error("Unknown automation template.");
  if (templateIsComingSoon(kind)) {
    throw new Error("This template isn't available yet — check back soon.");
  }
  if (templateRequiresMuse(kind)) await requireMuseAccess(userId);

  const steps = validateStepValues(kind, parsePayload(formData));

  const [existing] = await db
    .select({ id: automations.id })
    .from(automations)
    .where(and(eq(automations.id, id), eq(automations.userId, userId)))
    .limit(1);
  if (!existing) throw new Error("Automation not found.");

  await db
    .update(automations)
    .set({
      name,
      steps,
      nextFireAt: materializeNextFireAt(steps),
      updatedAt: new Date(),
    })
    .where(and(eq(automations.id, id), eq(automations.userId, userId)));

  revalidatePath("/app/automations");
  redirect(`/app/automations?id=${id}`);
}

export async function toggleAutomation(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const [current] = await db
    .select()
    .from(automations)
    .where(and(eq(automations.id, id), eq(automations.userId, userId)))
    .limit(1);
  if (!current) return;

  const next = current.status === "active" ? "paused" : "active";

  // Refuse to activate automations whose template is gated as coming-soon.
  // Complements the create/update/edit guards so no entry point can flip
  // one of these into the executor's active set.
  if (
    next === "active" &&
    templateIsComingSoon(current.kind as AutomationKind)
  ) {
    throw new Error("This template isn't available yet — check back soon.");
  }

  // Going active: materialize a fresh due-time so the cron poller picks it
  // up. Going inactive: clear it so we don't fire while paused.
  const steps = resolveSteps(current);
  const nextFireAt =
    next === "active" ? materializeNextFireAt(steps) : null;

  await db
    .update(automations)
    .set({ status: next, nextFireAt, updatedAt: new Date() })
    .where(and(eq(automations.id, id), eq(automations.userId, userId)));

  revalidatePath("/app/automations");
}

// Dev-only: writes a synthetic run so the history panel is visible before the
// real executor exists. Gated off in production to avoid polluting real data.
export async function simulateRun(formData: FormData) {
  if (process.env.NODE_ENV === "production") return;
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  const outcome =
    String(formData.get("outcome") ?? "success") === "failed"
      ? "failed"
      : "success";
  if (!id) return;

  const [row] = await db
    .select({
      id: automations.id,
      kind: automations.kind,
      steps: automations.steps,
      userId: automations.userId,
    })
    .from(automations)
    .where(and(eq(automations.id, id), eq(automations.userId, userId)))
    .limit(1);
  if (!row) return;

  const steps = resolveSteps(row);
  const { results, error } = synthesizeStepResults(steps, outcome);
  const startedAt = results[0] ? new Date(results[0].startedAt) : new Date();
  const finishedAt = results.at(-1)
    ? new Date(results.at(-1)!.finishedAt)
    : new Date();

  await recordRun({
    automationId: id,
    userId,
    status: outcome,
    stepResults: results,
    error,
    startedAt,
    finishedAt,
    trigger: { source: "simulate" },
  });

  revalidatePath("/app/automations");
}

export async function deleteAutomation(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db
    .delete(automations)
    .where(and(eq(automations.id, id), eq(automations.userId, userId)));

  revalidatePath("/app/automations");
  redirect("/app/automations");
}
