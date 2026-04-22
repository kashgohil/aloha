import { getFreshToken, forceRefresh } from "@/lib/publishers/tokens";
import type { NormalizedSnapshot } from "./types";

type PinAnalytics = {
  all?: {
    daily?: Array<{
      date?: string;
      metrics?: {
        IMPRESSION?: number;
        PIN_CLICK?: number;
        OUTBOUND_CLICK?: number;
        SAVE?: number;
        COMMENT?: number;
        REACTION?: number;
      };
    }>;
    summary_metrics?: {
      IMPRESSION?: number;
      PIN_CLICK?: number;
      OUTBOUND_CLICK?: number;
      SAVE?: number;
      COMMENT?: number;
      REACTION?: number;
    };
  };
};

async function fetchOnce(
  accessToken: string,
  pinId: string,
): Promise<PinAnalytics> {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const params = new URLSearchParams({
    start_date: fmt(start),
    end_date: fmt(end),
    metric_types: "IMPRESSION,SAVE,PIN_CLICK,OUTBOUND_CLICK,REACTION",
  });

  const res = await fetch(
    `https://api.pinterest.com/v5/pins/${pinId}/analytics?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Pinterest analytics ${res.status}: ${detail.slice(0, 300)}`);
  }

  return res.json() as Promise<PinAnalytics>;
}

export async function fetchPinterestPostMetrics(
  userId: string,
  remotePostId: string,
): Promise<NormalizedSnapshot> {
  let account = await getFreshToken(userId, "pinterest");

  let res: PinAnalytics;
  try {
    res = await fetchOnce(account.accessToken, remotePostId);
  } catch (err) {
    if (String(err).includes("401")) {
      account = await forceRefresh(userId, "pinterest");
      res = await fetchOnce(account.accessToken, remotePostId);
    } else {
      throw err;
    }
  }

  const summary = res.all?.summary_metrics;

  return {
    likes: summary?.REACTION ?? null,
    reposts: summary?.SAVE ?? null,
    replies: summary?.COMMENT ?? null,
    views: summary?.IMPRESSION ?? null,
    bookmarks: null,
    profileClicks: summary?.PIN_CLICK ?? null,
  };
}
