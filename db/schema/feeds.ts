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
import type { PostMedia } from "./posts";

// RSS / Atom subscriptions. `category` is populated when the feed was
// subscribed via the curated catalog; user-added feeds leave it null. HTTP
// conditional GET cursors (`etag`, `lastModified`) keep the fetch cheap on
// the daily sync.
export const feeds = pgTable(
  "feeds",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspaceId")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
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
  (table) => [
    uniqueIndex("feeds_workspace_url").on(table.workspaceId, table.url),
  ],
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
  createdByUserId: uuid("createdByUserId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  workspaceId: uuid("workspaceId")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  source: text("source", {
    enum: ["manual", "url_clip", "feed", "notion", "inbox", "email"],
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
