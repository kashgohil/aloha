// One-shot fix for campaigns incorrectly marked as `running` by the old
// `markBeatAccepted` behavior, which flipped `ready -> running` on the
// first beat accept — before the user clicked Launch and before any post
// was actually scheduled.
//
// A campaign in `running` is treated as actively publishing, but if no
// post under it ever reached `scheduled` / `published` / `failed`, it was
// never launched. Those campaigns are reverted to `ready`.
//
// Properly-launched campaigns (any post in scheduled/published/failed)
// are left alone — `computeLifecycleStatus` handled them correctly at
// launch and the hourly rollover keeps them honest.
//
// Idempotent: safe to re-run.
//
// Usage:
//   bun run scripts/fix-campaign-running-status.ts
//   bun run scripts/fix-campaign-running-status.ts --dry-run

import "dotenv/config";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, posts } from "@/db/schema";

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  const running = await db
    .select({ id: campaigns.id, name: campaigns.name })
    .from(campaigns)
    .where(eq(campaigns.status, "running"));

  if (running.length === 0) {
    console.log("No campaigns in `running` status. Nothing to do.");
    return;
  }

  console.log(`Found ${running.length} campaign(s) in \`running\`.`);

  let reverted = 0;
  let kept = 0;
  for (const c of running) {
    const launched = await db
      .select({ id: posts.id })
      .from(posts)
      .where(
        and(
          eq(posts.campaignId, c.id),
          inArray(posts.status, ["scheduled", "published", "failed"]),
        ),
      )
      .limit(1);

    if (launched.length > 0) {
      kept++;
      console.log(`  keep   ${c.id}  ${c.name} (has launched posts)`);
      continue;
    }

    reverted++;
    console.log(`  revert ${c.id}  ${c.name} -> ready`);
    if (!dryRun) {
      await db
        .update(campaigns)
        .set({ status: "ready", updatedAt: new Date() })
        .where(eq(campaigns.id, c.id));
    }
  }

  console.log(
    `\nDone. ${reverted} reverted to \`ready\`, ${kept} left as \`running\`.${
      dryRun ? " (dry run — no writes)" : ""
    }`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
