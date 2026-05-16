import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { workspaces } from "./workspaces";
import { generations } from "./ai";

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
  createdByUserId: uuid("createdByUserId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  workspaceId: uuid("workspaceId")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  goal: text("goal").notNull(),
  kind: text("kind", {
    enum: ["launch", "webinar", "sale", "drip", "evergreen", "reach", "custom"],
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
    enum: [
      "draft",
      "ready",
      "scheduled",
      "running",
      "paused",
      "complete",
      "archived",
    ],
  })
    .default("draft")
    .notNull(),
  generationId: uuid("generationId").references(() => generations.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
