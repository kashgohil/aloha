import { getFreshToken, forceRefresh } from "@/lib/publishers/tokens";
import type { SyncResult, NormalizedMessage } from "./types";

const MAX_PAGES = 2;
const PAGE_SIZE = 50;

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
  in_reply_to_user_id?: string;
  created_at?: string;
  referenced_tweets?: Array<{ type: string; id: string }>;
};

type MentionsResponse = {
  data?: Tweet[];
  includes?: { users?: TweetUser[] };
  meta?: { next_token?: string; result_count?: number };
};

async function fetchMentionsPage(
  accessToken: string,
  userId: string,
  paginationToken?: string,
): Promise<MentionsResponse> {
  const params = new URLSearchParams({
    max_results: String(PAGE_SIZE),
    "tweet.fields": "created_at,author_id,conversation_id,in_reply_to_user_id,referenced_tweets",
    expansions: "author_id",
    "user.fields": "name,username,profile_image_url",
  });
  if (paginationToken) params.set("pagination_token", paginationToken);

  const res = await fetch(
    `https://api.x.com/2/users/${userId}/mentions?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`X mentions API ${res.status}: ${detail.slice(0, 300)}`);
  }

  return res.json() as Promise<MentionsResponse>;
}

export async function fetchXMentions(
  appUserId: string,
  cursor: string | null,
): Promise<SyncResult> {
  let account = await getFreshToken(appUserId, "twitter");

  const messages: NormalizedMessage[] = [];
  let currentToken = cursor ?? undefined;
  let pagesRead = 0;

  while (pagesRead < MAX_PAGES) {
    let res: MentionsResponse;
    try {
      res = await fetchMentionsPage(
        account.accessToken,
        account.providerAccountId,
        currentToken,
      );
    } catch (err) {
      if (pagesRead === 0 && String(err).includes("401")) {
        account = await forceRefresh(appUserId, "twitter");
        res = await fetchMentionsPage(
          account.accessToken,
          account.providerAccountId,
          currentToken,
        );
      } else {
        throw err;
      }
    }

    if (!res.data || res.data.length === 0) break;

    const usersById = new Map<string, TweetUser>();
    for (const u of res.includes?.users ?? []) {
      usersById.set(u.id, u);
    }

    for (const tweet of res.data) {
      const author = usersById.get(tweet.author_id);
      const isReply = !!tweet.in_reply_to_user_id;
      const parentTweetId = tweet.referenced_tweets?.find(
        (r) => r.type === "replied_to",
      )?.id ?? null;

      messages.push({
        remoteId: tweet.id,
        threadId: tweet.conversation_id ?? null,
        parentId: parentTweetId,
        reason: isReply ? "reply" : "mention",
        authorDid: tweet.author_id,
        authorHandle: author?.username ?? tweet.author_id,
        authorDisplayName: author?.name ?? null,
        authorAvatarUrl: author?.profile_image_url ?? null,
        content: tweet.text,
        platformData: { tweet, author },
        platformCreatedAt: tweet.created_at
          ? new Date(tweet.created_at)
          : new Date(),
      });
    }

    currentToken = res.meta?.next_token;
    pagesRead++;

    if (!currentToken || (res.meta?.result_count ?? 0) < PAGE_SIZE) break;
  }

  return {
    messages,
    newCursor: currentToken ?? null,
  };
}
