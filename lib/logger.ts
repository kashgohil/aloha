// Console-based structured logger. Keeps the small Logger API that the
// app relies on — `new Logger({ source })`, `.info/.warn/.error/.debug`,
// and `.flush()` — so callsites don't need to change.
//
// Dev: pretty-printed, color-coded lines for quick scanning.
// Prod (Vercel): single-line JSON. Vercel's log viewer indexes structured
// JSON nicely, and log drains can forward it to Datadog, Better Stack,
// S3, etc. via the Vercel dashboard (no SDK lock-in).
//
//   import { Logger } from "@/lib/logger";
//   const log = new Logger({ source: "publishers" });
//   log.info("publishing", { postId });
//   await log.flush(); // no-op, kept for API parity
import * as Sentry from "@sentry/nextjs";

type Level = "debug" | "info" | "warn" | "error";
type Fields = Record<string, unknown>;

const isDev = process.env.NODE_ENV !== "production";

const COLORS: Record<Level, string> = {
  debug: "\x1b[90m", // gray
  info: "\x1b[36m", // cyan
  warn: "\x1b[33m", // yellow
  error: "\x1b[31m", // red
};
const RESET = "\x1b[0m";
const DIM = "\x1b[2m";

export class Logger {
  private readonly source: string;
  private readonly base: Fields;

  constructor(opts: { source?: string } & Fields = {}) {
    const { source, ...rest } = opts;
    this.source = source ?? "app";
    this.base = rest;
  }

  debug(msg: string, fields?: Fields) {
    this.emit("debug", msg, fields);
  }
  info(msg: string, fields?: Fields) {
    this.emit("info", msg, fields);
  }
  warn(msg: string, fields?: Fields) {
    this.emit("warn", msg, fields);
  }
  error(msg: string, fields?: Fields) {
    this.emit("error", msg, fields);
  }

  // Axiom parity. Console logging is synchronous — nothing to flush.
  async flush() {}

  private emit(level: Level, msg: string, fields?: Fields) {
    const payload = { ...this.base, ...fields };

    if (isDev) {
      const color = COLORS[level];
      const tag = `${color}${level.toUpperCase().padEnd(5)}${RESET}`;
      const src = `${DIM}[${this.source}]${RESET}`;
      const extras =
        Object.keys(payload).length > 0
          ? ` ${DIM}${safeStringify(payload)}${RESET}`
          : "";
      console[level === "debug" ? "log" : level](`${tag} ${src} ${msg}${extras}`);
      return;
    }

    // Production: single-line JSON. Vercel log viewer parses this; drains
    // forward the same structured shape downstream.
    const line = safeStringify({
      level,
      source: this.source,
      msg,
      time: new Date().toISOString(),
      ...payload,
    });
    console[level === "debug" ? "log" : level](line);
  }
}

function safeStringify(obj: unknown) {
  try {
    return JSON.stringify(obj);
  } catch {
    return String(obj);
  }
}

// Capture to Sentry and mirror the event id into the log so an entry can
// be pivoted to its Sentry event (and vice versa). Pass an existing `log`
// when one is in scope to reuse the source/base fields.
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
    opts.log ?? new Logger({ source: opts.source ?? opts.tags?.source ?? "app" });
  log.error(opts.message ?? "captured exception", {
    sentryEventId: eventId,
    error: err instanceof Error ? err.message : String(err),
    ...opts.tags,
    ...opts.extra,
  });
  return eventId;
}
