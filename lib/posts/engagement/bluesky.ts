import {
  createSession,
  getBlueskyCredentials,
} from "@/lib/publishers/bluesky";
import type { NormalizedSnapshot } from "./types";

export async function fetchBlueskyPostMetrics(
  userId: string,
  remotePostId: string,
): Promise<NormalizedSnapshot> {
  const credentials = await getBlueskyCredentials(userId);
  const agent = await createSession(credentials);

  const uri = remotePostId.startsWith("at://")
    ? remotePostId
    : `at://${credentials.did}/app.bsky.feed.post/${remotePostId}`;

  const res = await agent.getPosts({ uris: [uri] });
  const post = res.data.posts[0] as
    | { likeCount?: number; repostCount?: number; replyCount?: number; quoteCount?: number }
    | undefined;

  return {
    likes: post?.likeCount ?? null,
    reposts: (post?.repostCount ?? 0) + (post?.quoteCount ?? 0) || null,
    replies: post?.replyCount ?? null,
    views: null,
    bookmarks: null,
    profileClicks: null,
  };
}
