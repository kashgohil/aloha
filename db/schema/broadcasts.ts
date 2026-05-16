import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { workspaces } from "./workspaces";
import { sendingDomains } from "./channels";
import { generations } from "./ai";

export const subscribers = pgTable("subscribers", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdByUserId: uuid("createdByUserId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  workspaceId: uuid("workspaceId")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
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

// One-off email broadcast. v1 target is "all active subscribers"; the
// `audienceFilter` jsonb is future-proofing for tag/segment filters without
// a schema change. Body is markdown — the sender renders to html+text.
// `sendingDomainId` pins which verified domain the From address uses.
export const broadcasts = pgTable("broadcasts", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdByUserId: uuid("createdByUserId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  workspaceId: uuid("workspaceId")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  preheader: text("preheader"),
  body: text("body").notNull(),
  fromName: text("fromName"),
  fromAddress: text("fromAddress").notNull(),
  replyTo: text("replyTo"),
  sendingDomainId: uuid("sendingDomainId").references(() => sendingDomains.id, {
    onDelete: "set null",
  }),
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
      enum: ["pending", "sent", "delivered", "bounced", "complained", "failed"],
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
