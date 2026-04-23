import "server-only";

import { and, eq, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { broadcastSends, subscribers } from "@/db/schema";
import {
  registerAction,
  type ActionContext,
  type ActionResult,
} from "../registry";

// Config from `reengage_stale` template:
//   { inactiveDays: "30" | "60" | "90" }
// "Stale" = subscriber joined before the cutoff AND has no broadcast_sends
// row with openedAt or clickedAt more recent than the cutoff. Brand-new
// subscribers (who joined after the cutoff) are not stale yet — they just
// haven't had time to receive anything.

const MAX_STALE_BATCH = 500;

registerAction(
  "find_stale_subscribers",
  async ({ step, userId }: ActionContext): Promise<ActionResult> => {
    const cfg = step.config ?? {};
    const rawDays = typeof cfg.inactiveDays === "string" ? cfg.inactiveDays : "60";
    const parsed = Number.parseInt(rawDays, 10);
    const inactiveDays =
      Number.isFinite(parsed) && parsed > 0 ? parsed : 60;

    const cutoff = new Date(Date.now() - inactiveDays * 86_400_000);

    // Left-join-like existence check with a correlated subquery: exclude any
    // subscriber who has engaged with a broadcast since the cutoff. Doing
    // this as a `NOT EXISTS` keeps the query one round-trip and lets
    // Postgres use the (subscriberId, openedAt/clickedAt) index path.
    const rows = await db
      .select({ id: subscribers.id })
      .from(subscribers)
      .where(
        and(
          eq(subscribers.createdByUserId, userId),
          isNull(subscribers.unsubscribedAt),
          lt(subscribers.createdAt, cutoff),
          sql`NOT EXISTS (
            SELECT 1 FROM ${broadcastSends} bs
            WHERE bs."subscriberId" = ${subscribers.id}
              AND (
                (bs."openedAt" IS NOT NULL AND bs."openedAt" >= ${cutoff})
                OR (bs."clickedAt" IS NOT NULL AND bs."clickedAt" >= ${cutoff})
              )
          )`,
        ),
      )
      .limit(MAX_STALE_BATCH);

    return {
      output: {
        subscriberIds: rows.map((r) => r.id),
        count: rows.length,
        inactiveDays,
        cutoff: cutoff.toISOString(),
        truncated: rows.length >= MAX_STALE_BATCH,
      },
    };
  },
);
