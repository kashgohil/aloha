import { getFreshToken, forceRefresh } from "@/lib/publishers/tokens";
import type { NormalizedSnapshot } from "./types";

type FacebookPage = { id: string; access_token: string };

type InsightsResponse = {
  data?: Array<{ name: string; values?: Array<{ value?: number }> }>;
};

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

export async function fetchThreadsPostMetrics(
  userId: string,
  remotePostId: string,
): Promise<NormalizedSnapshot> {
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

  const params = new URLSearchParams({
    metric: "likes,replies,reposts,quotes,views",
    access_token: pageToken,
  });

  const res = await fetch(
    `https://graph.threads.net/v1.0/${remotePostId}/insights?${params}`,
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Threads insights ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as InsightsResponse;
  const metricsByName = new Map<string, number>();
  for (const m of data.data ?? []) {
    const value = m.values?.[0]?.value;
    if (typeof value === "number") metricsByName.set(m.name, value);
  }

  const reposts =
    metricsByName.has("reposts") || metricsByName.has("quotes")
      ? (metricsByName.get("reposts") ?? 0) + (metricsByName.get("quotes") ?? 0)
      : null;

  return {
    likes: metricsByName.get("likes") ?? null,
    reposts,
    replies: metricsByName.get("replies") ?? null,
    views: metricsByName.get("views") ?? null,
    bookmarks: null,
    profileClicks: null,
  };
}
