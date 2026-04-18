"use server";

import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  ideas,
  posts,
  type ChannelOverride,
  type PostMedia,
} from "@/db/schema";
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
  // When the composer was seeded from an idea, the client threads the idea
  // id back so we can stamp provenance on the post and flip the idea to
  // `drafted`. Advisory — posts without a source work fine.
  sourceIdeaId?: string | null;
};

async function flipIdeaToDrafted(
  userId: string,
  ideaId: string | null | undefined,
) {
  if (!ideaId) return;
  // Only move from `new` → `drafted`. Respect manual `archived` or already
  // `drafted` states — we don't want to un-archive by accident.
  await db
    .update(ideas)
    .set({ status: "drafted", updatedAt: new Date() })
    .where(
      and(
        eq(ideas.id, ideaId),
        eq(ideas.userId, userId),
        eq(ideas.status, "new"),
      ),
    );
}

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
      sourceIdeaId: payload.sourceIdeaId ?? null,
    });

    await flipIdeaToDrafted(session.user.id, payload.sourceIdeaId);

    revalidatePath("/app/dashboard");
    revalidatePath("/app/calendar");
    revalidatePath("/app/ideas");

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
        sourceIdeaId: payload.sourceIdeaId ?? null,
      })
      .returning();

    const newPost = results[0];

    await flipIdeaToDrafted(session.user.id, payload.sourceIdeaId);

    const delay = Math.max(
      0,
      Math.floor((payload.scheduledAt.getTime() - Date.now()) / 1000),
    );

    await qstashClient.publishJSON({
      url: `${env.APP_URL}/api/qstash`,
      body: {
        postId: newPost.id,
        intendedScheduledAt: payload.scheduledAt.toISOString(),
      },
      delay,
    });

    revalidatePath("/app/dashboard");
    revalidatePath("/app/calendar");
    revalidatePath("/app/ideas");

    return { success: true, postId: newPost.id };
  } catch (error) {
    console.error("Schedule Post Error:", error);
    throw new Error("Failed to schedule post");
  }
}

// Updates an existing draft or scheduled post in place. Content / media /
// platforms / overrides are always updatable. `scheduledAt` + status flips
// handle the draft → scheduled conversion and reschedule paths:
//
//   - Draft + no scheduledAt arg           → stays a draft, fields updated.
//   - Draft + scheduledAt arg              → flips to scheduled, QStash queued.
//   - Scheduled + scheduledAt=null arg     → flips back to draft, old QStash
//                                            message ignored on fire (handler
//                                            checks status).
//   - Scheduled + new scheduledAt arg      → reschedules. A new QStash message
//                                            is queued for the new time; the
//                                            old one still fires at the old
//                                            time but no-ops because the
//                                            handler re-reads status +
//                                            scheduledAt and only publishes
//                                            when they're both still valid.
//
// Published posts are not editable — caller is expected to gate that in the
// UI; we reject it here as a belt-and-braces guard.
export async function updatePost(
  postId: string,
  payload: ComposerPayload & { scheduledAt?: Date | null },
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [existing] = await db
    .select({
      id: posts.id,
      userId: posts.userId,
      status: posts.status,
    })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.userId, session.user.id)))
    .limit(1);
  if (!existing) throw new Error("Post not found");
  if (existing.status === "published") {
    throw new Error("Published posts are read-only.");
  }

  const scheduleRequested =
    payload.scheduledAt !== undefined && payload.scheduledAt !== null;
  const nextStatus: "draft" | "scheduled" = scheduleRequested
    ? "scheduled"
    : "draft";

  try {
    await db
      .update(posts)
      .set({
        content: payload.content,
        platforms: payload.platforms,
        media: payload.media ?? [],
        channelContent: sanitizeOverrides(
          payload.channelContent,
          payload.platforms,
        ),
        status: nextStatus,
        scheduledAt: scheduleRequested ? payload.scheduledAt! : null,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId));

    if (scheduleRequested && payload.scheduledAt) {
      const delay = Math.max(
        0,
        Math.floor((payload.scheduledAt.getTime() - Date.now()) / 1000),
      );
      await qstashClient.publishJSON({
        url: `${env.APP_URL}/api/qstash`,
        body: {
          postId,
          intendedScheduledAt: payload.scheduledAt.toISOString(),
        },
        delay,
      });
    }

    revalidatePath("/app/dashboard");
    revalidatePath("/app/calendar");
    revalidatePath("/app/ideas");

    return { success: true, postId };
  } catch (error) {
    console.error("Update Post Error:", error);
    throw new Error("Failed to update post");
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
