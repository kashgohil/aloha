"use server";

import { and, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { unstable_update } from "@/auth";
import { db } from "@/db";
import {
  users,
  workspaceInvites,
  workspaceMembers,
  workspaces,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { getAccountSeatEntitlement } from "@/lib/billing/workspace-limits";

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

  // Race guard: if the owner's seat pool fell below capacity between
  // invite-sent and invite-accept (downgrade, concurrent accepts), refuse.
  // The pending-invite count already includes this invite, so on the
  // free-tier path we only block when *accepted* members are already at
  // the cap — i.e. there's no slot for this one to flip into.
  const [ws] = await db
    .select({ ownerUserId: workspaces.ownerUserId })
    .from(workspaces)
    .where(eq(workspaces.id, invite.workspaceId))
    .limit(1);
  if (!ws) throw new Error("Workspace no longer exists.");
  const entitlement = await getAccountSeatEntitlement(ws.ownerUserId);
  if (!entitlement.isPaid && entitlement.members >= entitlement.limit) {
    throw new Error(
      "Account is at its seat limit. Ask the owner to upgrade.",
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
