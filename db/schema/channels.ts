import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { workspaces } from "./workspaces";
import { posts, type PostMedia } from "./posts";

// Per-user × per-channel publish-mode override. Only meaningful when the
// channel is in a gated platform state (e.g. Meta app review pending) —
// otherwise the effective state is `published` regardless of what's stored
// here. `auto` defers to the platform's current gating config; users pick
// between `review_pending` (silent queue) and `manual_assist` (reminders).
// See ai-grand-plan §8 for the full state machine.
export const channelStates = pgTable(
  "channel_states",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspaceId")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    channel: text("channel").notNull(),
    publishMode: text("publishMode", {
      enum: ["auto", "review_pending", "manual_assist"],
    })
      .default("auto")
      .notNull(),
    // Set when the channel entered a gated state — drives the 14-day
    // auto-flip from review_pending to manual_assist.
    reviewStartedAt: timestamp("reviewStartedAt", { mode: "date" }),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("channel_states_workspace_channel").on(
      table.workspaceId,
      table.channel,
    ),
  ],
);

// Cached profile details for each connected channel. Populated on
// connect/reconnect (OAuth signIn, manual connect actions) and refreshed
// lazily. Platform-agnostic on purpose so the UI can render an avatar +
// handle for any channel through one component. Missing fields just render
// as null — we never block connection on a failed profile fetch.
export const channelProfiles = pgTable(
  "channel_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspaceId")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    channel: text("channel").notNull(),
    // Platform-native account id (e.g. twitter user id, bluesky did,
    // mastodon account id). Stored so future refreshes can verify we're
    // still looking at the same account.
    providerAccountId: text("providerAccountId"),
    displayName: text("displayName"),
    handle: text("handle"),
    avatarUrl: text("avatarUrl"),
    profileUrl: text("profileUrl"),
    bio: text("bio"),
    followerCount: integer("followerCount"),
    // Last-fetch timestamp so we can decide when to refresh without
    // burning the platform API on every page load.
    fetchedAt: timestamp("fetchedAt", { mode: "date" }).defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("channel_profiles_workspace_channel").on(
      table.workspaceId,
      table.channel,
    ),
  ],
);

// Captures interest when a user clicks "Notify me" on a channel that isn't
// connectable yet (approval_needed platforms, unconfigured providers).
// Drives a ping when the channel becomes available.
export const channelNotifications = pgTable(
  "channel_notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspaceId")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    channel: text("channel").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("channel_notifications_user_channel").on(
      table.userId,
      table.channel,
    ),
  ],
);

// Per-user × per-channel flag: is Muse turned on for this channel? Drives
// both the entitlement check in the router and per-channel billing.
export const museEnabledChannels = pgTable(
  "muse_enabled_channels",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspaceId")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    channel: text("channel").notNull(),
    enabledAt: timestamp("enabledAt", { mode: "date" }).defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("muse_enabled_channels_workspace_channel").on(
      table.workspaceId,
      table.channel,
    ),
  ],
);

export const blueskyCredentials = pgTable("bluesky_credentials", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspaceId")
    .notNull()
    .unique()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  handle: text("handle").notNull(),
  appPassword: text("appPassword").notNull(),
  did: text("did"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Notion workspace connection. Notion OAuth returns a workspace-scoped bot
// token that never expires (unless revoked). Owner-user details come back
// in the token response so we cache the workspace label for UI.
export const notionCredentials = pgTable("notion_credentials", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspaceId")
    .notNull()
    .unique()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  accessToken: text("accessToken").notNull(),
  // Notion's own workspace identifier from the OAuth response — disambiguated
  // from our tenant-scoping `workspaceId` column above.
  notionWorkspaceId: text("notionWorkspaceId").notNull(),
  notionWorkspaceName: text("notionWorkspaceName"),
  notionWorkspaceIcon: text("notionWorkspaceIcon"),
  botId: text("botId").notNull(),
  // Flipped to true when a sync call returns 401 (user revoked the
  // integration inside Notion). Cleared on successful reconnect via the
  // OAuth callback's upsert.
  reauthRequired: boolean("reauthRequired").default(false).notNull(),
  lastSyncedAt: timestamp("lastSyncedAt", { mode: "date" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const mastodonCredentials = pgTable("mastodon_credentials", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspaceId")
    .notNull()
    .unique()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  instanceUrl: text("instanceUrl").notNull(),
  accessToken: text("accessToken").notNull(),
  accountId: text("accountId").notNull(),
  username: text("username").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const telegramCredentials = pgTable("telegram_credentials", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspaceId")
    .notNull()
    .unique()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  // User's phone number (used for authentication)
  phoneNumber: text("phoneNumber").notNull(),
  // Session data after authentication (auth_key, server_salt, etc.)
  sessionData: jsonb("sessionData").$type<Record<string, unknown>>(),
  // Where to post (channel/group username or ID)
  chatId: text("chatId").notNull(),
  // Display name for the connection (channel username for links)
  username: text("username"),
  // Auth state for multi-step login
  authState: text("authState", {
    enum: [
      "pending_phone",
      "pending_code",
      "pending_2fa",
      "authenticated",
      "failed",
    ],
  })
    .default("pending_phone")
    .notNull(),
  // Flipped to true when the session is invalid
  reauthRequired: boolean("reauthRequired").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// BYO sending domain. One user can verify multiple domains; at least one
// must be `verified` before a broadcast can go out. `resendDomainId` is the
// Resend-side id we poll for DKIM status. `dkimRecords` caches the DNS
// records we ask the user to add so the UI can render them without a
// re-fetch.
export const sendingDomains = pgTable(
  "sending_domains",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    createdByUserId: uuid("createdByUserId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspaceId")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    domain: text("domain").notNull(),
    resendDomainId: text("resendDomainId"),
    status: text("status", {
      enum: ["pending", "verified", "failed"],
    })
      .default("pending")
      .notNull(),
    dkimRecords: jsonb("dkimRecords")
      .$type<Array<{ name: string; type: string; value: string }>>()
      .default([])
      .notNull(),
    // Open + click tracking is a per-domain privacy decision. Default off
    // — opt-in for users who want numbers. Flipping either reissues
    // `domains.update` to Resend so the change takes effect for future
    // sends (in-flight messages keep their original behavior).
    openTracking: boolean("openTracking").default(false).notNull(),
    clickTracking: boolean("clickTracking").default(false).notNull(),
    verifiedAt: timestamp("verifiedAt", { mode: "date" }),
    lastCheckedAt: timestamp("lastCheckedAt", { mode: "date" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("sending_domains_user_domain").on(
      table.createdByUserId,
      table.domain,
    ),
  ],
);

// Cached per-post analytics pulled from each connected platform. One row per
// (user, platform, remotePostId). `postId` links back to our own `posts` when
// the post was published through Aloha; null for pre-Aloha history.
// Retention: marketing promises 24 months on every plan — see
// lib/analytics/retention.ts. Do not add a pruner that violates that window.
export const platformInsights = pgTable(
  "platform_insights",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspaceId")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(),
    remotePostId: text("remotePostId").notNull(),
    postId: uuid("postId").references(() => posts.id, { onDelete: "set null" }),
    metrics: jsonb("metrics")
      .$type<Record<string, number | null>>()
      .default({})
      .notNull(),
    platformPostedAt: timestamp("platformPostedAt", { mode: "date" }),
    fetchedAt: timestamp("fetchedAt", { mode: "date" }).defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("platform_insights_workspace_platform_remote").on(
      table.workspaceId,
      table.platform,
      table.remotePostId,
    ),
  ],
);

// Cached read-back of the user's own past posts per platform. Feeds voice
// training, repurposing, and de-dupe. Separate from `platform_insights` so a
// post can have its content cached even before metrics land.
export const platformContentCache = pgTable(
  "platform_content_cache",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspaceId")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(),
    remotePostId: text("remotePostId").notNull(),
    content: text("content").notNull(),
    media: jsonb("media").$type<PostMedia[]>().default([]).notNull(),
    platformData: jsonb("platformData")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    platformPostedAt: timestamp("platformPostedAt", { mode: "date" }),
    fetchedAt: timestamp("fetchedAt", { mode: "date" }).defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("platform_content_cache_workspace_platform_remote").on(
      table.workspaceId,
      table.platform,
      table.remotePostId,
    ),
  ],
);
