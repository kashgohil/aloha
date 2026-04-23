import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { subscribers } from "@/db/schema";
import { registerAction, type ActionContext, type ActionResult } from "../registry";

// Real `add_tag` handler. Resolves the target subscriber from the trigger
// payload (`subscriberId` or falling back to `email`) and appends the
// configured tag to the existing array without duplicates.
//
// Pattern to follow for the other stubbed handlers:
//   1. Write `lib/automations/handlers/{kind}.ts` calling `registerAction`
//   2. Remove the stub entry in `handlers/stubs.ts` — duplicate registration
//      will throw at module load otherwise.
//   3. Import the new file somewhere that's eagerly loaded by the executor
//      (see the `import "./handlers/stubs"` at the top of `executor.ts`).

registerAction(
  "add_tag",
  async ({ step, trigger, userId }: ActionContext): Promise<ActionResult> => {
    const tag = typeof step.config?.tag === "string" ? step.config.tag.trim() : "";
    if (!tag) {
      return { output: { skipped: true, reason: "Tag config was empty" } };
    }

    const subscriberId =
      typeof trigger.subscriberId === "string" ? trigger.subscriberId : null;
    const email = typeof trigger.email === "string" ? trigger.email : null;
    if (!subscriberId && !email) {
      return {
        output: { skipped: true, reason: "No subscriberId or email on trigger" },
      };
    }

    const whereClause = subscriberId
      ? and(eq(subscribers.id, subscriberId), eq(subscribers.createdByUserId, userId))
      : and(eq(subscribers.email, email!), eq(subscribers.createdByUserId, userId));

    // `array_append` is a no-op if the array already contains the value when
    // combined with the `NOT (tag = ANY(tags))` guard — keeps the column
    // free of duplicates without a read-modify-write round trip.
    const result = await db
      .update(subscribers)
      .set({
        tags: sql`CASE WHEN ${tag} = ANY(${subscribers.tags}) THEN ${subscribers.tags} ELSE array_append(coalesce(${subscribers.tags}, ARRAY[]::text[]), ${tag}) END`,
        updatedAt: new Date(),
      })
      .where(whereClause)
      .returning({ id: subscribers.id });

    return {
      output: {
        tag,
        subscriberId: result[0]?.id ?? subscriberId ?? null,
        matched: result.length > 0,
      },
    };
  },
);
