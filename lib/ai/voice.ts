// Brand-voice training pipeline. Takes slider state + optional uploaded
// corpus + optional sample IDs from platform_content_cache, runs the
// `voice.train` template, parses the structured JSON, and persists into
// `brand_voice`. Called from the settings Muse tab server action.
//
// Design notes:
//  - Uploaded corpus is in-request (no corpus table yet — the plan calls it
//    `brand_corpus` but adding the table isn't blocking voice v1; upload
//    flows straight into the training call).
//  - Sample IDs reference `platform_content_cache.id`. If none passed, we
//    auto-pick the most recent N across all connected platforms.
//  - Corpus is truncated to fit the model context. We don't paginate across
//    multiple calls yet — the Pro model's window handles a few hundred
//    posts comfortably.

import { inArray, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  brandCorpus,
  brandVoice,
  brandVoiceChannels,
  ideas,
  platformContentCache,
  posts,
  type ChannelOverride,
} from "@/db/schema";
import { and, eq, or } from "drizzle-orm";
import { PROMPTS, registerPrompts } from "./prompts";
import { requireActiveWorkspaceId } from "@/lib/workspaces/resolve";
import { generate } from "./router";

// Channels need at least this many samples before we train a per-channel
// delta. Below the threshold the channel falls back to the global profile
// (see ai-grand-plan §11). 15 is the empirical floor where the delta stops
// overfitting to a handful of posts.
const CHANNEL_DELTA_MIN_SAMPLES = 15;

export type VoiceSliders = {
  formality: number; // 0-100
  detail: number; // 0-100
  wit: number; // 0-100
  perspective: "first-person" | "third-person" | "mixed";
};

export type VoiceProfile = {
  summary: string;
  tone_descriptors: string[];
  hook_patterns: string[];
  cta_style: string;
  cadence: {
    avg_sentence_length_words: number;
    sentence_variance: "tight" | "moderate" | "varied";
    paragraph_breaks: "frequent" | "moderate" | "sparse";
  };
  emoji_rate: "none" | "low" | "medium" | "high";
  banned_phrases: string[];
  positive_examples: string[];
};

// Cap on corpus tokens sent to the trainer. Gemini Pro handles ~1M tokens
// but we keep the training call tight so latency + cost stay predictable.
// ~50k chars ≈ 12k tokens.
const MAX_CORPUS_CHARS = 50_000;
const AUTO_SAMPLE_LIMIT = 100;

export type TrainVoiceInput = {
  userId: string;
  sliders: VoiceSliders;
  uploadedCorpus?: string;
  // Explicit picks from platform_content_cache. If empty/undefined, we pull
  // the most recent AUTO_SAMPLE_LIMIT posts for the user.
  samplePostIds?: string[];
};

export type VoiceChannelDelta = {
  summary: string;
  tone_descriptors?: string[];
  hook_patterns?: string[];
  cta_style?: string;
  emoji_rate?: "none" | "low" | "medium" | "high";
  banned_phrases?: string[];
  positive_examples?: string[];
  sample_count: number;
};

export type TrainedChannelDelta = {
  channel: string;
  delta: VoiceChannelDelta;
};

export type SkippedChannelDelta = {
  channel: string;
  sampleCount: number;
  reason: "below-threshold";
};

export type TrainVoiceResult = {
  profile: VoiceProfile;
  generationId: string;
  corpusSize: number;
  sampleCount: number;
  channelDeltas: TrainedChannelDelta[];
  skippedChannels: SkippedChannelDelta[];
};

export async function trainVoice(
  input: TrainVoiceInput,
): Promise<TrainVoiceResult> {
  await registerPrompts();

  const [cachedSamples, internalSamples, corpusDocs, userIdeas] =
    await Promise.all([
      loadCorpusSamples(input.userId, input.samplePostIds),
      loadInternalPostSamples(input.userId),
      loadBrandCorpusForTraining(input.userId),
      loadIdeasForTraining(input.userId),
    ]);
  // Internal Aloha posts (draft / scheduled / published / failed) always
  // participate — they're the user's most direct voice signal on this
  // platform. Explicit samplePostIds only narrows the cached platform
  // samples, not the internal set.
  const samples = [...cachedSamples, ...internalSamples];
  const corpus = assembleCorpus(
    cachedSamples,
    internalSamples,
    corpusDocs,
    userIdeas,
    input.uploadedCorpus,
  );

  const result = await generate({
    userId: input.userId,
    feature: "voice.train",
    template: PROMPTS.voiceTrain,
    vars: {
      formality: String(input.sliders.formality),
      detail: String(input.sliders.detail),
      wit: String(input.sliders.wit),
      perspective: input.sliders.perspective,
    },
    userMessage: corpus,
    temperature: 0.3,
  });

  const profile = parseVoiceProfile(result.text);

  await persistVoiceProfile(input.userId, profile, samples.map((s) => s.id));

  const { trained, skipped } = await trainChannelDeltas(
    input.userId,
    profile,
    samples,
  );

  return {
    profile,
    generationId: result.generationId,
    corpusSize: corpus.length,
    sampleCount: samples.length,
    channelDeltas: trained,
    skippedChannels: skipped,
  };
}

async function trainChannelDeltas(
  userId: string,
  globalProfile: VoiceProfile,
  samples: Sample[],
): Promise<{ trained: TrainedChannelDelta[]; skipped: SkippedChannelDelta[] }> {
  const byChannel = new Map<string, Sample[]>();
  for (const s of samples) {
    const arr = byChannel.get(s.platform) ?? [];
    arr.push(s);
    byChannel.set(s.platform, arr);
  }

  const skipped: SkippedChannelDelta[] = [];
  const eligible: Array<{ channel: string; samples: Sample[] }> = [];
  for (const [channel, channelSamples] of byChannel) {
    if (channelSamples.length < CHANNEL_DELTA_MIN_SAMPLES) {
      skipped.push({
        channel,
        sampleCount: channelSamples.length,
        reason: "below-threshold",
      });
    } else {
      eligible.push({ channel, samples: channelSamples });
    }
  }

  if (eligible.length === 0) {
    await clearStaleChannelDeltas(userId, []);
    return { trained: [], skipped };
  }

  const globalProfileJson = JSON.stringify(globalProfile);

  const results = await Promise.all(
    eligible.map(async ({ channel, samples: channelSamples }) => {
      const corpus = buildChannelCorpus(channelSamples);
      const out = await generate({
        userId,
        feature: "voice.trainChannelDelta",
        template: PROMPTS.voiceTrainChannelDelta,
        vars: { channel, globalProfile: globalProfileJson },
        userMessage: corpus,
        temperature: 0.3,
      });
      const delta = parseChannelDelta(out.text, channelSamples.length);
      return { channel, delta };
    }),
  );

  await persistChannelDeltas(userId, results);
  await clearStaleChannelDeltas(
    userId,
    results.map((r) => r.channel),
  );

  return { trained: results, skipped };
}

function buildChannelCorpus(samples: Sample[]): string {
  const capped = samples.slice(0, 60);
  const joined = capped.map((s) => s.content).join("\n\n---\n\n");
  return joined.length > MAX_CORPUS_CHARS
    ? joined.slice(0, MAX_CORPUS_CHARS) + "\n\n[...truncated]"
    : joined;
}

function parseChannelDelta(
  text: string,
  sampleCount: number,
): VoiceChannelDelta {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Channel delta trainer returned non-JSON output.");
  }
  const p = parsed as Partial<VoiceChannelDelta>;
  if (typeof p.summary !== "string") {
    throw new Error("Channel delta JSON missing required 'summary' field.");
  }
  return { ...(parsed as VoiceChannelDelta), sample_count: sampleCount };
}

async function persistChannelDeltas(
  userId: string,
  deltas: TrainedChannelDelta[],
) {
  if (deltas.length === 0) return;
  const workspaceId = await requireActiveWorkspaceId(userId);
  for (const { channel, delta } of deltas) {
    await db
      .insert(brandVoiceChannels)
      .values({
        workspaceId,
        channel,
        overrides: delta as unknown as Record<string, unknown>,
      })
      .onConflictDoUpdate({
        target: [brandVoiceChannels.workspaceId, brandVoiceChannels.channel],
        set: {
          overrides: delta as unknown as Record<string, unknown>,
          version: sql`${brandVoiceChannels.version} + 1`,
          updatedAt: new Date(),
        },
      });
  }
}

// When a retrain no longer includes a previously-trained channel (e.g. the
// user disconnected an account), drop the stale delta so it can't continue
// influencing generations.
async function clearStaleChannelDeltas(userId: string, keep: string[]) {
  const workspaceId = await requireActiveWorkspaceId(userId);
  const rows = await db
    .select({ channel: brandVoiceChannels.channel })
    .from(brandVoiceChannels)
    .where(eq(brandVoiceChannels.workspaceId, workspaceId));
  const stale = rows.map((r) => r.channel).filter((c) => !keep.includes(c));
  if (stale.length === 0) return;
  await db
    .delete(brandVoiceChannels)
    .where(
      and(
        eq(brandVoiceChannels.workspaceId, workspaceId),
        inArray(brandVoiceChannels.channel, stale),
      ),
    );
}

async function loadCorpusSamples(
  userId: string,
  ids: string[] | undefined,
) {
  if (ids && ids.length > 0) {
    return db
      .select({
        id: platformContentCache.id,
        platform: platformContentCache.platform,
        content: platformContentCache.content,
      })
      .from(platformContentCache)
      .where(inArray(platformContentCache.id, ids));
  }
  return db
    .select({
      id: platformContentCache.id,
      platform: platformContentCache.platform,
      content: platformContentCache.content,
    })
    .from(platformContentCache)
    .where(eq(platformContentCache.userId, userId))
    .limit(AUTO_SAMPLE_LIMIT);
}

type Sample = { id: string; platform: string; content: string };
type CorpusDoc = { source: string; title: string | null; content: string };

// Posts authored inside Aloha — drafts, scheduled, published, and failed.
// We expand one sample per (post × platform), preferring the channel
// override when present so channel-delta training sees the variant the
// user actually wrote for that channel. Deleted posts are excluded.
async function loadInternalPostSamples(userId: string): Promise<Sample[]> {
  const rows = await db
    .select({
      id: posts.id,
      content: posts.content,
      platforms: posts.platforms,
      channelContent: posts.channelContent,
    })
    .from(posts)
    .where(and(eq(posts.createdByUserId, userId), ne(posts.status, "deleted")));

  const out: Sample[] = [];
  for (const row of rows) {
    const overrides = (row.channelContent ?? {}) as Record<
      string,
      ChannelOverride
    >;
    const targets = row.platforms.length > 0 ? row.platforms : ["general"];
    for (const platform of targets) {
      const override = overrides[platform]?.content;
      const content = (override ?? row.content)?.trim();
      if (!content) continue;
      out.push({ id: `post:${row.id}:${platform}`, platform, content });
    }
  }
  return out;
}

async function loadBrandCorpusForTraining(userId: string): Promise<CorpusDoc[]> {
  return db
    .select({
      source: brandCorpus.source,
      title: brandCorpus.title,
      content: brandCorpus.content,
    })
    .from(brandCorpus)
    .where(eq(brandCorpus.createdByUserId, userId));
}

// Ideas the user wrote themselves — `manual` captures and `url_clip` bodies
// (the note field the user types when clipping, not the URL's article
// body). These are short but high-signal: they're the user's actual voice,
// often the exact wording they'd use when posting. Feed-sourced ideas are
// skipped — their body is the article summary, not the user's writing.
type IdeaNote = { title: string | null; body: string };

async function loadIdeasForTraining(userId: string): Promise<IdeaNote[]> {
  return db
    .select({
      title: ideas.title,
      body: ideas.body,
    })
    .from(ideas)
    .where(
      and(
        eq(ideas.createdByUserId, userId),
        or(eq(ideas.source, "manual"), eq(ideas.source, "url_clip")),
      ),
    );
}

function assembleCorpus(
  cachedSamples: Sample[],
  internalSamples: Sample[],
  docs: CorpusDoc[],
  ideaNotes: IdeaNote[],
  uploaded: string | undefined,
): string {
  const blocks: string[] = [];

  if (cachedSamples.length > 0) {
    blocks.push(
      "--- Sample posts (your own writing from connected platforms) ---",
    );
    for (const s of cachedSamples) {
      blocks.push(`[${s.platform}] ${s.content}`);
    }
  }

  if (internalSamples.length > 0) {
    blocks.push(
      "--- Aloha posts (drafts, scheduled, and published from this app) ---",
    );
    for (const s of internalSamples) {
      blocks.push(`[${s.platform}] ${s.content}`);
    }
  }

  if (docs.length > 0) {
    blocks.push(
      "--- Long-form corpus (your writing workspace — Notion, Docs, uploads) ---",
    );
    for (const d of docs) {
      const header = d.title ? `[${d.source}] ${d.title}` : `[${d.source}]`;
      blocks.push(`${header}\n${d.content}`);
    }
  }

  if (ideaNotes.length > 0) {
    blocks.push(
      "--- Captured ideas (rough, high-signal for tone — your actual wording) ---",
    );
    for (const n of ideaNotes) {
      const header = n.title ? n.title : "(untitled)";
      blocks.push(`${header}\n${n.body}`);
    }
  }

  if (uploaded && uploaded.trim()) {
    blocks.push("--- Additional corpus (pasted) ---");
    blocks.push(uploaded.trim());
  }

  if (blocks.length === 0) {
    blocks.push(
      "(No corpus provided. Produce a slider-derived baseline profile.)",
    );
  }

  const joined = blocks.join("\n\n");
  return joined.length > MAX_CORPUS_CHARS
    ? joined.slice(0, MAX_CORPUS_CHARS) + "\n\n[...truncated]"
    : joined;
}

function parseVoiceProfile(text: string): VoiceProfile {
  // Models sometimes wrap JSON in fences despite instructions. Strip them.
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      "Voice trainer returned non-JSON output. Retry or check prompt.",
    );
  }

  // Shallow validation — enough to fail loudly instead of silently writing
  // garbage. The prompt holds the real contract.
  const p = parsed as Partial<VoiceProfile>;
  if (
    typeof p.summary !== "string" ||
    !Array.isArray(p.tone_descriptors) ||
    !p.cadence ||
    typeof p.emoji_rate !== "string"
  ) {
    throw new Error("Voice profile JSON missing required fields.");
  }
  return parsed as VoiceProfile;
}

async function persistVoiceProfile(
  userId: string,
  profile: VoiceProfile,
  sampleIds: string[],
) {
  const workspaceId = await requireActiveWorkspaceId(userId);
  await db
    .insert(brandVoice)
    .values({
      workspaceId,
      tone: { summary: profile.summary, descriptors: profile.tone_descriptors },
      features: {
        hook_patterns: profile.hook_patterns,
        cadence: profile.cadence,
        positive_examples: profile.positive_examples,
      },
      bannedPhrases: profile.banned_phrases ?? [],
      ctaStyle: profile.cta_style ?? null,
      emojiRate: profile.emoji_rate,
      sampleSourceIds: sampleIds,
      trainedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: brandVoice.workspaceId,
      set: {
        tone: { summary: profile.summary, descriptors: profile.tone_descriptors },
        features: {
          hook_patterns: profile.hook_patterns,
          cadence: profile.cadence,
          positive_examples: profile.positive_examples,
        },
        bannedPhrases: profile.banned_phrases ?? [],
        ctaStyle: profile.cta_style ?? null,
        emojiRate: profile.emoji_rate,
        sampleSourceIds: sampleIds,
        trainedAt: new Date(),
        updatedAt: new Date(),
      },
    });
}

export async function loadCurrentVoice(userId: string) {
  const workspaceId = await requireActiveWorkspaceId(userId);
  const [row] = await db
    .select()
    .from(brandVoice)
    .where(eq(brandVoice.workspaceId, workspaceId))
    .limit(1);
  return row ?? null;
}

export async function loadChannelVoice(
  userId: string,
  channel: string,
): Promise<VoiceChannelDelta | null> {
  const workspaceId = await requireActiveWorkspaceId(userId);
  const [row] = await db
    .select({ overrides: brandVoiceChannels.overrides })
    .from(brandVoiceChannels)
    .where(
      and(
        eq(brandVoiceChannels.workspaceId, workspaceId),
        eq(brandVoiceChannels.channel, channel),
      ),
    )
    .limit(1);
  return (row?.overrides as VoiceChannelDelta | undefined) ?? null;
}

export async function loadChannelVoices(
  userId: string,
  channels: string[],
): Promise<Record<string, VoiceChannelDelta | null>> {
  const result: Record<string, VoiceChannelDelta | null> = Object.fromEntries(
    channels.map((c) => [c, null]),
  );
  if (channels.length === 0) return result;
  const workspaceId = await requireActiveWorkspaceId(userId);
  const rows = await db
    .select({
      channel: brandVoiceChannels.channel,
      overrides: brandVoiceChannels.overrides,
    })
    .from(brandVoiceChannels)
    .where(
      and(
        eq(brandVoiceChannels.workspaceId, workspaceId),
        inArray(brandVoiceChannels.channel, channels),
      ),
    );
  for (const row of rows) {
    result[row.channel] = row.overrides as VoiceChannelDelta;
  }
  return result;
}

export async function loadAllChannelVoices(
  userId: string,
): Promise<Array<{ channel: string; delta: VoiceChannelDelta; version: number; updatedAt: Date }>> {
  const workspaceId = await requireActiveWorkspaceId(userId);
  const rows = await db
    .select({
      channel: brandVoiceChannels.channel,
      overrides: brandVoiceChannels.overrides,
      version: brandVoiceChannels.version,
      updatedAt: brandVoiceChannels.updatedAt,
    })
    .from(brandVoiceChannels)
    .where(eq(brandVoiceChannels.workspaceId, workspaceId));
  return rows.map((r) => ({
    channel: r.channel,
    delta: r.overrides as VoiceChannelDelta,
    version: r.version,
    updatedAt: r.updatedAt,
  }));
}
