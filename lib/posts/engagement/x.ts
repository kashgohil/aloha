import { Logger } from "@/lib/logger";
import { getFreshToken, forceRefresh } from "@/lib/publishers/tokens";
import type { NormalizedSnapshot } from "./types";

const log = new Logger({ source: "engagement.x" });

type TweetResponse = {
  data?: {
    id: string;
    public_metrics?: {
      like_count?: number;
      retweet_count?: number;
      reply_count?: number;
      quote_count?: number;
      bookmark_count?: number;
      impression_count?: number;
    };
    non_public_metrics?: {
      impression_count?: number;
      user_profile_clicks?: number;
    };
  };
};

async function fetchOnce(
  accessToken: string,
  tweetId: string,
): Promise<TweetResponse> {
  const params = new URLSearchParams({
    "tweet.fields": "public_metrics,non_public_metrics",
  });
  const res = await fetch(
    `https://api.x.com/2/tweets/${tweetId}?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`X tweet metrics ${res.status}: ${detail.slice(0, 300)}`);
  }
  return res.json() as Promise<TweetResponse>;
}

export async function fetchXPostMetrics(
  workspaceId: string,
  remotePostId: string,
): Promise<NormalizedSnapshot> {
  let account = await getFreshToken(workspaceId, "twitter");

  let res: TweetResponse;
  try {
    res = await fetchOnce(account.accessToken, remotePostId);
  } catch (err) {
    if (String(err).includes("401")) {
      account = await forceRefresh(workspaceId, "twitter");
      res = await fetchOnce(account.accessToken, remotePostId);
    } else {
      throw err;
    }
  }

  const pub = res.data?.public_metrics;
  const priv = res.data?.non_public_metrics;
  const reposts =
    pub?.retweet_count !== undefined || pub?.quote_count !== undefined
      ? (pub?.retweet_count ?? 0) + (pub?.quote_count ?? 0)
      : null;

  // non_public_metrics (impressions, profile clicks) only populate for
  // tweets owned by the authenticated user within the last ~30 days. Log
  // when they're missing so we can distinguish "X stopped returning them"
  // from "this post is too old" during debugging.
  if (!priv) {
    log.warn("non_public_metrics absent", {
      workspaceId,
      tweetId: remotePostId,
    });
  } else if (
    priv.impression_count === undefined &&
    priv.user_profile_clicks === undefined
  ) {
    log.warn("non_public_metrics present but empty", {
      workspaceId,
      tweetId: remotePostId,
    });
  }

  return {
    likes: pub?.like_count ?? null,
    reposts,
    replies: pub?.reply_count ?? null,
    // non_public_metrics impressions are more accurate; fall back to the
    // public count when non-public access is denied.
    views: priv?.impression_count ?? pub?.impression_count ?? null,
    bookmarks: pub?.bookmark_count ?? null,
    profileClicks: priv?.user_profile_clicks ?? null,
  };
}
