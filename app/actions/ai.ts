"use server";

import { getCurrentUser } from "@/lib/current-user";
import { requireMuseAccess } from "@/lib/billing/muse";
import { generate } from "@/lib/ai/router";
import { PROMPTS, registerPrompts } from "@/lib/ai/prompts";
import { loadChannelVoice, loadCurrentVoice } from "@/lib/ai/voice";
import { buildVoiceBlock, constraintsFor } from "@/lib/ai/voice-context";
import { CostCapExceededError } from "@/lib/ai/cost-cap";
import { generateImage, type ImageAspect } from "@/lib/ai/image";
import { ModerationBlockedError } from "@/lib/ai/moderation";

export async function refineContent(
  content: string,
  platform: string = "general",
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  await registerPrompts();

  try {
    const result = await generate({
      userId: user.id,
      feature: "composer.refine",
      template: PROMPTS.composerRefine,
      vars: { platform },
      userMessage: content,
      temperature: 0.6,
    });
    return result.text.trim();
  } catch (error) {
    if (error instanceof CostCapExceededError) throw error;
    console.error("AI Refinement Error:", error);
    throw new Error("Failed to refine content");
  }
}

export async function generateDraft(topic: string, platform: string = "general") {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  await requireMuseAccess(user.id);
  if (!topic.trim()) throw new Error("Topic is required");

  await registerPrompts();

  const [voice, channelDelta] = await Promise.all([
    loadCurrentVoice(user.id),
    loadChannelVoice(user.id, platform),
  ]);

  try {
    const result = await generate({
      userId: user.id,
      feature: "composer.generate",
      template: PROMPTS.composerGenerate,
      vars: {
        platform,
        platformConstraints: constraintsFor(platform),
        voiceBlock: buildVoiceBlock(voice, channelDelta, platform),
      },
      userMessage: `Topic / brief: ${topic.trim()}`,
      temperature: 0.8,
    });
    return result.text.trim();
  } catch (error) {
    if (error instanceof CostCapExceededError) throw error;
    console.error("AI Generate Error:", error);
    throw new Error("Failed to generate draft");
  }
}

export type RichDraft = {
  body: string;
  hook: string;
  altHooks: string[];
  keyPoints: string[];
  cta: string;
  hashtags: string[];
  mediaSuggestion: string;
  rationale: string;
  formatGuidance: string;
};

// Structured counterpart to `generateDraft` — returns body plus the
// scaffolding the composer sidebar surfaces (alt hooks, key points, CTA,
// hashtags, media suggestion, rationale). Single Pro/Flash call; callers
// persist `body` into `posts.content` and the rest into `posts.draftMeta`.
export async function generateRichDraft(
  topic: string,
  platform: string = "general",
): Promise<RichDraft> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  await requireMuseAccess(user.id);
  if (!topic.trim()) throw new Error("Topic is required");

  await registerPrompts();
  const [voice, channelDelta] = await Promise.all([
    loadCurrentVoice(user.id),
    loadChannelVoice(user.id, platform),
  ]);

  try {
    const result = await generate({
      userId: user.id,
      feature: "composer.draft",
      template: PROMPTS.composerDraft,
      vars: {
        platform,
        platformConstraints: constraintsFor(platform),
        voiceBlock: buildVoiceBlock(voice, channelDelta, platform),
      },
      userMessage: `Topic / brief: ${topic.trim()}`,
      temperature: 0.75,
    });
    return parseRichDraftJson(result.text);
  } catch (error) {
    if (error instanceof CostCapExceededError) throw error;
    console.error("AI Rich Draft Error:", error);
    throw new Error("Failed to generate draft");
  }
}

function parseRichDraftJson(text: string): RichDraft {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  let parsed: Partial<RichDraft> | null = null;
  try {
    parsed = JSON.parse(cleaned) as Partial<RichDraft>;
  } catch {
    throw new Error("Draft response was not valid JSON.");
  }
  const strArr = (v: unknown, cap: number): string[] =>
    Array.isArray(v)
      ? v
          .filter((x): x is string => typeof x === "string")
          .map((x) => x.trim())
          .filter(Boolean)
          .slice(0, cap)
      : [];
  const hashtags = strArr(parsed.hashtags, 20).map((h) =>
    h.startsWith("#") ? h : `#${h}`,
  );
  const body = typeof parsed.body === "string" ? parsed.body.trim() : "";
  if (!body) throw new Error("Draft came back empty. Try again.");
  return {
    body,
    hook: typeof parsed.hook === "string" ? parsed.hook.trim() : "",
    altHooks: strArr(parsed.altHooks, 5),
    keyPoints: strArr(parsed.keyPoints, 8),
    cta: typeof parsed.cta === "string" ? parsed.cta.trim() : "",
    hashtags,
    mediaSuggestion:
      typeof parsed.mediaSuggestion === "string"
        ? parsed.mediaSuggestion.trim()
        : "",
    rationale:
      typeof parsed.rationale === "string" ? parsed.rationale.trim() : "",
    formatGuidance:
      typeof parsed.formatGuidance === "string"
        ? parsed.formatGuidance.trim()
        : "",
  };
}

// Per-platform hashtag norms. The trainer reads these as guidance and hits
// the right count + tone for the network. Kept tight — model does the
// heavy lifting from the content itself.
const HASHTAG_NORMS: Record<string, string> = {
  twitter: "0-2 hashtags max. Most posts use none. Only if clearly niche-relevant.",
  linkedin:
    "3-5 hashtags, at the end, lowercase. Professional topics, not emojis.",
  facebook: "0-2 hashtags. Readers don't search by tag here.",
  instagram:
    "8-15 hashtags. Mix of broad (>1M posts), mid-tier (100K-1M), and niche (<100K). Place at end or in a first comment line.",
  threads: "0-2 hashtags. Conversational platform, tags feel out of place.",
  tiktok:
    "3-5 hashtags. Include one category tag and one trending/topical tag when plausible. Avoid banned spam tags.",
  bluesky: "0-1 hashtag. Ecosystem barely uses them.",
  medium:
    "3-5 tags (Medium uses tags, not hashtags — but format as hashtags in the array; the caller strips as needed).",
  reddit: "No hashtags. Reddit doesn't use them.",
  pinterest: "3-5 keywords-as-hashtags for SEO.",
  general: "3-5 hashtags, lowercase, niche over generic.",
};

export async function suggestHashtags(
  content: string,
  platform: string = "general",
): Promise<string[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  if (!content.trim()) return [];

  await registerPrompts();

  const norms = HASHTAG_NORMS[platform] ?? HASHTAG_NORMS.general;

  try {
    const result = await generate({
      userId: user.id,
      feature: "composer.hashtags",
      template: PROMPTS.composerHashtags,
      vars: { platform, platformNorms: norms },
      userMessage: content.trim(),
      temperature: 0.4,
    });
    return parseHashtagJson(result.text);
  } catch (error) {
    if (error instanceof CostCapExceededError) throw error;
    console.error("AI Hashtag Error:", error);
    throw new Error("Failed to suggest hashtags");
  }
}

function parseHashtagJson(text: string): string[] {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    const parsed = JSON.parse(cleaned) as { hashtags?: unknown };
    if (!Array.isArray(parsed.hashtags)) return [];
    return parsed.hashtags
      .filter((t): t is string => typeof t === "string")
      .map((t) => (t.startsWith("#") ? t : `#${t}`))
      .filter((t) => /^#[\w-]+$/.test(t));
  } catch {
    return [];
  }
}

export async function generateAltText(
  imageUrl: string,
  postContext: string = "",
): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  await requireMuseAccess(user.id);
  if (!imageUrl) throw new Error("Image URL is required");

  await registerPrompts();

  try {
    const result = await generate({
      userId: user.id,
      feature: "vision.altText",
      template: PROMPTS.visionAltText,
      vars: { postContext: postContext.trim() || "(none)" },
      userMessage: "Write alt text for the attached image.",
      images: [imageUrl],
      temperature: 0.2,
    });
    return result.text.trim().replace(/^["']|["']$/g, "");
  } catch (error) {
    if (error instanceof CostCapExceededError) throw error;
    console.error("AI Alt-Text Error:", error);
    throw new Error("Failed to generate alt text");
  }
}


const VALID_ASPECTS = ["1:1", "4:5", "16:9", "9:16"] as const;
const isAspect = (v: unknown): v is ImageAspect =>
  typeof v === "string" && (VALID_ASPECTS as readonly string[]).includes(v);

export type GeneratedImagePayload = {
  url: string;
  mimeType: string;
  width: number;
  height: number;
  alt: string | null;
};

export async function generateImageAction(
  prompt: string,
  aspect: string = "1:1",
): Promise<GeneratedImagePayload> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  await requireMuseAccess(user.id);
  if (!prompt.trim()) throw new Error("Prompt is required");

  try {
    const img = await generateImage({
      userId: user.id,
      prompt,
      aspect: isAspect(aspect) ? aspect : "1:1",
    });
    return {
      url: img.url,
      mimeType: img.mimeType,
      width: img.width,
      height: img.height,
      alt: null,
    };
  } catch (error) {
    if (error instanceof CostCapExceededError) throw error;
    if (error instanceof ModerationBlockedError) throw error;
    console.error("AI Image Error:", error);
    throw new Error("Failed to generate image");
  }
}

export type PostScore = {
  score: number;
  oneLine: string;
  strengths: string[];
  weaknesses: string[];
  improvementBrief: string;
};

export async function scorePost(
  content: string,
  platform: string = "general",
): Promise<PostScore> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  await requireMuseAccess(user.id);
  if (!content.trim()) throw new Error("Nothing to score yet.");

  await registerPrompts();

  try {
    const result = await generate({
      userId: user.id,
      feature: "composer.score",
      template: PROMPTS.composerScore,
      vars: { platform, platformConstraints: constraintsFor(platform) },
      userMessage: content.trim(),
      temperature: 0.2,
    });
    return parseScoreJson(result.text);
  } catch (error) {
    if (error instanceof CostCapExceededError) throw error;
    console.error("AI Score Error:", error);
    throw new Error("Failed to score post");
  }
}

function parseScoreJson(text: string): PostScore {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  let parsed: Partial<PostScore> | null = null;
  try {
    parsed = JSON.parse(cleaned) as Partial<PostScore>;
  } catch {
    throw new Error("Score response was not valid JSON.");
  }
  const score = clampInt(Number(parsed.score ?? 0), 0, 100);
  return {
    score,
    oneLine: typeof parsed.oneLine === "string" ? parsed.oneLine : "",
    strengths: sanitizeList(parsed.strengths),
    weaknesses: sanitizeList(parsed.weaknesses),
    improvementBrief:
      typeof parsed.improvementBrief === "string" ? parsed.improvementBrief : "",
  };
}

function clampInt(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

function sanitizeList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 3);
}

export async function improveWithBrief(
  content: string,
  platform: string,
  improvementBrief: string,
): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  await requireMuseAccess(user.id);
  if (!content.trim()) throw new Error("Nothing to improve yet.");
  if (!improvementBrief.trim()) {
    throw new Error("No improvement brief provided.");
  }

  await registerPrompts();
  const [voice, channelDelta] = await Promise.all([
    loadCurrentVoice(user.id),
    loadChannelVoice(user.id, platform),
  ]);

  try {
    const result = await generate({
      userId: user.id,
      feature: "composer.improve",
      template: PROMPTS.composerImprove,
      vars: {
        platform,
        improvementBrief: improvementBrief.trim(),
        voiceBlock: buildVoiceBlock(voice, channelDelta, platform),
      },
      userMessage: content.trim(),
      temperature: 0.6,
    });
    return result.text.trim();
  } catch (error) {
    if (error instanceof CostCapExceededError) throw error;
    console.error("AI Improve Error:", error);
    throw new Error("Failed to improve post");
  }
}
