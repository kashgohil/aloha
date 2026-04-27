import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { channelProfiles, posts } from "@/db/schema";
import { hasMuseInviteEntitlement } from "@/lib/billing/muse";
import { getCurrentContext } from "@/lib/current-context";
import { getCapability } from "@/lib/channels/capabilities";
import type { PostStatus } from "@/lib/posts/transitions";
import { StudioShell } from "./_components/studio-shell";

export const dynamic = "force-dynamic";

export default async function StudioPage({
  params,
}: {
  params: Promise<{ draftId: string }>;
}) {
  const ctx = (await getCurrentContext())!;
  const { user, workspace } = ctx;
  const { draftId } = await params;

  const [post] = await db
    .select({
      id: posts.id,
      content: posts.content,
      media: posts.media,
      platforms: posts.platforms,
      status: posts.status,
      scheduledAt: posts.scheduledAt,
      studioMode: posts.studioMode,
      studioPayload: posts.studioPayload,
    })
    .from(posts)
    .where(and(eq(posts.id, draftId), eq(posts.workspaceId, workspace.id)))
    .limit(1);

  if (!post) notFound();
  // Studio requires an initialized studio_mode. `enterStudio` must be
  // called before navigating here; if it wasn't, bounce back to Compose.
  if (!post.studioMode) {
    redirect(`/app/composer?post=${draftId}`);
  }
  // Published / deleted posts are terminal — Studio has nothing to do.
  if (post.status === "published" || post.status === "deleted") {
    redirect(`/app/posts/${draftId}`);
  }

  const cap = getCapability(post.studioMode.channel);
  if (!cap) {
    // Capability was removed after the draft entered Studio. Route back
    // to Compose; `exitStudio` can reconcile there.
    redirect(`/app/composer?post=${draftId}`);
  }

  const [profile, museAccess] = await Promise.all([
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
          eq(channelProfiles.channel, post.studioMode.channel),
        ),
      )
      .limit(1),
    hasMuseInviteEntitlement(user.id),
  ]);

  return (
    <StudioShell
      postId={post.id}
      channel={post.studioMode.channel}
      formId={post.studioMode.form}
      availableForms={cap.forms.map((f) => ({ id: f.id, label: f.label }))}
      initialPayload={post.studioPayload ?? {}}
      status={post.status as PostStatus}
      scheduledAt={post.scheduledAt?.toISOString() ?? null}
      timezone={workspace.timezone ?? user.timezone ?? "UTC"}
      profile={profile[0] ?? null}
      author={{
        name: user.name ?? user.email.split("@")[0],
        image: user.image,
      }}
      museAccess={museAccess}
      workspaceRole={ctx.role}
    />
  );
}
