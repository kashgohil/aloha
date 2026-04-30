import { and, eq, notInArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getCurrentContext } from "@/lib/current-context";
import { hasMuseInviteEntitlement } from "@/lib/billing/muse";
import { AUTH_ONLY_PROVIDERS } from "@/lib/auth-providers";
import { db } from "@/db";
import {
  accounts,
  blueskyCredentials,
  channelProfiles,
  ideas,
  mastodonCredentials,
  posts,
  telegramCredentials,
  type ChannelOverride,
  type DraftMeta,
  type PostMedia,
} from "@/db/schema";
import type { ChannelProfileView } from "@/components/channel-identity";
import { getBestWindowsForUser } from "@/lib/best-time";
import { getEffectiveStatesForUser } from "@/lib/channel-state";
import type { PostStatus } from "@/lib/posts/transitions";
import { listMentionableMembers, listNotes } from "@/app/actions/post-notes";
import type { PostNote, PostNoteMention } from "@/app/actions/post-notes";
import { Composer } from "./_components/composer";
import { markdownToPlain } from "@/lib/markdown";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

export default async function ComposerPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const ctx = (await getCurrentContext())!;
  const { user, workspace } = ctx;
  const params = await searchParams;
  const ideaId = first(params.idea) ?? null;
  const postId = first(params.post) ?? null;

  const timezone = workspace.timezone ?? user.timezone ?? "UTC";

  // Connected channels live across several tables: OAuth accounts plus
  // per-channel credential tables for bluesky/mastodon/telegram. Mirror
  // the union pattern used in posts/dashboard/analytics so the composer
  // doesn't show "no channels" when only a non-OAuth channel is wired up.
  const [oauthRows, blueskyRows, mastodonRows, telegramRows, bestWindows, channelStates, museAccess, profileRows] = await Promise.all([
    db
      .selectDistinct({ provider: accounts.provider })
      .from(accounts)
      .where(
        and(
          eq(accounts.workspaceId, workspace.id),
          notInArray(accounts.provider, AUTH_ONLY_PROVIDERS),
        ),
      ),
    db
      .select({ id: blueskyCredentials.id })
      .from(blueskyCredentials)
      .where(eq(blueskyCredentials.workspaceId, workspace.id))
      .limit(1),
    db
      .select({ id: mastodonCredentials.id })
      .from(mastodonCredentials)
      .where(eq(mastodonCredentials.workspaceId, workspace.id))
      .limit(1),
    db
      .select({ id: telegramCredentials.id })
      .from(telegramCredentials)
      .where(eq(telegramCredentials.workspaceId, workspace.id))
      .limit(1),
    getBestWindowsForUser(user.id, timezone),
    getEffectiveStatesForUser(user.id),
    hasMuseInviteEntitlement(user.id),
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
  const channelProfilesById: Record<string, ChannelProfileView> = Object.fromEntries(
    profileRows.map((p) => [p.channel, p as ChannelProfileView]),
  );

  // If the composer was opened from an idea, pull the body so the editor
  // starts populated. We don't flip the idea to "drafted" on open — the
  // flip happens when the user actually saves or schedules a post, in
  // posts.ts.
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
    // Load the post for editing. Ownership-checked. Scheduled-time stays
    // read-only for non-draft posts; content/platforms/media edits flow
    // through updatePost. Post + its source idea are independent queries
    // now that we know the url param; fire them together.
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
          studioMode: posts.studioMode,
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
    // Studio-mode drafts (including scheduled ones being re-opened for
    // edit) belong in the Studio route, not the flat composer. Redirect
    // before rendering so the URL is canonical.
    if (post?.studioMode) {
      redirect(`/app/composer/${post.id}/studio`);
    }
    if (post) {
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
    }
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

  const connectedProviders = Array.from(
    new Set<string>([
      ...oauthRows.map((c) => c.provider),
      ...(blueskyRows.length > 0 ? ["bluesky"] : []),
      ...(mastodonRows.length > 0 ? ["mastodon"] : []),
      ...(telegramRows.length > 0 ? ["telegram"] : []),
    ]),
  );

  return (
    <Composer
      author={{
        name: user.name ?? user.email.split("@")[0],
        email: user.email,
        image: user.image,
        workspaceName: user.workspaceName,
        timezone,
        workspaceRole: ctx.role,
      }}
      connectedProviders={connectedProviders}
      channelProfiles={channelProfilesById}
      museAccess={museAccess}
      bestWindows={bestWindows}
      channelStates={channelStates}
      initialContent={initialContent}
      initialMedia={initialMedia}
      initialPlatforms={initialPlatforms}
      initialOverrides={initialOverrides}
      initialScheduledAt={initialScheduledAt}
      initialStatus={initialStatus}
      initialDraftMeta={initialDraftMeta}
      editingPostId={editingPostId}
      sourceIdeaId={sourceIdeaId}
      sourceIdeaTitle={sourceIdeaTitle}
      initialNotes={initialNotes}
      mentionableMembers={mentionableMembers}
    />
  );
}
