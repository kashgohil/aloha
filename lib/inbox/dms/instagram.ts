import { getFreshToken, forceRefresh } from "@/lib/publishers/tokens";
import type { NormalizedMessage, SyncResult } from "../types";
import { upsertThreadProfiles, type ThreadProfile } from "./_thread-profiles";

// Instagram Messaging flows through the Graph API under the linked
// Facebook Page. We list conversations with platform=instagram, then
// fetch messages per conversation. Direction is derived from the sender
// id vs the IG business account id.

const MAX_CONVOS = 30;
const PAGE_SIZE = 20;

type FacebookPage = { id: string; access_token: string };

type Conversation = {
  id: string;
  updated_time?: string;
  participants?: {
    data?: Array<{
      id: string;
      username?: string;
      name?: string;
      profile_pic?: string;
    }>;
  };
};

type ConversationsResponse = {
  data?: Conversation[];
  paging?: { cursors?: { after?: string } };
};

type IgMessage = {
  id: string;
  created_time: string;
  from: {
    id: string;
    username?: string;
    name?: string;
    profile_pic?: string;
  };
  message?: string;
};

type MessagesResponse = {
  data?: IgMessage[];
  paging?: { cursors?: { after?: string } };
};

async function getPageAndIgAccount(
  userAccessToken: string,
): Promise<{ pageAccessToken: string; igAccountId: string }> {
  const pagesRes = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?access_token=${userAccessToken}`,
  );
  if (!pagesRes.ok) throw new Error(`Instagram pages lookup ${pagesRes.status}`);
  const pages = (await pagesRes.json()) as { data?: FacebookPage[] };
  const page = pages.data?.[0];
  if (!page) throw new Error("No Facebook page linked to Instagram");

  const igRes = await fetch(
    `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`,
  );
  if (!igRes.ok) throw new Error(`Instagram business account lookup ${igRes.status}`);
  const igData = (await igRes.json()) as {
    instagram_business_account?: { id: string };
  };
  const igAccountId = igData.instagram_business_account?.id;
  if (!igAccountId) throw new Error("Instagram business account not linked");

  return { pageAccessToken: page.access_token, igAccountId };
}

async function fetchConvosPage(
  pageAccessToken: string,
  pageId: string,
  cursor?: string,
): Promise<ConversationsResponse> {
  const params = new URLSearchParams({
    platform: "instagram",
    fields:
      "id,updated_time,participants{id,username,name,profile_pic}",
    limit: String(MAX_CONVOS),
    access_token: pageAccessToken,
  });
  if (cursor) params.set("after", cursor);

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${pageId}/conversations?${params}`,
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Instagram conversations ${res.status}: ${detail.slice(0, 300)}`);
  }
  return res.json() as Promise<ConversationsResponse>;
}

async function fetchMessagesPage(
  pageAccessToken: string,
  convoId: string,
): Promise<MessagesResponse> {
  const params = new URLSearchParams({
    fields: "id,created_time,from{id,username,name,profile_pic},message",
    limit: String(PAGE_SIZE),
    access_token: pageAccessToken,
  });

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${convoId}/messages?${params}`,
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Instagram messages ${res.status}: ${detail.slice(0, 300)}`);
  }
  return res.json() as Promise<MessagesResponse>;
}

export async function fetchInstagramDms(
  workspaceId: string,
  cursor: string | null,
): Promise<SyncResult> {
  let account = await getFreshToken(workspaceId, "instagram");

  let pageAccessToken: string;
  let igAccountId: string;
  try {
    ({ pageAccessToken, igAccountId } = await getPageAndIgAccount(
      account.accessToken,
    ));
  } catch (err) {
    if (String(err).includes("401") || String(err).includes("190")) {
      account = await forceRefresh(workspaceId, "instagram");
      ({ pageAccessToken, igAccountId } = await getPageAndIgAccount(
        account.accessToken,
      ));
    } else {
      throw err;
    }
  }

  // The /me/accounts hop only returns the page id when asked, but we
  // already have it implicitly — refetch here so conversations lookup has
  // a stable pageId even though we went through getPageAndIgAccount for
  // the token. This doubles as validation that the page still exists.
  const pagesRes = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?access_token=${account.accessToken}`,
  );
  const pages = (await pagesRes.json()) as { data?: FacebookPage[] };
  const pageId = pages.data?.[0]?.id;
  if (!pageId) {
    return { messages: [], comments: [], newCursor: null };
  }

  const messages: NormalizedMessage[] = [];
  const threadProfiles: ThreadProfile[] = [];

  const convosRes = await fetchConvosPage(
    pageAccessToken,
    pageId,
    cursor ?? undefined,
  );
  const convos = convosRes.data ?? [];

  for (const convo of convos) {
    const counterparty = convo.participants?.data?.find(
      (p) => p.id !== igAccountId,
    );
    if (counterparty) {
      threadProfiles.push({
        threadId: convo.id,
        counterpartyId: counterparty.id,
        counterpartyHandle: counterparty.username ?? counterparty.id,
        counterpartyDisplayName: counterparty.name ?? null,
        counterpartyAvatarUrl: counterparty.profile_pic ?? null,
      });
    }
    const msgRes = await fetchMessagesPage(pageAccessToken, convo.id);
    for (const m of msgRes.data ?? []) {
      if (!m.from?.id) continue;
      const outbound = m.from.id === igAccountId;

      messages.push({
        remoteId: m.id,
        threadId: convo.id,
        parentId: null,
        reason: "dm",
        direction: outbound ? "out" : "in",
        authorDid: m.from.id,
        authorHandle: m.from.username ?? m.from.id,
        authorDisplayName: m.from.name ?? null,
        authorAvatarUrl: m.from.profile_pic ?? null,
        content: m.message ?? "",
        platformData: { convoId: convo.id, igAccountId },
        platformCreatedAt: new Date(m.created_time),
      });
    }
  }

  await upsertThreadProfiles(workspaceId, "instagram", threadProfiles);

  return {
    messages,
    comments: [],
    newCursor: convosRes.paging?.cursors?.after ?? null,
  };
}
