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
  workspaceId: uuid("workspaceId")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
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
  workspaceId: uuid("workspaceId")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
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
