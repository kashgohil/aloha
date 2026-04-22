import { getFreshToken, forceRefresh } from "@/lib/publishers/tokens";
import type { NormalizedSnapshot } from "./types";

type SocialActionsResponse = {
  likesSummary?: { totalLikes?: number; aggregatedTotalLikes?: number };
  commentsSummary?: { totalFirstLevelComments?: number; aggregatedTotalComments?: number };
};

async function fetchOnce(
  accessToken: string,
  shareUrn: string,
): Promise<SocialActionsResponse> {
  const urn = encodeURIComponent(shareUrn);
  const res = await fetch(
    `https://api.linkedin.com/rest/socialActions/${urn}`,
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
    throw new Error(`LinkedIn socialActions ${res.status}: ${detail.slice(0, 300)}`);
  }
  return res.json() as Promise<SocialActionsResponse>;
}

export async function fetchLinkedInPostMetrics(
  userId: string,
  remotePostId: string,
): Promise<NormalizedSnapshot> {
  let account = await getFreshToken(userId, "linkedin");

  let res: SocialActionsResponse;
  try {
    res = await fetchOnce(account.accessToken, remotePostId);
  } catch (err) {
    if (String(err).includes("401")) {
      account = await forceRefresh(userId, "linkedin");
      res = await fetchOnce(account.accessToken, remotePostId);
    } else {
      throw err;
    }
  }

  // Impressions/views require the organizational analytics endpoints and
  // Marketing Developer Platform access, which we don't hold. Leave null.
  return {
    likes:
      res.likesSummary?.aggregatedTotalLikes ??
      res.likesSummary?.totalLikes ??
      null,
    reposts: null,
    replies:
      res.commentsSummary?.aggregatedTotalComments ??
      res.commentsSummary?.totalFirstLevelComments ??
      null,
    views: null,
    bookmarks: null,
    profileClicks: null,
  };
}
