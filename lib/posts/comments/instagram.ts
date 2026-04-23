import { getFreshToken, forceRefresh } from "@/lib/publishers/tokens";
import type { CommentsFetchResult, NormalizedComment } from "./types";

const PAGE_SIZE = 50;

type IgComment = {
  id: string;
  text: string;
  timestamp: string;
  username?: string;
  from?: {
    id: string;
    username: string;
    full_name?: string;
    profile_picture_url?: string;
  };
  replies?: {
    data?: Array<{
      id: string;
      text: string;
      timestamp: string;
      username?: string;
      from?: {
        id: string;
        username: string;
        full_name?: string;
        profile_picture_url?: string;
      };
    }>;
  };
};

type CommentsResponse = {
  data?: IgComment[];
  paging?: { cursors?: { after?: string }; next?: string };
};

type FacebookPage = { id: string; access_token: string };

async function getPageAccessToken(userAccessToken: string): Promise<string> {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?access_token=${userAccessToken}`,
  );
  if (!res.ok) {
    throw new Error(`Instagram pages lookup ${res.status}`);
  }
  const data = (await res.json()) as { data?: FacebookPage[] };
  const page = data.data?.[0];
  if (!page) throw new Error("No Facebook page linked to Instagram");
  return page.access_token;
}

async function fetchPage(
  mediaId: string,
  pageAccessToken: string,
  cursor?: string,
): Promise<CommentsResponse> {
  const params = new URLSearchParams({
    fields:
      "id,text,timestamp,username,from{id,username,full_name,profile_picture_url},replies{id,text,timestamp,username,from{id,username,full_name,profile_picture_url}}",
    limit: String(PAGE_SIZE),
    access_token: pageAccessToken,
  });
  if (cursor) params.set("after", cursor);

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${mediaId}/comments?${params}`,
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Instagram comments ${res.status}: ${detail.slice(0, 300)}`);
  }
  return res.json() as Promise<CommentsResponse>;
}

export async function fetchInstagramPostComments(
  workspaceId: string,
  rootRemoteId: string,
  cursor: string | null,
): Promise<CommentsFetchResult> {
  let account = await getFreshToken(workspaceId, "instagram");
  let pageToken: string;
  try {
    pageToken = await getPageAccessToken(account.accessToken);
  } catch (err) {
    if (String(err).includes("401") || String(err).includes("190")) {
      account = await forceRefresh(workspaceId, "instagram");
      pageToken = await getPageAccessToken(account.accessToken);
    } else {
      throw err;
    }
  }

  const comments: NormalizedComment[] = [];
  const res = await fetchPage(rootRemoteId, pageToken, cursor ?? undefined);

  for (const c of res.data ?? []) {
    const author = c.from;
    comments.push({
      remoteId: c.id,
      parentRemoteId: rootRemoteId,
      rootRemoteId,
      authorDid: author?.id ?? null,
      authorHandle: c.username ?? author?.username ?? "unknown",
      authorDisplayName: author?.full_name ?? null,
      authorAvatarUrl: author?.profile_picture_url ?? null,
      content: c.text,
      platformData: { mediaId: rootRemoteId },
      platformCreatedAt: new Date(c.timestamp),
    });

    for (const r of c.replies?.data ?? []) {
      const rAuthor = r.from;
      comments.push({
        remoteId: r.id,
        parentRemoteId: c.id,
        rootRemoteId,
        authorDid: rAuthor?.id ?? null,
        authorHandle: r.username ?? rAuthor?.username ?? "unknown",
        authorDisplayName: rAuthor?.full_name ?? null,
        authorAvatarUrl: rAuthor?.profile_picture_url ?? null,
        content: r.text,
        platformData: { mediaId: rootRemoteId, parentCommentId: c.id },
        platformCreatedAt: new Date(r.timestamp),
      });
    }
  }

  return { comments, newCursor: res.paging?.cursors?.after ?? null };
}
