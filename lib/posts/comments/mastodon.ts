import { getMastodonCredentials } from "@/lib/publishers/mastodon";
import type { CommentsFetchResult, NormalizedComment } from "./types";

type MastodonStatus = {
  id: string;
  uri: string;
  url?: string;
  created_at: string;
  content: string;
  in_reply_to_id: string | null;
  account: {
    id: string;
    username: string;
    display_name: string;
    avatar: string;
  };
};

type ContextResponse = {
  ancestors: MastodonStatus[];
  descendants: MastodonStatus[];
};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

export async function fetchMastodonPostComments(
  workspaceId: string,
  rootRemoteId: string,
): Promise<CommentsFetchResult> {
  const credentials = await getMastodonCredentials(workspaceId);

  const res = await fetch(
    `${credentials.instanceUrl}/api/v1/statuses/${rootRemoteId}/context`,
    {
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        Accept: "application/json",
      },
    },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Mastodon context ${res.status}: ${detail.slice(0, 300)}`);
  }

  const ctx = (await res.json()) as ContextResponse;

  // Only descendants are relevant — ancestors are posts above our own.
  const comments: NormalizedComment[] = ctx.descendants.map((s) => ({
    remoteId: s.id,
    parentRemoteId: s.in_reply_to_id ?? rootRemoteId,
    rootRemoteId,
    authorDid: s.account.id,
    authorHandle: s.account.username,
    authorDisplayName: s.account.display_name || s.account.username,
    authorAvatarUrl: s.account.avatar,
    content: stripHtml(s.content),
    platformData: { uri: s.uri, url: s.url },
    platformCreatedAt: new Date(s.created_at),
  }));

  return { comments, newCursor: null };
}
