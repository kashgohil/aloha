import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { workspaces } from "./workspaces";
import { assets } from "./brand";

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
  createdByUserId: uuid("createdByUserId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  workspaceId: uuid("workspaceId")
    .notNull()
    .unique()
    .references(() => workspaces.id, { onDelete: "cascade" }),
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
    createdByUserId: uuid("createdByUserId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspaceId")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
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
  (t) => [index("automations_next_fire_idx").on(t.status, t.nextFireAt)],
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

// In-app notifications. Written by publishers + inbox sync; consumed by the
// bell menu. `kind` drives the icon + label; `url` is the optional click-
// through target; `metadata` holds kind-specific extras (postId, platform,
// error summary) so the UI can render without extra joins.
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  workspaceId: uuid("workspaceId")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  kind: text("kind", {
    enum: [
      "post_published",
      "post_partial",
      "post_failed",
      "inbox_sync_failed",
      // Review workflow (Phase 5). Fan-out rules:
      //   post_submitted — fires to every reviewer+ in the workspace
      //                    (excluding the submitter themselves)
      //   post_approved  — fires to the submitter
      //   post_comment   — fires to post author + earlier commenters
      //                    (excluding the commenter themselves)
      "post_submitted",
      "post_approved",
      "post_comment",
      // Fires when a post gets assigned to a specific reviewer.
      "post_assigned",
      // Fires when a comment @-mentions someone. Distinct from
      // post_comment so the mentioned party gets a louder signal than
      // a general thread ping.
      "post_mention",
      // Fires when a workspace is frozen by the quota reconciler (owner
      // is over their workspace-addon seat allowance). Targets the
      // workspace owner; url deep-links to /app/settings/billing.
      "workspace_frozen",
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
