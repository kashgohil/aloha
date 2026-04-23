import { requireContext, type CurrentContext, type WorkspaceRole } from "@/lib/current-context";

// Role hierarchy, most → least privileged. An "admin or above" check can
// use `ROLE_RANK[role] <= ROLE_RANK.admin`.
export const ROLE_RANK: Record<WorkspaceRole, number> = {
  owner: 0,
  admin: 1,
  editor: 2,
  reviewer: 3,
  viewer: 4,
};

// Preset role sets that map to common permission buckets. Use these in
// action wrappers so grants flow through one place — if we later decide
// reviewers can delete posts, we edit `ROLES.ADMIN` (or introduce a new
// bucket) once instead of hunting through every action.
export const ROLES = {
  // Billing, workspace settings, destructive ops on any data.
  OWNER: ["owner"] as const,
  // Invites, member role changes, delete-post, settings.
  ADMIN: ["owner", "admin"] as const,
  // Approve posts, bypass review, publish directly.
  REVIEWER: ["owner", "admin", "reviewer"] as const,
  // Any write access (create/edit drafts, submit for review).
  EDITOR: ["owner", "admin", "editor", "reviewer"] as const,
  // Any membership (read-only consumers still count).
  ANY: ["owner", "admin", "editor", "reviewer", "viewer"] as const,
};

export class PermissionError extends Error {
  constructor(
    public readonly required: readonly WorkspaceRole[],
    public readonly actual: WorkspaceRole,
  ) {
    super(
      `Requires ${required.join(" or ")} in this workspace; you are ${actual}.`,
    );
    this.name = "PermissionError";
  }
}

// Role guard. Load context, verify the caller has one of the roles in
// `required`, return context for the action body to use. Throws with a
// structured error so UI layers can distinguish "not signed in" from
// "not allowed" when they catch.
export async function assertRole(
  required: readonly WorkspaceRole[],
): Promise<CurrentContext> {
  const ctx = await requireContext();
  if (!required.includes(ctx.role)) {
    throw new PermissionError(required, ctx.role);
  }
  return ctx;
}

// Curried wrapper for server actions. Hides the role check in one line
// at the top of the action:
//
//   export const deletePost = withRole(ROLES.ADMIN, async (ctx, id) => {
//     await db.delete(posts).where(eq(posts.id, id));
//   });
//
// The handler receives `ctx` as its first arg followed by whatever
// arguments the caller passed. `"use server"` files wrap their
// exported actions with this; pages/components call the result just
// like any other server action.
export function withRole<Args extends unknown[], R>(
  required: readonly WorkspaceRole[],
  handler: (ctx: CurrentContext, ...args: Args) => Promise<R>,
): (...args: Args) => Promise<R> {
  return async (...args: Args) => {
    const ctx = await assertRole(required);
    return handler(ctx, ...args);
  };
}

// Client-side helper: does this user hold at least one of these roles?
// Used to hide/disable buttons that would throw on click. Client mirrors
// server — keep the required set in sync.
export function hasRole(
  userRole: WorkspaceRole | null | undefined,
  required: readonly WorkspaceRole[],
): boolean {
  return userRole != null && required.includes(userRole);
}
