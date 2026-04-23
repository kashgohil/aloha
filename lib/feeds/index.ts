// Feed subscribe / fetch / sync service. Handles the full lifecycle:
//   - subscribe(): fetch + validate a URL, create the `feeds` row, pull
//     the first page of items in the same request so the UI shows a
//     populated reader immediately.
//   - syncFeed(): daily refresh for a single feed; conditional GET via
//     If-None-Match / If-Modified-Since to keep bandwidth honest.
//   - syncAllFeeds(): iterate every user's feeds.
//
// Parser issues (malformed XML, etc.) are captured in `feeds.lastError`
// and increment `errorCount`; they never block other feeds in the batch.

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { feedItems, feeds } from "@/db/schema";
import { parseFeed, FeedParseError, type ParsedItem } from "./parser";
import { requireActiveWorkspaceId } from "@/lib/workspaces/resolve";

const USER_AGENT = "AlohaBot/1.0 (+https://usealoha.app) feed-reader";
const FETCH_TIMEOUT_MS = 15_000;
const MAX_ITEMS_PER_SYNC = 50;

export class FeedFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FeedFetchError";
  }
}

export type SubscribeResult = {
  feedId: string;
  title: string;
  itemsAdded: number;
};

export async function subscribe(
  userId: string,
  rawUrl: string,
  category: string | null = null,
): Promise<SubscribeResult> {
  const url = normalizeUrl(rawUrl);
  const workspaceId = await requireActiveWorkspaceId(userId);

  // Dedup against existing subscription.
  const [existing] = await db
    .select({ id: feeds.id, title: feeds.title })
    .from(feeds)
    .where(and(eq(feeds.workspaceId, workspaceId), eq(feeds.url, url)))
    .limit(1);
  if (existing) {
    return { feedId: existing.id, title: existing.title, itemsAdded: 0 };
  }

  const fetched = await fetchFeed(url);
  const parsed = parseFeed(fetched.body);

  const [row] = await db
    .insert(feeds)
    .values({
      workspaceId,
      url,
      siteUrl: parsed.siteUrl,
      title: parsed.title,
      description: parsed.description,
      iconUrl: parsed.iconUrl,
      category,
      lastFetchedAt: new Date(),
      etag: fetched.etag,
      lastModified: fetched.lastModified,
    })
    .returning({ id: feeds.id });

  const itemsAdded = await upsertItems(row.id, parsed.items);

  return { feedId: row.id, title: parsed.title, itemsAdded };
}

export async function unsubscribe(userId: string, feedId: string): Promise<void> {
  const workspaceId = await requireActiveWorkspaceId(userId);
  await db
    .delete(feeds)
    .where(and(eq(feeds.workspaceId, workspaceId), eq(feeds.id, feedId)));
}

export type SyncOutcome = {
  feedId: string;
  status: "ok" | "unchanged" | "failed";
  itemsAdded?: number;
  error?: string;
};

export async function syncFeed(feedId: string): Promise<SyncOutcome> {
  const [row] = await db
    .select({
      id: feeds.id,
      url: feeds.url,
      etag: feeds.etag,
      lastModified: feeds.lastModified,
      errorCount: feeds.errorCount,
    })
    .from(feeds)
    .where(eq(feeds.id, feedId))
    .limit(1);
  if (!row) return { feedId, status: "failed", error: "Feed not found." };

  try {
    const fetched = await fetchFeed(row.url, {
      ifNoneMatch: row.etag,
      ifModifiedSince: row.lastModified,
    });
    if (fetched.notModified) {
      await db
        .update(feeds)
        .set({ lastFetchedAt: new Date(), updatedAt: new Date() })
        .where(eq(feeds.id, feedId));
      return { feedId, status: "unchanged" };
    }

    const parsed = parseFeed(fetched.body);
    const itemsAdded = await upsertItems(feedId, parsed.items);

    await db
      .update(feeds)
      .set({
        title: parsed.title,
        description: parsed.description,
        siteUrl: parsed.siteUrl,
        iconUrl: parsed.iconUrl,
        etag: fetched.etag,
        lastModified: fetched.lastModified,
        lastFetchedAt: new Date(),
        errorCount: 0,
        lastError: null,
        updatedAt: new Date(),
      })
      .where(eq(feeds.id, feedId));

    return { feedId, status: "ok", itemsAdded };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(feeds)
      .set({
        errorCount: sql`${feeds.errorCount} + 1`,
        lastError: message.slice(0, 500),
        lastFetchedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(feeds.id, feedId));
    return { feedId, status: "failed", error: message };
  }
}

export async function syncAllFeeds(): Promise<SyncOutcome[]> {
  const rows = await db.select({ id: feeds.id }).from(feeds);
  const outcomes: SyncOutcome[] = [];
  for (const r of rows) {
    outcomes.push(await syncFeed(r.id));
  }
  return outcomes;
}

// ---- internals ------------------------------------------------------------

async function upsertItems(
  feedId: string,
  parsedItems: ParsedItem[],
): Promise<number> {
  const items = parsedItems.slice(0, MAX_ITEMS_PER_SYNC);
  if (items.length === 0) return 0;

  const rows = items.map((it) => ({
    feedId,
    guid: it.guid || it.url || it.title, // last-resort dedup key
    title: it.title,
    summary: it.summary,
    url: it.url,
    author: it.author,
    imageUrl: it.imageUrl,
    publishedAt: it.publishedAt,
  }));

  // `returning` gives us the id set of rows actually inserted (conflicts
  // are no-op'd). The length of that array = newly-added item count.
  const inserted = await db
    .insert(feedItems)
    .values(rows)
    .onConflictDoNothing({
      target: [feedItems.feedId, feedItems.guid],
    })
    .returning({ id: feedItems.id });
  return inserted.length;
}

type FetchResult = {
  body: string;
  etag: string | null;
  lastModified: string | null;
  notModified?: boolean;
};

async function fetchFeed(
  url: string,
  opts: {
    ifNoneMatch?: string | null;
    ifModifiedSince?: string | null;
  } = {},
): Promise<FetchResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const headers: Record<string, string> = {
      "User-Agent": USER_AGENT,
      Accept: "application/atom+xml, application/rss+xml, application/xml;q=0.9, */*;q=0.5",
    };
    if (opts.ifNoneMatch) headers["If-None-Match"] = opts.ifNoneMatch;
    if (opts.ifModifiedSince) headers["If-Modified-Since"] = opts.ifModifiedSince;

    const res = await fetch(url, {
      headers,
      redirect: "follow",
      signal: controller.signal,
    });
    if (res.status === 304) {
      return {
        body: "",
        etag: opts.ifNoneMatch ?? null,
        lastModified: opts.ifModifiedSince ?? null,
        notModified: true,
      };
    }
    if (!res.ok) {
      throw new FeedFetchError(`Feed returned ${res.status}.`);
    }
    const body = await res.text();
    return {
      body,
      etag: res.headers.get("etag"),
      lastModified: res.headers.get("last-modified"),
    };
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new FeedFetchError("Feed took too long to respond.");
    }
    if (err instanceof FeedFetchError) throw err;
    throw new FeedFetchError(
      `Couldn't fetch feed: ${(err as Error).message ?? "unknown error"}.`,
    );
  } finally {
    clearTimeout(timer);
  }
}

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  try {
    const u = new URL(trimmed);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      throw new Error("unsupported protocol");
    }
    return u.toString();
  } catch {
    throw new FeedFetchError("That doesn't look like a valid feed URL.");
  }
}

// Re-exported for tests / admin tooling.
export { FeedParseError };
