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
import { revalidateTag } from "next/cache";
import { db } from "@/db";
import { reachTag } from "@/lib/reach-cache";
import { requireActiveWorkspaceId } from "@/lib/workspaces/resolve";
import {
  accounts,
  aiJobs,
  blueskyCredentials,
  platformContentCache,
  platformInsights,
} from "@/db/schema";
import { getFreshToken } from "@/lib/publishers/tokens";
import type {
  ReadbackAdapter,
  ReadbackBatch,
  ReadbackContext,
} from "./types";
import { ReadbackGatedError } from "./types";
import { blueskyReadbackAdapter } from "./bluesky";
import { linkedinReadbackAdapter } from "./linkedin";
import { threadsReadbackAdapter } from "./threads";
import { xReadbackAdapter } from "./x";

const ADAPTERS: Record<string, ReadbackAdapter> = {
  twitter: xReadbackAdapter,
  linkedin: linkedinReadbackAdapter,
  bluesky: blueskyReadbackAdapter,
  threads: threadsReadbackAdapter,
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
    const ctx = await buildContext(userId, adapter);
    const batch = await adapter.fetch(ctx);
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
  const pairs: Array<{ userId: string; platform: string }> = [];

  // OAuth-source adapters: look up the OAuth provider (may differ from the
  // platform key — Threads reuses the Facebook account).
  const oauthRows = await db
    .select({ userId: accounts.userId, provider: accounts.provider })
    .from(accounts)
    .where(eq(accounts.reauthRequired, false));
  const oauthPairs = new Set(
    oauthRows.map((r) => `${r.userId}:${r.provider}`),
  );
  for (const adapter of Object.values(ADAPTERS)) {
    if (adapter.source.kind !== "oauth") continue;
    for (const row of oauthRows) {
      if (
        row.provider === adapter.source.oauthProvider &&
        oauthPairs.has(`${row.userId}:${row.provider}`)
      ) {
        pairs.push({ userId: row.userId, platform: adapter.platform });
      }
    }
  }

  // Credential-source adapters.
  for (const adapter of Object.values(ADAPTERS)) {
    if (adapter.source.kind !== "bluesky_creds") continue;
    const bsRows = await db
      .select({ userId: blueskyCredentials.userId })
      .from(blueskyCredentials);
    for (const row of bsRows) {
      pairs.push({ userId: row.userId, platform: adapter.platform });
    }
  }

  const outcomes: ReadbackOutcome[] = [];
  for (const pair of pairs) {
    outcomes.push(await runReadbackForAccount(pair.userId, pair.platform));
  }
  return outcomes;
}

async function buildContext(
  userId: string,
  adapter: ReadbackAdapter,
): Promise<ReadbackContext> {
  if (adapter.source.kind === "oauth") {
    const account = await getFreshToken(
      userId,
      adapter.source.oauthProvider as RefreshableProvider,
    );
    return { userId, account };
  }
  // bluesky_creds
  const [row] = await db
    .select({
      handle: blueskyCredentials.handle,
      appPassword: blueskyCredentials.appPassword,
      did: blueskyCredentials.did,
    })
    .from(blueskyCredentials)
    .where(eq(blueskyCredentials.userId, userId))
    .limit(1);
  if (!row) {
    throw new Error(`Bluesky credentials missing for user ${userId}`);
  }
  return {
    userId,
    blueskyCreds: {
      handle: row.handle,
      appPassword: row.appPassword,
      did: row.did,
    },
  };
}

async function upsertBatch(
  userId: string,
  platform: string,
  batch: ReadbackBatch,
): Promise<{ itemsCached: number; insightsUpserted: number }> {
  if (batch.items.length === 0) {
    return { itemsCached: 0, insightsUpserted: 0 };
  }

  const workspaceId = await requireActiveWorkspaceId(userId);
  const contentRows = batch.items.map((item) => ({
    userId,
    workspaceId,
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
      workspaceId,
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

  if (insightRows.length > 0) {
    // "max" → stale-while-revalidate; next dashboard visit refetches
    // without blocking on the cron job.
    revalidateTag(reachTag(userId), "max");
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
  const workspaceId = await requireActiveWorkspaceId(userId);
  const [row] = await db
    .insert(aiJobs)
    .values({
      userId,
      workspaceId,
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
