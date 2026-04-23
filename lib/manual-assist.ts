// Manual-assist reminder service. When a scheduled delivery transitions to
// `manual_assist` at post-time (§8 state machine), we email the user the
// pre-formatted content so they can copy and publish natively. This is the
// only reminder channel wired today — push/in-app are follow-ups.
//
// Called from the publisher dispatcher right after marking the delivery as
// `manual_assist`. Failures are logged but never propagate; a failed email
// shouldn't block the dispatcher from proceeding to other platforms.

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { posts, users, type PostMedia } from "@/db/schema";
import { sendEmail } from "@/lib/email/send";
import { manualAssistEmail } from "@/lib/email/templates/manual-assist";
import { env } from "@/lib/env";

const PLATFORM_NAMES: Record<string, string> = {
  twitter: "X",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  instagram: "Instagram",
  threads: "Threads",
  tiktok: "TikTok",
  youtube: "YouTube",
  bluesky: "Bluesky",
  mastodon: "Mastodon",
  medium: "Medium",
  reddit: "Reddit",
  pinterest: "Pinterest",
};

function platformDisplayName(id: string): string {
  return PLATFORM_NAMES[id] ?? id;
}

export async function sendManualAssistReminder(input: {
  userId: string;
  postId: string;
  platform: string;
  content: string;
  media: PostMedia[];
  scheduledAt: Date | null;
}): Promise<void> {
  const [user] = await db
    .select({ email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, input.userId))
    .limit(1);
  if (!user?.email) {
    console.warn(
      "[manual-assist] skipping reminder: user email not found",
      input.userId,
    );
    return;
  }

  const email = manualAssistEmail({
    name: user.name,
    platform: input.platform,
    platformName: platformDisplayName(input.platform),
    postId: input.postId,
    content: input.content,
    mediaUrls: input.media.map((m) => m.url),
    scheduledAt: input.scheduledAt,
    appUrl: env.APP_URL,
  });

  await sendEmail({
    to: user.email,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
}

// Convenience for the dispatcher — loads the post row to avoid duplicating
// the schema-coupling query in multiple places.
export async function sendManualAssistReminderForDelivery(
  postId: string,
  platform: string,
): Promise<void> {
  const post = await db.query.posts.findFirst({ where: eq(posts.id, postId) });
  if (!post) return;

  const override = post.channelContent?.[platform];
  const content = override?.content ?? post.content;
  const media = override?.media ?? post.media;

  await sendManualAssistReminder({
    userId: post.createdByUserId,
    postId: post.id,
    platform,
    content,
    media,
    scheduledAt: post.scheduledAt ?? null,
  });
}
