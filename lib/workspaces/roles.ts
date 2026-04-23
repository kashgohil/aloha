import type { WorkspaceRole } from "@/lib/current-context";

export type { WorkspaceRole };

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

// Client-side helper: does this user hold at least one of these roles?
// Used to hide/disable buttons that would throw on click. Client mirrors
// server — keep the required set in sync.
export function hasRole(
  userRole: WorkspaceRole | null | undefined,
  required: readonly WorkspaceRole[],
): boolean {
  return userRole != null && required.includes(userRole);
}
