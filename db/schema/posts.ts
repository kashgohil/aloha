import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  jsonb,
  index,
  uniqueIndex,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { workspaces } from "./workspaces";
import { ideas } from "./feeds";
import { campaigns } from "./campaigns";

export type PostMedia = {
  url: string;
  mimeType: string;
  width?: number;
  height?: number;
  alt?: string;
};

// Per-channel customization. Any field left undefined inherits the post's
// base content/media. Keyed by platform id ("twitter", "linkedin", etc.).
//
// `form` and `payload` carry the per-channel structured authoring state
// (formerly the standalone `studioMode` / `studioPayload` columns). When
// `form` is set, the publisher dispatches via the capability registry
// using `payload`; when unset, the channel falls back to the flat
// `content` + `media` overrides.
export type ChannelOverride = {
  content?: string;
  media?: PostMedia[];
  form?: string;
  payload?: StudioPayload;
};

// Channel-form-specific structured content. Shape is validated by the
// capability registry for the declared `{ channel, form }`. Opaque here.
export type StudioPayload = Record<string, unknown>;

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

export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdByUserId: uuid("createdByUserId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  workspaceId: uuid("workspaceId")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
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
    enum: [
      "draft",
      "in_review",
      "approved",
      "scheduled",
      "published",
      "failed",
      "deleted",
    ],
  })
    .default("draft")
    .notNull(),
  scheduledAt: timestamp("scheduledAt"),
  publishedAt: timestamp("publishedAt"),
  submittedForReviewAt: timestamp("submittedForReviewAt"),
  submittedBy: uuid("submittedBy").references(() => users.id, {
    onDelete: "set null",
  }),
  approvedAt: timestamp("approvedAt"),
  approvedBy: uuid("approvedBy").references(() => users.id, {
    onDelete: "set null",
  }),
  // When a post is approved via a public share link by someone who isn't
  // a workspace member, `approvedBy` stays null and we record the typed
  // name + email here so the audit trail isn't anonymous. Cleared on
  // back-to-draft alongside the other approval fields.
  externalApproverIdentity: jsonb("externalApproverIdentity").$type<{
    name: string;
    email: string;
  }>(),
  // Optional reviewer assignment. When set, the post shows on that
  // reviewer's "assigned to me" Kanban filter. Null = goes into the
  // general reviewer queue (anyone with reviewer+ can approve). Cleared
  // on transition back to draft so re-submissions start fresh.
  assignedReviewerId: uuid("assignedReviewerId").references(() => users.id, {
    onDelete: "set null",
  }),
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
  // Set when the user marks a published post as "evergreen" — eligible
  // for resurfacing as a fresh draft by the recycle automation. Cleared
  // when the user opts the post out. Only meaningful for `published`
  // posts; the automation filters there anyway.
  evergreenMarkedAt: timestamp("evergreenMarkedAt", { mode: "date" }),
  // Updated each time the recycle automation creates a child draft from
  // this post. Lets the handler enforce a cool-off window so a single
  // winner isn't resurfaced every cycle, and powers the lineage UI on
  // the origin's detail page.
  lastResurfacedAt: timestamp("lastResurfacedAt", { mode: "date" }),
  // For posts that ARE the resurface (i.e., the new draft cloned from
  // an origin), this points at the origin. Null for original posts.
  // Self-FK with set-null so deleting the origin doesn't cascade-kill
  // the resurfaces — they stand on their own once authored.
  parentPostId: uuid("parentPostId").references((): AnyPgColumn => posts.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt", { mode: "date" }),
  enqueuedAt: timestamp("enqueuedAt"),
});

// One row per (post × platform) attempt. Lets us represent partial success
// ("LinkedIn went out, X failed"), surface per-channel errors, and flag
// reauth needed without losing the other platform's success state.
export const postDeliveries = pgTable(
  "post_deliveries",
  {
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
    // Engagement snapshot scheduling. Set when a delivery succeeds and
    // advanced by the engagement-snapshots cron after each call. NULL means
    // the decay curve has played out and we're done snapshotting.
    nextMetricSyncAt: timestamp("nextMetricSyncAt", { mode: "date" }),
    // Free-form metadata about how the delivery completed. Today this
    // carries `deliveredVia` ("auto" | "manual_assist_email" | "extension")
    // so we can attribute manual-assist completions back to the surface
    // that drove them. Optional fields like `extensionVersion` get
    // stamped opportunistically — keep the type loose to avoid migrations
    // for every new attribution dimension.
    metadata: jsonb("metadata")
      .$type<{
        deliveredVia?:
          | "auto"
          | "manual_assist_email"
          | "extension"
          | "manual_web";
        extensionVersion?: string;
      }>()
      .default({})
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    // One delivery row per (post, platform). `upsertDelivery` relies on
    // this to be race-safe via ON CONFLICT DO NOTHING — without it,
    // concurrent publishPost runs for the same post would each insert
    // their own row and we'd end up with zombie failed siblings of a
    // live LinkedIn post (DUPLICATE_POST trips the LinkedIn API).
    uniqueIndex("post_deliveries_post_platform").on(
      table.postId,
      table.platform,
    ),
  ],
);

// Individual replies/comments on one of the user's post deliveries. Keyed by
// `(userId, platform, remoteId)` — association to a delivery happens at read
// time via `rootRemoteId` matching `post_deliveries.remoteId`. The post detail
// page builds the threaded tree client-side from `parentRemoteId`.
export const postComments = pgTable(
  "post_comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspaceId")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(),
    remoteId: text("remoteId").notNull(),
    // Immediate parent in the reply chain. For a direct reply to the post,
    // parentRemoteId === rootRemoteId. Used by the UI to build the tree.
    parentRemoteId: text("parentRemoteId").notNull(),
    // Top-level post this thread hangs off of. Matches
    // `post_deliveries.remoteId` for the user's own posts. Indexed for the
    // "all replies on this post" query.
    rootRemoteId: text("rootRemoteId").notNull(),
    authorDid: text("authorDid"),
    authorHandle: text("authorHandle").notNull(),
    authorDisplayName: text("authorDisplayName"),
    authorAvatarUrl: text("authorAvatarUrl"),
    content: text("content").notNull(),
    platformData: jsonb("platformData")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    platformCreatedAt: timestamp("platformCreatedAt", {
      mode: "date",
    }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("post_comments_workspace_platform_remote").on(
      table.workspaceId,
      table.platform,
      table.remoteId,
    ),
    index("post_comments_workspace_platform_root").on(
      table.workspaceId,
      table.platform,
      table.rootRemoteId,
    ),
  ],
);

// Internal review comments on a post. Distinct from `postComments` (which
// stores fetched platform replies). Surfaced in the UI as "Comments" on the
// post detail + composer. Not tied to status — leaveable at any stage. Edits
// bump `editedAt` so the UI can badge "edited".
export const postNotes = pgTable(
  "post_notes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("postId")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    // Author when the note comes from a workspace member. Null when the
    // note was left through a public share link by an external reviewer
    // (in which case `externalAuthor` carries their typed identity).
    // Exactly one of authorUserId / externalAuthor is set.
    authorUserId: uuid("authorUserId").references(() => users.id, {
      onDelete: "cascade",
    }),
    // Identity of an external reviewer who left this note via /r/[token].
    // Set when authorUserId is null. Not validated beyond shape — the
    // share token authorizes the action, the name + email are display
    // metadata for the workspace's audit trail.
    externalAuthor: jsonb("externalAuthor").$type<{
      name: string;
      email: string;
    }>(),
    body: text("body").notNull(),
    // Mentioned workspace-member user ids, deduped. Drives the mention
    // notifications and lets the renderer style `@Name` tokens as pills.
    // Kept as jsonb rather than a join table — handful of ids per note,
    // read alongside the note every render.
    mentions: jsonb("mentions").$type<string[]>().default([]).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    editedAt: timestamp("editedAt"),
    // Nullable parent for threading. Top-level notes have null parentNoteId.
    // Self-reference lets replies attach to any note in the thread.
    parentNoteId: uuid("parentNoteId").references(
      (): AnyPgColumn => postNotes.id,
      {
        onDelete: "cascade",
      },
    ),
  },
  (table) => [index("post_notes_post").on(table.postId, table.createdAt)],
);

// Shareable review links. A REVIEWER+ mints a token and sends the URL to a
// client / external stakeholder. The token grants viewing the post + leaving
// notes + (optionally) approving or requesting changes — without needing a
// workspace seat. External actions write back to the same `postNotes` and
// `posts` tables; identity comes from the typed name + email captured on
// first visit. Token is opaque base64url, looked up directly (cf.
// `workspaceInvites`). `expiresAt` null = no expiry; `revokedAt` non-null
// blocks use even before expiry.
export const postShareTokens = pgTable(
  "post_share_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("postId")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspaceId")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    createdByUserId: uuid("createdByUserId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    permissions: text("permissions", {
      enum: ["comment_only", "comment_approve"],
    })
      .default("comment_approve")
      .notNull(),
    expiresAt: timestamp("expiresAt", { mode: "date" }),
    revokedAt: timestamp("revokedAt", { mode: "date" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("post_share_tokens_post").on(table.postId),
    index("post_share_tokens_token").on(table.token),
  ],
);

// Append-only time-series of engagement counters per delivery. Latest row =
// current count; deltas across rows drive the analytics chart. Nullable
// metric columns because platform support varies (e.g. no impressions on
// Bluesky).
export const postEngagementSnapshots = pgTable(
  "post_engagement_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    deliveryId: uuid("deliveryId")
      .notNull()
      .references(() => postDeliveries.id, { onDelete: "cascade" }),
    capturedAt: timestamp("capturedAt", { mode: "date" })
      .defaultNow()
      .notNull(),
    likes: integer("likes"),
    reposts: integer("reposts"),
    replies: integer("replies"),
    views: integer("views"),
    bookmarks: integer("bookmarks"),
    profileClicks: integer("profileClicks"),
  },
  (table) => [
    index("post_engagement_snapshots_delivery_captured").on(
      table.deliveryId,
      table.capturedAt,
    ),
  ],
);

// Per-delivery sync cursors for engagement streams. `kind` separates the
// snapshot counter stream from the comments stream so they can paginate
// independently (different endpoints, different rate-limit budgets).
export const postSyncCursors = pgTable(
  "post_sync_cursors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    deliveryId: uuid("deliveryId")
      .notNull()
      .references(() => postDeliveries.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["snapshot", "comments"] }).notNull(),
    cursor: text("cursor"),
    lastSyncedAt: timestamp("lastSyncedAt", { mode: "date" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("post_sync_cursors_delivery_kind").on(
      table.deliveryId,
      table.kind,
    ),
  ],
);
