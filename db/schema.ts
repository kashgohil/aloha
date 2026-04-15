import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  primaryKey,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

export type PostMedia = {
  url: string;
  mimeType: string;
  width?: number;
  height?: number;
  alt?: string;
};

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
  // Billing — lazy-created on first checkout
  polarCustomerId: text("polarCustomerId").unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// One row per Polar subscription. A user with Basic + Muse has two rows;
// the BillingService presents them as a single logical subscription.
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  polarSubscriptionId: text("polarSubscriptionId").notNull().unique(),
  // Which product family this subscription is on. "basic" = Basic-only,
  // "bundle" = Basic+Muse combined. Switching between these is a product
  // migration on the same Polar subscription — no second checkout.
  productKey: text("productKey", { enum: ["basic", "bundle"] }).notNull(),
  status: text("status", {
    enum: [
      "incomplete",
      "active",
      "past_due",
      "canceled",
      "revoked",
    ],
  }).notNull(),
  interval: text("interval", { enum: ["month", "year"] }).notNull(),
  seats: integer("seats").notNull().default(1),
  currentPeriodEnd: timestamp("currentPeriodEnd", { mode: "date" }),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
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

export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  platforms: text("platforms").array().notNull(), // Stores ["twitter", "linkedin"]
  media: jsonb("media").$type<PostMedia[]>().default([]).notNull(),
  status: text("status", { enum: ["draft", "scheduled", "published", "failed"] })
    .default("draft")
    .notNull(),
  scheduledAt: timestamp("scheduledAt"),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// One row per (post × platform) attempt. Lets us represent partial success
// ("LinkedIn went out, X failed"), surface per-channel errors, and flag
// reauth needed without losing the other platform's success state.
export const postDeliveries = pgTable("post_deliveries", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("postId")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(),
  status: text("status", {
    enum: ["pending", "published", "failed", "needs_reauth"],
  })
    .default("pending")
    .notNull(),
  remotePostId: text("remotePostId"),
  remoteUrl: text("remoteUrl"),
  errorCode: text("errorCode"),
  errorMessage: text("errorMessage"),
  attemptCount: integer("attemptCount").default(0).notNull(),
  publishedAt: timestamp("publishedAt", { mode: "date" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const pages = pgTable("pages", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  title: text("title"),
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const links = pgTable("links", {
  id: uuid("id").defaultRandom().primaryKey(),
  pageId: uuid("pageId")
    .notNull()
    .references(() => pages.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  url: text("url").notNull(),
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const automations = pgTable("automations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  name: text("name").notNull(),
  status: text("status", { enum: ["active", "paused", "draft"] })
    .default("draft")
    .notNull(),
  runCount: integer("runCount").default(0).notNull(),
  lastRunAt: timestamp("lastRunAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const subscribers = pgTable("subscribers", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  name: text("name"),
  tags: text("tags").array(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const blueskyCredentials = pgTable("bluesky_credentials", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  handle: text("handle").notNull(),
  appPassword: text("appPassword").notNull(),
  did: text("did"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
