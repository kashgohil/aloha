import { Logger } from "@/lib/logger";
import { getFreshToken, forceRefresh } from "@/lib/publishers/tokens";
import type { NormalizedSnapshot } from "./types";

const log = new Logger({ source: "engagement.instagram" });

type FacebookPage = { id: string; access_token: string };

type MediaResponse = {
  like_count?: number;
  comments_count?: number;
};

type InsightsResponse = {
  data?: Array<{ name: string; values?: Array<{ value?: number }> }>;
};

async function getPageAccessToken(userAccessToken: string): Promise<string> {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?access_token=${userAccessToken}`,
  );
  if (!res.ok) throw new Error(`Instagram pages lookup ${res.status}`);
  const data = (await res.json()) as { data?: FacebookPage[] };
  const page = data.data?.[0];
  if (!page) throw new Error("No Facebook page linked to Instagram");
  return page.access_token;
}

export async function fetchInstagramPostMetrics(
  userId: string,
  remotePostId: string,
): Promise<NormalizedSnapshot> {
  let account = await getFreshToken(userId, "instagram");
  let pageToken: string;
  try {
    pageToken = await getPageAccessToken(account.accessToken);
  } catch (err) {
    if (String(err).includes("401") || String(err).includes("190")) {
      account = await forceRefresh(userId, "instagram");
      pageToken = await getPageAccessToken(account.accessToken);
    } else {
      throw err;
    }
  }

  const mediaRes = await fetch(
    `https://graph.facebook.com/v19.0/${remotePostId}?fields=like_count,comments_count&access_token=${pageToken}`,
  );
  const media: MediaResponse = mediaRes.ok
    ? ((await mediaRes.json()) as MediaResponse)
    : {};

  // Insights endpoint returns reach for business media. Stories + some
  // media types don't support it — we log every failure so the reason
  // (permissions vs media type vs deprecation) is visible in the logs
  // rather than invisibly coalesced to null.
  let views: number | null = null;
  try {
    const insightsRes = await fetch(
      `https://graph.facebook.com/v19.0/${remotePostId}/insights?metric=reach&access_token=${pageToken}`,
    );
    if (insightsRes.ok) {
      const data = (await insightsRes.json()) as InsightsResponse;
      views = data.data?.[0]?.values?.[0]?.value ?? null;
      if (views === null) {
        log.warn("insights/reach returned no value", {
          userId,
          mediaId: remotePostId,
        });
      }
    } else {
      const detail = await insightsRes.text().catch(() => "");
      log.warn("insights/reach request failed", {
        userId,
        mediaId: remotePostId,
        status: insightsRes.status,
        detail: detail.slice(0, 300),
      });
    }
  } catch (err) {
    log.warn("insights/reach threw", {
      userId,
      mediaId: remotePostId,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return {
    likes: media.like_count ?? null,
    reposts: null,
    replies: media.comments_count ?? null,
    views,
    bookmarks: null,
    profileClicks: null,
  };
}
