import { db } from "@/db";
import { inboxMessages, inboxSyncCursors } from "@/db/schema";
import { Logger, captureException } from "@/lib/logger";
import { createNotification } from "@/lib/notifications";
import { requireActiveWorkspaceId } from "@/lib/workspaces/resolve";
import { and, eq } from "drizzle-orm";
import { fetchBlueskyNotifications } from "./bluesky";
import { fetchBlueskyDms } from "./dms/bluesky";
import { fetchInstagramDms } from "./dms/instagram";
import { fetchXDms } from "./dms/x";
import { fetchFacebookInbox } from "./facebook";
import { fetchMastodonNotifications } from "./mastodon";
import { fetchTelegramMessages } from "./telegram";
import { fetchThreadsInbox } from "./threads";
import type { NormalizedMessage, SyncResult } from "./types";
import { fetchXMentions } from "./x";

const log = new Logger({ source: "inbox.sync" });

// Pinterest is omitted — its API only exposes comments on the user's own
// media, which flow through the per-post sync. Instagram stays here
// exclusively for DMs (no mentions endpoint available).
type Platform =
  | "bluesky"
  | "twitter"
  | "facebook"
  | "instagram"
  | "threads"
  | "mastodon"
  | "telegram";

type Fetcher = (
  userId: string,
  cursor: string | null,
) => Promise<SyncResult>;

// Per-platform fetch list. Each platform has one mention fetcher (or null
// when it doesn't expose mentions — e.g. Instagram) and an optional DM
// fetcher. Multiple fetchers run sequentially; the mentions stream owns
// the cursor since it's the expensive-to-re-fetch one. DMs ignore cursor
// and re-pull the latest window each sync — the unique index on
// inbox_messages dedupes overlap for free.
const FETCHERS: Record<
  Platform,
  { mentions: Fetcher | null; dms: Fetcher | null }
> = {
  bluesky: { mentions: fetchBlueskyNotifications, dms: fetchBlueskyDms },
  twitter: { mentions: fetchXMentions, dms: fetchXDms },
  facebook: { mentions: null, dms: fetchFacebookInbox },
  instagram: { mentions: null, dms: fetchInstagramDms },
  threads: { mentions: fetchThreadsInbox, dms: null },
  mastodon: { mentions: fetchMastodonNotifications, dms: null },
  telegram: { mentions: null, dms: fetchTelegramMessages },
};

async function runFetcher(
  userId: string,
  platform: Platform,
  kind: "mentions" | "dms",
  fetcher: Fetcher,
  cursor: string | null,
): Promise<{ messages: NormalizedMessage[]; newCursor: string | null }> {
  try {
    const res = await fetcher(userId, cursor);
    return { messages: res.messages, newCursor: res.newCursor };
  } catch (err) {
    await captureException(err, {
      tags: { source: "inbox.sync", platform, kind },
      extra: { userId },
    });
    const message = err instanceof Error ? err.message : String(err);
    await createNotification({
      userId,
      kind: "inbox_sync_failed",
      title: `Couldn't sync ${platform} ${kind}`,
      body: message.slice(0, 200),
      url: `/app/inbox`,
      metadata: { platform, kind, error: message.slice(0, 500) },
    });
    log.warn(`fetcher failed`, {
      platform,
      kind,
      userId,
      error: message.slice(0, 200),
    });
    // A DM failure shouldn't take down mentions (or vice versa). Swallow
    // and return empty so the other stream can still land its rows.
    return { messages: [], newCursor: cursor };
  }
}

export async function syncInbox(
  userId: string,
  platform: Platform,
): Promise<{ mentionsSynced: number; dmsSynced: number }> {
  const routes = FETCHERS[platform];
  const workspaceId = await requireActiveWorkspaceId(userId);

  const [cursorRow] = await db
    .select({ cursor: inboxSyncCursors.cursor })
    .from(inboxSyncCursors)
    .where(
      and(
        eq(inboxSyncCursors.userId, userId),
        eq(inboxSyncCursors.platform, platform),
      ),
    )
    .limit(1);

  let mentionResult: { messages: NormalizedMessage[]; newCursor: string | null } =
    { messages: [], newCursor: cursorRow?.cursor ?? null };
  let dmResult: { messages: NormalizedMessage[]; newCursor: string | null } =
    { messages: [], newCursor: null };

  if (routes.mentions) {
    mentionResult = await runFetcher(
      userId,
      platform,
      "mentions",
      routes.mentions,
      cursorRow?.cursor ?? null,
    );
  }
  if (routes.dms) {
    // DMs re-pull latest each sync (see note on FETCHERS above).
    dmResult = await runFetcher(userId, platform, "dms", routes.dms, null);
  }

  const allMessages = [...mentionResult.messages, ...dmResult.messages];
  let mentionsSynced = 0;
  let dmsSynced = 0;

  if (allMessages.length > 0) {
    const rows = allMessages.map((m) => ({
      userId,
      workspaceId,
      platform,
      remoteId: m.remoteId,
      threadId: m.threadId,
      parentId: m.parentId,
      reason: m.reason,
      direction: m.direction,
      authorDid: m.authorDid,
      authorHandle: m.authorHandle,
      authorDisplayName: m.authorDisplayName,
      authorAvatarUrl: m.authorAvatarUrl,
      content: m.content,
      platformData: m.platformData,
      platformCreatedAt: m.platformCreatedAt,
    }));

    const inserted = await db
      .insert(inboxMessages)
      .values(rows)
      .onConflictDoNothing()
      .returning({ id: inboxMessages.id, reason: inboxMessages.reason });

    for (const r of inserted) {
      if (r.reason === "mention") mentionsSynced += 1;
      else if (r.reason === "dm") dmsSynced += 1;
    }
  }

  // Persist the mentions cursor — it's the one that needs to advance.
  await db
    .insert(inboxSyncCursors)
    .values({
      userId,
      workspaceId,
      platform,
      cursor: mentionResult.newCursor,
      lastSyncedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [inboxSyncCursors.userId, inboxSyncCursors.platform],
      set: {
        cursor: mentionResult.newCursor,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      },
    });

  return { mentionsSynced, dmsSynced };
}
