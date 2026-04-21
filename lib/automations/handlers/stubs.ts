import "server-only";
import {
  registerAction,
  type ActionContext,
  type ActionResult,
} from "../registry";

// Every action referenced by a template lives here as a stub until a real
// handler lands. Each logs what it *would* do and returns a plausible
// output so downstream steps and the run-history UI have something to
// render. Replace these with real integrations one at a time by calling
// `registerAction("kind", handler)` from a new file — duplicate
// registration throws, which is the signal to delete the stub below first.

function stubAction(kind: string) {
  return async (ctx: ActionContext): Promise<ActionResult> => {
    console.info(
      `[automations] stub action "${kind}" for automation=${ctx.automationId} step=${ctx.step.id}`,
      { config: ctx.step.config, trigger: ctx.trigger },
    );
    return { output: { stubbed: true, kind, at: new Date().toISOString() } };
  };
}

// ── Actions ──────────────────────────────────────────────────────────────

registerAction("post_to_slack", stubAction("post_to_slack"));
registerAction("send_dm", stubAction("send_dm"));
