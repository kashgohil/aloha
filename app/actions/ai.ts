"use server";

import { getCurrentUser } from "@/lib/current-user";
import { generate } from "@/lib/ai/router";
import { PROMPTS, registerPrompts } from "@/lib/ai/prompts";
import { loadCurrentVoice } from "@/lib/ai/voice";
import { buildVoiceBlock, constraintsFor } from "@/lib/ai/voice-context";

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
    console.error("AI Refinement Error:", error);
    throw new Error("Failed to refine content");
  }
}

export async function generateDraft(topic: string, platform: string = "general") {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  if (!topic.trim()) throw new Error("Topic is required");

  await registerPrompts();

  const voice = await loadCurrentVoice(user.id);

  try {
    const result = await generate({
      userId: user.id,
      feature: "composer.generate",
      template: PROMPTS.composerGenerate,
      vars: {
        platform,
        platformConstraints: constraintsFor(platform),
        voiceBlock: buildVoiceBlock(voice),
      },
      userMessage: `Topic / brief: ${topic.trim()}`,
      temperature: 0.8,
    });
    return result.text.trim();
  } catch (error) {
    console.error("AI Generate Error:", error);
    throw new Error("Failed to generate draft");
  }
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
    console.error("AI Alt-Text Error:", error);
    throw new Error("Failed to generate alt text");
  }
}

