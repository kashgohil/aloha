// Canonical post lifecycle stages.
//
//   draft → in_review → approved → scheduled → published
//                                        ↓
//                                      failed
//
// Forward movement is strictly one stage at a time. From `approved` the
// user may branch to either `scheduled` or `published`. Backward movement
// always drops to `draft` (simpler than preserving the prior stage, and
// matches the product spec). `deleted` is a soft-delete side channel and
// can be reached from any stage.
//
// Owners and admins are allowed to bypass the review workflow and jump
// straight from `draft` (or `in_review`) to `scheduled` / `published`.
// Editors and reviewers must walk the staircase.
import type { WorkspaceRole } from "@/lib/current-context";

export type PostStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "scheduled"
  | "published"
  | "failed"
  | "deleted";

const FORWARD: Record<PostStatus, PostStatus[]> = {
  draft: ["in_review"],
  in_review: ["approved"],
  approved: ["scheduled", "published"],
  scheduled: ["published", "failed"],
  published: [],
  failed: [],
  deleted: [],
};

function canBypassReview(role: WorkspaceRole | null | undefined): boolean {
  return role === "owner" || role === "admin";
}

export function canTransition(
  from: PostStatus,
  to: PostStatus,
  role?: WorkspaceRole | null,
): boolean {
  // Soft-delete is handled via delete actions, not kanban drops onto this column.
  if (to === "deleted") return false;
  if (to === "draft") {
    // Backward reset from any editable non-terminal stage. Scheduled posts
    // can be unscheduled back to draft (cancel) — this is the only way to
    // take a scheduled post out of the queue short of deleting it.
    return (
      from === "in_review" || from === "approved" || from === "scheduled"
    );
  }
  if (FORWARD[from]?.includes(to)) return true;
  // Owner / admin shortcut: skip review and approve, schedule or publish
  // straight from a draft (or an in-flight review they're authoring).
  if (
    canBypassReview(role) &&
    (to === "scheduled" || to === "published") &&
    (from === "draft" || from === "in_review")
  ) {
    return true;
  }
  return false;
}

export function assertTransition(
  from: PostStatus,
  to: PostStatus,
  role?: WorkspaceRole | null,
): void {
  if (!canTransition(from, to, role)) {
    throw new Error(
      `Invalid post transition: ${from} → ${to}. Posts move draft → in_review → approved → scheduled → published in order.`,
    );
  }
}
