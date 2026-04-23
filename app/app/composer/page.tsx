import { and, eq, notInArray } from "drizzle-orm";
import { getCurrentContext } from "@/lib/current-context";
import { hasMuseInviteEntitlement } from "@/lib/billing/muse";
import { AUTH_ONLY_PROVIDERS } from "@/lib/auth-providers";
import { db } from "@/db";
import {
  accounts,
  channelProfiles,
  ideas,
  posts,
  type ChannelOverride,
  type DraftMeta,
  type PostMedia,
} from "@/db/schema";
import type { ChannelProfileView } from "@/components/channel-identity";
import { getBestWindowsForUser } from "@/lib/best-time";
import { getEffectiveStatesForUser } from "@/lib/channel-state";
import type { PostStatus } from "@/lib/posts/transitions";
import { listNotes } from "@/app/actions/post-notes";
import type { PostNote } from "@/app/actions/post-notes";
import { Composer } from "./_components/composer";

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

  const [connected, bestWindows, channelStates, museAccess, profileRows] = await Promise.all([
    db
      .selectDistinct({ provider: accounts.provider })
      .from(accounts)
      .where(
        and(
          eq(accounts.workspaceId, workspace.id),
          notInArray(accounts.provider, AUTH_ONLY_PROVIDERS),
        ),
      ),
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
        sourceIdeaTitle = idea.title ?? idea.body.slice(0, 60);
      }
      initialNotes = await listNotes(post.id);
    }
  } else if (ideaId) {
    const [idea] = await db
      .select({ id: ideas.id, title: ideas.title, body: ideas.body })
      .from(ideas)
      .where(and(eq(ideas.id, ideaId), eq(ideas.workspaceId, workspace.id)))
      .limit(1);
    if (idea) {
      initialContent = idea.body;
      sourceIdeaId = idea.id;
      sourceIdeaTitle = idea.title ?? idea.body.slice(0, 60);
    }
  }

  const connectedProviders = connected.map((c) => c.provider);

  return (
    <Composer
      author={{
        name: user.name ?? user.email.split("@")[0],
        email: user.email,
        image: user.image,
        workspaceName: user.workspaceName,
        timezone,
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
    />
  );
}
