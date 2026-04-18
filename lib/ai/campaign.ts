// Campaign beat-sheet generation. Mirrors the plan generator shape but
// produces a sequenced arc (teaser → announce → social_proof → urgency
// → recap, adapted to the campaign kind) instead of a flat weekly
// cadence. Reuses plan helpers for voice + inspiration + best-windows
// to avoid duplication.

import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  campaigns,
  feedItems,
  feeds,
  ideas,
  platformContentCache,
  platformInsights,
} from "@/db/schema";
import { generate } from "./router";
import { PROMPTS, registerPrompts } from "./prompts";
import { loadCurrentVoice } from "./voice";
import { buildVoiceBlock } from "./voice-context";
import { getBestWindowsForUser } from "@/lib/best-time";
import { desc, inArray } from "drizzle-orm";

export const CAMPAIGN_KINDS = [
  "launch",
  "webinar",
  "sale",
  "drip",
  "evergreen",
  "custom",
] as const;
export type CampaignKind = (typeof CAMPAIGN_KINDS)[number];

export const BEAT_PHASES = [
  "teaser",
  "announce",
  "social_proof",
  "urgency",
  "last_call",
  "recap",
  "reminder",
  "follow_up",
] as const;
export type BeatPhase = (typeof BEAT_PHASES)[number];

const VALID_FORMATS = [
  "single",
  "thread",
  "carousel",
  "long-form",
  "short-video",
  "link",
] as const;
type BeatFormat = (typeof VALID_FORMATS)[number];

export type CampaignBeat = {
  id: string;
  date: string; // YYYY-MM-DD
  phase: BeatPhase;
  channel: string;
  title: string;
  angle: string;
  format: BeatFormat;
  accepted?: boolean;
  acceptedPostId?: string;
};

export type GenerateCampaignInput = {
  userId: string;
  name: string;
  goal: string;
  kind: CampaignKind;
  channels: string[];
  rangeStart: Date;
  rangeEnd: Date;
};

export type GeneratedCampaign = {
  campaignId: string;
  overview: string;
  beats: CampaignBeat[];
};

const MAX_INSPIRATION_ITEMS = 6;
const MAX_IDEA_ITEMS = 10;
const MAX_TOP_PERFORMERS = 5;

export async function generateCampaign(
  input: GenerateCampaignInput,
): Promise<GeneratedCampaign> {
  if (input.channels.length === 0) {
    throw new Error("Pick at least one channel for the campaign.");
  }
  if (input.rangeEnd <= input.rangeStart) {
    throw new Error("End date must be after start date.");
  }

  await registerPrompts();

  const [voice, bestWindowsByChannel, inspiration, userIdeas, topPerformers] =
    await Promise.all([
      loadCurrentVoice(input.userId),
      getBestWindowsForUser(input.userId, "UTC"),
      loadRecentInspiration(input.userId),
      loadUserIdeas(input.userId),
      loadPastHighPerformers(input.userId, input.channels),
    ]);

  const vars = {
    kind: input.kind,
    goal: input.goal.trim(),
    channels: input.channels.join(", "),
    rangeStart: toIsoDate(input.rangeStart),
    rangeEnd: toIsoDate(input.rangeEnd),
    bestWindows: formatBestWindows(input.channels, bestWindowsByChannel),
    inspiration: formatInspiration(inspiration),
    yourIdeas: formatIdeas(userIdeas),
    topPerformers: formatTopPerformers(topPerformers),
    voiceBlock: buildVoiceBlock(voice),
  };

  const result = await generate({
    userId: input.userId,
    feature: "campaign.beatsheet",
    template: PROMPTS.campaignBeatsheet,
    vars,
    userMessage:
      "Produce the beat sheet as strict JSON. No markdown, no prose outside the JSON object.",
    temperature: 0.6,
  });

  const parsed = parseCampaignJson(result.text, input.channels);
  const beatsWithIds: CampaignBeat[] = parsed.beats.map((b) => ({
    ...b,
    id: crypto.randomUUID(),
  }));

  const [row] = await db
    .insert(campaigns)
    .values({
      userId: input.userId,
      name: input.name.trim() || parsed.name || input.goal.trim().slice(0, 60),
      goal: input.goal.trim(),
      kind: input.kind,
      channels: input.channels,
      rangeStart: input.rangeStart,
      rangeEnd: input.rangeEnd,
      beats: beatsWithIds as unknown as Array<Record<string, unknown>>,
      status: "ready",
      generationId: result.generationId,
    })
    .returning({ id: campaigns.id });

  return {
    campaignId: row.id,
    overview: parsed.overview,
    beats: beatsWithIds,
  };
}

// ---- parsing --------------------------------------------------------------

function parseCampaignJson(
  text: string,
  allowedChannels: string[],
): { name: string; overview: string; beats: Omit<CampaignBeat, "id">[] } {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("The beat sheet wasn't valid JSON. Try again.");
  }

  const obj = parsed as {
    name?: unknown;
    overview?: unknown;
    beats?: unknown;
  };
  if (typeof obj.overview !== "string" || !Array.isArray(obj.beats)) {
    throw new Error("Beat sheet output missing required fields.");
  }

  const allowed = new Set(allowedChannels);
  const beats: Omit<CampaignBeat, "id">[] = [];

  for (const raw of obj.beats) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const date = typeof r.date === "string" ? r.date : "";
    const channel = typeof r.channel === "string" ? r.channel : "";
    const title = typeof r.title === "string" ? r.title.trim() : "";
    const angle = typeof r.angle === "string" ? r.angle.trim() : "";
    const phase =
      typeof r.phase === "string" &&
      (BEAT_PHASES as readonly string[]).includes(r.phase)
        ? (r.phase as BeatPhase)
        : "announce";
    const format =
      typeof r.format === "string" &&
      (VALID_FORMATS as readonly string[]).includes(r.format)
        ? (r.format as BeatFormat)
        : "single";

    if (!title || !date || !allowed.has(channel)) continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    beats.push({ date, phase, channel, title, angle, format });
  }

  if (beats.length === 0) {
    throw new Error(
      "Beat sheet came back empty. Try again with a clearer goal.",
    );
  }

  return {
    name: typeof obj.name === "string" ? obj.name.trim() : "",
    overview: obj.overview,
    beats,
  };
}

// ---- helpers --------------------------------------------------------------

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatBestWindows(
  channels: string[],
  byChannel: Record<
    string,
    Array<{ dayOfWeek: number; hourStart: number; hourEnd: number }>
  >,
): string {
  const dayLabel = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const fmtHour = (h: number) => {
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
      `  - ${ch}: ${dayLabel[top.dayOfWeek]} ${fmtHour(top.hourStart)}–${fmtHour(top.hourEnd)}`,
    );
  }
  return lines.length > 0 ? lines.join("\n") : "(no best-window data yet)";
}

// ---- research pane loaders ------------------------------------------------

// User's own captured ideas — manual captures and URL clips skew toward
// voice, but for campaign briefs any non-archived idea is a useful topic
// seed. Muse riffs on these rather than restating them verbatim.
async function loadUserIdeas(userId: string) {
  return db
    .select({
      title: ideas.title,
      body: ideas.body,
      tags: ideas.tags,
    })
    .from(ideas)
    .where(and(eq(ideas.userId, userId), ne(ideas.status, "archived")))
    .orderBy(desc(ideas.createdAt))
    .limit(MAX_IDEA_ITEMS);
}

// Top-performing past posts, joined against the content cache so the model
// sees the actual text (not just metrics). Ranked by impressions, with
// engagement sum as a fallback when impressions are missing. Constrained to
// the campaign's target channels so the signal matches where we're
// publishing next.
async function loadPastHighPerformers(userId: string, channels: string[]) {
  if (channels.length === 0) return [];
  const rankScore = sql<number>`
    COALESCE(
      NULLIF(${platformInsights.metrics}->>'impressions', '')::bigint,
      (
        COALESCE(NULLIF(${platformInsights.metrics}->>'likes', '')::int, 0)
        + COALESCE(NULLIF(${platformInsights.metrics}->>'replies', '')::int, 0)
        + COALESCE(NULLIF(${platformInsights.metrics}->>'reposts', '')::int, 0)
        + COALESCE(NULLIF(${platformInsights.metrics}->>'quotes', '')::int, 0)
      ) * 100
    )
  `;
  return db
    .select({
      platform: platformInsights.platform,
      content: platformContentCache.content,
      score: rankScore,
    })
    .from(platformInsights)
    .innerJoin(
      platformContentCache,
      and(
        eq(platformInsights.userId, platformContentCache.userId),
        eq(platformInsights.platform, platformContentCache.platform),
        eq(
          platformInsights.remotePostId,
          platformContentCache.remotePostId,
        ),
      ),
    )
    .where(
      and(
        eq(platformInsights.userId, userId),
        inArray(platformInsights.platform, channels),
      ),
    )
    .orderBy(desc(rankScore))
    .limit(MAX_TOP_PERFORMERS);
}

async function loadRecentInspiration(userId: string) {
  const userFeedIds = (
    await db.select({ id: feeds.id }).from(feeds).where(eq(feeds.userId, userId))
  ).map((r) => r.id);
  if (userFeedIds.length === 0) return [];
  return db
    .select({
      title: feedItems.title,
      summary: feedItems.summary,
    })
    .from(feedItems)
    .where(inArray(feedItems.feedId, userFeedIds))
    .orderBy(desc(feedItems.publishedAt))
    .limit(MAX_INSPIRATION_ITEMS);
}

function formatInspiration(
  items: Array<{ title: string; summary: string | null }>,
): string {
  if (items.length === 0) return "(no recent reads — rely on voice + goal)";
  return items
    .map((it, i) => {
      const sum = it.summary ? ` — ${it.summary.slice(0, 140)}` : "";
      return `  ${i + 1}. ${it.title}${sum}`;
    })
    .join("\n");
}

function formatIdeas(
  items: Array<{ title: string | null; body: string; tags: string[] }>,
): string {
  if (items.length === 0) {
    return "(no captured ideas — lean on the goal + voice alone)";
  }
  return items
    .map((it, i) => {
      const head = it.title ?? it.body.slice(0, 80);
      const body =
        it.body && it.body !== it.title
          ? ` — ${it.body.slice(0, 180)}`
          : "";
      const tags =
        it.tags.length > 0 ? `  [${it.tags.map((t) => `#${t}`).join(" ")}]` : "";
      return `  ${i + 1}. ${head}${body}${tags}`;
    })
    .join("\n");
}

function formatTopPerformers(
  items: Array<{ platform: string; content: string }>,
): string {
  if (items.length === 0) {
    return "(no past performance data yet — Muse will lean on voice + goal)";
  }
  return items
    .map((it, i) => {
      const excerpt = it.content.replace(/\s+/g, " ").slice(0, 240).trim();
      return `  ${i + 1}. [${it.platform}] ${excerpt}`;
    })
    .join("\n");
}

// ---- acceptance + loading -------------------------------------------------

export async function markBeatAccepted(
  campaignId: string,
  beatId: string,
  postId: string,
): Promise<void> {
  const [row] = await db
    .select({ beats: campaigns.beats, status: campaigns.status })
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);
  if (!row) return;

  const next = (row.beats as CampaignBeat[]).map((b) =>
    b.id === beatId ? { ...b, accepted: true, acceptedPostId: postId } : b,
  );
  const nextStatus = row.status === "ready" ? "running" : row.status;
  await db
    .update(campaigns)
    .set({
      beats: next as unknown as Array<Record<string, unknown>>,
      status: nextStatus,
      updatedAt: new Date(),
    })
    .where(eq(campaigns.id, campaignId));
}

export async function loadCampaign(
  userId: string,
  campaignId: string,
): Promise<{
  id: string;
  name: string;
  goal: string;
  kind: CampaignKind;
  channels: string[];
  rangeStart: Date;
  rangeEnd: Date;
  beats: CampaignBeat[];
  status: string;
  createdAt: Date;
} | null> {
  const [row] = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId)))
    .limit(1);
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    goal: row.goal,
    kind: row.kind as CampaignKind,
    channels: row.channels,
    rangeStart: row.rangeStart,
    rangeEnd: row.rangeEnd,
    beats: row.beats as CampaignBeat[],
    status: row.status,
    createdAt: row.createdAt,
  };
}

export async function listCampaigns(userId: string) {
  return db
    .select({
      id: campaigns.id,
      name: campaigns.name,
      goal: campaigns.goal,
      kind: campaigns.kind,
      status: campaigns.status,
      rangeStart: campaigns.rangeStart,
      rangeEnd: campaigns.rangeEnd,
      beats: campaigns.beats,
      createdAt: campaigns.createdAt,
    })
    .from(campaigns)
    .where(eq(campaigns.userId, userId))
    .orderBy(desc(campaigns.createdAt));
}

// Regenerates a single beat in place. The beat's date, channel, and phase
// are kept — Muse rewrites the title + angle + format only. Useful when
// one beat in an otherwise-good sheet is off-tone or too similar to
// another beat. Refuses to regenerate beats that are already drafted
// (that would orphan the linked post's provenance).
export async function regenerateCampaignBeat(
  userId: string,
  campaignId: string,
  beatId: string,
): Promise<CampaignBeat> {
  const campaign = await loadCampaign(userId, campaignId);
  if (!campaign) throw new Error("Campaign not found.");

  const target = campaign.beats.find((b) => b.id === beatId);
  if (!target) throw new Error("Beat not found.");
  if (target.accepted) {
    throw new Error(
      "This beat is already drafted. Edit the post in the composer instead.",
    );
  }

  const other = campaign.beats.filter((b) => b.id !== beatId);
  const duplicateGuard = other
    .map((b) => `  - [${b.channel} · ${b.phase}] ${b.title}`)
    .join("\n");

  await registerPrompts();

  const [voice, bestWindowsByChannel, inspiration, userIdeas, topPerformers] =
    await Promise.all([
      loadCurrentVoice(userId),
      getBestWindowsForUser(userId, "UTC"),
      loadRecentInspiration(userId),
      loadUserIdeas(userId),
      loadPastHighPerformers(userId, campaign.channels),
    ]);

  const result = await generate({
    userId,
    feature: "campaign.beatsheet",
    template: PROMPTS.campaignBeatsheet,
    vars: {
      kind: campaign.kind,
      goal: campaign.goal,
      channels: campaign.channels.join(", "),
      rangeStart: target.date,
      rangeEnd: target.date,
      bestWindows: formatBestWindows(
        campaign.channels,
        bestWindowsByChannel,
      ),
      inspiration: formatInspiration(inspiration),
      yourIdeas: formatIdeas(userIdeas),
      topPerformers: formatTopPerformers(topPerformers),
      voiceBlock: buildVoiceBlock(voice),
    },
    userMessage: [
      "Regenerate ONE single beat only.",
      `It must target: date ${target.date}, channel ${target.channel}, phase ${target.phase}.`,
      "Produce exactly one beat in the \"beats\" array.",
      "Do NOT repeat any of these existing beats in shape or substance:",
      duplicateGuard || "  (none)",
      "Return strict JSON — no markdown, no prose outside the JSON object.",
    ].join("\n"),
    temperature: 0.85,
  });

  const parsed = parseCampaignJson(result.text, campaign.channels);
  const fresh = parsed.beats[0];
  if (!fresh) throw new Error("Regeneration came back empty. Try again.");

  const replacement: CampaignBeat = {
    id: beatId,
    date: target.date,
    channel: target.channel,
    phase: target.phase,
    title: fresh.title,
    angle: fresh.angle,
    format: fresh.format,
  };

  const next = campaign.beats.map((b) => (b.id === beatId ? replacement : b));
  await db
    .update(campaigns)
    .set({
      beats: next as unknown as Array<Record<string, unknown>>,
      updatedAt: new Date(),
    })
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId)));

  return replacement;
}
