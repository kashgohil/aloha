"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { postShareTokens, posts } from "@/db/schema";
import { ROLES } from "@/lib/workspaces/roles";
import { assertRole } from "@/lib/workspaces/assert-role";
import {
  mintShareToken,
  shareReviewUrl,
  type SharePermissions,
} from "@/lib/posts/share-tokens";

export type ShareLinkRow = {
  id: string;
  url: string;
  permissions: SharePermissions;
  createdAt: Date;
  expiresAt: Date | null;
  revokedAt: Date | null;
  createdByUserId: string;
};

const ALLOWED_TTL_DAYS = new Set([1, 7, 30]);

async function loadOwnedPost(postId: string, workspaceId: string) {
  const [row] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.workspaceId, workspaceId)))
    .limit(1);
  if (!row) throw new Error("Post not found");
  return row;
}

export async function createShareLink(
  postId: string,
  options: {
    permissions?: SharePermissions;
    // 1, 7, or 30 days. No "forever" option by design — every link
    // auto-expires so an old draft can't keep leaking via a stale URL.
    expiresInDays: number;
  },
): Promise<{ id: string; url: string }> {
  const ctx = await assertRole(ROLES.REVIEWER);
  await loadOwnedPost(postId, ctx.workspace.id);

  const permissions: SharePermissions =
    options.permissions ?? "comment_approve";
  if (!ALLOWED_TTL_DAYS.has(options.expiresInDays)) {
    throw new Error("Pick a TTL of 1, 7, or 30 days.");
  }
  const expiresAt = new Date(
    Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000,
  );

  const token = mintShareToken();
  const [row] = await db
    .insert(postShareTokens)
    .values({
      postId,
      workspaceId: ctx.workspace.id,
      createdByUserId: ctx.user.id,
      token,
      permissions,
      expiresAt,
    })
    .returning({ id: postShareTokens.id });

  revalidatePath(`/app/posts/${postId}`);
  return { id: row.id, url: shareReviewUrl(token) };
}

export async function revokeShareLink(tokenId: string) {
  const ctx = await assertRole(ROLES.REVIEWER);

  const [row] = await db
    .select({ id: postShareTokens.id, postId: postShareTokens.postId })
    .from(postShareTokens)
    .where(
      and(
        eq(postShareTokens.id, tokenId),
        eq(postShareTokens.workspaceId, ctx.workspace.id),
      ),
    )
    .limit(1);
  if (!row) throw new Error("Share link not found");

  await db
    .update(postShareTokens)
    .set({ revokedAt: new Date() })
    .where(eq(postShareTokens.id, tokenId));

  revalidatePath(`/app/posts/${row.postId}`);
  return { success: true };
}

export async function listShareLinks(postId: string): Promise<ShareLinkRow[]> {
  const ctx = await assertRole(ROLES.REVIEWER);
  await loadOwnedPost(postId, ctx.workspace.id);

  const rows = await db
    .select({
      id: postShareTokens.id,
      token: postShareTokens.token,
      permissions: postShareTokens.permissions,
      createdAt: postShareTokens.createdAt,
      expiresAt: postShareTokens.expiresAt,
      revokedAt: postShareTokens.revokedAt,
      createdByUserId: postShareTokens.createdByUserId,
    })
    .from(postShareTokens)
    .where(eq(postShareTokens.postId, postId))
    .orderBy(desc(postShareTokens.createdAt));

  return rows.map((r) => ({
    id: r.id,
    url: shareReviewUrl(r.token),
    permissions: r.permissions as SharePermissions,
    createdAt: r.createdAt,
    expiresAt: r.expiresAt,
    revokedAt: r.revokedAt,
    createdByUserId: r.createdByUserId,
  }));
}
