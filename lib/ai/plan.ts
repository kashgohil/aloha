// Content plan generation. Given a brief (goal / themes / channels /
// frequency / date range), asks the model for a schedule of per-day ideas,
// parses the structured JSON, and persists a `content_plans` row.
// Non-streaming for v1 — the structured output is small (<40 ideas) and
// streaming JSON parsing is brittle. We'll revisit if latency bites.

import { and, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { contentPlans, feedItems, feeds } from "@/db/schema";
import { getBestWindowsForUser } from "@/lib/best-time";
import { generate } from "./router";
import { PROMPTS, registerPrompts } from "./prompts";
import { loadCurrentVoice } from "./voice";
import { buildVoiceBlock } from "./voice-context";

const VALID_FORMATS = [
  "single",
  "thread",
  "carousel",
  "long-form",
  "short-video",
  "link",
] as const;
type IdeaFormat = (typeof VALID_FORMATS)[number];

export type PlanIdea = {
  id: string;
  date: string; // YYYY-MM-DD
  channel: string;
  title: string;
  angle: string;
  format: IdeaFormat;
  accepted?: boolean;
  acceptedPostId?: string;
};

export type GeneratePlanInput = {
  userId: string;
  goal: string;
  themes: string[];
  channels: string[];
  frequency: number;
  rangeStart: Date;
  rangeEnd: Date;
};

export type GeneratedPlan = {
  planId: string;
  overview: string;
  ideas: PlanIdea[];
};

const MAX_INSPIRATION_ITEMS = 8;

export async function generatePlan(
  input: GeneratePlanInput,
): Promise<GeneratedPlan> {
  if (input.channels.length === 0) {
    throw new Error("Pick at least one channel for the plan.");
  }
  if (input.rangeEnd <= input.rangeStart) {
    throw new Error("End date must be after start date.");
  }

  await registerPrompts();

  const [voice, bestWindowsByChannel, inspiration] = await Promise.all([
    loadCurrentVoice(input.userId),
    getBestWindowsForUser(input.userId, "UTC"),
    loadRecentInspiration(input.userId),
  ]);

  const bestWindowsSummary = formatBestWindows(
    input.channels,
    bestWindowsByChannel,
  );
  const inspirationSummary = formatInspiration(inspiration);

  const vars = {
    goal: input.goal.trim(),
    themes: input.themes.length > 0 ? input.themes.join(", ") : "(none specified)",
    channels: input.channels.join(", "),
    frequency: String(input.frequency),
    rangeStart: toIsoDate(input.rangeStart),
    rangeEnd: toIsoDate(input.rangeEnd),
    bestWindows: bestWindowsSummary,
    inspiration: inspirationSummary,
    voiceBlock: buildVoiceBlock(voice),
  };

  const result = await generate({
    userId: input.userId,
    feature: "plan.generate",
    template: PROMPTS.planGenerate,
    vars,
    userMessage:
      "Produce the plan as strict JSON. No markdown, no prose outside the JSON object.",
    temperature: 0.7,
  });

  const parsed = parsePlanJson(result.text, input.channels);

  // Persist — the plan's `ideas` array is the one UI edits (accept, dismiss,
  // etc.). Every idea gets a synthetic id for per-row selection tracking.
  const ideasWithIds: PlanIdea[] = parsed.ideas.map((i) => ({
    ...i,
    id: crypto.randomUUID(),
  }));

  const [row] = await db
    .insert(contentPlans)
    .values({
      userId: input.userId,
      goal: input.goal.trim(),
      themes: input.themes,
      channels: input.channels,
      frequency: input.frequency,
      rangeStart: input.rangeStart,
      rangeEnd: input.rangeEnd,
      status: "ready",
      ideas: ideasWithIds as unknown as Array<Record<string, unknown>>,
      generationId: result.generationId,
    })
    .returning({ id: contentPlans.id });

  return {
    planId: row.id,
    overview: parsed.overview,
    ideas: ideasWithIds,
  };
}

// ---- parsing --------------------------------------------------------------

function parsePlanJson(
  text: string,
  allowedChannels: string[],
): { overview: string; ideas: Omit<PlanIdea, "id">[] } {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("The plan output wasn't valid JSON. Try again.");
  }

  const obj = parsed as { overview?: unknown; ideas?: unknown };
  if (typeof obj.overview !== "string" || !Array.isArray(obj.ideas)) {
    throw new Error("Plan output missing required fields.");
  }

  const allowed = new Set(allowedChannels);
  const ideas: Omit<PlanIdea, "id">[] = [];

  for (const raw of obj.ideas) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const date = typeof r.date === "string" ? r.date : "";
    const channel = typeof r.channel === "string" ? r.channel : "";
    const title = typeof r.title === "string" ? r.title.trim() : "";
    const angle = typeof r.angle === "string" ? r.angle.trim() : "";
    const format =
      typeof r.format === "string" &&
      (VALID_FORMATS as readonly string[]).includes(r.format)
        ? (r.format as IdeaFormat)
        : "single";

    if (!title || !date || !allowed.has(channel)) continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    ideas.push({ date, channel, title, angle, format });
  }

  if (ideas.length === 0) {
    throw new Error("Plan came back empty. Try again with a clearer brief.");
  }

  return { overview: obj.overview, ideas };
}

// ---- helpers --------------------------------------------------------------

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatBestWindows(
  channels: string[],
  byChannel: Record<string, Array<{ dayOfWeek: number; hourStart: number; hourEnd: number }>>,
): string {
  const dayLabel = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const formatHour = (h: number) => {
    if (h === 0) return "12am";
    if (h === 12) return "12pm";
    return h < 12 ? `${h}am` : `${h - 12}pm`;
  };

  const lines: string[] = [];
  for (const ch of channels) {
    const windows = byChannel[ch] ?? [];
    if (windows.length === 0) continue;
    const top = windows[0];
    lines.push(
      `  - ${ch}: ${dayLabel[top.dayOfWeek]} ${formatHour(top.hourStart)}–${formatHour(top.hourEnd)}`,
    );
  }
  return lines.length > 0 ? lines.join("\n") : "(no best-window data yet)";
}

async function loadRecentInspiration(userId: string) {
  // Pull recent items the user has saved AS ideas or which sit in their most
  // active feeds. Kept intentionally small — the model is better at riffing
  // on a handful of headlines than drowning in a wall of text.
  const userFeedIds = (
    await db.select({ id: feeds.id }).from(feeds).where(eq(feeds.userId, userId))
  ).map((r) => r.id);
  if (userFeedIds.length === 0) return [];
  const items = await db
    .select({
      title: feedItems.title,
      summary: feedItems.summary,
    })
    .from(feedItems)
    .where(
      and(
        inArray(feedItems.feedId, userFeedIds),
        isNotNull(feedItems.savedAsIdeaId),
      ),
    )
    .orderBy(desc(feedItems.publishedAt))
    .limit(MAX_INSPIRATION_ITEMS);
  return items;
}

function formatInspiration(
  items: Array<{ title: string; summary: string | null }>,
): string {
  if (items.length === 0) return "(no recent inspiration — rely on themes + voice)";
  return items
    .map((it, i) => {
      const sum = it.summary ? ` — ${it.summary.slice(0, 140)}` : "";
      return `  ${i + 1}. ${it.title}${sum}`;
    })
    .join("\n");
}

// ---- idea acceptance ------------------------------------------------------

// Updates an idea inside the plan's jsonb array — toggling the `accepted`
// flag and (when accepted) back-refing the draft post id. Caller handles
// creation of the post row; this just keeps the plan in sync.
export async function markIdeaAccepted(
  planId: string,
  ideaId: string,
  postId: string,
): Promise<void> {
  const [row] = await db
    .select({ ideas: contentPlans.ideas })
    .from(contentPlans)
    .where(eq(contentPlans.id, planId))
    .limit(1);
  if (!row) return;

  const next = (row.ideas as PlanIdea[]).map((i) =>
    i.id === ideaId ? { ...i, accepted: true, acceptedPostId: postId } : i,
  );
  await db
    .update(contentPlans)
    .set({
      ideas: next as unknown as Array<Record<string, unknown>>,
      status: sql`CASE WHEN ${contentPlans.status} = 'ready' THEN 'accepted' ELSE ${contentPlans.status} END`,
      updatedAt: new Date(),
    })
    .where(eq(contentPlans.id, planId));
}

export async function loadPlan(
  userId: string,
  planId: string,
): Promise<{
  id: string;
  goal: string;
  themes: string[];
  channels: string[];
  frequency: number;
  rangeStart: Date;
  rangeEnd: Date;
  status: string;
  ideas: PlanIdea[];
  createdAt: Date;
} | null> {
  const [row] = await db
    .select()
    .from(contentPlans)
    .where(eq(contentPlans.id, planId))
    .limit(1);
  if (!row || row.userId !== userId) return null;
  return {
    id: row.id,
    goal: row.goal,
    themes: row.themes,
    channels: row.channels,
    frequency: row.frequency,
    rangeStart: row.rangeStart,
    rangeEnd: row.rangeEnd,
    status: row.status,
    ideas: row.ideas as PlanIdea[],
    createdAt: row.createdAt,
  };
}

// Regenerates the pending ideas for a single date in an existing plan.
// Accepted ideas on that date are preserved (the user already drafted from
// them); pending ideas are replaced with a fresh set at the same slot
// count. Returns the newly generated ideas.
export async function regeneratePlanDay(
  userId: string,
  planId: string,
  date: string,
): Promise<PlanIdea[]> {
  const plan = await loadPlan(userId, planId);
  if (!plan) throw new Error("Plan not found.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Invalid date.");

  const sameDay = plan.ideas.filter((i) => i.date === date);
  const accepted = sameDay.filter((i) => i.accepted);
  const pending = sameDay.filter((i) => !i.accepted);
  const slots = Math.max(1, pending.length);

  await registerPrompts();
  const [voice, bestWindowsByChannel, inspiration] = await Promise.all([
    loadCurrentVoice(userId),
    getBestWindowsForUser(userId, "UTC"),
    loadRecentInspiration(userId),
  ]);

  // Summarize the ideas we're KEEPING so the model doesn't produce dupes.
  const keepSummary =
    accepted.length > 0
      ? accepted
          .map((i) => `  - [${i.channel}] ${i.title}: ${i.angle}`)
          .join("\n")
      : "(none)";

  const result = await generate({
    userId,
    feature: "plan.generate",
    template: PROMPTS.planGenerate,
    vars: {
      goal: plan.goal,
      themes:
        plan.themes.length > 0 ? plan.themes.join(", ") : "(none specified)",
      channels: plan.channels.join(", "),
      frequency: String(slots),
      rangeStart: date,
      rangeEnd: date,
      bestWindows: formatBestWindows(plan.channels, bestWindowsByChannel),
      inspiration: formatInspiration(inspiration),
      voiceBlock: buildVoiceBlock(voice),
    },
    userMessage: [
      "Regenerate only this single day.",
      `Target date: ${date}`,
      `Produce exactly ${slots} idea${slots === 1 ? "" : "s"}.`,
      `Do NOT repeat these already-drafted ideas:\n${keepSummary}`,
      "Return strict JSON — no markdown, no prose outside the JSON.",
    ].join("\n"),
    temperature: 0.85,
  });

  const parsed = parsePlanJson(result.text, plan.channels);
  const freshIdeas: PlanIdea[] = parsed.ideas
    .slice(0, slots)
    .map((i) => ({
      ...i,
      date, // pin to the target — the model occasionally drifts on single-day runs
      id: crypto.randomUUID(),
    }));

  if (freshIdeas.length === 0) {
    throw new Error("Regeneration came back empty. Try again.");
  }

  const merged: PlanIdea[] = [
    ...plan.ideas.filter((i) => i.date !== date),
    ...accepted,
    ...freshIdeas,
  ];

  await db
    .update(contentPlans)
    .set({
      ideas: merged as unknown as Array<Record<string, unknown>>,
      updatedAt: new Date(),
    })
    .where(
      and(eq(contentPlans.id, planId), eq(contentPlans.userId, userId)),
    );

  return freshIdeas;
}
