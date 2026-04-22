import { getFreshToken, forceRefresh } from "@/lib/publishers/tokens";
import type { CommentsFetchResult, NormalizedComment } from "./types";

const PAGE_SIZE = 50;

type LinkedInComment = {
  id: string;
  message: { text: string };
  created: { time: number };
  actor: string;
  parentComment?: string;
};

type CommentsResponse = {
  elements?: LinkedInComment[];
  paging?: { start?: number; count?: number; total?: number };
};

async function fetchPage(
  accessToken: string,
  shareUrn: string,
  start: number,
): Promise<CommentsResponse> {
  const urn = encodeURIComponent(shareUrn);
  const res = await fetch(
    `https://api.linkedin.com/rest/socialActions/${urn}/comments?start=${start}&count=${PAGE_SIZE}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "LinkedIn-Version": "202405",
        "X-Restli-Protocol-Version": "2.0.0",
      },
    },
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`LinkedIn comments ${res.status}: ${detail.slice(0, 300)}`);
  }
  return res.json() as Promise<CommentsResponse>;
}

export async function fetchLinkedInPostComments(
  userId: string,
  rootRemoteId: string,
  cursor: string | null,
): Promise<CommentsFetchResult> {
  let account = await getFreshToken(userId, "linkedin");

  const start = cursor ? parseInt(cursor, 10) || 0 : 0;

  let res: CommentsResponse;
  try {
    res = await fetchPage(account.accessToken, rootRemoteId, start);
  } catch (err) {
    if (String(err).includes("401")) {
      account = await forceRefresh(userId, "linkedin");
      res = await fetchPage(account.accessToken, rootRemoteId, start);
    } else {
      throw err;
    }
  }

  const elements = res.elements ?? [];
  const comments: NormalizedComment[] = elements.map((c) => ({
    remoteId: c.id,
    parentRemoteId: c.parentComment ?? rootRemoteId,
    rootRemoteId,
    // LinkedIn's comments API returns actor URNs only. Resolving them to
    // real names requires partner-tier scopes (r_1st_connections_profile
    // or Marketing Developer Platform) that we don't hold, so display a
    // generic label. authorHandle keeps the member id as a stable key;
    // the UI suppresses it for LinkedIn rows.
    authorDid: c.actor,
    authorHandle: c.actor.replace(/^urn:li:person:/, ""),
    authorDisplayName: "LinkedIn member",
    authorAvatarUrl: null,
    content: c.message?.text ?? "",
    platformData: { actor: c.actor, parentComment: c.parentComment ?? null },
    platformCreatedAt: new Date(c.created.time),
  }));

  const nextStart = start + elements.length;
  const total = res.paging?.total ?? nextStart;
  const newCursor =
    elements.length < PAGE_SIZE || nextStart >= total ? null : String(nextStart);

  return { comments, newCursor };
}
