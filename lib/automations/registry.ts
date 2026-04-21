import "server-only";
import type { StoredFlowStep } from "@/db/schema";

// ── Types ────────────────────────────────────────────────────────────────

export type RunContext = {
  automationId: string;
  userId: string;
  trigger: Record<string, unknown>;
  // Accumulated outputs from earlier steps, keyed by stepId. Handlers can
  // read upstream results (e.g. `find_stale_subscribers` → `send_email`).
  snapshot: Record<string, unknown>;
};

export type ActionContext = RunContext & {
  step: StoredFlowStep;
};

export type ActionResult = {
  // Output merged into snapshot under `step.id` for downstream steps.
  output?: Record<string, unknown>;
};

export type ActionHandler = (ctx: ActionContext) => Promise<ActionResult>;

export type ConditionContext = RunContext & {
  step: StoredFlowStep;
};

// Conditions may return a bare boolean (simple matchers like keyword_match)
// or an object carrying side-channel details (threshold comparisons want
// to surface the actual numbers so a downstream alert step can quote them
// in its body). The executor normalizes both shapes.
export type ConditionResult =
  | boolean
  | { matched: boolean; details?: Record<string, unknown> };

export type ConditionHandler = (
  ctx: ConditionContext,
) => Promise<ConditionResult>;

// ── Registries ───────────────────────────────────────────────────────────

const actionHandlers = new Map<string, ActionHandler>();
const conditionHandlers = new Map<string, ConditionHandler>();

// Idempotent by design: HMR and Next's dual server/client module graphs both
// cause handler files to evaluate more than once. Re-registration with the
// same function reference is a no-op; registering a *different* function for
// the same kind logs a warning and keeps the newer one.
export function registerAction(kind: string, handler: ActionHandler) {
  const existing = actionHandlers.get(kind);
  if (existing && existing !== handler) {
    console.warn(
      `[automations] action handler "${kind}" re-registered with a different function; using the new one.`,
    );
  }
  actionHandlers.set(kind, handler);
}

export function registerCondition(kind: string, handler: ConditionHandler) {
  const existing = conditionHandlers.get(kind);
  if (existing && existing !== handler) {
    console.warn(
      `[automations] condition handler "${kind}" re-registered with a different function; using the new one.`,
    );
  }
  conditionHandlers.set(kind, handler);
}

export function getActionHandler(kind: string): ActionHandler | undefined {
  return actionHandlers.get(kind);
}

export function getConditionHandler(
  kind: string,
): ConditionHandler | undefined {
  return conditionHandlers.get(kind);
}

// For the UI / tests — snapshot the registered kinds.
export function registeredKinds(): {
  actions: string[];
  conditions: string[];
} {
  return {
    actions: Array.from(actionHandlers.keys()).sort(),
    conditions: Array.from(conditionHandlers.keys()).sort(),
  };
}
