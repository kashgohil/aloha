import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";

export const inboxMessages = pgTable(
  "inbox_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspaceId")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(),
    remoteId: text("remoteId").notNull(),
    threadId: text("threadId"),
    parentId: text("parentId"),
    reason: text("reason", { enum: ["mention", "dm"] }).notNull(),
    // null for mentions (always inbound). 'in' or 'out' for DMs so the
    // thread view can render sent vs received bubbles.
    direction: text("direction", { enum: ["in", "out"] }),
    authorDid: text("authorDid").notNull(),
    authorHandle: text("authorHandle").notNull(),
    authorDisplayName: text("authorDisplayName"),
    authorAvatarUrl: text("authorAvatarUrl"),
    content: text("content").notNull(),
    // Inline media attached to the message (images, video, gifs, files).
    // Normalized across platforms so the renderer doesn't have to branch.
    attachments: jsonb("attachments")
      .$type<
        Array<{
          type: "image" | "video" | "gif" | "audio" | "file";
          url: string;
          previewUrl?: string;
          width?: number;
          height?: number;
          altText?: string;
          durationSec?: number;
          fileName?: string;
        }>
      >()
      .default([])
      .notNull(),
    isRead: boolean("isRead").default(false).notNull(),
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
    uniqueIndex("inbox_messages_workspace_platform_remote").on(
      table.workspaceId,
      table.platform,
      table.remoteId,
    ),
  ],
);

// Cached counterparty profile per DM thread. Without this, threads with
// only outbound messages have no recipient identity (the platforms expand
// senders only on the events endpoint), so the inbox would render as
// "talking to yourself." Populated at sync time after parsing the
// conversation id and looking the participant up.
export const dmThreadProfiles = pgTable(
  "dm_thread_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspaceId")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(),
    threadId: text("threadId").notNull(),
    counterpartyId: text("counterpartyId").notNull(),
    counterpartyHandle: text("counterpartyHandle").notNull(),
    counterpartyDisplayName: text("counterpartyDisplayName"),
    counterpartyAvatarUrl: text("counterpartyAvatarUrl"),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("dm_thread_profiles_workspace_platform_thread").on(
      table.workspaceId,
      table.platform,
      table.threadId,
    ),
  ],
);

export const inboxSyncCursors = pgTable(
  "inbox_sync_cursors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspaceId")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(),
    cursor: text("cursor"),
    lastSyncedAt: timestamp("lastSyncedAt", { mode: "date" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("inbox_sync_cursors_workspace_platform").on(
      table.workspaceId,
      table.platform,
    ),
  ],
);
