// Notion workspace integration. Two things live here:
//   1. The OAuth token exchange (Notion's endpoint wants JSON + Basic auth,
//      which doesn't match NextAuth's default OAuth flow — so we handle it
//      standalone the same way Bluesky/Mastodon do).
//   2. A thin content API: search pages the bot can see and fetch each
//      page's plaintext by concatenating its block tree.
//
// Notion tokens don't expire, so we don't wire refresh. If revoked from the
// Notion UI, subsequent calls 401 — caller should flag the user to reconnect.

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notionCredentials, workspaces } from "@/db/schema";
import { env } from "@/lib/env";
import { requireActiveWorkspaceId } from "@/lib/workspaces/resolve";

const NOTION_VERSION = "2022-06-28";
const API_BASE = "https://api.notion.com/v1";

export type NotionTokenExchange = {
  access_token: string;
  bot_id: string;
  workspace_id: string;
  workspace_name: string | null;
  workspace_icon: string | null;
};

export function notionAuthorizeUrl(state: string, redirectUri: string): string {
  if (!env.NOTION_OAUTH_CLIENT_ID) {
    throw new Error("NOTION_OAUTH_CLIENT_ID not configured");
  }
  const params = new URLSearchParams({
    client_id: env.NOTION_OAUTH_CLIENT_ID,
    response_type: "code",
    owner: "user",
    redirect_uri: redirectUri,
    state,
  });
  return `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;
}

export async function exchangeNotionCode(
  code: string,
  redirectUri: string,
): Promise<NotionTokenExchange> {
  if (!env.NOTION_OAUTH_CLIENT_ID || !env.NOTION_OAUTH_CLIENT_SECRET) {
    throw new Error("Notion OAuth credentials not configured");
  }
  const basic = Buffer.from(
    `${env.NOTION_OAUTH_CLIENT_ID}:${env.NOTION_OAUTH_CLIENT_SECRET}`,
  ).toString("base64");
  const res = await fetch(`${API_BASE}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${basic}`,
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Notion OAuth exchange failed (${res.status}): ${body.slice(0, 400)}`);
  }
  return (await res.json()) as NotionTokenExchange;
}

export async function saveNotionConnection(
  userId: string,
  token: NotionTokenExchange,
): Promise<void> {
  const workspaceId = await requireActiveWorkspaceId(userId);
  await db
    .insert(notionCredentials)
    .values({
      workspaceId,
      accessToken: token.access_token,
      notionWorkspaceId: token.workspace_id,
      notionWorkspaceName: token.workspace_name,
      notionWorkspaceIcon: token.workspace_icon,
      botId: token.bot_id,
    })
    .onConflictDoUpdate({
      target: notionCredentials.workspaceId,
      set: {
        accessToken: token.access_token,
        notionWorkspaceId: token.workspace_id,
        notionWorkspaceName: token.workspace_name,
        notionWorkspaceIcon: token.workspace_icon,
        botId: token.bot_id,
        updatedAt: new Date(),
      },
    });
}

export async function getNotionConnection(userId: string) {
  const workspaceId = await requireActiveWorkspaceId(userId);
  const [row] = await db
    .select()
    .from(notionCredentials)
    .where(eq(notionCredentials.workspaceId, workspaceId))
    .limit(1);
  return row ?? null;
}

export async function disconnectNotion(userId: string): Promise<void> {
  const workspaceId = await requireActiveWorkspaceId(userId);
  await db
    .delete(notionCredentials)
    .where(eq(notionCredentials.workspaceId, workspaceId));
}

// --- Content API -----------------------------------------------------------

export type NotionPageSummary = {
  id: string;
  title: string;
  url: string;
  lastEdited: string | null;
};

export class NotionAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotionAuthError";
  }
}

async function notionFetch<T>(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (res.status === 401) {
    throw new NotionAuthError(
      "Notion access revoked — user must reconnect the integration.",
    );
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Notion API ${path} failed (${res.status}): ${body.slice(0, 400)}`);
  }
  return (await res.json()) as T;
}

// Lists pages accessible to the integration. Notion's `search` returns both
// pages and databases — we filter to pages. User must share pages with the
// integration inside Notion for them to appear.
export async function listAccessiblePages(
  token: string,
  limit = 50,
): Promise<NotionPageSummary[]> {
  type SearchResponse = {
    results: Array<{
      id: string;
      object: "page" | "database";
      url?: string;
      last_edited_time?: string;
      properties?: Record<string, unknown>;
      parent?: Record<string, unknown>;
    }>;
    has_more?: boolean;
    next_cursor?: string | null;
  };

  const pages: NotionPageSummary[] = [];
  let cursor: string | null = null;
  let fetched = 0;

  while (fetched < limit) {
    const body: Record<string, unknown> = {
      filter: { property: "object", value: "page" },
      sort: { direction: "descending", timestamp: "last_edited_time" },
      page_size: Math.min(50, limit - fetched),
    };
    if (cursor) body.start_cursor = cursor;

    const res: SearchResponse = await notionFetch(token, "/search", {
      method: "POST",
      body: JSON.stringify(body),
    });

    for (const r of res.results) {
      if (r.object !== "page") continue;
      pages.push({
        id: r.id,
        title: extractPageTitle(r.properties),
        url: r.url ?? "",
        lastEdited: r.last_edited_time ?? null,
      });
      fetched += 1;
      if (fetched >= limit) break;
    }
    if (!res.has_more || !res.next_cursor) break;
    cursor = res.next_cursor;
  }

  return pages;
}

function extractPageTitle(properties: Record<string, unknown> | undefined): string {
  if (!properties) return "Untitled";
  for (const v of Object.values(properties)) {
    if (
      v &&
      typeof v === "object" &&
      "type" in v &&
      (v as { type: string }).type === "title"
    ) {
      const titleArr = (v as { title?: Array<{ plain_text?: string }> }).title ?? [];
      const text = titleArr.map((t) => t.plain_text ?? "").join("").trim();
      return text || "Untitled";
    }
  }
  return "Untitled";
}

// Fetches all children blocks of a page (recursively flattened) and returns
// plaintext. Nested blocks are appended inline — good enough for voice
// training where structure matters less than tone.
export async function fetchPageText(token: string, pageId: string): Promise<string> {
  const chunks: string[] = [];
  await walkBlocks(token, pageId, chunks, 0);
  return chunks.join("\n").trim();
}

async function walkBlocks(
  token: string,
  blockId: string,
  out: string[],
  depth: number,
): Promise<void> {
  if (depth > 4) return; // guard against pathological nesting

  type BlockListResponse = {
    results: Array<{
      id: string;
      type: string;
      has_children?: boolean;
      [k: string]: unknown;
    }>;
    has_more?: boolean;
    next_cursor?: string | null;
  };

  let cursor: string | null = null;
  while (true) {
    const qs = cursor ? `?start_cursor=${cursor}&page_size=100` : "?page_size=100";
    const res: BlockListResponse = await notionFetch(
      token,
      `/blocks/${blockId}/children${qs}`,
    );
    for (const block of res.results) {
      const text = blockPlainText(block);
      if (text) out.push(text);
      if (block.has_children) {
        await walkBlocks(token, block.id, out, depth + 1);
      }
    }
    if (!res.has_more || !res.next_cursor) break;
    cursor = res.next_cursor;
  }
}

function blockPlainText(block: Record<string, unknown>): string {
  const type = block.type as string;
  const body = (block[type] ?? {}) as {
    rich_text?: Array<{ plain_text?: string }>;
  };
  const rich = body.rich_text;
  if (!rich || rich.length === 0) return "";
  return rich.map((r) => r.plain_text ?? "").join("").trim();
}

// Convenience: require a connection, 401s surface as "reconnect Notion".
export async function requireNotionToken(userId: string): Promise<string> {
  const conn = await getNotionConnection(userId);
  if (!conn) {
    throw new Error("Notion not connected");
  }
  return conn.accessToken;
}

// --- Sync -----------------------------------------------------------------

import { brandCorpus } from "@/db/schema";

export type NotionSyncResult = {
  synced: number;
  failed: number;
  totalChars: number;
};

// Pulls the latest pages accessible to the integration (up to `limit`) and
// upserts them into `brand_corpus`. Pages the user doesn't share no longer
// show up and are left untouched — we don't delete stale rows here since a
// user might have shared-and-unshared a doc they still want trained on.
export async function syncNotionCorpus(
  userId: string,
  limit = 25,
): Promise<NotionSyncResult> {
  const token = await requireNotionToken(userId);
  const workspaceId = await requireActiveWorkspaceId(userId);

  let pages: NotionPageSummary[];
  try {
    pages = await listAccessiblePages(token, limit);
  } catch (err) {
    if (err instanceof NotionAuthError) {
      await flagNotionReauth(userId);
    }
    throw err;
  }

  let synced = 0;
  let failed = 0;
  let totalChars = 0;

  for (const page of pages) {
    try {
      const text = await fetchPageText(token, page.id);
      if (!text) continue;

      await db
        .insert(brandCorpus)
        .values({
          createdByUserId: userId,
          workspaceId,
          source: "notion",
          sourceId: page.id,
          title: page.title,
          content: text,
          url: page.url || null,
          fetchedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [brandCorpus.workspaceId, brandCorpus.source, brandCorpus.sourceId],
          set: {
            title: page.title,
            content: text,
            url: page.url || null,
            fetchedAt: new Date(),
            updatedAt: new Date(),
          },
        });
      synced += 1;
      totalChars += text.length;
    } catch (err) {
      if (err instanceof NotionAuthError) {
        await flagNotionReauth(userId);
        throw err;
      }
      console.error(`[notion] sync failed for page ${page.id}`, err);
      failed += 1;
    }
  }

  await db
    .update(notionCredentials)
    .set({
      lastSyncedAt: new Date(),
      reauthRequired: false,
      updatedAt: new Date(),
    })
    .where(eq(notionCredentials.workspaceId, workspaceId));

  return { synced, failed, totalChars };
}

async function flagNotionReauth(userId: string): Promise<void> {
  const workspaceId = await requireActiveWorkspaceId(userId);
  await db
    .update(notionCredentials)
    .set({ reauthRequired: true, updatedAt: new Date() })
    .where(eq(notionCredentials.workspaceId, workspaceId));
}

// Iterates every connected Notion account (skipping those flagged for
// reauth) and runs `syncNotionCorpus`. Per-account failures are caught so
// one bad token doesn't abort the batch. Returns a summary the cron
// endpoint can log.
export type AllSyncOutcome = {
  userId: string;
  status: "ok" | "failed" | "reauth";
  synced: number;
  totalChars: number;
  error?: string;
};

export async function syncAllNotionAccounts(): Promise<AllSyncOutcome[]> {
  // Iterate by workspace. The owner is attributed as `createdByUserId` on
  // brand_corpus rows so existing audit fields stay meaningful.
  const rows = await db
    .select({
      workspaceId: notionCredentials.workspaceId,
      reauthRequired: notionCredentials.reauthRequired,
      ownerUserId: workspaces.ownerUserId,
    })
    .from(notionCredentials)
    .innerJoin(workspaces, eq(workspaces.id, notionCredentials.workspaceId));

  const outcomes: AllSyncOutcome[] = [];
  for (const row of rows) {
    if (row.reauthRequired) {
      outcomes.push({
        userId: row.ownerUserId,
        status: "reauth",
        synced: 0,
        totalChars: 0,
      });
      continue;
    }
    try {
      const res = await syncNotionCorpus(row.ownerUserId);
      outcomes.push({
        userId: row.ownerUserId,
        status: "ok",
        synced: res.synced,
        totalChars: res.totalChars,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      outcomes.push({
        userId: row.ownerUserId,
        status: err instanceof NotionAuthError ? "reauth" : "failed",
        synced: 0,
        totalChars: 0,
        error: message,
      });
    }
  }
  return outcomes;
}

export async function loadBrandCorpus(userId: string) {
  const workspaceId = await requireActiveWorkspaceId(userId);
  return db
    .select({
      id: brandCorpus.id,
      source: brandCorpus.source,
      title: brandCorpus.title,
      content: brandCorpus.content,
      url: brandCorpus.url,
      fetchedAt: brandCorpus.fetchedAt,
    })
    .from(brandCorpus)
    .where(eq(brandCorpus.workspaceId, workspaceId))
    .orderBy(brandCorpus.fetchedAt);
}
