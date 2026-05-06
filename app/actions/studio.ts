"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  posts,
  type ChannelOverride,
  type StudioPayload,
} from "@/db/schema";
import { assertRole } from "@/lib/workspaces/assert-role";
import { ROLES } from "@/lib/workspaces/roles";
import { getCapability, getForm } from "@/lib/channels/capabilities";

// Enter Studio mode for a draft on a single channel. Writes the channel's
// form + structured payload into `channelContent[channel]`, and pins
// `platforms` to `[channel]` while we still have a single-channel studio
// shell. (When the merged Compose surface lands, multi-channel studio
// state coexists in `channelContent` without touching `platforms`.)
//
// No-op when the channel is already pinned to the same form — lets reopen
// + accidental double-clicks coalesce.
export async function enterStudio(
  postId: string,
  channel: string,
  formId?: string,
) {
  const ctx = await assertRole(ROLES.EDITOR);

  const [post] = await db
    .select({
      id: posts.id,
      content: posts.content,
      media: posts.media,
      status: posts.status,
      channelContent: posts.channelContent,
    })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.workspaceId, ctx.workspace.id)))
    .limit(1);
  if (!post) throw new Error("Post not found");
  if (post.status === "published" || post.status === "deleted") {
    throw new Error("This post can no longer be edited.");
  }

  const cap = getCapability(channel);
  if (!cap) throw new Error(`Studio is not available for ${channel}.`);

  const form = formId
    ? cap.forms.find((f) => f.id === formId)
    : cap.forms[0];
  if (!form) throw new Error(`Unknown Studio form: ${formId ?? "(default)"}`);

  const existing = post.channelContent?.[channel];
  if (existing?.form === form.id) {
    return { success: true };
  }

  const payload: StudioPayload = form.hydrate({
    content: post.content,
    media: post.media ?? [],
  });

  const nextChannelContent: Record<string, ChannelOverride> = {
    [channel]: { ...(existing ?? {}), form: form.id, payload },
  };

  await db
    .update(posts)
    .set({
      platforms: [channel],
      channelContent: nextChannelContent,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, postId));

  return { success: true };
}

// Update the studio payload for a channel in-place while the user edits.
// Separate from `updatePost` so we don't pay for the full ComposerPayload
// round-trip on every keystroke-coalesced save.
export async function saveStudioPayload(
  postId: string,
  channel: string,
  payload: StudioPayload,
) {
  const ctx = await assertRole(ROLES.EDITOR);

  const [post] = await db
    .select({
      id: posts.id,
      status: posts.status,
      channelContent: posts.channelContent,
    })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.workspaceId, ctx.workspace.id)))
    .limit(1);
  if (!post) throw new Error("Post not found");
  const existing = post.channelContent?.[channel];
  if (!existing?.form) {
    throw new Error("Channel is not in Studio mode.");
  }
  if (post.status !== "draft") {
    throw new Error(
      "Post is locked. Move it back to draft to edit its content.",
    );
  }

  await db
    .update(posts)
    .set({
      channelContent: {
        ...post.channelContent,
        [channel]: { ...existing, payload },
      },
      updatedAt: new Date(),
    })
    .where(eq(posts.id, postId));

  return { success: true };
}

// Swap to a different form within the same channel. Re-hydrates from the
// current payload by routing through the outgoing form's `flatten` and the
// incoming form's `hydrate` — lossy but predictable.
export async function switchStudioForm(
  postId: string,
  channel: string,
  nextFormId: string,
) {
  const ctx = await assertRole(ROLES.EDITOR);

  const [post] = await db
    .select({
      id: posts.id,
      status: posts.status,
      channelContent: posts.channelContent,
      media: posts.media,
    })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.workspaceId, ctx.workspace.id)))
    .limit(1);
  const existing = post?.channelContent?.[channel];
  if (!post || !existing?.form) {
    throw new Error("Channel is not in Studio mode.");
  }
  if (post.status !== "draft") {
    throw new Error(
      "Post is locked. Move it back to draft to edit its content.",
    );
  }

  const current = getForm(channel, existing.form);
  const next = getForm(channel, nextFormId);
  if (!current || !next) throw new Error("Unknown Studio form.");

  const flat = current.flatten(existing.payload ?? {});
  const nextPayload = next.hydrate({
    content: flat.text,
    media: flat.media,
  });

  await db
    .update(posts)
    .set({
      channelContent: {
        ...post.channelContent,
        [channel]: { ...existing, form: nextFormId, payload: nextPayload },
      },
      updatedAt: new Date(),
    })
    .where(eq(posts.id, postId));

  return { success: true };
}

// Exit Studio for a single channel and return to multi-channel Compose.
// Flattens the structured payload back into the flat `content` + `media`
// fields and clears `form`/`payload` for the channel. `platforms` stays
// pinned to the studio channel so the user can explicitly re-fanout from
// Compose if they want.
export async function exitStudio(postId: string, channel: string) {
  const ctx = await assertRole(ROLES.EDITOR);

  const [post] = await db
    .select({
      id: posts.id,
      status: posts.status,
      channelContent: posts.channelContent,
    })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.workspaceId, ctx.workspace.id)))
    .limit(1);
  const existing = post?.channelContent?.[channel];
  if (!post || !existing?.form) {
    throw new Error("Channel is not in Studio mode.");
  }
  if (post.status !== "draft") {
    throw new Error(
      "Post is locked. Move it back to draft to edit its content.",
    );
  }

  const form = getForm(channel, existing.form);
  const flat = form
    ? form.flatten(existing.payload ?? {})
    : { text: "", media: [] };

  // Strip form + payload from this channel's override. If nothing else
  // remains, drop the entry so JSONB stays tidy.
  const nextEntry: ChannelOverride = { ...existing };
  delete nextEntry.form;
  delete nextEntry.payload;
  const nextChannelContent = { ...post.channelContent };
  if (
    nextEntry.content === undefined &&
    nextEntry.media === undefined
  ) {
    delete nextChannelContent[channel];
  } else {
    nextChannelContent[channel] = nextEntry;
  }

  await db
    .update(posts)
    .set({
      content: flat.text,
      media: flat.media,
      channelContent: nextChannelContent,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, postId));

  revalidatePath("/app/dashboard");
  revalidatePath("/app/calendar");
  return { success: true };
}
