import "server-only";

import { db } from "@/db";
import { automations, type StoredFlowStep } from "@/db/schema";
import { captureException } from "@/lib/logger";
import { nextWeeklyFire } from "./schedule";
import { schedule } from "./scheduler";

// Default-on automations seeded at workspace creation. Today: just the
// weekly Insights digest. Add more here when there are other "every
// workspace probably wants this on by default" automations — better
// than spawning ad-hoc inserts in every creation path.

const DEFAULT_INSIGHTS_SCHEDULE = { day: "mon", hour: 8 } as const;

function buildInsightsSteps(): StoredFlowStep[] {
  // IDs match the convention used by the builder UI's `validateStepValues`
  // (`${kind}:${index}`), so the row opens cleanly in the editor if the
  // user clicks through to it later.
  return [
    {
      id: "weekly_insights:0",
      type: "trigger",
      kind: "schedule",
      title: "Every Monday, 8am",
      detail: "Uses your workspace timezone",
      config: { schedule: { ...DEFAULT_INSIGHTS_SCHEDULE } },
    },
    {
      id: "weekly_insights:1",
      type: "action",
      kind: "send_insights_digest",
      title: "Send Insights digest",
      detail:
        "Emails workspace owners and admins. Skips when there's not enough data.",
      config: {},
    },
  ];
}

// Inserts the weekly Insights automation as `active` for a freshly-created
// workspace and schedules its first QStash tick. Failures are logged but
// not propagated — a missing default automation isn't worth blocking
// workspace creation over; the user can recreate it from the templates UI.
export async function bootstrapDefaultAutomations(args: {
  workspaceId: string;
  ownerUserId: string;
}): Promise<void> {
  try {
    const steps = buildInsightsSteps();
    const fireAt = nextWeeklyFire(DEFAULT_INSIGHTS_SCHEDULE);

    const [row] = await db
      .insert(automations)
      .values({
        createdByUserId: args.ownerUserId,
        workspaceId: args.workspaceId,
        kind: "weekly_insights",
        name: "Weekly Insights",
        status: "active",
        steps,
        nextFireAt: fireAt,
      })
      .returning({ id: automations.id });

    const messageId = await schedule({
      kind: "fire",
      id: row.id,
      at: fireAt,
    });
    if (messageId) {
      await db
        .update(automations)
        .set({ scheduledMessageId: messageId, updatedAt: new Date() })
        .where(eqAutomationId(row.id));
    }
    // If schedule() returned null, the hourly cron reconciler will pick
    // up the row on its next sweep — no need to retry inline.
  } catch (err) {
    await captureException(err, {
      tags: { source: "automations.bootstrap" },
      extra: { workspaceId: args.workspaceId },
    });
    console.error(
      `[bootstrap] failed to seed default automations for workspace ${args.workspaceId}:`,
      err,
    );
  }
}

// Tiny helper so the import surface stays clean; `eq` is in drizzle-orm
// but we already pull in `automations` directly.
import { eq } from "drizzle-orm";
function eqAutomationId(id: string) {
  return eq(automations.id, id);
}
