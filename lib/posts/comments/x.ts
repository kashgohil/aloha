import { getFreshToken, forceRefresh } from "@/lib/publishers/tokens";
import type { CommentsFetchResult, NormalizedComment } from "./types";

const MAX_PAGES = 3;
const PAGE_SIZE = 100;

type TweetUser = {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
};

type Tweet = {
  id: string;
  text: string;
  author_id: string;
  conversation_id?: string;
  created_at?: string;
  referenced_tweets?: Array<{ type: string; id: string }>;
};

type SearchResponse = {
  data?: Tweet[];
  includes?: { users?: TweetUser[] };
  meta?: { next_token?: string; result_count?: number };
};

async function searchPage(
  accessToken: string,
  conversationId: string,
  paginationToken?: string,
): Promise<SearchResponse> {
  const params = new URLSearchParams({
    query: `conversation_id:${conversationId}`,
    max_results: String(PAGE_SIZE),
    "tweet.fields":
      "created_at,author_id,conversation_id,referenced_tweets",
    expansions: "author_id",
    "user.fields": "name,username,profile_image_url",
  });
  if (paginationToken) params.set("next_token", paginationToken);

  const res = await fetch(
    `https://api.x.com/2/tweets/search/recent?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`X search API ${res.status}: ${detail.slice(0, 300)}`);
  }

  return res.json() as Promise<SearchResponse>;
}

export async function fetchXPostComments(
  workspaceId: string,
  rootRemoteId: string,
  cursor: string | null,
): Promise<CommentsFetchResult> {
  let account = await getFreshToken(workspaceId, "twitter");

  const comments: NormalizedComment[] = [];
  let token = cursor ?? undefined;
  let pagesRead = 0;

  while (pagesRead < MAX_PAGES) {
    let res: SearchResponse;
    try {
      res = await searchPage(account.accessToken, rootRemoteId, token);
    } catch (err) {
      if (pagesRead === 0 && String(err).includes("401")) {
        account = await forceRefresh(workspaceId, "twitter");
        res = await searchPage(account.accessToken, rootRemoteId, token);
      } else {
        throw err;
      }
    }

    if (!res.data || res.data.length === 0) break;

    const usersById = new Map<string, TweetUser>();
    for (const u of res.includes?.users ?? []) usersById.set(u.id, u);

    for (const t of res.data) {
      // The root tweet itself is included in conversation_id results; skip it.
      if (t.id === rootRemoteId) continue;

      const parent =
        t.referenced_tweets?.find((r) => r.type === "replied_to")?.id ??
        rootRemoteId;
      const author = usersById.get(t.author_id);

      comments.push({
        remoteId: t.id,
        parentRemoteId: parent,
        rootRemoteId,
        authorDid: t.author_id,
        authorHandle: author?.username ?? t.author_id,
        authorDisplayName: author?.name ?? null,
        authorAvatarUrl: author?.profile_image_url ?? null,
        content: t.text,
        platformData: { tweet: t, author },
        platformCreatedAt: t.created_at ? new Date(t.created_at) : new Date(),
      });
    }

    token = res.meta?.next_token;
    pagesRead++;

    if (!token || (res.meta?.result_count ?? 0) < PAGE_SIZE) break;
  }

  return { comments, newCursor: token ?? null };
}
