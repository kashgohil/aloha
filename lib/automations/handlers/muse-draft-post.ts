import "server-only";

import { desc, eq } from "drizzle-orm";

// Muse automation outputs land in the review queue, not straight into
// drafts. Rationale: the user didn't write these themselves, so a human
// checkpoint before scheduling is the default posture. Flip this to
// "draft" to send them to the regular draft bin instead.
const MUSE_AUTOMATION_INITIAL_STATUS = "in_review" as const;
import { db } from "@/db";
import { museEnabledChannels, posts, type DraftMeta } from "@/db/schema";
import { requireActiveWorkspaceId } from "@/lib/workspaces/resolve";
import { generate } from "@/lib/ai/router";
import { PROMPTS, registerPrompts } from "@/lib/ai/prompts";
import { loadChannelVoice, loadCurrentVoice } from "@/lib/ai/voice";
import { buildVoiceBlock, constraintsFor } from "@/lib/ai/voice-context";
import { hasMuseInviteEntitlement } from "@/lib/billing/muse";
import { CostCapExceededError } from "@/lib/ai/cost-cap";
import { ModerationBlockedError } from "@/lib/ai/moderation";
import {
  registerAction,
  type ActionContext,
  type ActionResult,
} from "../registry";

// Template UI offers "any" | "linkedin" | "x" | "bluesky"; "x" is the
// user-facing label, "twitter" is the internal platform slug used by
// publishers/readback/accounts rows.
const CHANNEL_ALIASES: Record<string, string> = {
  x: "twitter",
  twitter: "twitter",
  linkedin: "linkedin",
  bluesky: "bluesky",
};

async function resolveChannel(
  userId: string,
  configured: string,
): Promise<string> {
  if (configured && configured !== "any") {
    return CHANNEL_ALIASES[configured] ?? configured;
  }
  const workspaceId = await requireActiveWorkspaceId(userId);
  const [row] = await db
    .select({ channel: museEnabledChannels.channel })
    .from(museEnabledChannels)
    .where(eq(museEnabledChannels.workspaceId, workspaceId))
    .orderBy(desc(museEnabledChannels.enabledAt))
    .limit(1);
  return row?.channel ?? "linkedin";
}

function parseRichDraft(raw: string): {
  body: string;
  meta: DraftMeta;
} {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    throw new Error("Muse draft response was not valid JSON.");
  }
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const arr = (v: unknown, cap: number): string[] =>
    Array.isArray(v)
      ? v
          .filter((x): x is string => typeof x === "string")
          .map((x) => x.trim())
          .filter(Boolean)
          .slice(0, cap)
      : [];
  const body = str(parsed.body);
  if (!body) throw new Error("Muse draft came back with an empty body.");
  const hashtags = arr(parsed.hashtags, 20).map((h) =>
    h.startsWith("#") ? h : `#${h}`,
  );
  return {
    body,
    meta: {
      hook: str(parsed.hook) || undefined,
      altHooks: arr(parsed.altHooks, 5),
      keyPoints: arr(parsed.keyPoints, 8),
      cta: str(parsed.cta) || undefined,
      hashtags,
      mediaSuggestion: str(parsed.mediaSuggestion) || undefined,
      rationale: str(parsed.rationale) || undefined,
      formatGuidance: str(parsed.formatGuidance) || undefined,
    },
  };
}

registerAction(
  "muse_draft_post",
  async ({ step, userId }: ActionContext): Promise<ActionResult> => {
    const hasMuse = await hasMuseInviteEntitlement(userId);
    if (!hasMuse) {
      return {
        output: { skipped: true, reason: "Muse access not granted for user" },
      };
    }

    const cfg = step.config ?? {};
    const topic =
      typeof cfg.topic === "string" && cfg.topic.trim().length > 0
        ? cfg.topic.trim()
        : null;
    const configuredChannel =
      typeof cfg.channel === "string" ? cfg.channel : "any";
    const platform = await resolveChannel(userId, configuredChannel);

    await registerPrompts();
    const [voice, channelDelta] = await Promise.all([
      loadCurrentVoice(userId),
      loadChannelVoice(userId, platform),
    ]);

    try {
      const result = await generate({
        userId,
        feature: "composer.draft",
        template: PROMPTS.composerDraft,
        vars: {
          platform,
          platformConstraints: constraintsFor(platform),
          voiceBlock: buildVoiceBlock(voice, channelDelta, platform),
        },
        userMessage: topic
          ? `Topic / brief: ${topic}`
          : "Pick a fresh topic the author would plausibly want to post about this week, drawing from their voice profile.",
        temperature: 0.75,
      });

      const { body, meta } = parseRichDraft(result.text);

      const now = new Date();
      const workspaceId = await requireActiveWorkspaceId(userId);
      const [row] = await db
        .insert(posts)
        .values({
          createdByUserId: userId,
          workspaceId,
          content: body,
          platforms: [platform],
          status: MUSE_AUTOMATION_INITIAL_STATUS,
          draftMeta: meta,
          submittedForReviewAt: now,
          submittedBy: userId,
        })
        .returning({ id: posts.id });

      return {
        output: {
          postId: row.id,
          platform,
          topic,
          body,
          generationId: result.generationId,
        },
      };
    } catch (err) {
      if (err instanceof CostCapExceededError) {
        return {
          output: {
            skipped: true,
            reason: "Cost cap exceeded for this user's month",
          },
        };
      }
      if (err instanceof ModerationBlockedError) {
        return {
          output: { skipped: true, reason: "Blocked by moderation" },
        };
      }
      throw err;
    }
  },
);
