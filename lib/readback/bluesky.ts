// Bluesky read-back via AT Proto. Uses the same app-password session flow
// as the publisher (lib/publishers/bluesky.ts). `getAuthorFeed` returns the
// user's own posts with likeCount / repostCount / replyCount attached, so
// one call covers both content cache and insights. Impressions aren't
// exposed by AT Proto, so that key is null and our scorer falls back to
// engagement sum.

import { AtpAgent } from "@atproto/api";
import type {
  ReadbackAdapter,
  ReadbackBatch,
  ReadbackContext,
  ReadbackItem,
} from "./types";

const MAX_RESULTS = 50;

export const blueskyReadbackAdapter: ReadbackAdapter = {
  platform: "bluesky",
  source: { kind: "bluesky_creds" },
  async fetch(ctx: ReadbackContext): Promise<ReadbackBatch> {
    const creds = ctx.blueskyCreds;
    if (!creds) throw new Error("Bluesky read-back: missing credentials");

    const agent = new AtpAgent({ service: "https://bsky.social" });
    await agent.login({
      identifier: creds.handle,
      password: creds.appPassword,
    });

    const actor = creds.did ?? creds.handle;
    const res = await agent.getAuthorFeed({
      actor,
      limit: MAX_RESULTS,
      filter: "posts_no_replies",
    });

    const items: ReadbackItem[] = [];
    for (const entry of res.data.feed) {
      const post = entry.post;
      // Skip reposts — `reason` present means it's someone else's content
      // boosted by the user, not an original post we want to track.
      if (entry.reason) continue;

      const record = post.record as {
        text?: string;
        createdAt?: string;
      };
      items.push({
        remotePostId: post.uri,
        content: record.text ?? "",
        media: [],
        platformData: { cid: post.cid, uri: post.uri },
        platformPostedAt: record.createdAt ? new Date(record.createdAt) : null,
        metrics: {
          impressions: null,
          likes: post.likeCount ?? 0,
          reposts: post.repostCount ?? 0,
          replies: post.replyCount ?? 0,
          quotes: post.quoteCount ?? 0,
        },
      });
    }

    return { items };
  },
};
