import { LINKEDIN_API_VERSION } from "@/lib/linkedin/api-version";
import {
  LINKEDIN_SOCIAL_READ_SCOPE,
  hasLinkedInScope,
} from "@/lib/linkedin/scopes";
import { getFreshToken, forceRefresh } from "@/lib/publishers/tokens";
import type { NormalizedSnapshot } from "./types";

const EMPTY_SNAPSHOT: NormalizedSnapshot = {
  likes: null,
  reposts: null,
  replies: null,
  views: null,
  bookmarks: null,
  profileClicks: null,
};

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
        "LinkedIn-Version": LINKEDIN_API_VERSION,
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
  workspaceId: string,
  remotePostId: string,
): Promise<NormalizedSnapshot> {
  let account = await getFreshToken(workspaceId, "linkedin");

  // Scope gate: /rest/socialActions needs r_member_social, which is part
  // of LinkedIn's Community Management API product. Without it the
  // endpoint 401s on a fresh token and the recovery path explodes on
  // the missing refresh_token (Sign In + Share On products don't issue
  // refresh tokens either). Early-return an all-null snapshot — the
  // post-analytics UI already shows "didn't return any metrics on the
  // scopes we hold" when every metric is null across history.
  if (!hasLinkedInScope(account.scope, LINKEDIN_SOCIAL_READ_SCOPE)) {
    return EMPTY_SNAPSHOT;
  }

  let res: SocialActionsResponse;
  try {
    res = await fetchOnce(account.accessToken, remotePostId);
  } catch (err) {
    if (String(err).includes("401")) {
      try {
        account = await forceRefresh(workspaceId, "linkedin");
      } catch {
        // No refresh_token (Community Management API product not
        // approved) — treat as "metrics unavailable" rather than paging
        // Sentry on every cron tick.
        return EMPTY_SNAPSHOT;
      }
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
