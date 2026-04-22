import { getMastodonCredentials } from "@/lib/publishers/mastodon";
import type { NormalizedSnapshot } from "./types";

type Status = {
  favourites_count?: number;
  reblogs_count?: number;
  replies_count?: number;
};

export async function fetchMastodonPostMetrics(
  userId: string,
  remotePostId: string,
): Promise<NormalizedSnapshot> {
  const credentials = await getMastodonCredentials(userId);

  const res = await fetch(
    `${credentials.instanceUrl}/api/v1/statuses/${remotePostId}`,
    {
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        Accept: "application/json",
      },
    },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Mastodon status ${res.status}: ${detail.slice(0, 300)}`);
  }

  const status = (await res.json()) as Status;

  return {
    likes: status.favourites_count ?? null,
    reposts: status.reblogs_count ?? null,
    replies: status.replies_count ?? null,
    views: null,
    bookmarks: null,
    profileClicks: null,
  };
}
