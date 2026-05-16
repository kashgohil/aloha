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
import { generations } from "./ai";

// Long-form corpus the user has made available for voice training and
// repurposing. Fed by Notion sync today; Google Docs + uploads later. Each
// row is one document. Dedupe on (user, source, sourceId) so repeated syncs
// update in place instead of fanning out.
export const brandCorpus = pgTable(
  "brand_corpus",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    createdByUserId: uuid("createdByUserId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspaceId")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
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
    uniqueIndex("brand_corpus_workspace_source_sourceid").on(
      table.workspaceId,
      table.source,
      table.sourceId,
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
  workspaceId: uuid("workspaceId")
    .notNull()
    .unique()
    .references(() => workspaces.id, { onDelete: "cascade" }),
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
    workspaceId: uuid("workspaceId")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
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
    uniqueIndex("brand_voice_channels_workspace_channel").on(
      table.workspaceId,
      table.channel,
    ),
  ],
);

// Unified media library. Uploads, AI-generated images, and future imports
// (Figma, Canva, Dropbox) all land here. `source` distinguishes origin;
// `prompt` is populated only for AI-generated assets and lets us show
// "generated from" provenance in the library UI.
export const assets = pgTable("assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdByUserId: uuid("createdByUserId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  workspaceId: uuid("workspaceId")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
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
  sourceGenerationId: uuid("sourceGenerationId").references(
    () => generations.id,
    {
      onDelete: "set null",
    },
  ),
  // Free-form metadata per asset — EXIF, platform-of-origin, Figma file id,
  // etc. Kept loose so adapters don't need schema changes.
  metadata: jsonb("metadata")
    .$type<Record<string, unknown>>()
    .default({})
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
