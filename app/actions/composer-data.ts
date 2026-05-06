"use server";

// Data loaders for the composer + studio surfaces. Used by both the
// /app/composer route pages and the global ComposerDialog so the two
// share a single source of truth for what props the client components
// need. Returns a discriminated `kind` so the caller can branch on
// "composer" vs "studio" vs "redirect" without inspecting payload
// shapes.

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  channelProfiles,
  ideas,
  posts,
  type ChannelOverride,
  type DraftMeta,
  type PostMedia,
  type StudioPayload,
} from "@/db/schema";
import type { ChannelProfileView } from "@/components/channel-identity";
import { hasMuseInviteEntitlement } from "@/lib/billing/muse";
import { canPublish } from "@/lib/billing/trial";
import { getCapability } from "@/lib/channels/capabilities";
import { getConnectedProviders } from "@/lib/channels/connected";
import { getEffectiveStatesForUser } from "@/lib/channel-state";
import { getBestWindowsForUser } from "@/lib/best-time";
import { getCurrentContext, type WorkspaceRole } from "@/lib/current-context";
import { markdownToPlain } from "@/lib/markdown";
import type { PostStatus } from "@/lib/posts/transitions";
import {
  listMentionableMembers,
  listNotes,
  type PostNote,
  type PostNoteMention,
} from "@/app/actions/post-notes";

export type ComposerLoadInput = {
  postId?: string | null;
  ideaId?: string | null;
};

export type ComposerProps = {
  author: {
    name: string;
    email: string;
    image: string | null;
    workspaceName: string | null;
    timezone: string;
    workspaceRole: WorkspaceRole | null;
  };
  connectedProviders: string[];
  channelProfiles: Record<string, ChannelProfileView>;
  museAccess: boolean;
  publishAllowed: boolean;
  bestWindows: Awaited<ReturnType<typeof getBestWindowsForUser>>;
  channelStates: Awaited<ReturnType<typeof getEffectiveStatesForUser>>;
  initialContent: string;
  initialMedia: PostMedia[];
  initialPlatforms: string[];
  initialOverrides: Record<string, ChannelOverride>;
  initialScheduledAt: string | null;
  initialStatus: PostStatus | null;
  initialDraftMeta: DraftMeta | null;
  editingPostId: string | null;
  sourceIdeaId: string | null;
  sourceIdeaTitle: string | null;
  initialNotes: PostNote[];
  mentionableMembers: PostNoteMention[];
};

export type StudioProps = {
  postId: string;
  channel: string;
  formId: string;
  availableForms: { id: string; label: string }[];
  initialPayload: StudioPayload;
  status: PostStatus;
  scheduledAt: string | null;
  timezone: string;
  profile: {
    displayName: string | null;
    handle: string | null;
    avatarUrl: string | null;
  } | null;
  author: { name: string; image: string | null };
  museAccess: boolean;
  workspaceRole: WorkspaceRole;
};

export type ComposerLoad =
  | { kind: "composer"; props: ComposerProps }
  | { kind: "studio"; props: StudioProps }
  | { kind: "redirect"; to: string }
  | { kind: "not-found" };

export async function loadComposerData(
  input: ComposerLoadInput,
): Promise<ComposerLoad> {
  const ctx = (await getCurrentContext())!;
  const { user, workspace } = ctx;
  const { postId = null, ideaId = null } = input;
  const timezone = workspace.timezone ?? user.timezone ?? "UTC";

  const [
    connectedProviders,
    bestWindows,
    channelStates,
    museAccess,
    publishAllowed,
    profileRows,
  ] = await Promise.all([
    getConnectedProviders(workspace.id),
    getBestWindowsForUser(user.id, timezone),
    getEffectiveStatesForUser(user.id),
    hasMuseInviteEntitlement(user.id),
    canPublish(workspace.id, workspace.ownerUserId),
    db
      .select({
        channel: channelProfiles.channel,
        displayName: channelProfiles.displayName,
        handle: channelProfiles.handle,
        avatarUrl: channelProfiles.avatarUrl,
        profileUrl: channelProfiles.profileUrl,
        followerCount: channelProfiles.followerCount,
      })
      .from(channelProfiles)
      .where(eq(channelProfiles.workspaceId, workspace.id)),
  ]);
  const channelProfilesById: Record<string, ChannelProfileView> =
    Object.fromEntries(
      profileRows.map((p) => [p.channel, p as ChannelProfileView]),
    );

  let initialContent = "";
  let initialMedia: PostMedia[] = [];
  let initialPlatforms: string[] = [];
  let initialOverrides: Record<string, ChannelOverride> = {};
  let initialScheduledAt: string | null = null;
  let initialStatus: PostStatus | null = null;
  let initialDraftMeta: DraftMeta | null = null;
  let editingPostId: string | null = null;
  let sourceIdeaId: string | null = null;
  let sourceIdeaTitle: string | null = null;
  let initialNotes: PostNote[] = [];
  let mentionableMembers: PostNoteMention[] = [];

  if (postId) {
    const [postRows, ideaRows] = await Promise.all([
      db
        .select({
          id: posts.id,
          content: posts.content,
          platforms: posts.platforms,
          media: posts.media,
          channelContent: posts.channelContent,
          status: posts.status,
          scheduledAt: posts.scheduledAt,
          sourceIdeaId: posts.sourceIdeaId,
          draftMeta: posts.draftMeta,
        })
        .from(posts)
        .where(and(eq(posts.id, postId), eq(posts.workspaceId, workspace.id)))
        .limit(1),
      db
        .select({ id: ideas.id, title: ideas.title, body: ideas.body })
        .from(ideas)
        .innerJoin(posts, eq(posts.sourceIdeaId, ideas.id))
        .where(and(eq(posts.id, postId), eq(posts.workspaceId, workspace.id)))
        .limit(1),
    ]);
    const [post] = postRows;
    const [idea] = ideaRows;
    if (!post) return { kind: "not-found" };
    // If any channel currently in `platforms` carries a Studio form, the
    // legacy single-channel studio shell still owns this draft. Redirect
    // the dialog to studio mode. (Once Phase 3 lands the merged Compose
    // surface, this branch goes away — the unified dialog handles all
    // channels in-place.)
    const studioChannel = post.platforms.find(
      (p) => post.channelContent?.[p]?.form,
    );
    if (studioChannel) {
      return { kind: "redirect", to: `/app/composer/${post.id}/studio` };
    }
    editingPostId = post.id;
    initialContent = post.content;
    initialPlatforms = post.platforms;
    initialMedia = post.media;
    initialOverrides = post.channelContent;
    initialStatus = post.status as PostStatus;
    initialScheduledAt = post.scheduledAt?.toISOString() ?? null;
    initialDraftMeta = post.draftMeta ?? null;
    sourceIdeaId = post.sourceIdeaId;
    if (idea) {
      sourceIdeaTitle = idea.title ?? markdownToPlain(idea.body).slice(0, 60);
    }
    [initialNotes, mentionableMembers] = await Promise.all([
      listNotes(post.id),
      listMentionableMembers(),
    ]);
  } else if (ideaId) {
    const [idea] = await db
      .select({ id: ideas.id, title: ideas.title, body: ideas.body })
      .from(ideas)
      .where(and(eq(ideas.id, ideaId), eq(ideas.workspaceId, workspace.id)))
      .limit(1);
    if (idea) {
      const plainBody = markdownToPlain(idea.body);
      initialContent = plainBody;
      sourceIdeaId = idea.id;
      sourceIdeaTitle = idea.title ?? plainBody.slice(0, 60);
    }
  }

  return {
    kind: "composer",
    props: {
      author: {
        name: user.name ?? user.email.split("@")[0],
        email: user.email,
        image: user.image,
        workspaceName: user.workspaceName,
        timezone,
        workspaceRole: ctx.role,
      },
      connectedProviders: [...connectedProviders],
      channelProfiles: channelProfilesById,
      museAccess,
      publishAllowed,
      bestWindows,
      channelStates,
      initialContent,
      initialMedia,
      initialPlatforms,
      initialOverrides,
      initialScheduledAt,
      initialStatus,
      initialDraftMeta,
      editingPostId,
      sourceIdeaId,
      sourceIdeaTitle,
      initialNotes,
      mentionableMembers,
    },
  };
}

export async function loadStudioData(postId: string): Promise<ComposerLoad> {
  const ctx = (await getCurrentContext())!;
  const { user, workspace } = ctx;

  const [post] = await db
    .select({
      id: posts.id,
      content: posts.content,
      media: posts.media,
      platforms: posts.platforms,
      channelContent: posts.channelContent,
      status: posts.status,
      scheduledAt: posts.scheduledAt,
    })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.workspaceId, workspace.id)))
    .limit(1);

  if (!post) return { kind: "not-found" };
  // Single-channel studio still derives its channel from the (single)
  // platform pin established by `enterStudio`. If no pinned channel
  // carries a form, this draft isn't in studio mode anymore.
  const channel = post.platforms.find(
    (p) => post.channelContent?.[p]?.form,
  );
  const override = channel ? post.channelContent?.[channel] : undefined;
  if (!channel || !override?.form) {
    return { kind: "redirect", to: `/app/composer?post=${postId}` };
  }
  if (post.status === "published" || post.status === "deleted") {
    return { kind: "redirect", to: `/app/posts/${postId}` };
  }
  const cap = getCapability(channel);
  if (!cap) return { kind: "redirect", to: `/app/composer?post=${postId}` };

  const [profileRows, museAccess] = await Promise.all([
    db
      .select({
        displayName: channelProfiles.displayName,
        handle: channelProfiles.handle,
        avatarUrl: channelProfiles.avatarUrl,
      })
      .from(channelProfiles)
      .where(
        and(
          eq(channelProfiles.workspaceId, workspace.id),
          eq(channelProfiles.channel, channel),
        ),
      )
      .limit(1),
    hasMuseInviteEntitlement(user.id),
  ]);

  return {
    kind: "studio",
    props: {
      postId: post.id,
      channel,
      formId: override.form,
      availableForms: cap.forms.map((f) => ({ id: f.id, label: f.label })),
      initialPayload: override.payload ?? {},
      status: post.status as PostStatus,
      scheduledAt: post.scheduledAt?.toISOString() ?? null,
      timezone: workspace.timezone ?? user.timezone ?? "UTC",
      profile: profileRows[0] ?? null,
      author: {
        name: user.name ?? user.email.split("@")[0],
        image: user.image,
      },
      museAccess,
      workspaceRole: ctx.role,
    },
  };
}
