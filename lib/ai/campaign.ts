// Campaign beat-sheet generation. Two shapes share this engine:
//
//   - Arc campaigns (launch / webinar / sale / custom) produce a sequenced
//     narrative — teaser → announce → social_proof → urgency → recap — via
//     the `campaignBeatsheet` prompt. Beats carry phase + title + angle.
//
//   - Cadence campaigns (drip / evergreen) produce a rhythm over a longer
//     range at `postsPerWeek` frequency via the `campaignCadence` prompt.
//     Beats still carry a phase (mostly teaser/announce/social_proof) but
//     additionally carry richer scaffolding (hook, keyPoints, cta,
//     hashtags, mediaSuggestion, rationale) so the review UI looks and
//     feels like the old plan ideas.

import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  campaigns,
  feedItems,
  feeds,
  ideas,
  platformContentCache,
  platformInsights,
  posts,
} from "@/db/schema";
import { generate } from "./router";
import { PROMPTS, registerPrompts } from "./prompts";
import { loadCurrentVoice } from "./voice";
import { buildVoiceBlock } from "./voice-context";
import { getBestWindowsForUser } from "@/lib/best-time";
import { requireActiveWorkspaceId } from "@/lib/workspaces/resolve";
import {
  defaultFormatFor,
  formatAllowlistBlock,
  formatGuidanceBlock,
  formatGuidanceFor as formatGuidanceForChannel,
  isValidFormat,
} from "@/lib/campaigns/channel-formats";
import { desc, inArray, isNotNull } from "drizzle-orm";

export const CAMPAIGN_KINDS = [
  "launch",
  "webinar",
  "sale",
  "drip",
  "evergreen",
  "reach",
  "custom",
] as const;
export type CampaignKind = (typeof CAMPAIGN_KINDS)[number];

export const CADENCE_KINDS = [
  "drip",
  "evergreen",
  "reach",
] as const satisfies readonly CampaignKind[];
export const isCadenceKind = (k: CampaignKind): boolean =>
  (CADENCE_KINDS as readonly string[]).includes(k);

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

// Format slugs are validated per-channel against lib/campaigns/channel-formats.
// The beat carries an opaque string; the parser + UI dropdowns enforce the
// channel's allowlist at the boundary.
export type BeatFormat = string;

export type CampaignBeat = {
  id: string;
  date: string; // YYYY-MM-DD
  phase: BeatPhase;
  channel: string;
  title: string;
  angle: string;
  format: BeatFormat;
  // Richer scaffolding — populated for cadence campaigns (drip/evergreen)
  // so the review cards + the accepted draft carry real post material, not
  // just a working title. Arc campaigns leave these undefined.
  hook?: string;
  keyPoints?: string[];
  cta?: string;
  hashtags?: string[];
  mediaSuggestion?: string;
  rationale?: string;
  accepted?: boolean;
  acceptedPostId?: string;
  // Hydrated by `loadCampaign` from the linked post when accepted. Lets
  // the UI surface the actual scheduled clock time (post may have been
  // tuned in the composer) instead of guessing the noon default, and
  // render a preview of what the post actually says.
  scheduledAt?: Date | null;
  postContent?: string | null;
  postStatus?: string | null;
  postMedia?: import("@/db/schema").PostMedia[] | null;
};

export type GenerateCampaignInput = {
  userId: string;
  name: string;
  goal: string;
  kind: CampaignKind;
  channels: string[];
  themes: string[];
  postsPerWeek: number | null;
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

  const cadence = isCadenceKind(input.kind);
  if (cadence && (!input.postsPerWeek || input.postsPerWeek < 1)) {
    throw new Error("Pick a posts-per-week cadence for drip/evergreen runs.");
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

  const sharedVars = {
    goal: input.goal.trim(),
    channels: input.channels.join(", "),
    rangeStart: toIsoDate(input.rangeStart),
    rangeEnd: toIsoDate(input.rangeEnd),
    bestWindows: formatBestWindows(input.channels, bestWindowsByChannel),
    inspiration: formatInspiration(inspiration),
    yourIdeas: formatIdeas(userIdeas),
    topPerformers: formatTopPerformers(topPerformers),
    voiceBlock: buildVoiceBlock(voice),
    formatAllowlist: formatAllowlistBlock(input.channels),
    formatGuidance: formatGuidanceBlock(input.channels),
  };

  const result = cadence
    ? await generate({
        userId: input.userId,
        feature: "campaign.cadence",
        template: PROMPTS.campaignCadence,
        vars: {
          ...sharedVars,
          kind: input.kind,
          themes:
            input.themes.length > 0
              ? input.themes.join(", ")
              : "(none specified)",
          frequency: String(input.postsPerWeek ?? 5),
        },
        userMessage:
          "Produce the cadence run as strict JSON. No markdown, no prose outside the JSON object.",
        temperature: 0.7,
      })
    : await generate({
        userId: input.userId,
        feature: "campaign.beatsheet",
        template: PROMPTS.campaignBeatsheet,
        vars: {
          ...sharedVars,
          kind: input.kind,
        },
        userMessage:
          "Produce the beat sheet as strict JSON. No markdown, no prose outside the JSON object.",
        temperature: 0.6,
      });

  const parsed = parseCampaignJson(result.text, input.channels);
  const beatsWithIds: CampaignBeat[] = parsed.beats.map((b) => ({
    ...b,
    id: crypto.randomUUID(),
  }));

  const campaignWorkspaceId = await requireActiveWorkspaceId(input.userId);
  const [row] = await db
    .insert(campaigns)
    .values({
      createdByUserId: input.userId,
      workspaceId: campaignWorkspaceId,
      name: input.name.trim() || parsed.name || input.goal.trim().slice(0, 60),
      goal: input.goal.trim(),
      kind: input.kind,
      channels: input.channels,
      themes: input.themes,
      postsPerWeek: cadence ? (input.postsPerWeek ?? null) : null,
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
      typeof r.format === "string" && isValidFormat(channel, r.format)
        ? r.format
        : defaultFormatFor(channel);

    if (!title || !date || !allowed.has(channel)) continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;

    const beat: Omit<CampaignBeat, "id"> = {
      date,
      phase,
      channel,
      title,
      angle,
      format,
    };

    // Scaffolding fields — both prompts (beatsheet + cadence) now emit them
    // so every accepted beat becomes a draft-ready post. Old arc beats
    // persisted before this change just won't carry them; the parser
    // tolerates either shape.
    const hook = typeof r.hook === "string" ? r.hook.trim() : "";
    const cta = typeof r.cta === "string" ? r.cta.trim() : "";
    const mediaSuggestion =
      typeof r.mediaSuggestion === "string" ? r.mediaSuggestion.trim() : "";
    const rationale =
      typeof r.rationale === "string" ? r.rationale.trim() : "";
    const keyPoints = Array.isArray(r.keyPoints)
      ? r.keyPoints
          .filter((k): k is string => typeof k === "string")
          .map((k) => k.trim())
          .filter(Boolean)
          .slice(0, 8)
      : [];
    const hashtags = Array.isArray(r.hashtags)
      ? r.hashtags
          .filter((k): k is string => typeof k === "string")
          .map((k) => (k.startsWith("#") ? k : `#${k}`))
          .filter((k) => /^#[\w-]+$/.test(k))
          .slice(0, 20)
      : [];

    if (hook) beat.hook = hook;
    if (keyPoints.length > 0) beat.keyPoints = keyPoints;
    if (cta) beat.cta = cta;
    if (hashtags.length > 0) beat.hashtags = hashtags;
    if (mediaSuggestion) beat.mediaSuggestion = mediaSuggestion;
    if (rationale) beat.rationale = rationale;

    beats.push(beat);
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
    .where(and(eq(ideas.createdByUserId, userId), ne(ideas.status, "archived")))
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
  const workspaceId = await requireActiveWorkspaceId(userId);
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
        eq(platformInsights.workspaceId, platformContentCache.workspaceId),
        eq(platformInsights.platform, platformContentCache.platform),
        eq(
          platformInsights.remotePostId,
          platformContentCache.remotePostId,
        ),
      ),
    )
    .where(
      and(
        eq(platformInsights.workspaceId, workspaceId),
        inArray(platformInsights.platform, channels),
      ),
    )
    .orderBy(desc(rankScore))
    .limit(MAX_TOP_PERFORMERS);
}

async function loadRecentInspiration(userId: string) {
  const workspaceId = await requireActiveWorkspaceId(userId);
  const userFeedIds = (
    await db
      .select({ id: feeds.id })
      .from(feeds)
      .where(eq(feeds.workspaceId, workspaceId))
  ).map((r) => r.id);
  if (userFeedIds.length === 0) return [];
  return db
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
  await db
    .update(campaigns)
    .set({
      beats: next as unknown as Array<Record<string, unknown>>,
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
  themes: string[];
  postsPerWeek: number | null;
  rangeStart: Date;
  rangeEnd: Date;
  beats: CampaignBeat[];
  status: string;
  createdAt: Date;
} | null> {
  const [row] = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.createdByUserId, userId)))
    .limit(1);
  if (!row) return null;
  const rawBeats = row.beats as CampaignBeat[];
  const acceptedPostIds = rawBeats
    .map((b) => b.acceptedPostId)
    .filter((id): id is string => Boolean(id));
  const postById = new Map<
    string,
    {
      scheduledAt: Date | null;
      content: string | null;
      status: string | null;
      media: import("@/db/schema").PostMedia[] | null;
    }
  >();
  if (acceptedPostIds.length > 0) {
    const rows = await db
      .select({
        id: posts.id,
        scheduledAt: posts.scheduledAt,
        content: posts.content,
        status: posts.status,
        media: posts.media,
      })
      .from(posts)
      .where(inArray(posts.id, acceptedPostIds));
    for (const r of rows)
      postById.set(r.id, {
        scheduledAt: r.scheduledAt,
        content: r.content,
        status: r.status,
        media: r.media,
      });
  }
  const beats: CampaignBeat[] = rawBeats.map((b) => {
    if (!b.acceptedPostId) return b;
    const p = postById.get(b.acceptedPostId);
    return {
      ...b,
      scheduledAt: p?.scheduledAt ?? null,
      postContent: p?.content ?? null,
      postStatus: p?.status ?? null,
      postMedia: p?.media ?? null,
    };
  });
  return {
    id: row.id,
    name: row.name,
    goal: row.goal,
    kind: row.kind as CampaignKind,
    channels: row.channels,
    themes: row.themes,
    postsPerWeek: row.postsPerWeek,
    rangeStart: row.rangeStart,
    rangeEnd: row.rangeEnd,
    beats,
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
      channels: campaigns.channels,
      status: campaigns.status,
      rangeStart: campaigns.rangeStart,
      rangeEnd: campaigns.rangeEnd,
      beats: campaigns.beats,
      createdAt: campaigns.createdAt,
    })
    .from(campaigns)
    .where(eq(campaigns.createdByUserId, userId))
    .orderBy(desc(campaigns.createdAt));
}

// Regenerates a single beat in place. The beat's date, channel, and phase
// are kept — Muse rewrites the title + angle + format (and scaffolding for
// cadence campaigns) only. Refuses to regenerate beats that are already
// drafted (that would orphan the linked post's provenance).
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

  const cadence = isCadenceKind(campaign.kind);
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

  const sharedVars = {
    goal: campaign.goal,
    channels: campaign.channels.join(", "),
    rangeStart: target.date,
    rangeEnd: target.date,
    bestWindows: formatBestWindows(campaign.channels, bestWindowsByChannel),
    inspiration: formatInspiration(inspiration),
    yourIdeas: formatIdeas(userIdeas),
    topPerformers: formatTopPerformers(topPerformers),
    voiceBlock: buildVoiceBlock(voice),
    formatAllowlist: formatAllowlistBlock(campaign.channels),
    formatGuidance: formatGuidanceBlock(campaign.channels),
  };

  const userMessage = [
    "Regenerate ONE single beat only.",
    `It must target: date ${target.date}, channel ${target.channel}, phase ${target.phase}.`,
    'Produce exactly one beat in the "beats" array.',
    "Do NOT repeat any of these existing beats in shape or substance:",
    duplicateGuard || "  (none)",
    "Return strict JSON — no markdown, no prose outside the JSON object.",
  ].join("\n");

  const result = cadence
    ? await generate({
        userId,
        feature: "campaign.cadence",
        template: PROMPTS.campaignCadence,
        vars: {
          ...sharedVars,
          kind: campaign.kind,
          themes:
            campaign.themes.length > 0
              ? campaign.themes.join(", ")
              : "(none specified)",
          frequency: String(campaign.postsPerWeek ?? 1),
        },
        userMessage,
        temperature: 0.85,
      })
    : await generate({
        userId,
        feature: "campaign.beatsheet",
        template: PROMPTS.campaignBeatsheet,
        vars: {
          ...sharedVars,
          kind: campaign.kind,
        },
        userMessage,
        temperature: 0.85,
      });

  const parsed = parseCampaignJson(result.text, campaign.channels);
  const fresh = parsed.beats[0];
  if (!fresh) throw new Error("Regeneration came back empty. Try again.");

  const replacement: CampaignBeat = {
    ...fresh,
    id: beatId,
    date: target.date,
    channel: target.channel,
    phase: target.phase,
  };

  const next = campaign.beats.map((b) => (b.id === beatId ? replacement : b));
  await db
    .update(campaigns)
    .set({
      beats: next as unknown as Array<Record<string, unknown>>,
      updatedAt: new Date(),
    })
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.createdByUserId, userId)));

  return replacement;
}

// ---- draft body composition ----------------------------------------------

// Builds the editor-ready body from a beat. For rich (cadence) beats we
// flow hook → keyPoints → cta → hashtags the same way the old plan
// generator did; for arc beats we fall back to title + angle.
export function composeBeatBody(beat: CampaignBeat): string {
  const hasRicher =
    beat.hook || (beat.keyPoints && beat.keyPoints.length > 0) || beat.cta;
  if (!hasRicher) {
    return beat.title + (beat.angle ? `\n\n${beat.angle}` : "");
  }
  const parts: string[] = [];
  if (beat.hook) parts.push(beat.hook);
  if (beat.keyPoints && beat.keyPoints.length > 0) {
    const isBeatFormat =
      beat.format === "thread" || beat.format === "carousel";
    parts.push(
      isBeatFormat
        ? beat.keyPoints.map((k, i) => `${i + 1}. ${k}`).join("\n")
        : beat.keyPoints.join("\n\n"),
    );
  }
  if (beat.cta) parts.push(beat.cta);
  if (beat.hashtags && beat.hashtags.length > 0) {
    parts.push(beat.hashtags.join(" "));
  }
  return parts.join("\n\n");
}

// Short human-readable format hint shown in the composer sidebar. Not
// prompt context — just UI copy. Now delegates to the per-channel registry
// so a "thread" on X reads differently than a "thread" on Threads.
export function formatGuidanceFor(format: string, channel: string): string {
  return formatGuidanceForChannel(channel, format);
}

// ---- beat mutations -------------------------------------------------------
//
// All mutations write the entire `beats` jsonb array back. Concurrent edits
// to different beats on the same campaign would race; campaigns are single-
// user-edited in practice and revalidatePath flushes the cached view, so
// the cost of a row-level lock isn't worth it yet.

async function loadBeatsForUser(
  userId: string,
  campaignId: string,
): Promise<CampaignBeat[] | null> {
  const [row] = await db
    .select({ beats: campaigns.beats })
    .from(campaigns)
    .where(
      and(
        eq(campaigns.id, campaignId),
        eq(campaigns.createdByUserId, userId),
      ),
    )
    .limit(1);
  return row ? (row.beats as CampaignBeat[]) : null;
}

async function writeBeats(
  userId: string,
  campaignId: string,
  beats: CampaignBeat[],
): Promise<void> {
  await db
    .update(campaigns)
    .set({
      beats: beats as unknown as Array<Record<string, unknown>>,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(campaigns.id, campaignId),
        eq(campaigns.createdByUserId, userId),
      ),
    );
}

export type BeatEditPatch = Partial<
  Pick<
    CampaignBeat,
    | "title"
    | "angle"
    | "hook"
    | "keyPoints"
    | "cta"
    | "hashtags"
    | "mediaSuggestion"
    | "rationale"
  >
>;

export async function editCampaignBeat(
  userId: string,
  campaignId: string,
  beatId: string,
  patch: BeatEditPatch,
): Promise<CampaignBeat> {
  const beats = await loadBeatsForUser(userId, campaignId);
  if (!beats) throw new Error("Campaign not found.");
  const target = beats.find((b) => b.id === beatId);
  if (!target) throw new Error("Beat not found.");
  if (target.accepted) {
    throw new Error("This beat is drafted — edit the post in composer.");
  }
  const updated: CampaignBeat = { ...target, ...patch };
  const next = beats.map((b) => (b.id === beatId ? updated : b));
  await writeBeats(userId, campaignId, next);
  return updated;
}

export async function changeCampaignBeatFormat(
  userId: string,
  campaignId: string,
  beatId: string,
  newFormat: string,
): Promise<CampaignBeat> {
  const beats = await loadBeatsForUser(userId, campaignId);
  if (!beats) throw new Error("Campaign not found.");
  const target = beats.find((b) => b.id === beatId);
  if (!target) throw new Error("Beat not found.");
  if (target.accepted) {
    throw new Error("This beat is drafted — change format in composer.");
  }
  if (!isValidFormat(target.channel, newFormat)) {
    throw new Error(`'${newFormat}' isn't valid for ${target.channel}.`);
  }
  const updated: CampaignBeat = { ...target, format: newFormat };
  const next = beats.map((b) => (b.id === beatId ? updated : b));
  await writeBeats(userId, campaignId, next);
  return updated;
}

export async function rescheduleCampaignBeat(
  userId: string,
  campaignId: string,
  beatId: string,
  newDate: string,
): Promise<CampaignBeat> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
    throw new Error("Date must be YYYY-MM-DD.");
  }
  const beats = await loadBeatsForUser(userId, campaignId);
  if (!beats) throw new Error("Campaign not found.");
  const target = beats.find((b) => b.id === beatId);
  if (!target) throw new Error("Beat not found.");
  if (target.accepted) {
    throw new Error(
      "This beat is drafted — reschedule the post in composer instead.",
    );
  }
  const updated: CampaignBeat = { ...target, date: newDate };
  const next = beats.map((b) => (b.id === beatId ? updated : b));
  await writeBeats(userId, campaignId, next);
  return updated;
}

export async function deleteCampaignBeat(
  userId: string,
  campaignId: string,
  beatId: string,
): Promise<void> {
  const beats = await loadBeatsForUser(userId, campaignId);
  if (!beats) throw new Error("Campaign not found.");
  const target = beats.find((b) => b.id === beatId);
  if (!target) return;
  if (target.accepted) {
    throw new Error(
      "This beat is drafted — delete the post in composer instead.",
    );
  }
  const next = beats.filter((b) => b.id !== beatId);
  await writeBeats(userId, campaignId, next);
}

// Drafts a sibling beat — same date, channel, phase as the source beat,
// but a *different* format. Used by the inspector "add another format for
// this slot" action. Refuses if the target format already exists for that
// (date, channel) pair.
export async function addSiblingBeat(
  userId: string,
  campaignId: string,
  sourceBeatId: string,
  targetFormat: string,
): Promise<CampaignBeat> {
  const campaign = await loadCampaign(userId, campaignId);
  if (!campaign) throw new Error("Campaign not found.");

  const source = campaign.beats.find((b) => b.id === sourceBeatId);
  if (!source) throw new Error("Source beat not found.");
  if (!isValidFormat(source.channel, targetFormat)) {
    throw new Error(
      `'${targetFormat}' isn't valid for ${source.channel}.`,
    );
  }
  const collision = campaign.beats.find(
    (b) =>
      b.date === source.date &&
      b.channel === source.channel &&
      b.format === targetFormat,
  );
  if (collision) {
    throw new Error(
      `A ${targetFormat} beat already exists on ${source.date} for ${source.channel}.`,
    );
  }

  const cadence = isCadenceKind(campaign.kind);
  const duplicateGuard = campaign.beats
    .map((b) => `  - [${b.channel} · ${b.phase} · ${b.format}] ${b.title}`)
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

  const sharedVars = {
    goal: campaign.goal,
    channels: campaign.channels.join(", "),
    rangeStart: source.date,
    rangeEnd: source.date,
    bestWindows: formatBestWindows(campaign.channels, bestWindowsByChannel),
    inspiration: formatInspiration(inspiration),
    yourIdeas: formatIdeas(userIdeas),
    topPerformers: formatTopPerformers(topPerformers),
    voiceBlock: buildVoiceBlock(voice),
    formatAllowlist: formatAllowlistBlock(campaign.channels),
    formatGuidance: formatGuidanceBlock(campaign.channels),
  };

  const userMessage = [
    "Draft ONE single beat — a sibling for an existing beat in a different format.",
    `It must target: date ${source.date}, channel ${source.channel}, phase ${source.phase}, format ${targetFormat}.`,
    `Pivot the angle so it doesn't repeat the source beat — same goal, different format-native angle for ${targetFormat}.`,
    'Produce exactly one beat in the "beats" array.',
    "Do NOT repeat any of these existing beats:",
    duplicateGuard || "  (none)",
    "Return strict JSON — no markdown, no prose outside the JSON object.",
  ].join("\n");

  const result = cadence
    ? await generate({
        userId,
        feature: "campaign.cadence",
        template: PROMPTS.campaignCadence,
        vars: {
          ...sharedVars,
          kind: campaign.kind,
          themes:
            campaign.themes.length > 0
              ? campaign.themes.join(", ")
              : "(none specified)",
          frequency: String(campaign.postsPerWeek ?? 1),
        },
        userMessage,
        temperature: 0.85,
      })
    : await generate({
        userId,
        feature: "campaign.beatsheet",
        template: PROMPTS.campaignBeatsheet,
        vars: { ...sharedVars, kind: campaign.kind },
        userMessage,
        temperature: 0.85,
      });

  const parsed = parseCampaignJson(result.text, campaign.channels);
  const fresh = parsed.beats[0];
  if (!fresh) throw new Error("Sibling generation came back empty.");

  const newBeat: CampaignBeat = {
    ...fresh,
    id: crypto.randomUUID(),
    date: source.date,
    channel: source.channel,
    phase: source.phase,
    // Force the requested format even if Muse drifted.
    format: isValidFormat(source.channel, targetFormat)
      ? targetFormat
      : fresh.format,
  };

  const next = [...campaign.beats, newBeat];
  await writeBeats(userId, campaignId, next);
  return newBeat;
}
