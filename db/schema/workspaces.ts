import {
  pgTable,
  text,
  timestamp,
  uuid,
  primaryKey,
  boolean,
  index,
  uniqueIndex,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

// A tenant. Every piece of user-owned content (posts, channels, corpus,
// subscriptions…) will be scoped to a workspace over the course of Phase 2.
// For single-user users the workspace is created 1:1 during backfill and
// owned by them. Multi-member workspaces arrive in Phase 4 via invites.
export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  // The user who created / owns this workspace. Transfer-of-ownership
  // lives in a later phase; for now this is always a member with role
  // "owner" in `workspaceMembers`.
  ownerUserId: uuid("ownerUserId")
    .notNull()
    .references((): AnyPgColumn => users.id, { onDelete: "cascade" }),
  timezone: text("timezone"),
  // Semantic descriptor — lifted from the old `users.role`. Not a permission
  // role (those live on `workspaceMembers.role`). Kept for onboarding nudges,
  // pricing tiers, and analytics segmentation.
  role: text("role", {
    enum: ["solo", "creator", "team", "agency", "nonprofit"],
  }),
  // Billing customer pointer. Moves from `users.polarCustomerId` to here in
  // Slice 2.7; kept nullable until then so backfill can populate it lazily.
  polarCustomerId: text("polarCustomerId").unique(),
  // Public-facing short identifier used in user-friendly URLs and inbound
  // email aliases (e.g., `ideas-{shortId}@in.usealoha.app`). 12 chars from
  // [a-z0-9], unique. Nullable for two reasons: (a) old rows backfill
  // lazily on first read, (b) external systems sometimes use the workspace
  // id directly, so we don't want a hard schema requirement that blocks
  // workspace creation if the random generator collides under load.
  shortId: text("shortId").unique(),
  // Non-null when the workspace is in read-only "frozen" state — set by
  // the quota reconciler when the owner has more workspaces than their
  // current add-on seat count allows (e.g. after canceling add-on seats,
  // or a past_due subscription churning into revoked). Frozen workspaces
  // remain visible but block publish/invite mutations. Cleared when the
  // owner either deletes enough workspaces or buys back the seats.
  frozenAt: timestamp("frozenAt", { mode: "date" }),
  // Every new workspace gets a 30-day Basic trial. After trialEndsAt the
  // workspace drops to view-only (publish + AI generation gated) unless the
  // owner has an active paid subscription. NULL = legacy row predating trial
  // tracking; treated as an expired trial by callers (paid sub overrides).
  trialEndsAt: timestamp("trialEndsAt", { mode: "date" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Many-to-many between users and workspaces. A user can be a member of any
// number of workspaces with different roles in each. Roles are set up with
// the full Phase 4 enum now (it's free — everyone's `owner` until invites
// land), so we don't need a separate migration to expand it later.
export const workspaceMembers = pgTable(
  "workspace_members",
  {
    workspaceId: uuid("workspaceId")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("userId")
      .notNull()
      .references((): AnyPgColumn => users.id, { onDelete: "cascade" }),
    role: text("role", {
      enum: ["owner", "admin", "editor", "reviewer", "viewer"],
    })
      .default("owner")
      .notNull(),
    invitedBy: uuid("invitedBy").references((): AnyPgColumn => users.id, {
      onDelete: "set null",
    }),
    joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.workspaceId, table.userId] }),
    index("workspace_members_user").on(table.userId),
  ],
);

// Pending workspace invites. Each row is a signed token the recipient
// trades in on `/app/invite/[token]`. `acceptedAt` is set when used;
// expired or accepted rows stick around as an audit trail. The unique
// index on (workspaceId, email) prevents double-inviting the same
// address; re-sending updates the existing row instead of creating a
// parallel invite.
export const workspaceInvites = pgTable(
  "workspace_invites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspaceId")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role", {
      enum: ["owner", "admin", "editor", "reviewer", "viewer"],
    }).notNull(),
    // URL-safe secret. Long enough to resist brute-force; not reversible
    // — the caller presents the token, we look it up directly.
    token: text("token").notNull().unique(),
    invitedBy: uuid("invitedBy")
      .notNull()
      .references((): AnyPgColumn => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expiresAt", { mode: "date" }).notNull(),
    // Null while pending; stamped when the recipient accepts.
    acceptedAt: timestamp("acceptedAt", { mode: "date" }),
    // Stamped when an admin revokes the invite. Revoked rows stay around
    // for audit but can't be accepted (accept flow checks both).
    revokedAt: timestamp("revokedAt", { mode: "date" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("workspace_invites_workspace_email").on(
      table.workspaceId,
      table.email,
    ),
    index("workspace_invites_token").on(table.token),
  ],
);
