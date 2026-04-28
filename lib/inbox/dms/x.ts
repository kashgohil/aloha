import { getFreshToken, forceRefresh } from "@/lib/publishers/tokens";
import type { NormalizedMessage, SyncResult } from "../types";
import { upsertThreadProfiles, type ThreadProfile } from "./_thread-profiles";

const PAGE_SIZE = 100;
const MAX_PAGES = 2;

type DmUser = {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
};

type DmEvent = {
  id: string;
  event_type: string;
  text?: string;
  created_at?: string;
  dm_conversation_id?: string;
  sender_id?: string;
};

type DmEventsResponse = {
  data?: DmEvent[];
  includes?: { users?: DmUser[] };
  meta?: { next_token?: string; result_count?: number };
};

async function fetchPage(
  accessToken: string,
  paginationToken?: string,
): Promise<DmEventsResponse> {
  const params = new URLSearchParams({
    max_results: String(PAGE_SIZE),
    event_types: "MessageCreate",
    "dm_event.fields": "id,event_type,text,created_at,dm_conversation_id,sender_id",
    expansions: "sender_id",
    "user.fields": "name,username,profile_image_url",
  });
  if (paginationToken) params.set("pagination_token", paginationToken);

  const res = await fetch(
    `https://api.x.com/2/dm_events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`X dm_events ${res.status}: ${detail.slice(0, 300)}`);
  }

  return res.json() as Promise<DmEventsResponse>;
}

export async function fetchXDms(
  workspaceId: string,
  cursor: string | null,
): Promise<SyncResult> {
  let account = await getFreshToken(workspaceId, "twitter");

  const messages: NormalizedMessage[] = [];
  let token = cursor ?? undefined;
  let pagesRead = 0;

  while (pagesRead < MAX_PAGES) {
    let res: DmEventsResponse;
    try {
      res = await fetchPage(account.accessToken, token);
    } catch (err) {
      if (pagesRead === 0 && String(err).includes("401")) {
        account = await forceRefresh(workspaceId, "twitter");
        res = await fetchPage(account.accessToken, token);
      } else {
        throw err;
      }
    }

    if (!res.data || res.data.length === 0) break;

    const usersById = new Map<string, DmUser>();
    for (const u of res.includes?.users ?? []) usersById.set(u.id, u);

    for (const ev of res.data) {
      if (ev.event_type !== "MessageCreate") continue;
      if (!ev.sender_id || !ev.dm_conversation_id) continue;

      const outbound = ev.sender_id === account.providerAccountId;
      const user = usersById.get(ev.sender_id);

      messages.push({
        remoteId: ev.id,
        threadId: ev.dm_conversation_id,
        parentId: null,
        reason: "dm",
        direction: outbound ? "out" : "in",
        authorDid: ev.sender_id,
        authorHandle: user?.username ?? ev.sender_id,
        authorDisplayName: user?.name ?? null,
        authorAvatarUrl: user?.profile_image_url ?? null,
        content: ev.text ?? "",
        platformData: {
          convoId: ev.dm_conversation_id,
          senderId: ev.sender_id,
        },
        platformCreatedAt: ev.created_at ? new Date(ev.created_at) : new Date(),
      });
    }

    token = res.meta?.next_token;
    pagesRead++;

    if (!token || (res.meta?.result_count ?? 0) < PAGE_SIZE) break;
  }

  await syncCounterpartyProfiles(workspaceId, account.accessToken, account.providerAccountId, messages);

  return { messages, comments: [], newCursor: token ?? null };
}

// X 1:1 DM conversation ids are `<participantA>-<participantB>` with both
// halves numeric. Anything else (group DMs, future formats) we skip — the
// fallback to message-derived counterparty still works once they reply.
function extractCounterpartyId(threadId: string, selfId: string): string | null {
  const parts = threadId.split("-");
  if (parts.length !== 2) return null;
  if (!parts.every((p) => /^\d+$/.test(p))) return null;
  const other = parts.find((p) => p !== selfId);
  return other ?? null;
}

async function syncCounterpartyProfiles(
  workspaceId: string,
  accessToken: string,
  selfId: string,
  messages: NormalizedMessage[],
): Promise<void> {
  // Build (threadId -> counterpartyId) for every thread we touched. The
  // ids endpoint takes up to 100 per call so this batches naturally.
  const byThread = new Map<string, string>();
  for (const m of messages) {
    if (!m.threadId || byThread.has(m.threadId)) continue;
    const other = extractCounterpartyId(m.threadId, selfId);
    if (other) byThread.set(m.threadId, other);
  }
  if (byThread.size === 0) return;

  const ids = Array.from(new Set(byThread.values()));
  // Chunk to respect the /2/users?ids=... 100-id cap.
  const profiles = new Map<string, { handle: string; name: string | null; avatar: string | null }>();
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const params = new URLSearchParams({
      ids: chunk.join(","),
      "user.fields": "name,username,profile_image_url",
    });
    const res = await fetch(`https://api.x.com/2/users?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      // Don't fail the whole sync over profile enrichment — messages are
      // already collected and the UI degrades to message-derived names.
      return;
    }
    const json = (await res.json()) as {
      data?: Array<{ id: string; name: string; username: string; profile_image_url?: string }>;
    };
    for (const u of json.data ?? []) {
      profiles.set(u.id, {
        handle: u.username,
        name: u.name ?? null,
        avatar: u.profile_image_url ?? null,
      });
    }
  }

  const rows: ThreadProfile[] = [];
  for (const [threadId, counterpartyId] of byThread) {
    const p = profiles.get(counterpartyId);
    if (!p) continue;
    rows.push({
      threadId,
      counterpartyId,
      counterpartyHandle: p.handle,
      counterpartyDisplayName: p.name,
      counterpartyAvatarUrl: p.avatar,
    });
  }
  await upsertThreadProfiles(workspaceId, "twitter", rows);
}
