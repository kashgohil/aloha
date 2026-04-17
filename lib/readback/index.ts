// Dispatcher + upsert helpers for nightly platform read-back.
//
// Shape:
//   runReadbackForAccount(userId, platform) — one adapter call, upsert batch,
//       log to ai_jobs. Safe to call standalone (tests, manual refresh).
//   runReadbackAllAccounts() — iterate every connected (user × platform),
//       call the above. Per-account failures don't abort the batch.
//
// Rate-limit posture: nightly cadence is generous enough that we don't need
// jitter yet for a single user. Revisit when multi-user lands — stagger per
// account within the cron window and honor 429 Retry-After.

import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  accounts,
  aiJobs,
  platformContentCache,
  platformInsights,
} from "@/db/schema";
import { getFreshToken } from "@/lib/publishers/tokens";
import type { ReadbackAdapter, ReadbackBatch } from "./types";
import { ReadbackGatedError } from "./types";
import { xReadbackAdapter } from "./x";
import { linkedinReadbackAdapter } from "./linkedin";

const ADAPTERS: Record<string, ReadbackAdapter> = {
  twitter: xReadbackAdapter,
  linkedin: linkedinReadbackAdapter,
};

type RefreshableProvider = Parameters<typeof getFreshToken>[1];

export type ReadbackOutcome = {
  userId: string;
  platform: string;
  status: "ok" | "gated" | "failed";
  itemsCached: number;
  insightsUpserted: number;
  error?: string;
};

export async function runReadbackForAccount(
  userId: string,
  platform: string,
): Promise<ReadbackOutcome> {
  const adapter = ADAPTERS[platform];
  if (!adapter) {
    return {
      userId,
      platform,
      status: "failed",
      itemsCached: 0,
      insightsUpserted: 0,
      error: `No read-back adapter for platform "${platform}"`,
    };
  }

  const jobId = await startJob(userId, platform);

  try {
    const account = await getFreshToken(userId, platform as RefreshableProvider);
    const batch = await adapter.fetch({ userId, account });
    const { itemsCached, insightsUpserted } = await upsertBatch(
      userId,
      platform,
      batch,
    );
    await finishJob(jobId, "done", null);
    return {
      userId,
      platform,
      status: "ok",
      itemsCached,
      insightsUpserted,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (err instanceof ReadbackGatedError) {
      await finishJob(jobId, "done", `gated: ${message}`);
      return {
        userId,
        platform,
        status: "gated",
        itemsCached: 0,
        insightsUpserted: 0,
        error: message,
      };
    }
    await finishJob(jobId, "failed", message);
    return {
      userId,
      platform,
      status: "failed",
      itemsCached: 0,
      insightsUpserted: 0,
      error: message,
    };
  }
}

export async function runReadbackAllAccounts(): Promise<ReadbackOutcome[]> {
  const rows = await db
    .select({
      userId: accounts.userId,
      provider: accounts.provider,
    })
    .from(accounts)
    .where(eq(accounts.reauthRequired, false));

  const pairs = rows.filter((r) => r.provider in ADAPTERS);

  const outcomes: ReadbackOutcome[] = [];
  for (const pair of pairs) {
    outcomes.push(await runReadbackForAccount(pair.userId, pair.provider));
  }
  return outcomes;
}

async function upsertBatch(
  userId: string,
  platform: string,
  batch: ReadbackBatch,
): Promise<{ itemsCached: number; insightsUpserted: number }> {
  if (batch.items.length === 0) {
    return { itemsCached: 0, insightsUpserted: 0 };
  }

  const contentRows = batch.items.map((item) => ({
    userId,
    platform,
    remotePostId: item.remotePostId,
    content: item.content,
    media: item.media,
    platformData: item.platformData,
    platformPostedAt: item.platformPostedAt,
    fetchedAt: new Date(),
    updatedAt: new Date(),
  }));

  await db
    .insert(platformContentCache)
    .values(contentRows)
    .onConflictDoUpdate({
      target: [
        platformContentCache.userId,
        platformContentCache.platform,
        platformContentCache.remotePostId,
      ],
      set: {
        content: sqlExcluded("content"),
        media: sqlExcluded("media"),
        platformData: sqlExcluded("platformData"),
        platformPostedAt: sqlExcluded("platformPostedAt"),
        fetchedAt: sqlExcluded("fetchedAt"),
        updatedAt: sqlExcluded("updatedAt"),
      },
    });

  const insightRows = batch.items
    .filter((item) => item.metrics !== null)
    .map((item) => ({
      userId,
      platform,
      remotePostId: item.remotePostId,
      metrics: item.metrics!,
      platformPostedAt: item.platformPostedAt,
      fetchedAt: new Date(),
      updatedAt: new Date(),
    }));

  if (insightRows.length > 0) {
    await db
      .insert(platformInsights)
      .values(insightRows)
      .onConflictDoUpdate({
        target: [
          platformInsights.userId,
          platformInsights.platform,
          platformInsights.remotePostId,
        ],
        set: {
          metrics: sqlExcluded("metrics"),
          platformPostedAt: sqlExcluded("platformPostedAt"),
          fetchedAt: sqlExcluded("fetchedAt"),
          updatedAt: sqlExcluded("updatedAt"),
        },
      });
  }

  return {
    itemsCached: contentRows.length,
    insightsUpserted: insightRows.length,
  };
}

// `excluded.<col>` is Postgres's reference to the row that would have been
// inserted if the conflict hadn't fired — the idiom for ON CONFLICT ... SET
// col = EXCLUDED.col. Identifier is quoted because the schema uses camelCase.
function sqlExcluded(col: string) {
  return sql.raw(`excluded."${col}"`);
}

async function startJob(userId: string, platform: string): Promise<string> {
  const [row] = await db
    .insert(aiJobs)
    .values({
      userId,
      kind: "readback",
      payload: { platform },
      status: "running",
      startedAt: new Date(),
    })
    .returning({ id: aiJobs.id });
  return row.id;
}

async function finishJob(
  id: string,
  status: "done" | "failed",
  lastError: string | null,
) {
  await db
    .update(aiJobs)
    .set({
      status,
      completedAt: new Date(),
      lastError,
      updatedAt: new Date(),
    })
    .where(eq(aiJobs.id, id));
}

export function isReadbackPlatform(p: string): boolean {
  return p in ADAPTERS;
}

// Re-exported for tests / admin tooling.
export { ADAPTERS as readbackAdapters };
