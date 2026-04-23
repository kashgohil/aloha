"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users, workspaceMembers, workspaces } from "@/db/schema";
import { assertRole, ROLES } from "@/lib/workspaces/roles";
import type { WorkspaceRole } from "@/lib/current-context";

const ASSIGNABLE_ROLES: readonly WorkspaceRole[] = [
  "admin",
  "editor",
  "reviewer",
  "viewer",
];

export type MemberRow = {
  userId: string;
  name: string | null;
  email: string;
  image: string | null;
  role: WorkspaceRole;
  joinedAt: Date;
  isOwner: boolean;
  isSelf: boolean;
};

export async function listWorkspaceMembers(): Promise<MemberRow[]> {
  const ctx = await assertRole(ROLES.ANY);
  const rows = await db
    .select({
      userId: workspaceMembers.userId,
      name: users.name,
      email: users.email,
      image: users.image,
      role: workspaceMembers.role,
      joinedAt: workspaceMembers.joinedAt,
      workspaceOwnerId: workspaces.ownerUserId,
    })
    .from(workspaceMembers)
    .innerJoin(users, eq(users.id, workspaceMembers.userId))
    .innerJoin(
      workspaces,
      eq(workspaces.id, workspaceMembers.workspaceId),
    )
    .where(eq(workspaceMembers.workspaceId, ctx.workspace.id))
    .orderBy(workspaceMembers.joinedAt);

  return rows.map((r) => ({
    userId: r.userId,
    name: r.name,
    email: r.email,
    image: r.image,
    role: r.role as WorkspaceRole,
    joinedAt: r.joinedAt,
    isOwner: r.userId === r.workspaceOwnerId,
    isSelf: r.userId === ctx.user.id,
  }));
}

// Changes a member's role. Owner is protected — role changes for the
// owner happen via transferOwnership instead.
export async function changeMemberRole(formData: FormData) {
  const ctx = await assertRole(ROLES.OWNER);
  const userId = String(formData.get("userId") ?? "");
  const roleRaw = String(formData.get("role") ?? "");
  if (!userId) throw new Error("Missing user.");
  if (!(ASSIGNABLE_ROLES as readonly string[]).includes(roleRaw)) {
    throw new Error("Pick a role.");
  }
  const role = roleRaw as WorkspaceRole;

  // Protect the workspace owner — their role is "owner" until a transfer.
  const [workspace] = await db
    .select({ ownerUserId: workspaces.ownerUserId })
    .from(workspaces)
    .where(eq(workspaces.id, ctx.workspace.id))
    .limit(1);
  if (workspace?.ownerUserId === userId) {
    throw new Error("Owner role changes happen via Transfer ownership.");
  }

  await db
    .update(workspaceMembers)
    .set({ role })
    .where(
      and(
        eq(workspaceMembers.workspaceId, ctx.workspace.id),
        eq(workspaceMembers.userId, userId),
      ),
    );
  revalidatePath("/app/settings/members");
}

export async function removeMember(formData: FormData) {
  const ctx = await assertRole(ROLES.ADMIN);
  const userId = String(formData.get("userId") ?? "");
  if (!userId) throw new Error("Missing user.");

  // Can't remove the owner — must transfer ownership first.
  const [workspace] = await db
    .select({ ownerUserId: workspaces.ownerUserId })
    .from(workspaces)
    .where(eq(workspaces.id, ctx.workspace.id))
    .limit(1);
  if (workspace?.ownerUserId === userId) {
    throw new Error("Transfer ownership before removing the owner.");
  }
  // Admins can't remove other admins/owners — only owners can.
  if (ctx.role === "admin") {
    const [target] = await db
      .select({ role: workspaceMembers.role })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, ctx.workspace.id),
          eq(workspaceMembers.userId, userId),
        ),
      )
      .limit(1);
    if (target?.role === "admin" || target?.role === "owner") {
      throw new Error("Admins can't remove other admins.");
    }
  }

  await db
    .delete(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, ctx.workspace.id),
        eq(workspaceMembers.userId, userId),
      ),
    );

  // If the removed user had this workspace as their active, they'll land
  // on a fallback membership next time they load. Nulling is safer than
  // leaving them pointing at a workspace they can't access.
  await db
    .update(users)
    .set({ activeWorkspaceId: null, updatedAt: new Date() })
    .where(
      and(eq(users.id, userId), eq(users.activeWorkspaceId, ctx.workspace.id)),
    );

  revalidatePath("/app/settings/members");
}

// Transfers workspace ownership. New owner must already be a member;
// old owner is demoted to admin.
export async function transferOwnership(formData: FormData) {
  const ctx = await assertRole(ROLES.OWNER);
  const newOwnerUserId = String(formData.get("userId") ?? "");
  if (!newOwnerUserId) throw new Error("Missing user.");
  if (newOwnerUserId === ctx.user.id) {
    throw new Error("You're already the owner.");
  }

  const [target] = await db
    .select({ role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, ctx.workspace.id),
        eq(workspaceMembers.userId, newOwnerUserId),
      ),
    )
    .limit(1);
  if (!target) throw new Error("Target user isn't a workspace member.");

  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .update(workspaces)
      .set({ ownerUserId: newOwnerUserId, updatedAt: now })
      .where(eq(workspaces.id, ctx.workspace.id));
    await tx
      .update(workspaceMembers)
      .set({ role: "owner" })
      .where(
        and(
          eq(workspaceMembers.workspaceId, ctx.workspace.id),
          eq(workspaceMembers.userId, newOwnerUserId),
        ),
      );
    await tx
      .update(workspaceMembers)
      .set({ role: "admin" })
      .where(
        and(
          eq(workspaceMembers.workspaceId, ctx.workspace.id),
          eq(workspaceMembers.userId, ctx.user.id),
          ne(workspaceMembers.userId, newOwnerUserId),
        ),
      );
  });

  revalidatePath("/app/settings/members");
}
