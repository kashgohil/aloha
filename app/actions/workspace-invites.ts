"use server";

import { randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  users,
  workspaceInvites,
  workspaceMembers,
  workspaces,
} from "@/db/schema";
import { sendEmail } from "@/lib/email/send";
import { workspaceInviteEmail } from "@/lib/email/templates/workspace-invite";
import { ROLES } from "@/lib/workspaces/roles";
import { assertRole } from "@/lib/workspaces/assert-role";
import { assertActive } from "@/lib/workspaces/assert-active";
import type { WorkspaceRole } from "@/lib/current-context";
import { getAccountSeatEntitlement } from "@/lib/billing/workspace-limits";

// 7-day expiry is the sweet spot: long enough to survive a weekend
// inbox, short enough that forgotten invites don't hang around forever.
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const ASSIGNABLE_ROLES: readonly WorkspaceRole[] = [
  "admin",
  "editor",
  "reviewer",
  "viewer",
];

function generateToken(): string {
  // 32 bytes → 256 bits of entropy, URL-safe.
  return randomBytes(32).toString("base64url");
}

export type PendingInvite = {
  id: string;
  email: string;
  role: WorkspaceRole;
  invitedBy: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
};

export async function listPendingInvites(): Promise<PendingInvite[]> {
  const ctx = await assertRole(ROLES.ADMIN);
  const rows = await db
    .select()
    .from(workspaceInvites)
    .where(
      and(
        eq(workspaceInvites.workspaceId, ctx.workspace.id),
        isNull(workspaceInvites.acceptedAt),
        isNull(workspaceInvites.revokedAt),
      ),
    )
    .orderBy(workspaceInvites.createdAt);
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    role: r.role as WorkspaceRole,
    invitedBy: r.invitedBy,
    expiresAt: r.expiresAt,
    acceptedAt: r.acceptedAt,
    revokedAt: r.revokedAt,
    createdAt: r.createdAt,
  }));
}

export async function sendWorkspaceInvite(formData: FormData) {
  const ctx = await assertActive(ROLES.ADMIN);

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const roleRaw = String(formData.get("role") ?? "editor");

  if (!email || !email.includes("@")) {
    throw new Error("Enter a valid email address.");
  }
  if (!(ASSIGNABLE_ROLES as readonly string[]).includes(roleRaw)) {
    throw new Error("Pick a role.");
  }
  const role = roleRaw as WorkspaceRole;

  // Don't re-invite an existing member.
  const [existingMember] = await db
    .select({ userId: workspaceMembers.userId })
    .from(workspaceMembers)
    .innerJoin(users, eq(users.id, workspaceMembers.userId))
    .where(
      and(
        eq(workspaceMembers.workspaceId, ctx.workspace.id),
        eq(users.email, email),
      ),
    )
    .limit(1);
  if (existingMember) {
    throw new Error("That email already belongs to a workspace member.");
  }

  // Account-pool seat cap: existing members + pending invites across all
  // workspaces the owner controls. Checked here so sending an invite that
  // couldn't be accepted is blocked up front; acceptance re-checks as a
  // race guard. Seat budget is the owner's, not the inviter's.
  const entitlement = await getAccountSeatEntitlement(
    ctx.workspace.ownerUserId,
  );
  if (!entitlement.allowed) {
    throw new Error(entitlement.reason ?? "Seat limit reached.");
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
  const now = new Date();

  // Resend = upsert an existing pending row for the same address, so an
  // admin can re-send (refresh token + expiry) without piling up
  // duplicate rows. The unique index enforces one row per (workspace, email).
  await db
    .insert(workspaceInvites)
    .values({
      workspaceId: ctx.workspace.id,
      email,
      role,
      token,
      invitedBy: ctx.user.id,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: [workspaceInvites.workspaceId, workspaceInvites.email],
      set: {
        role,
        token,
        expiresAt,
        invitedBy: ctx.user.id,
        acceptedAt: null,
        revokedAt: null,
        updatedAt: now,
      },
    });

  const tpl = workspaceInviteEmail({
    inviterName: ctx.user.name,
    workspaceName: ctx.workspace.name,
    role,
    token,
  });
  await sendEmail({
    to: email,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
  });

  revalidatePath("/app/settings/members");
}

export async function revokeWorkspaceInvite(inviteId: string) {
  const ctx = await assertRole(ROLES.ADMIN);
  await db
    .update(workspaceInvites)
    .set({ revokedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(workspaceInvites.id, inviteId),
        eq(workspaceInvites.workspaceId, ctx.workspace.id),
      ),
    );
  revalidatePath("/app/settings/members");
}
