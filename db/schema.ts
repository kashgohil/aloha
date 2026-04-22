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
  uniqueIndex,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

export type PostMedia = {
  url: string;
  mimeType: string;
  width?: number;
  height?: number;
  alt?: string;
};

// Per-channel customization. Any field left undefined inherits the post's
// base content/media. Keyed by platform id ("twitter", "linkedin", etc.).
export type ChannelOverride = {
  content?: string;
  media?: PostMedia[];
};

// Structured draft metadata emitted by Muse generation. `content` stays the
// canonical body used by publishers; draftMeta is additive scaffolding the
// composer can surface (alt hooks, CTA options, media hint, why-this-works).
// Every field optional — older posts and manual drafts simply have no meta.
export type DraftMeta = {
  hook?: string;
  keyPoints?: string[];
  cta?: string;
  hashtags?: string[];
  mediaSuggestion?: string;
  altHooks?: string[];
  rationale?: string;
  formatGuidance?: string;
  format?: string;
  sourceIdeaId?: string;
  // Set by repost_top (or any future "re-share" flow) to link a draft back
  // to the original post it was cloned from. Lets the automation skip
  // winners that have already been reposted in the current window.
  sourcePostId?: string;
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
  // Master switch for in-app notifications. When false, `createNotification`
  // is a no-op. Per-category flags below layer on top.
  notificationsEnabled: boolean("notificationsEnabled").default(true).notNull(),
  notifyPostOutcomes: boolean("notifyPostOutcomes").default(true).notNull(),
  notifyInboxSyncIssues: boolean("notifyInboxSyncIssues").default(true).notNull(),
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
  // Per-channel overrides layered on top of `content` + `media`. A missing
  // entry (or entry with undefined fields) means the channel inherits the
  // base values, so existing rows stay valid with `{}`.
  channelContent: jsonb("channelContent")
    .$type<Record<string, ChannelOverride>>()
    .default({})
    .notNull(),
  // Optional structured scaffolding from Muse (hook, key points, CTA, alt
  // hooks, hashtags, media suggestion, rationale). Canonical body lives in
  // `content`; this is additive, the composer reads it to surface a sidebar
  // with alt hooks and rationale. Null for manual drafts.
  draftMeta: jsonb("draftMeta").$type<DraftMeta>(),
  status: text("status", {
    enum: ["draft", "scheduled", "published", "failed", "deleted"],
  })
    .default("draft")
    .notNull(),
  scheduledAt: timestamp("scheduledAt"),
  publishedAt: timestamp("publishedAt"),
  // When the composer was seeded from an idea (via ?idea= URL), we stamp
  // the source here so the idea can be flipped to `drafted` + we keep
  // provenance. Set-null on idea delete so orphaned posts survive.
  sourceIdeaId: uuid("sourceIdeaId").references((): AnyPgColumn => ideas.id, {
    onDelete: "set null",
  }),
  // Stamped when a post was drafted from a campaign beat. Lets the
  // campaign detail list its own drafts + the calendar tint cells by
  // campaign. Set-null on campaign delete so drafts survive.
  campaignId: uuid("campaignId").references((): AnyPgColumn => campaigns.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt", { mode: "date" }),
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
  // Delivery lifecycle. `pending_review` = channel is gated behind platform
  // approval and publishing is suppressed; `manual_assist` = channel is in
  // reminder-only mode and the user will publish themselves. Both are
  // terminal-for-this-run but recoverable: when the channel's state changes
  // (approval lands, or user flips back to auto), scheduled posts can be
  // re-queued without losing their delivery row.
  status: text("status", {
    enum: [
      "pending",
      "published",
      "failed",
      "needs_reauth",
      "pending_review",
      "manual_assist",
      // `deleted` = we successfully removed the remote post via the platform's
      // delete API. `remotePostId` / `remoteUrl` are preserved as a tombstone
      // so the UI can still show "was at <url>, deleted on <date>".
      "deleted",
    ],
  })
    .default("pending")
    .notNull(),
  remotePostId: text("remotePostId"),
  remoteUrl: text("remoteUrl"),
  errorCode: text("errorCode"),
  errorMessage: text("errorMessage"),
  attemptCount: integer("attemptCount").default(0).notNull(),
  publishedAt: timestamp("publishedAt", { mode: "date" }),
  deletedAt: timestamp("deletedAt", { mode: "date" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const wishlist = pgTable("wishlist", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PageTheme = {
  fontPairId?: string;
  accentId?: string;
  backgroundPresetId?: string;
};

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
  // Template + theme: null theme means "use template defaults". An image
  // background is signalled by backgroundAssetId (FK to assets); a preset
  // background lives in theme.backgroundPresetId. Asset wins if both are set.
  templateId: text("templateId").notNull().default("peach"),
  theme: jsonb("theme").$type<PageTheme>(),
  avatarAssetId: uuid("avatarAssetId").references(() => assets.id, {
    onDelete: "set null",
  }),
  backgroundAssetId: uuid("backgroundAssetId").references(() => assets.id, {
    onDelete: "set null",
  }),
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
  // null = auto-detect from url/label (globe fallback). "none" = render no
  // icon. Any other value is a preset id from the link-icons catalog.
  iconPresetId: text("iconPresetId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Serialized flow step. `steps` is null on legacy rows — callers fall back to
// the template definition keyed by `kind`. Once a row is edited through the
// builder the full graph is persisted here and the template is no longer
// consulted.
export type StoredFlowStep = {
  id: string;
  type: "trigger" | "action" | "condition" | "delay";
  kind: string;
  title: string;
  detail: string;
  config?: Record<string, unknown>;
  next?: string[];
  branches?: { yes?: string[]; no?: string[] };
};

export type StoredStepResult = {
  stepId: string;
  status: "success" | "failed" | "skipped";
  startedAt: string;
  finishedAt: string;
  output?: Record<string, unknown>;
  error?: string;
};

export const automations = pgTable(
  "automations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    name: text("name").notNull(),
    status: text("status", { enum: ["active", "paused", "draft"] })
      .default("draft")
      .notNull(),
    config: jsonb("config").$type<Record<string, unknown>>(),
    steps: jsonb("steps").$type<StoredFlowStep[]>(),
    runCount: integer("runCount").default(0).notNull(),
    lastRunAt: timestamp("lastRunAt"),
    // Materialized next fire time for schedule-kind triggers. Null for
    // event-driven automations. The cron endpoint scans active rows where
    // nextFireAt <= now and enqueues a run.
    nextFireAt: timestamp("nextFireAt"),
    // Message id for the currently-scheduled fire in the delayed-message
    // queue (QStash today). When set, the queue will call the tick endpoint
    // at nextFireAt. Cleared on pause/delete or after the message fires.
    // Hourly cron is the safety net if this drifts.
    scheduledMessageId: text("scheduledMessageId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (t) => [
    index("automations_next_fire_idx").on(t.status, t.nextFireAt),
  ],
);

export const automationRuns = pgTable(
  "automation_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    automationId: uuid("automationId")
      .notNull()
      .references(() => automations.id, { onDelete: "cascade" }),
    status: text("status", {
      enum: ["running", "waiting", "success", "failed", "skipped"],
    })
      .default("running")
      .notNull(),
    trigger: jsonb("trigger").$type<Record<string, unknown>>(),
    stepResults: jsonb("stepResults")
      .$type<StoredStepResult[]>()
      .default([])
      .notNull(),
    error: text("error"),
    // Resume metadata for runs paused on a `delay` step. When status =
    // 'waiting', the cron endpoint picks up rows where resumeAt <= now and
    // continues execution from `cursor` with `snapshot` merged as the
    // accumulated context.
    resumeAt: timestamp("resumeAt"),
    cursor: text("cursor"),
    // Message id for the pending resume in the delayed-message queue. When
    // set, the queue will call the tick endpoint at resumeAt. The hourly
    // cron is the safety net if this drifts.
    scheduledMessageId: text("scheduledMessageId"),
    snapshot: jsonb("snapshot")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    startedAt: timestamp("startedAt").defaultNow().notNull(),
    finishedAt: timestamp("finishedAt"),
  },
  (t) => [
    index("automation_runs_automation_started_idx").on(
      t.automationId,
      t.startedAt.desc(),
    ),
    index("automation_runs_resume_idx").on(t.status, t.resumeAt),
  ],
);

export const subscribers = pgTable("subscribers", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  name: text("name"),
  tags: text("tags").array(),
  // Set when the subscriber clicks the unsubscribe link (or we process a
  // List-Unsubscribe header). Null = active. Broadcast fan-out must skip
  // any subscriber with a non-null value here.
  unsubscribedAt: timestamp("unsubscribedAt", { mode: "date" }),
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
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
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
    uniqueIndex("sending_domains_user_domain").on(table.userId, table.domain),
  ],
);

// One-off email broadcast. v1 target is "all active subscribers"; the
// `audienceFilter` jsonb is future-proofing for tag/segment filters without
// a schema change. Body is markdown — the sender renders to html+text.
// `sendingDomainId` pins which verified domain the From address uses.
export const broadcasts = pgTable("broadcasts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  preheader: text("preheader"),
  body: text("body").notNull(),
  fromName: text("fromName"),
  fromAddress: text("fromAddress").notNull(),
  replyTo: text("replyTo"),
  sendingDomainId: uuid("sendingDomainId").references(
    () => sendingDomains.id,
    { onDelete: "set null" },
  ),
  audienceFilter: jsonb("audienceFilter")
    .$type<{ tags?: string[] }>()
    .default({})
    .notNull(),
  status: text("status", {
    enum: ["draft", "scheduled", "sending", "sent", "failed", "canceled"],
  })
    .default("draft")
    .notNull(),
  scheduledAt: timestamp("scheduledAt", { mode: "date" }),
  sentAt: timestamp("sentAt", { mode: "date" }),
  recipientCount: integer("recipientCount").default(0).notNull(),
  deliveredCount: integer("deliveredCount").default(0).notNull(),
  bouncedCount: integer("bouncedCount").default(0).notNull(),
  openedCount: integer("openedCount").default(0).notNull(),
  clickedCount: integer("clickedCount").default(0).notNull(),
  unsubscribedCount: integer("unsubscribedCount").default(0).notNull(),
  // Muse-generated broadcasts link back to the generation for provenance,
  // same pattern as campaigns. Null for manual drafts.
  generationId: uuid("generationId").references(() => generations.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// One row per (broadcast × subscriber) attempt. Drives per-recipient
// tracking, unsubscribe scoping, and the aggregate counters on `broadcasts`.
// `resendMessageId` is the id Resend returns from /emails — we join on it
// when a webhook fires.
export const broadcastSends = pgTable(
  "broadcast_sends",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    broadcastId: uuid("broadcastId")
      .notNull()
      .references(() => broadcasts.id, { onDelete: "cascade" }),
    subscriberId: uuid("subscriberId")
      .notNull()
      .references(() => subscribers.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    status: text("status", {
      enum: [
        "pending",
        "sent",
        "delivered",
        "bounced",
        "complained",
        "failed",
      ],
    })
      .default("pending")
      .notNull(),
    resendMessageId: text("resendMessageId"),
    errorMessage: text("errorMessage"),
    sentAt: timestamp("sentAt", { mode: "date" }),
    deliveredAt: timestamp("deliveredAt", { mode: "date" }),
    openedAt: timestamp("openedAt", { mode: "date" }),
    clickedAt: timestamp("clickedAt", { mode: "date" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("broadcast_sends_broadcast_subscriber").on(
      table.broadcastId,
      table.subscriberId,
    ),
  ],
);

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

// Notion workspace connection. Notion OAuth returns a workspace-scoped bot
// token that never expires (unless revoked). Owner-user details come back
// in the token response so we cache the workspace label for UI.
export const notionCredentials = pgTable("notion_credentials", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("accessToken").notNull(),
  workspaceId: text("workspaceId").notNull(),
  workspaceName: text("workspaceName"),
  workspaceIcon: text("workspaceIcon"),
  botId: text("botId").notNull(),
  // Flipped to true when a sync call returns 401 (user revoked the
  // integration inside Notion). Cleared on successful reconnect via the
  // OAuth callback's upsert.
  reauthRequired: boolean("reauthRequired").default(false).notNull(),
  lastSyncedAt: timestamp("lastSyncedAt", { mode: "date" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Long-form corpus the user has made available for voice training and
// repurposing. Fed by Notion sync today; Google Docs + uploads later. Each
// row is one document. Dedupe on (user, source, sourceId) so repeated syncs
// update in place instead of fanning out.
export const brandCorpus = pgTable(
  "brand_corpus",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    source: text("source", {
      enum: ["notion", "google_docs", "upload", "manual"],
    }).notNull(),
    // External ID — Notion page id, Doc id, or a synthetic id for uploads.
    sourceId: text("sourceId").notNull(),
    title: text("title"),
    content: text("content").notNull(),
    url: text("url"),
    // Last time we pulled this document from its source.
    fetchedAt: timestamp("fetchedAt", { mode: "date" }).defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("brand_corpus_user_source_sourceid").on(
      table.userId,
      table.source,
      table.sourceId,
    ),
  ],
);

// Unified media library. Uploads, AI-generated images, and future imports
// (Figma, Canva, Dropbox) all land here. `source` distinguishes origin;
// `prompt` is populated only for AI-generated assets and lets us show
// "generated from" provenance in the library UI.
export const assets = pgTable("assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  source: text("source", {
    enum: ["upload", "generated", "imported"],
  }).notNull(),
  url: text("url").notNull(),
  mimeType: text("mimeType").notNull(),
  width: integer("width"),
  height: integer("height"),
  alt: text("alt"),
  // AI-provenance. Null for uploads; non-null for assets the user generated
  // inside Aloha. We keep this so the library UI can show the prompt and
  // "regenerate" actions reuse it.
  prompt: text("prompt"),
  sourceGenerationId: uuid("sourceGenerationId").references(() => generations.id, {
    onDelete: "set null",
  }),
  // Free-form metadata per asset — EXIF, platform-of-origin, Figma file id,
  // etc. Kept loose so adapters don't need schema changes.
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Campaigns — a sequenced run of posts around one goal. Two shapes share
// this table: narrative arcs (launch, webinar, sale, custom) where beats
// flow teaser → announce → …, and cadence runs (drip, evergreen) where
// beats pace over a range at `postsPerWeek` frequency and carry richer
// scaffolding (hook, keyPoints, cta, hashtags). `themes` and
// `postsPerWeek` are only meaningful for cadence kinds; arc kinds leave
// them null/empty. Acceptance flips a beat in place and back-refs the
// draft post id.
export const campaigns = pgTable("campaigns", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  goal: text("goal").notNull(),
  kind: text("kind", {
    enum: ["launch", "webinar", "sale", "drip", "evergreen", "custom"],
  }).notNull(),
  channels: text("channels").array().default([]).notNull(),
  themes: text("themes").array().default([]).notNull(),
  postsPerWeek: integer("postsPerWeek"),
  rangeStart: timestamp("rangeStart", { mode: "date" }).notNull(),
  rangeEnd: timestamp("rangeEnd", { mode: "date" }).notNull(),
  beats: jsonb("beats")
    .$type<Array<Record<string, unknown>>>()
    .default([])
    .notNull(),
  status: text("status", {
    enum: ["draft", "ready", "running", "paused", "complete", "archived"],
  })
    .default("draft")
    .notNull(),
  generationId: uuid("generationId").references(() => generations.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// RSS / Atom subscriptions. `category` is populated when the feed was
// subscribed via the curated catalog; user-added feeds leave it null. HTTP
// conditional GET cursors (`etag`, `lastModified`) keep the fetch cheap on
// the daily sync.
export const feeds = pgTable(
  "feeds",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    siteUrl: text("siteUrl"),
    title: text("title").notNull(),
    description: text("description"),
    iconUrl: text("iconUrl"),
    category: text("category"),
    lastFetchedAt: timestamp("lastFetchedAt", { mode: "date" }),
    etag: text("etag"),
    lastModified: text("lastModified"),
    errorCount: integer("errorCount").default(0).notNull(),
    lastError: text("lastError"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("feeds_user_url").on(table.userId, table.url)],
);

// One row per item pulled from a feed. Dedupe on (feedId, guid) — guid
// falls back to the item URL when the feed doesn't emit one. Items don't
// have their own userId — ownership flows through the feed.
export const feedItems = pgTable(
  "feed_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    feedId: uuid("feedId")
      .notNull()
      .references(() => feeds.id, { onDelete: "cascade" }),
    guid: text("guid").notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    url: text("url"),
    author: text("author"),
    imageUrl: text("imageUrl"),
    publishedAt: timestamp("publishedAt", { mode: "date" }),
    isRead: boolean("isRead").default(false).notNull(),
    // When an item is saved to the swipe file, link back so we can show
    // "already saved" state + navigate to the idea.
    savedAsIdeaId: uuid("savedAsIdeaId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("feed_items_feed_guid").on(table.feedId, table.guid)],
);

// Swipe file — captured ideas, hooks, reference posts, half-formed thoughts.
// Rows arrive from: manual capture, URL clip, feed save, Notion sync, inbox
// mark-as-idea. A minimal schema — richer metadata (embeddings, channel
// suggestions) lands later.
export const ideas = pgTable("ideas", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  source: text("source", {
    enum: ["manual", "url_clip", "feed", "notion", "inbox"],
  }).notNull(),
  sourceId: text("sourceId"),
  sourceUrl: text("sourceUrl"),
  title: text("title"),
  body: text("body").notNull(),
  media: jsonb("media").$type<PostMedia[]>(),
  tags: text("tags").array().default([]).notNull(),
  channelFit: text("channelFit").array().default([]).notNull(),
  status: text("status", { enum: ["new", "drafted", "archived"] })
    .default("new")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const mastodonCredentials = pgTable("mastodon_credentials", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  instanceUrl: text("instanceUrl").notNull(),
  accessToken: text("accessToken").notNull(),
  accountId: text("accountId").notNull(),
  username: text("username").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const telegramCredentials = pgTable("telegram_credentials", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
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
    enum: ["pending_phone", "pending_code", "pending_2fa", "authenticated", "failed"],
  }).default("pending_phone").notNull(),
  // Flipped to true when the session is invalid
  reauthRequired: boolean("reauthRequired").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const inboxMessages = pgTable(
  "inbox_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(),
    remoteId: text("remoteId").notNull(),
    threadId: text("threadId"),
    parentId: text("parentId"),
    reason: text("reason", { enum: ["mention", "reply"] }).notNull(),
    authorDid: text("authorDid").notNull(),
    authorHandle: text("authorHandle").notNull(),
    authorDisplayName: text("authorDisplayName"),
    authorAvatarUrl: text("authorAvatarUrl"),
    content: text("content").notNull(),
    isRead: boolean("isRead").default(false).notNull(),
    platformData: jsonb("platformData").$type<Record<string, unknown>>().default({}).notNull(),
    platformCreatedAt: timestamp("platformCreatedAt", { mode: "date" }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("inbox_messages_user_platform_remote").on(
      table.userId,
      table.platform,
      table.remoteId,
    ),
  ],
);

// Per-user voice profile. Trained from past posts + uploaded corpus + slider
// input; consumed by every Muse generation call. Basic companion ignores it.
// `tone` holds the slider state and any structured descriptors; `features`
// holds derived stats from the training corpus (avg sentence length, emoji
// rate, hook patterns) so prompts don't have to re-derive each call.
export const brandVoice = pgTable("brand_voice", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  tone: jsonb("tone").$type<Record<string, unknown>>().default({}).notNull(),
  features: jsonb("features")
    .$type<Record<string, unknown>>()
    .default({})
    .notNull(),
  bannedPhrases: text("bannedPhrases").array().default([]).notNull(),
  ctaStyle: text("ctaStyle"),
  emojiRate: text("emojiRate", { enum: ["none", "low", "medium", "high"] }),
  sampleSourceIds: text("sampleSourceIds").array().default([]).notNull(),
  version: integer("version").default(1).notNull(),
  trainedAt: timestamp("trainedAt", { mode: "date" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Per-channel overrides on top of `brand_voice`. Training produces both in one
// pass. If overrides end up doing most of the work in practice, revisit
// flattening into independent per-channel profiles (see ai-grand-plan §11).
export const brandVoiceChannels = pgTable(
  "brand_voice_channels",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    channel: text("channel").notNull(),
    overrides: jsonb("overrides")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    version: integer("version").default(1).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("brand_voice_channels_user_channel").on(
      table.userId,
      table.channel,
    ),
  ],
);

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
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
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
    uniqueIndex("channel_states_user_channel").on(table.userId, table.channel),
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

// Cached profile details for each connected channel. Populated on
// connect/reconnect (OAuth signIn, manual connect actions) and refreshed
// lazily. Platform-agnostic on purpose so the UI can render an avatar +
// handle for any channel through one component. Missing fields just render
// as null — we never block connection on a failed profile fetch.
export const channelProfiles = pgTable(
  "channel_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
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
    uniqueIndex("channel_profiles_user_channel").on(
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
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    channel: text("channel").notNull(),
    enabledAt: timestamp("enabledAt", { mode: "date" }).defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("muse_enabled_channels_user_channel").on(
      table.userId,
      table.channel,
    ),
  ],
);

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
    feature: text("feature").notNull(),
    requestedAt: timestamp("requestedAt"),
    grantedAt: timestamp("grantedAt"),
    grantedBy: uuid("grantedBy").references((): AnyPgColumn => users.id, {
      onDelete: "set null",
    }),
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

// Named, versioned system prompts. Rolling a new template version is a
// deploy, not a config change — feature code pins (name, version).
export const promptTemplates = pgTable(
  "prompt_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    version: integer("version").notNull(),
    systemPrompt: text("systemPrompt").notNull(),
    inputSchema: jsonb("inputSchema")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    modelHint: text("modelHint"),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("prompt_templates_name_version").on(table.name, table.version),
  ],
);

// Log of every LLM call. Powers cost dashboards, router evaluation, and
// fine-tune candidate selection. `costMicros` is USD × 1e6 to keep integer
// math; divide at render time.
export const generations = pgTable("generations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  feature: text("feature").notNull(),
  templateName: text("templateName"),
  templateVersion: integer("templateVersion"),
  model: text("model").notNull(),
  input: jsonb("input").$type<Record<string, unknown>>().default({}).notNull(),
  output: jsonb("output")
    .$type<Record<string, unknown>>()
    .default({})
    .notNull(),
  tokensIn: integer("tokensIn").default(0).notNull(),
  tokensOut: integer("tokensOut").default(0).notNull(),
  costMicros: integer("costMicros").default(0).notNull(),
  latencyMs: integer("latencyMs").default(0).notNull(),
  status: text("status", {
    enum: ["pending", "ok", "error", "moderated"],
  })
    .default("pending")
    .notNull(),
  errorCode: text("errorCode"),
  errorMessage: text("errorMessage"),
  feedback: text("feedback", {
    enum: ["accepted", "edited", "rejected"],
  }),
  feedbackAt: timestamp("feedbackAt", { mode: "date" }),
  langfuseTraceId: text("langfuseTraceId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// QStash-backed queue for long-running AI work: batch generation, nightly
// insights pulls, voice training, weekly digests. `qstashMessageId` lets the
// worker dedupe and cancel.
export const aiJobs = pgTable("ai_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId").references(() => users.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  payload: jsonb("payload")
    .$type<Record<string, unknown>>()
    .default({})
    .notNull(),
  status: text("status", {
    enum: ["queued", "running", "done", "failed"],
  })
    .default("queued")
    .notNull(),
  scheduledAt: timestamp("scheduledAt", { mode: "date" }),
  startedAt: timestamp("startedAt", { mode: "date" }),
  completedAt: timestamp("completedAt", { mode: "date" }),
  attempts: integer("attempts").default(0).notNull(),
  lastError: text("lastError"),
  qstashMessageId: text("qstashMessageId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Cached per-post analytics pulled from each connected platform. One row per
// (user, platform, remotePostId). `postId` links back to our own `posts` when
// the post was published through Aloha; null for pre-Aloha history.
// Retention: marketing promises 24 months on every plan — see
// lib/analytics/retention.ts. Do not add a pruner that violates that window.
export const platformInsights = pgTable(
  "platform_insights",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
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
    uniqueIndex("platform_insights_user_platform_remote").on(
      table.userId,
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
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
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
    uniqueIndex("platform_content_cache_user_platform_remote").on(
      table.userId,
      table.platform,
      table.remotePostId,
    ),
  ],
);

// In-app notifications. Written by publishers + inbox sync; consumed by the
// bell menu. `kind` drives the icon + label; `url` is the optional click-
// through target; `metadata` holds kind-specific extras (postId, platform,
// error summary) so the UI can render without extra joins.
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  kind: text("kind", {
    enum: [
      "post_published",
      "post_partial",
      "post_failed",
      "inbox_sync_failed",
    ],
  }).notNull(),
  title: text("title").notNull(),
  body: text("body"),
  url: text("url"),
  metadata: jsonb("metadata")
    .$type<Record<string, unknown>>()
    .default({})
    .notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const inboxSyncCursors = pgTable(
  "inbox_sync_cursors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(),
    cursor: text("cursor"),
    lastSyncedAt: timestamp("lastSyncedAt", { mode: "date" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("inbox_sync_cursors_user_platform").on(
      table.userId,
      table.platform,
    ),
  ],
);
