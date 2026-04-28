import "server-only";
import { randomBytes } from "crypto";
import { and, eq, isNull, gt, or } from "drizzle-orm";
import { db } from "@/db";
import { postShareTokens, posts, workspaces } from "@/db/schema";
import { env } from "@/lib/env";

export type SharePermissions = "comment_only" | "comment_approve";

// 32 bytes of entropy. Mirrors `workspaceInvites.token` — opaque, looked
// up directly. Not stateless (cf. unsubscribe HMAC) because we need to
// support per-token revocation + TTL without dragging the secret-set into
// the verification flow.
export function mintShareToken(): string {
  return randomBytes(32).toString("base64url");
}

export function shareReviewUrl(token: string): string {
  return `${env.APP_URL}/r/${token}`;
}

export type VerifiedShareToken = {
  tokenId: string;
  postId: string;
  workspaceId: string;
  workspaceTimezone: string | null;
  permissions: SharePermissions;
};

// Resolves the opaque token to its post + workspace context. Returns null
// for any failure mode (unknown token, revoked, expired) so callers can
// render a single "this link no longer works" page without leaking which
// reason. A null `expiresAt` means "no expiry"; a non-null `revokedAt`
// always invalidates regardless of expiry.
export async function verifyShareToken(
  token: string,
): Promise<VerifiedShareToken | null> {
  if (!token) return null;
  const now = new Date();
  const [row] = await db
    .select({
      tokenId: postShareTokens.id,
      postId: postShareTokens.postId,
      workspaceId: postShareTokens.workspaceId,
      permissions: postShareTokens.permissions,
      expiresAt: postShareTokens.expiresAt,
      revokedAt: postShareTokens.revokedAt,
      workspaceTimezone: workspaces.timezone,
    })
    .from(postShareTokens)
    .innerJoin(workspaces, eq(workspaces.id, postShareTokens.workspaceId))
    .where(
      and(
        eq(postShareTokens.token, token),
        isNull(postShareTokens.revokedAt),
        or(isNull(postShareTokens.expiresAt), gt(postShareTokens.expiresAt, now)),
      ),
    )
    .limit(1);
  if (!row) return null;
  return {
    tokenId: row.tokenId,
    postId: row.postId,
    workspaceId: row.workspaceId,
    workspaceTimezone: row.workspaceTimezone,
    permissions: row.permissions as SharePermissions,
  };
}

// Confirms the post still exists and lives in the workspace the token
// was minted for. Cascade deletes already cover the cleanup path; this
// is a defensive read for the public route to fail loudly if a post was
// soft-deleted (deletedAt set) without revoking the token.
export async function loadSharedPost(verified: VerifiedShareToken) {
  const [post] = await db
    .select()
    .from(posts)
    .where(
      and(
        eq(posts.id, verified.postId),
        eq(posts.workspaceId, verified.workspaceId),
      ),
    )
    .limit(1);
  if (!post) return null;
  if (post.deletedAt) return null;
  return post;
}
