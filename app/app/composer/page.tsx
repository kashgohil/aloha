import { and, eq, notInArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/current-user";
import { AUTH_ONLY_PROVIDERS } from "@/lib/auth-providers";
import { db } from "@/db";
import {
  accounts,
  ideas,
  posts,
  type ChannelOverride,
  type PostMedia,
} from "@/db/schema";
import { getBestWindowsForUser } from "@/lib/best-time";
import { getEffectiveStatesForUser } from "@/lib/channel-state";
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
  const user = (await getCurrentUser())!;
  const params = await searchParams;
  const ideaId = first(params.idea) ?? null;
  const postId = first(params.post) ?? null;

  const timezone = user.timezone ?? "UTC";

  const [connected, bestWindows, channelStates] = await Promise.all([
    db
      .selectDistinct({ provider: accounts.provider })
      .from(accounts)
      .where(
        and(
          eq(accounts.userId, user.id),
          notInArray(accounts.provider, AUTH_ONLY_PROVIDERS),
        ),
      ),
    getBestWindowsForUser(user.id, timezone),
    getEffectiveStatesForUser(user.id),
  ]);

  // If the composer was opened from an idea, pull the body so the editor
  // starts populated. We don't flip the idea to "drafted" on open — the
  // flip happens when the user actually saves or schedules a post, in
  // posts.ts.
  let initialContent = "";
  let initialMedia: PostMedia[] = [];
  let initialPlatforms: string[] = [];
  let initialOverrides: Record<string, ChannelOverride> = {};
  let initialScheduledAt: string | null = null;
  let initialStatus: "draft" | "scheduled" | "published" | "failed" | null = null;
  let editingPostId: string | null = null;
  let sourceIdeaId: string | null = null;
  let sourceIdeaTitle: string | null = null;

  if (postId) {
    // Load the post for editing. Ownership-checked. Scheduled-time stays
    // read-only for non-draft posts; content/platforms/media edits flow
    // through updatePost.
    const [post] = await db
      .select({
        id: posts.id,
        content: posts.content,
        platforms: posts.platforms,
        media: posts.media,
        channelContent: posts.channelContent,
        status: posts.status,
        scheduledAt: posts.scheduledAt,
        sourceIdeaId: posts.sourceIdeaId,
      })
      .from(posts)
      .where(and(eq(posts.id, postId), eq(posts.userId, user.id)))
      .limit(1);
    if (post) {
      editingPostId = post.id;
      initialContent = post.content;
      initialPlatforms = post.platforms;
      initialMedia = post.media;
      initialOverrides = post.channelContent;
      initialStatus = post.status as "draft" | "scheduled" | "published" | "failed";
      initialScheduledAt = post.scheduledAt?.toISOString() ?? null;
      sourceIdeaId = post.sourceIdeaId;
      if (sourceIdeaId) {
        const [idea] = await db
          .select({ title: ideas.title, body: ideas.body })
          .from(ideas)
          .where(eq(ideas.id, sourceIdeaId))
          .limit(1);
        if (idea) {
          sourceIdeaTitle = idea.title ?? idea.body.slice(0, 60);
        }
      }
    }
  } else if (ideaId) {
    const [idea] = await db
      .select({ id: ideas.id, title: ideas.title, body: ideas.body })
      .from(ideas)
      .where(and(eq(ideas.id, ideaId), eq(ideas.userId, user.id)))
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
      bestWindows={bestWindows}
      channelStates={channelStates}
      initialContent={initialContent}
      initialMedia={initialMedia}
      initialPlatforms={initialPlatforms}
      initialOverrides={initialOverrides}
      initialScheduledAt={initialScheduledAt}
      initialStatus={initialStatus}
      editingPostId={editingPostId}
      sourceIdeaId={sourceIdeaId}
      sourceIdeaTitle={sourceIdeaTitle}
    />
  );
}
