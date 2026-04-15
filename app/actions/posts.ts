"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { posts, type ChannelOverride, type PostMedia } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { Client } from "@upstash/qstash";
import { env } from "@/lib/env";

const qstashClient = new Client({
  token: env.QSTASH_TOKEN,
});

export type ComposerPayload = {
  content: string;
  platforms: string[];
  media?: PostMedia[];
  channelContent?: Record<string, ChannelOverride>;
};

export async function saveDraft(payload: ComposerPayload) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    await db.insert(posts).values({
      userId: session.user.id,
      content: payload.content,
      platforms: payload.platforms,
      media: payload.media ?? [],
      channelContent: sanitizeOverrides(payload.channelContent, payload.platforms),
      status: "draft",
    });

    revalidatePath("/app/dashboard");
    revalidatePath("/app/calendar");

    return { success: true };
  } catch (error) {
    console.error("Save Draft Error:", error);
    throw new Error("Failed to save draft");
  }
}

export async function schedulePost(
  payload: ComposerPayload & { scheduledAt: Date },
) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    const results = await db
      .insert(posts)
      .values({
        userId: session.user.id,
        content: payload.content,
        platforms: payload.platforms,
        media: payload.media ?? [],
        channelContent: sanitizeOverrides(
          payload.channelContent,
          payload.platforms,
        ),
        status: "scheduled",
        scheduledAt: payload.scheduledAt,
      })
      .returning();

    const newPost = results[0];

    const delay = Math.max(
      0,
      Math.floor((payload.scheduledAt.getTime() - Date.now()) / 1000),
    );

    await qstashClient.publishJSON({
      url: `${env.APP_URL}/api/qstash`,
      body: {
        postId: newPost.id,
      },
      delay,
    });

    revalidatePath("/app/dashboard");
    revalidatePath("/app/calendar");

    return { success: true, postId: newPost.id };
  } catch (error) {
    console.error("Schedule Post Error:", error);
    throw new Error("Failed to schedule post");
  }
}

// Keep only entries that actually differ from base and target a selected
// platform — avoids dead overrides lingering in JSONB.
function sanitizeOverrides(
  overrides: Record<string, ChannelOverride> | undefined,
  platforms: string[],
): Record<string, ChannelOverride> {
  if (!overrides) return {};
  const out: Record<string, ChannelOverride> = {};
  for (const platform of platforms) {
    const o = overrides[platform];
    if (!o) continue;
    const entry: ChannelOverride = {};
    if (typeof o.content === "string") entry.content = o.content;
    if (Array.isArray(o.media)) entry.media = o.media;
    if (entry.content !== undefined || entry.media !== undefined) {
      out[platform] = entry;
    }
  }
  return out;
}
