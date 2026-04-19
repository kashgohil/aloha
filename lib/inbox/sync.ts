import { db } from "@/db";
import { inboxMessages, inboxSyncCursors } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { fetchBlueskyNotifications } from "./bluesky";
import { fetchXMentions } from "./x";
import { fetchFacebookInbox } from "./facebook";
import { fetchInstagramInbox } from "./instagram";
import { fetchThreadsInbox } from "./threads";
import { fetchMastodonNotifications } from "./mastodon";
import { fetchPinterestInbox } from "./pinterest";
import type { NormalizedMessage } from "./types";
import { createNotification } from "@/lib/notifications";

type Platform = "bluesky" | "twitter" | "facebook" | "instagram" | "threads" | "mastodon" | "pinterest";

const FETCHERS: Partial<
  Record<
    Platform,
    (userId: string, cursor: string | null) => Promise<{ messages: NormalizedMessage[]; newCursor: string | null }>
  >
> = {
  bluesky: fetchBlueskyNotifications,
  twitter: fetchXMentions,
  facebook: fetchFacebookInbox,
  instagram: fetchInstagramInbox,
  threads: fetchThreadsInbox,
  mastodon: fetchMastodonNotifications,
  pinterest: fetchPinterestInbox,
};

export async function syncInbox(
  userId: string,
  platform: Platform,
): Promise<{ synced: number }> {
  const fetcher = FETCHERS[platform];
  if (!fetcher) return { synced: 0 };

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

  let messages: NormalizedMessage[];
  let newCursor: string | null;
  try {
    const result = await fetcher(userId, cursorRow?.cursor ?? null);
    messages = result.messages;
    newCursor = result.newCursor;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await createNotification({
      userId,
      kind: "inbox_sync_failed",
      title: `Couldn't sync ${platform}`,
      body: message.slice(0, 200),
      url: `/app/inbox`,
      metadata: { platform, error: message.slice(0, 500) },
    });
    throw err;
  }

  if (messages.length === 0) return { synced: 0 };

  const rows = messages.map((m) => ({
    userId,
    platform,
    remoteId: m.remoteId,
    threadId: m.threadId,
    parentId: m.parentId,
    reason: m.reason as "mention" | "reply",
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
    .returning({ id: inboxMessages.id });

  await db
    .insert(inboxSyncCursors)
    .values({
      userId,
      platform,
      cursor: newCursor,
      lastSyncedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [inboxSyncCursors.userId, inboxSyncCursors.platform],
      set: {
        cursor: newCursor,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      },
    });

  return { synced: inserted.length };
}
