import { db } from "@/db";
import { inboxMessages, postComments, postDeliveries, posts } from "@/db/schema";
import type { ActivityItem } from "@/app/app/dashboard/_components";
import { and, desc, eq } from "drizzle-orm";

const INBOX_LIMIT = 20;
const COMMENTS_LIMIT = 20;
const MERGED_LIMIT = 20;

export async function getRecentActivity(
  userId: string,
): Promise<ActivityItem[]> {
  // Two independent queries merged in Node — simpler than a UNION across
  // two different row shapes, and the limits are small enough that this
  // costs nothing.
  const [inboxRows, commentRows] = await Promise.all([
    db
      .select()
      .from(inboxMessages)
      .where(eq(inboxMessages.userId, userId))
      .orderBy(desc(inboxMessages.platformCreatedAt))
      .limit(INBOX_LIMIT),
    // Join comments to their delivery so we can build a /app/posts/[id]
    // link from rootRemoteId. Scope by userId so we only surface comments
    // that hang off the user's own posts.
    db
      .select({
        id: postComments.id,
        platform: postComments.platform,
        authorHandle: postComments.authorHandle,
        authorDisplayName: postComments.authorDisplayName,
        authorAvatarUrl: postComments.authorAvatarUrl,
        content: postComments.content,
        platformCreatedAt: postComments.platformCreatedAt,
        postId: posts.id,
      })
      .from(postComments)
      .innerJoin(
        postDeliveries,
        and(
          eq(postDeliveries.platform, postComments.platform),
          eq(postDeliveries.remotePostId, postComments.rootRemoteId),
        ),
      )
      .innerJoin(posts, eq(posts.id, postDeliveries.postId))
      .where(
        and(eq(postComments.userId, userId), eq(posts.createdByUserId, userId)),
      )
      .orderBy(desc(postComments.platformCreatedAt))
      .limit(COMMENTS_LIMIT),
  ]);

  const fromInbox: ActivityItem[] = inboxRows.map((m) => ({
    id: m.id,
    kind: m.reason === "dm" ? "dm" : "mention",
    platform: m.platform,
    authorHandle: m.authorHandle,
    authorDisplayName: m.authorDisplayName,
    authorAvatarUrl: m.authorAvatarUrl,
    content: m.content,
    platformCreatedAt: m.platformCreatedAt,
    href: `/app/inbox?selected=${m.id}`,
  }));

  const fromComments: ActivityItem[] = commentRows.map((c) => ({
    id: c.id,
    kind: "reply",
    platform: c.platform,
    authorHandle: c.authorHandle,
    authorDisplayName: c.authorDisplayName,
    authorAvatarUrl: c.authorAvatarUrl,
    content: c.content,
    platformCreatedAt: c.platformCreatedAt,
    href: `/app/posts/${c.postId}?channel=${c.platform}`,
  }));

  return [...fromInbox, ...fromComments]
    .sort(
      (a, b) =>
        b.platformCreatedAt.getTime() - a.platformCreatedAt.getTime(),
    )
    .slice(0, MERGED_LIMIT);
}
