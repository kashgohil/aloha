import { getFreshToken, forceRefresh } from "@/lib/publishers/tokens";
import type { CommentsFetchResult, NormalizedComment } from "./types";

const PAGE_SIZE = 50;

type PinterestComment = {
  id: string;
  pin_id: string;
  text: string;
  created_at: string;
  commenter?: {
    id: string;
    username: string;
    full_name?: string;
    profile_image_url?: string;
  };
};

type CommentsResponse = {
  items: PinterestComment[];
  page?: { next_cursor?: string };
};

async function fetchPage(
  accessToken: string,
  pinId: string,
  cursor?: string,
): Promise<CommentsResponse> {
  const params = new URLSearchParams({ page_size: String(PAGE_SIZE) });
  if (cursor) params.set("bookmark", cursor);
  const res = await fetch(
    `https://api.pinterest.com/v5/pins/${pinId}/comments?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Pinterest comments ${res.status}: ${detail.slice(0, 300)}`);
  }
  return res.json() as Promise<CommentsResponse>;
}

export async function fetchPinterestPostComments(
  userId: string,
  rootRemoteId: string,
  cursor: string | null,
): Promise<CommentsFetchResult> {
  let account = await getFreshToken(userId, "pinterest");

  let res: CommentsResponse;
  try {
    res = await fetchPage(account.accessToken, rootRemoteId, cursor ?? undefined);
  } catch (err) {
    if (String(err).includes("401")) {
      account = await forceRefresh(userId, "pinterest");
      res = await fetchPage(account.accessToken, rootRemoteId, cursor ?? undefined);
    } else {
      throw err;
    }
  }

  // Pinterest comments are flat — no nesting surfaced by the API.
  const comments: NormalizedComment[] = (res.items ?? []).map((c) => ({
    remoteId: c.id,
    parentRemoteId: rootRemoteId,
    rootRemoteId,
    authorDid: c.commenter?.id ?? null,
    authorHandle: c.commenter?.username ?? "unknown",
    authorDisplayName:
      c.commenter?.full_name ?? c.commenter?.username ?? null,
    authorAvatarUrl: c.commenter?.profile_image_url ?? null,
    content: c.text,
    platformData: { pinId: rootRemoteId },
    platformCreatedAt: new Date(c.created_at),
  }));

  return { comments, newCursor: res.page?.next_cursor ?? null };
}
