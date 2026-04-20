// Axiom logger. Create a fresh instance per request/operation in
// serverless (state shouldn't persist across invocations) and `await
// log.flush()` before the function returns — Axiom buffers writes and
// will drop them otherwise.
//
//   import { Logger } from "@/lib/logger";
//   const log = new Logger({ source: "publishers" });
//   log.info("publishing", { postId });
//   await log.flush();
//
// In route handlers, `withAxiom` is more ergonomic:
//   import { withAxiom, type AxiomRequest } from "next-axiom";
//   export const POST = withAxiom((req: AxiomRequest) => {
//     req.log.info("hit"); return NextResponse.json({ ok: true });
//   });
import * as Sentry from "@sentry/nextjs";
import { Logger } from "next-axiom";

export { Logger, withAxiom } from "next-axiom";
export type { AxiomRequest } from "next-axiom";

// Capture to Sentry and mirror the event id into Axiom so a log entry
// can be pivoted to its Sentry event (and vice versa). Pass an existing
// `log` when one is in scope (e.g. `req.log` from `withAxiom`) — it
// won't be flushed for you. Omit `log` and a one-shot Axiom logger is
// created and flushed inline.
export async function captureException(
  err: unknown,
  opts: {
    log?: Logger;
    source?: string;
    message?: string;
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  } = {},
): Promise<string> {
  const eventId = Sentry.captureException(err, {
    tags: opts.tags,
    extra: opts.extra,
  });
  const log =
    opts.log ??
    new Logger({ source: opts.source ?? opts.tags?.source ?? "app" });
  log.error(opts.message ?? "captured exception", {
    sentryEventId: eventId,
    error: err instanceof Error ? err.message : String(err),
    ...opts.tags,
    ...opts.extra,
  });
  if (!opts.log) await log.flush();
  return eventId;
}
