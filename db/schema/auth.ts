import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  primaryKey,
  boolean,
  jsonb,
  index,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";
import { workspaces } from "./workspaces";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  passwordHash: text("passwordHash"),
  // Workspace / onboarding fields
  workspaceName: text("workspaceName"),
  role: text("role", {
    enum: ["solo", "creator", "team", "agency", "nonprofit"],
  }),
  timezone: text("timezone"),
  onboardedAt: timestamp("onboardedAt", { mode: "date" }),
  // Master switch for in-app notifications. When false, `createNotification`
  // is a no-op. Per-category flags below layer on top.
  notificationsEnabled: boolean("notificationsEnabled").default(true).notNull(),
  notifyPostOutcomes: boolean("notifyPostOutcomes").default(true).notNull(),
  notifyInboxSyncIssues: boolean("notifyInboxSyncIssues")
    .default(true)
    .notNull(),
  // Per-event email toggles for the review pipeline. Each governs whether
  // the matching in-app notification also fans out to email. The master
  // `notificationsEnabled` switch still gates everything; these layer on
  // top so a user can opt out of (e.g.) comment emails while keeping the
  // approval ping.
  notifyReviewSubmittedByEmail: boolean("notifyReviewSubmittedByEmail")
    .default(true)
    .notNull(),
  notifyReviewApprovedByEmail: boolean("notifyReviewApprovedByEmail")
    .default(true)
    .notNull(),
  notifyReviewAssignedByEmail: boolean("notifyReviewAssignedByEmail")
    .default(true)
    .notNull(),
  notifyReviewCommentByEmail: boolean("notifyReviewCommentByEmail")
    .default(true)
    .notNull(),
  notifyReviewMentionByEmail: boolean("notifyReviewMentionByEmail")
    .default(true)
    .notNull(),
  // Weekly Insights digest — top posts + concrete suggestions emailed
  // to workspace owners + admins. Default-on; users opt out from the
  // notifications settings page. Independent of `notificationsEnabled`
  // because the insights email is creator-facing analytics, not an
  // event ping; killing the master switch shouldn't silently kill the
  // weekly retro.
  notifyInsightsDigestByEmail: boolean("notifyInsightsDigestByEmail")
    .default(true)
    .notNull(),
  // Which workspace the user is currently acting inside. Nullable during
  // Phase 2 rollout; backfill sets this to the user's personal workspace
  // once it exists. Later phases tighten this + drive the workspace switch
  // JWT claim.
  activeWorkspaceId: uuid("activeWorkspaceId").references(
    (): AnyPgColumn => workspaces.id,
    { onDelete: "set null" },
  ),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Stays nullable on purpose: DrizzleAdapter inserts the account row
    // during OAuth sign-in before our `linkAccount` event has a chance to
    // stamp workspaceId. The event backfills it synchronously so the row
    // is tenant-scoped for every query thereafter.
    workspaceId: uuid("workspaceId").references(() => workspaces.id, {
      onDelete: "cascade",
    }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
    // Flipped to true by the publisher when a token can't be refreshed;
    // cleared on successful publish or on re-sign-in (events.signIn).
    // NextAuth's DrizzleAdapter ignores custom columns.
    reauthRequired: boolean("reauthRequired").default(false).notNull(),
  },
  (account) => [
    {
      compoundKey: primaryKey({
        columns: [account.provider, account.providerAccountId],
      }),
    },
  ],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [
    {
      compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
    },
  ],
);

export const authenticators = pgTable(
  "authenticator",
  {
    credentialID: text("credentialID").notNull().unique(),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: boolean("credentialBackedUp").notNull(),
    transports: text("transports"),
  },
  (authenticator) => [
    {
      compoundKey: primaryKey({
        columns: [authenticator.userId, authenticator.credentialID],
      }),
    },
  ],
);

// Admin panel operators. Completely separate from `users` — no shared
// sessions, no OAuth, password + TOTP only. Seed via scripts/seed-admin.ts;
// there is no self-signup path.
export const internalUsers = pgTable("internal_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("passwordHash").notNull(),
  // Base32 TOTP shared secret. Null until the operator completes enrollment
  // on first login. Once set, every login requires a valid 6-digit code.
  totpSecret: text("totpSecret"),
  totpEnrolledAt: timestamp("totpEnrolledAt", { mode: "date" }),
  role: text("role", { enum: ["owner", "staff"] })
    .default("staff")
    .notNull(),
  lastLoginAt: timestamp("lastLoginAt", { mode: "date" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Audit log for admin actions. Every mutation in /admin writes a row here so
// we can trace who did what to whom. `targetUserId` is the end-user the
// action touched (nullable for system-wide actions).
export const internalAuditLog = pgTable(
  "internal_audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorId: uuid("actorId")
      .notNull()
      .references(() => internalUsers.id, { onDelete: "restrict" }),
    action: text("action").notNull(),
    targetUserId: uuid("targetUserId").references(() => users.id, {
      onDelete: "set null",
    }),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("internal_audit_log_actor_created").on(
      table.actorId,
      table.createdAt.desc(),
    ),
    index("internal_audit_log_target_created").on(
      table.targetUserId,
      table.createdAt.desc(),
    ),
  ],
);
