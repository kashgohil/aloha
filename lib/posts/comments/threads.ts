import { getFreshToken, forceRefresh } from "@/lib/publishers/tokens";
import type { CommentsFetchResult, NormalizedComment } from "./types";

const PAGE_SIZE = 50;

type ThreadsReply = {
  id: string;
  text?: string;
  username?: string;
  timestamp?: string;
  replied_to?: { id: string };
  root_post?: { id: string };
};

type RepliesResponse = {
  data?: ThreadsReply[];
  paging?: { cursors?: { after?: string } };
};

type FacebookPage = { id: string; access_token: string };

async function getPageAccessToken(userAccessToken: string): Promise<string> {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?access_token=${userAccessToken}`,
  );
  if (!res.ok) throw new Error(`Threads pages lookup ${res.status}`);
  const data = (await res.json()) as { data?: FacebookPage[] };
  const page = data.data?.[0];
  if (!page) throw new Error("No Facebook page linked to Threads");
  return page.access_token;
}

async function fetchPage(
  postId: string,
  pageAccessToken: string,
  cursor?: string,
): Promise<RepliesResponse> {
  const params = new URLSearchParams({
    fields:
      "id,text,username,timestamp,replied_to,root_post",
    reverse: "false",
    limit: String(PAGE_SIZE),
    access_token: pageAccessToken,
  });
  if (cursor) params.set("after", cursor);

  const res = await fetch(
    `https://graph.threads.net/v1.0/${postId}/replies?${params}`,
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Threads replies ${res.status}: ${detail.slice(0, 300)}`);
  }
  return res.json() as Promise<RepliesResponse>;
}

export async function fetchThreadsPostComments(
  userId: string,
  rootRemoteId: string,
  cursor: string | null,
): Promise<CommentsFetchResult> {
  let account = await getFreshToken(userId, "threads");
  let pageToken: string;
  try {
    pageToken = await getPageAccessToken(account.accessToken);
  } catch (err) {
    if (String(err).includes("401") || String(err).includes("190")) {
      account = await forceRefresh(userId, "threads");
      pageToken = await getPageAccessToken(account.accessToken);
    } else {
      throw err;
    }
  }

  const res = await fetchPage(rootRemoteId, pageToken, cursor ?? undefined);

  const comments: NormalizedComment[] = (res.data ?? []).map((r) => ({
    remoteId: r.id,
    parentRemoteId: r.replied_to?.id ?? rootRemoteId,
    rootRemoteId: r.root_post?.id ?? rootRemoteId,
    authorDid: null,
    authorHandle: r.username ?? "unknown",
    authorDisplayName: null,
    authorAvatarUrl: null,
    content: r.text ?? "",
    platformData: {
      repliedTo: r.replied_to?.id,
      rootPost: r.root_post?.id,
    },
    platformCreatedAt: r.timestamp ? new Date(r.timestamp) : new Date(),
  }));

  return { comments, newCursor: res.paging?.cursors?.after ?? null };
}
