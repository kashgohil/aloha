// Text-input moderation for image generation prompts. Fail-closed on
// anything explicit. This is a first-pass gate — we run the user's prompt
// through a light moderation model and refuse to generate when it returns
// allowed=false. Image content moderation (post-generation) is a follow-up
// tail; most provider pipelines have their own output-side safety too.

import { generate } from "./router";
import { PROMPTS, registerPrompts } from "./prompts";

export type ModerationDecision = {
  allowed: boolean;
  reason: string;
};

export class ModerationBlockedError extends Error {
  readonly decision: ModerationDecision;
  constructor(decision: ModerationDecision) {
    super(decision.reason || "Content blocked by safety filter.");
    this.name = "ModerationBlockedError";
    this.decision = decision;
  }
}

export async function moderateImagePrompt(
  userId: string,
  prompt: string,
): Promise<ModerationDecision> {
  await registerPrompts();

  const result = await generate({
    userId,
    feature: "composer.refine", // cheap tier; dedicated feature key not worth a router entry yet
    template: PROMPTS.moderationInput,
    userMessage: prompt,
    temperature: 0,
  });

  const cleaned = result.text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as Partial<ModerationDecision>;
    if (typeof parsed.allowed !== "boolean") {
      throw new Error("missing allowed");
    }
    return {
      allowed: parsed.allowed,
      reason: typeof parsed.reason === "string" ? parsed.reason : "",
    };
  } catch {
    // Fail closed: if the gate is unparseable, don't generate. The product
    // can't distinguish model-error-as-allowance vs. actually-allowed, so
    // refuse rather than silently let through.
    return {
      allowed: false,
      reason: "Safety check failed. Please reword and try again.",
    };
  }
}

export async function requireSafePrompt(
  userId: string,
  prompt: string,
): Promise<void> {
  const decision = await moderateImagePrompt(userId, prompt);
  if (!decision.allowed) {
    throw new ModerationBlockedError(decision);
  }
}
