"use server";

import { getCurrentUser } from "@/lib/current-user";
import { generate } from "@/lib/ai/router";
import { PROMPTS, registerPrompts } from "@/lib/ai/prompts";
import { loadCurrentVoice } from "@/lib/ai/voice";

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

// Per-platform character limits the generator should honor. Kept in sync
// with composer.tsx PLATFORMS. "general" = a safe 500-char fallback.
const PLATFORM_CONSTRAINTS: Record<string, string> = {
  twitter: "280 characters max. Single post (not a thread). Punchy hook.",
  linkedin:
    "Up to 3000 characters. Hook, 2-3 beats, optional question close. No theatrical line breaks unless the voice profile warrants them.",
  facebook: "Long-form OK. Lead with the headline thought.",
  instagram:
    "Caption up to 2200 characters. Warm first line, line break after the hook.",
  threads: "Up to 500 characters. Conversational, not performative.",
  tiktok:
    "Caption up to 2200 characters but prefer short. Pairs with a video — caption is footer, not message.",
  bluesky: "300 characters recommended. Authentic, not performative.",
  medium: "Long-form article OK. Start with insight, not a hook.",
  reddit:
    "Respect the community's norms. No marketing cadence. Short title if title post.",
  general: "Keep under 500 characters. Neutral, platform-agnostic.",
};

export async function generateDraft(topic: string, platform: string = "general") {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  if (!topic.trim()) throw new Error("Topic is required");

  await registerPrompts();

  const voice = await loadCurrentVoice(user.id);
  const voiceBlock = voice
    ? buildVoiceBlock(voice)
    : "(No voice profile trained yet. Write in a neutral, direct tone.)";

  const constraints =
    PLATFORM_CONSTRAINTS[platform] ?? PLATFORM_CONSTRAINTS.general;

  try {
    const result = await generate({
      userId: user.id,
      feature: "composer.generate",
      template: PROMPTS.composerGenerate,
      vars: { platform, platformConstraints: constraints, voiceBlock },
      userMessage: `Topic / brief: ${topic.trim()}`,
      temperature: 0.8,
    });
    return result.text.trim();
  } catch (error) {
    console.error("AI Generate Error:", error);
    throw new Error("Failed to generate draft");
  }
}

// Voice row → prose block the generator consumes as system-prompt context.
function buildVoiceBlock(voice: {
  tone: unknown;
  features: unknown;
  bannedPhrases: string[];
  ctaStyle: string | null;
  emojiRate: string | null;
}): string {
  const tone = (voice.tone ?? {}) as {
    summary?: string;
    descriptors?: string[];
  };
  const features = (voice.features ?? {}) as {
    hook_patterns?: string[];
    cadence?: {
      avg_sentence_length_words?: number;
      sentence_variance?: string;
      paragraph_breaks?: string;
    };
    positive_examples?: string[];
  };

  const parts: string[] = [];
  if (tone.summary) parts.push(`Summary: ${tone.summary}`);
  if (tone.descriptors?.length)
    parts.push(`Tone: ${tone.descriptors.join(", ")}`);
  if (features.hook_patterns?.length)
    parts.push(`Hook patterns: ${features.hook_patterns.join(" / ")}`);
  if (features.cadence) {
    const c = features.cadence;
    const bits: string[] = [];
    if (c.avg_sentence_length_words)
      bits.push(`avg sentence ~${c.avg_sentence_length_words} words`);
    if (c.sentence_variance) bits.push(`variance: ${c.sentence_variance}`);
    if (c.paragraph_breaks) bits.push(`paragraph breaks: ${c.paragraph_breaks}`);
    if (bits.length) parts.push(`Cadence: ${bits.join("; ")}`);
  }
  if (voice.ctaStyle) parts.push(`CTA style: ${voice.ctaStyle}`);
  if (voice.emojiRate) parts.push(`Emoji rate: ${voice.emojiRate}`);
  if (voice.bannedPhrases.length)
    parts.push(`Never use: ${voice.bannedPhrases.join(", ")}`);
  if (features.positive_examples?.length) {
    parts.push("Positive examples (tone, not topics):");
    for (const ex of features.positive_examples.slice(0, 3)) {
      parts.push(`  - ${ex}`);
    }
  }

  return parts.join("\n");
}
