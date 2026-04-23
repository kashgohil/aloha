import "server-only";

import { and, eq, gte, isNull, lt, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { subscribers } from "@/db/schema";
import {
  registerCondition,
  type ConditionContext,
  type ConditionResult,
} from "../registry";

// Used by `unsubscribe_spike_alert`. Fires when the last 24h's unsubscribe
// rate exceeds the configured percentage threshold. Rate is defined as:
//
//   rate = (unsubscribes in last 24h) / (subscribers active at start of window) × 100
//
// The base is "subscribers who existed at the start of the window and
// weren't already unsubscribed before it" — otherwise a tiny list with one
// new unsubscribe would always trip the alert. If the base is smaller than
// MIN_BASE, we return false regardless; single-digit lists produce noise,
// not signal.
//
// Returns `{ matched, details }` so the downstream `send_alert` step can
// quote the actual numerator, denominator, and threshold in its email.

const WINDOW_MS = 24 * 60 * 60 * 1000;
const MIN_BASE = 20;

registerCondition(
  "rate_over_threshold",
  async ({ userId, step }: ConditionContext): Promise<ConditionResult> => {
    const cfg = step.config ?? {};
    const rawThreshold =
      typeof cfg.threshold === "string" ? cfg.threshold : "2";
    const parsed = Number.parseFloat(rawThreshold);
    const thresholdPct =
      Number.isFinite(parsed) && parsed > 0 ? parsed : 2;

    const cutoff = new Date(Date.now() - WINDOW_MS);

    const [unsubRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(subscribers)
      .where(
        and(
          eq(subscribers.createdByUserId, userId),
          gte(subscribers.unsubscribedAt, cutoff),
        ),
      );

    const [baseRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(subscribers)
      .where(
        and(
          eq(subscribers.createdByUserId, userId),
          lt(subscribers.createdAt, cutoff),
          or(
            isNull(subscribers.unsubscribedAt),
            gte(subscribers.unsubscribedAt, cutoff),
          ),
        ),
      );

    const unsubscribes = unsubRow?.count ?? 0;
    const base = baseRow?.count ?? 0;

    if (base < MIN_BASE) {
      return {
        matched: false,
        details: {
          reason: `Base too small (${base} < ${MIN_BASE}) — rate check skipped`,
          unsubscribes,
          base,
          thresholdPct,
          windowHours: WINDOW_MS / 3_600_000,
        },
      };
    }

    const ratePct = (unsubscribes / base) * 100;
    const matched = ratePct > thresholdPct;

    return {
      matched,
      details: {
        unsubscribes,
        base,
        ratePct: Math.round(ratePct * 100) / 100,
        thresholdPct,
        windowHours: WINDOW_MS / 3_600_000,
      },
    };
  },
);
