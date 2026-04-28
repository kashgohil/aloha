import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  postNotes,
  users,
  workspaces,
  type PostMedia,
} from "@/db/schema";
import {
  loadSharedPost,
  verifyShareToken,
  type SharePermissions,
} from "@/lib/posts/share-tokens";
import { ExternalReviewShell } from "./_components/external-review-shell";

export const dynamic = "force-dynamic";

export type ExternalNote = {
  id: string;
  body: string;
  createdAt: string;
  parentNoteId: string | null;
  // Discriminator: when authorKind is "user" we have a workspace member;
  // when "external" the note was left through this same /r/ surface and
  // we surface the typed name initials.
  authorKind: "user" | "external";
  authorName: string | null;
  authorImage: string | null;
};

async function listSharedNotes(postId: string): Promise<ExternalNote[]> {
  const rows = await db
    .select({
      id: postNotes.id,
      body: postNotes.body,
      createdAt: postNotes.createdAt,
      parentNoteId: postNotes.parentNoteId,
      authorUserId: postNotes.authorUserId,
      externalAuthor: postNotes.externalAuthor,
      authorName: users.name,
      authorImage: users.image,
    })
    .from(postNotes)
    .leftJoin(users, eq(users.id, postNotes.authorUserId))
    .where(eq(postNotes.postId, postId))
    .orderBy(asc(postNotes.createdAt));

  return rows.map((row) => ({
    id: row.id,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    parentNoteId: row.parentNoteId,
    authorKind: row.authorUserId ? "user" : "external",
    authorName: row.authorUserId
      ? row.authorName
      : (row.externalAuthor?.name ?? null),
    authorImage: row.authorUserId ? row.authorImage : null,
  }));
}

export default async function ExternalReviewPage(props: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await props.params;
  const verified = await verifyShareToken(token);

  if (!verified) {
    return (
      <Shell
        heading="Link expired"
        body="This review link no longer works. It may have expired, been revoked, or never existed. Ask whoever sent it for a fresh one."
      />
    );
  }

  const post = await loadSharedPost(verified);
  if (!post) {
    return (
      <Shell
        heading="Draft no longer available"
        body="The post this link pointed to has been removed."
      />
    );
  }

  const [workspace] = await db
    .select({ name: workspaces.name })
    .from(workspaces)
    .where(eq(workspaces.id, verified.workspaceId))
    .limit(1);

  const notes = await listSharedNotes(post.id);

  return (
    <ExternalReviewShell
      token={token}
      permissions={verified.permissions as SharePermissions}
      workspaceName={workspace?.name ?? "the team"}
      post={{
        id: post.id,
        content: post.content,
        platforms: post.platforms,
        media: post.media as PostMedia[],
        status: post.status,
      }}
      notes={notes}
    />
  );
}

function Shell({ heading, body }: { heading: string; body: string }) {
  return (
    <main className="min-h-screen grid place-items-center px-6 py-16 bg-background text-ink">
      <div className="max-w-md w-full text-center space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          Aloha review
        </p>
        <h1 className="font-display text-[36px] leading-[1.05] tracking-[-0.03em]">
          {heading}
        </h1>
        <p className="text-[14.5px] text-ink/70 leading-[1.55]">{body}</p>
      </div>
    </main>
  );
}
