import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  index,
  uniqueIndex,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { users, internalUsers } from "./auth";
import { workspaces } from "./workspaces";

// One row per Polar subscription. A user with Basic + Muse has two rows;
// the BillingService presents them as a single logical subscription.
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdByUserId: uuid("createdByUserId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  workspaceId: uuid("workspaceId")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  polarSubscriptionId: text("polarSubscriptionId").notNull().unique(),
  // Which product family this subscription is on.
  //   "basic"           — Basic-only base plan. Seats = channels.
  //   "bundle"          — Basic+Muse combined base plan. Seats = channels.
  //                       Switching basic↔bundle is a product migration on
  //                       the same Polar subscription — no second checkout.
  //   "workspace_addon" — Flat-priced add-on ($25/mo or $250/yr per seat).
  //                       Seats = number of extra workspaces beyond the 1
  //                       that the base plan includes. Each seat also
  //                       includes +3 channels and +3 member slots.
  //   "member_addon"    — Per-workspace add-on ($3/mo or $30/yr per seat).
  //                       Seats = extra member slots beyond the per-workspace
  //                       included allowance (5 base + 3 × workspace_addon).
  productKey: text("productKey", {
    enum: [
      "basic",
      "bundle",
      "workspace_addon",
      "member_addon",
      // Recurring credit-boost subscription. Each renewal grants
      // CREDIT_BOOST_AMOUNT credits on top of the plan's monthly grant.
      "credits_boost",
    ],
  }).notNull(),
  status: text("status", {
    enum: ["incomplete", "active", "past_due", "canceled", "revoked"],
  }).notNull(),
  interval: text("interval", { enum: ["month", "year"] }).notNull(),
  seats: integer("seats").notNull().default(1),
  currentPeriodEnd: timestamp("currentPeriodEnd", { mode: "date" }),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Per-account credit ledger. Every grant, consume, top-up, or admin
// adjustment is one row; the running balance is sum(delta) since the
// most recent `monthly_grant` row for the owner. Period rollover happens
// lazily when a consume/read sees that the latest grant is >= 30 days old.
//
// Scope: account-level (ownerUserId). `workspaceId` is metadata so the
// owner admin view can break down spend by tenant — it does NOT change
// the balance pool.
export const creditLedger = pgTable("credit_ledger", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerUserId: uuid("ownerUserId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // Signed integer. Positive on grants/top-ups, negative on consumes.
  delta: integer("delta").notNull(),
  reason: text("reason", {
    enum: ["monthly_grant", "topup", "consume", "expire", "admin_adjust"],
  }).notNull(),
  // AI feature key on consume rows (e.g. "ai.refine"). Null for grants.
  feature: text("feature"),
  // Tenant the consume happened in — purely informational, not a scope
  // boundary. Null for account-wide events (grants, top-ups).
  workspaceId: uuid("workspaceId").references(() => workspaces.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Invite-gated feature access. One row per (user, feature) — e.g. "muse",
// "broadcasts". `requestedAt` is the waitlist signal (user clicked
// "request access"); `grantedAt` flips the entitlement on. `revokedAt`
// lets us pause access without losing history. Entitlement checks treat
// access as active when grantedAt IS NOT NULL AND revokedAt IS NULL.
export const featureAccess = pgTable(
  "feature_access",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspaceId")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    feature: text("feature").notNull(),
    requestedAt: timestamp("requestedAt"),
    grantedAt: timestamp("grantedAt"),
    grantedBy: uuid("grantedBy").references(
      (): AnyPgColumn => internalUsers.id,
      { onDelete: "set null" },
    ),
    revokedAt: timestamp("revokedAt"),
    note: text("note"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("feature_access_user_feature").on(table.userId, table.feature),
    index("feature_access_feature_requested").on(
      table.feature,
      table.requestedAt,
    ),
  ],
);
