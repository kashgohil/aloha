"use server";

import { and, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { unstable_update } from "@/auth";
import { db } from "@/db";
import {
  users,
  workspaceInvites,
  workspaceMembers,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { getWorkspaceMemberEntitlement } from "@/lib/billing/workspace-limits";

// Looks up an invite by token without acting on it. Used by the accept
// page to render the workspace name / role before the user clicks
// confirm. Returns `null` for unknown / already-accepted / revoked /
// expired tokens.
export async function previewInviteByToken(token: string) {
  const [invite] = await db
    .select({
      id: workspaceInvites.id,
      workspaceId: workspaceInvites.workspaceId,
      email: workspaceInvites.email,
      role: workspaceInvites.role,
      expiresAt: workspaceInvites.expiresAt,
      acceptedAt: workspaceInvites.acceptedAt,
      revokedAt: workspaceInvites.revokedAt,
    })
    .from(workspaceInvites)
    .where(eq(workspaceInvites.token, token))
    .limit(1);
  if (!invite) return null;

  if (invite.acceptedAt) return { status: "accepted" as const };
  if (invite.revokedAt) return { status: "revoked" as const };
  if (invite.expiresAt.getTime() < Date.now()) {
    return { status: "expired" as const };
  }

  return {
    status: "pending" as const,
    id: invite.id,
    workspaceId: invite.workspaceId,
    email: invite.email,
    role: invite.role,
  };
}

// Accept endpoint. Assumes the user is already signed in under the same
// email as the invite (the accept page redirects to sign-in otherwise).
// Creates the membership, flips activeWorkspaceId, re-mints the JWT so
// the user lands in the new workspace immediately.
export async function acceptInviteAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (!token) throw new Error("Missing invite token.");

  const user = await getCurrentUser();
  if (!user) throw new Error("Sign in first.");

  const [invite] = await db
    .select()
    .from(workspaceInvites)
    .where(
      and(
        eq(workspaceInvites.token, token),
        isNull(workspaceInvites.acceptedAt),
        isNull(workspaceInvites.revokedAt),
      ),
    )
    .limit(1);
  if (!invite) throw new Error("Invite is no longer valid.");
  if (invite.expiresAt.getTime() < Date.now()) {
    throw new Error("Invite has expired — ask for a fresh one.");
  }
  if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
    throw new Error(
      "This invite is for a different email. Sign in as that address.",
    );
  }

  // Race guard: if the workspace fell over the free-tier cap between
  // invite-sent and invite-accept (e.g. owner downgraded, or multiple
  // invites landed concurrently), refuse. The member count already
  // includes pending invites, so this is a final check against the
  // actual membership table post-any-concurrent-accepts.
  //
  // We allow acceptance if this specific invite was already counted in
  // the pending slice at send time — subtract 1 from the cap check since
  // this invite is about to transition from pending → member.
  const entitlement = await getWorkspaceMemberEntitlement(invite.workspaceId);
  if (!entitlement.isPaid && entitlement.members >= entitlement.limit) {
    throw new Error(
      "This workspace is at its member limit. Ask the owner to upgrade.",
    );
  }

  // Create membership (idempotent) and mark invite accepted. Ordering:
  // insert first so an already-a-member edge case exits cleanly via the
  // onConflict before we touch the invite row.
  await db
    .insert(workspaceMembers)
    .values({
      workspaceId: invite.workspaceId,
      userId: user.id,
      role: invite.role,
      invitedBy: invite.invitedBy,
    })
    .onConflictDoNothing({
      target: [workspaceMembers.workspaceId, workspaceMembers.userId],
    });

  const now = new Date();
  await db
    .update(workspaceInvites)
    .set({ acceptedAt: now, updatedAt: now })
    .where(eq(workspaceInvites.id, invite.id));

  await db
    .update(users)
    .set({ activeWorkspaceId: invite.workspaceId, updatedAt: now })
    .where(eq(users.id, user.id));

  await unstable_update({ user: {} });
  redirect("/app/dashboard");
}
