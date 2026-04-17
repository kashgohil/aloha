// X (Twitter) read-back via v2 API. Pulls the authenticated user's recent
// tweets with public_metrics attached — one call covers both `content` and
// `insights`. NextAuth stores the X user id as `providerAccountId`, so we
// don't need an extra /2/users/me round-trip.
//
// Rate limits: the v2 user-tweets endpoint is generous on Basic tier but
// cramped on Free. Nightly cadence with max_results=50 keeps us well under
// the ceiling. When we go multi-user, add jittered scheduling per account.

import type {
  ReadbackAdapter,
  ReadbackBatch,
  ReadbackContext,
  ReadbackItem,
} from "./types";

type XTweet = {
  id: string;
  text: string;
  created_at?: string;
  public_metrics?: {
    retweet_count?: number;
    reply_count?: number;
    like_count?: number;
    quote_count?: number;
    bookmark_count?: number;
    impression_count?: number;
  };
};

type XTweetsResponse = {
  data?: XTweet[];
  meta?: { result_count?: number; newest_id?: string };
  errors?: unknown;
};

const MAX_RESULTS = 50;
const TWEET_FIELDS = "created_at,public_metrics";

export const xReadbackAdapter: ReadbackAdapter = {
  platform: "twitter",
  async fetch(ctx: ReadbackContext): Promise<ReadbackBatch> {
    const xUserId = ctx.account.providerAccountId;
    const url = new URL(`https://api.x.com/2/users/${xUserId}/tweets`);
    url.searchParams.set("max_results", String(MAX_RESULTS));
    url.searchParams.set("tweet.fields", TWEET_FIELDS);
    url.searchParams.set("exclude", "retweets,replies");
    if (ctx.since) {
      url.searchParams.set("start_time", ctx.since.toISOString());
    }

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${ctx.account.accessToken}` },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `X read-back failed (${res.status}): ${body.slice(0, 400)}`,
      );
    }
    const json = (await res.json()) as XTweetsResponse;
    const tweets = json.data ?? [];

    const items: ReadbackItem[] = tweets.map((t) => ({
      remotePostId: t.id,
      content: t.text,
      media: [],
      platformData: { public_metrics: t.public_metrics ?? {} },
      platformPostedAt: t.created_at ? new Date(t.created_at) : null,
      metrics: toMetrics(t.public_metrics),
    }));

    return { items };
  },
};

function toMetrics(
  pm: XTweet["public_metrics"] | undefined,
): Record<string, number | null> | null {
  if (!pm) return null;
  return {
    impressions: pm.impression_count ?? null,
    likes: pm.like_count ?? null,
    replies: pm.reply_count ?? null,
    reposts: pm.retweet_count ?? null,
    quotes: pm.quote_count ?? null,
    bookmarks: pm.bookmark_count ?? null,
  };
}
