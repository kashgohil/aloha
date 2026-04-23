import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { automations } from "@/db/schema";
import { resolveSteps } from "@/app/app/automations/_lib/steps";
import { templatesWithTrigger } from "@/app/app/automations/_lib/handler-map";
import { startRun } from "./executor";

// Fan out an external event to every active automation whose trigger
// matches. `triggerKind` is the handler slug declared in
// `_lib/handler-map.ts` (e.g. "subscriber_joined", "domain_verified").
//
// Call this from the existing code path where the event happens — e.g.
// right after a subscriber is inserted, or when a sending domain flips to
// "verified". The dispatcher is intentionally cheap: looking up templates
// is an in-memory table; the DB query is scoped to one user + trigger.
export async function dispatchEvent(args: {
  triggerKind: string;
  userId: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  const kinds = templatesWithTrigger(args.triggerKind);
  if (kinds.length === 0) return;

  const rows = await db
    .select()
    .from(automations)
    .where(
      and(
        eq(automations.createdByUserId, args.userId),
        eq(automations.status, "active"),
        inArray(automations.kind, kinds),
      ),
    );

  await Promise.all(
    rows.map((row) =>
      startRun({
        automationId: row.id,
        userId: row.createdByUserId,
        steps: resolveSteps(row),
        trigger: { kind: args.triggerKind, ...(args.payload ?? {}) },
      }).catch((err) => {
        console.error(
          `[automations] dispatch failed for ${row.id}`,
          err instanceof Error ? err.message : err,
        );
      }),
    ),
  );
}
