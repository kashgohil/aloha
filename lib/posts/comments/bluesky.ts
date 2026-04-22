import {
  createSession,
  getBlueskyCredentials,
} from "@/lib/publishers/bluesky";
import type { CommentsFetchResult, NormalizedComment } from "./types";

type ThreadNode = {
  post?: {
    uri: string;
    cid?: string;
    author?: {
      did?: string;
      handle?: string;
      displayName?: string;
      avatar?: string;
    };
    record?: { text?: string; reply?: { parent?: { uri?: string } } };
    indexedAt?: string;
  };
  parent?: ThreadNode | { notFound?: boolean };
  replies?: ThreadNode[];
};

function walk(
  node: ThreadNode,
  rootUri: string,
  out: NormalizedComment[],
) {
  const post = node.post;
  if (post && post.uri !== rootUri && post.author && post.record) {
    const parentUri =
      (post.record.reply?.parent?.uri as string | undefined) ?? rootUri;
    out.push({
      remoteId: post.uri,
      parentRemoteId: parentUri,
      rootRemoteId: rootUri,
      authorDid: post.author.did ?? null,
      authorHandle: post.author.handle ?? "unknown",
      authorDisplayName: post.author.displayName ?? null,
      authorAvatarUrl: post.author.avatar ?? null,
      content: post.record.text ?? "",
      platformData: { uri: post.uri, cid: post.cid },
      platformCreatedAt: post.indexedAt ? new Date(post.indexedAt) : new Date(),
    });
  }
  for (const child of node.replies ?? []) {
    walk(child, rootUri, out);
  }
}

export async function fetchBlueskyPostComments(
  userId: string,
  rootRemoteId: string,
): Promise<CommentsFetchResult> {
  const credentials = await getBlueskyCredentials(userId);
  const agent = await createSession(credentials);

  // post_deliveries.remotePostId stores just the record key (rkey) for
  // Bluesky. getPostThread needs a full AT-URI, so reassemble using the
  // user's DID. A value that already looks like an at:// URI is passed
  // through untouched.
  const uri = rootRemoteId.startsWith("at://")
    ? rootRemoteId
    : `at://${credentials.did}/app.bsky.feed.post/${rootRemoteId}`;

  const res = await agent.getPostThread({ uri, depth: 6 });
  const out: NormalizedComment[] = [];
  walk(res.data.thread as ThreadNode, uri, out);

  return { comments: out, newCursor: null };
}
