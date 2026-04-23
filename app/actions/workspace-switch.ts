"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { unstable_update } from "@/auth";
import { db } from "@/db";
import { users, workspaceMembers, workspaces } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { getWorkspaceCreationEntitlement } from "@/lib/billing/workspace-limits";

export type WorkspaceChoice = {
  id: string;
  name: string;
  role: "owner" | "admin" | "editor" | "reviewer" | "viewer";
  isActive: boolean;
};

// Lists every workspace the user is a member of, newest-join first, with
// their role in each. Drives the switcher dropdown.
export async function listMyWorkspaces(): Promise<WorkspaceChoice[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const rows = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(eq(workspaceMembers.userId, user.id));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    isActive: r.id === user.activeWorkspaceId,
  }));
}

// Switches the user's active workspace. Ownership check is strict — must
// be an existing `workspace_members` row. Re-mints the JWT so every
// subsequent request sees the new workspace; full-tree revalidate so
// server-rendered pages drop their per-workspace data.
export async function switchWorkspace(workspaceId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const [membership] = await db
    .select({ role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, user.id),
      ),
    )
    .limit(1);
  if (!membership) {
    throw new Error("Not a member of that workspace.");
  }

  if (user.activeWorkspaceId === workspaceId) {
    // No-op; avoid a pointless JWT re-mint.
    return { success: true };
  }

  await db
    .update(users)
    .set({ activeWorkspaceId: workspaceId, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  // Force the JWT callback to refetch. Token now carries the new
  // activeWorkspaceId + role on the next request.
  await unstable_update({ user: {} });

  revalidatePath("/app", "layout");
  return { success: true };
}

const VALID_ROLES = [
  "solo",
  "creator",
  "team",
  "agency",
  "nonprofit",
] as const;
type WorkspaceRole = (typeof VALID_ROLES)[number];
const isWorkspaceRole = (v: unknown): v is WorkspaceRole =>
  typeof v === "string" && (VALID_ROLES as readonly string[]).includes(v);

const isValidTimezone = (tz: string) => {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

// Creates a new workspace, adds the current user as its owner, and
// switches to it. Used by /app/workspace/new as the form action.
// Intentionally terse: name required, role + timezone optional (falls
// back to the user's profile timezone). Billing isn't provisioned here —
// new workspaces start on the free tier until the user hits checkout.
export async function createWorkspaceAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // Free-tier gate — owners on free plan cap at one workspace. Checked
  // here in addition to the UI affordance so a direct POST can't skip it.
  const entitlement = await getWorkspaceCreationEntitlement(user.id);
  if (!entitlement.allowed) {
    throw new Error(entitlement.reason ?? "Workspace limit reached.");
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Workspace name is required.");
  if (name.length > 60) {
    throw new Error("Workspace name must be 60 characters or fewer.");
  }

  const roleRaw = formData.get("role");
  const role = isWorkspaceRole(roleRaw) ? roleRaw : null;

  const tzInput = String(formData.get("timezone") ?? "").trim();
  const timezone = isValidTimezone(tzInput)
    ? tzInput
    : (user.timezone ?? "UTC");

  const [workspace] = await db
    .insert(workspaces)
    .values({
      name,
      ownerUserId: user.id,
      timezone,
      role,
    })
    .returning({ id: workspaces.id });

  await db.insert(workspaceMembers).values({
    workspaceId: workspace.id,
    userId: user.id,
    role: "owner",
  });

  // Flip the user's active workspace so they land in the new one
  // immediately after submitting the form.
  await db
    .update(users)
    .set({ activeWorkspaceId: workspace.id, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  await unstable_update({ user: {} });
  revalidatePath("/app", "layout");
  redirect("/app/dashboard");
}
