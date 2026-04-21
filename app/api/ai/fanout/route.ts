// Fan-out streaming endpoint. Takes existing content written for ONE source
// platform and streams native adaptations for N target platforms in
// parallel. Same SSE event shape as /api/ai/variants so the client streaming
// code can parse both.
//
// Event payloads (JSON per data: line):
//   { platform, type: "start" }
//   { platform, type: "chunk", text }
//   { platform, type: "done", text }
//   { platform, type: "error", message }
//   { type: "all_done" }

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { generateStream } from "@/lib/ai/router";
import { PROMPTS, registerPrompts } from "@/lib/ai/prompts";
import { loadChannelVoices, loadCurrentVoice } from "@/lib/ai/voice";
import { buildVoiceBlock, constraintsFor } from "@/lib/ai/voice-context";
import { assertCostCap, CostCapExceededError } from "@/lib/ai/cost-cap";
import { MuseAccessRequiredError, requireMuseAccess } from "@/lib/billing/muse";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_TARGETS = 10;

type Body = {
  sourceContent?: unknown;
  sourcePlatform?: unknown;
  targetPlatforms?: unknown;
};

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Body;
  const sourceContent =
    typeof body.sourceContent === "string" ? body.sourceContent.trim() : "";
  const sourcePlatform =
    typeof body.sourcePlatform === "string" ? body.sourcePlatform : "";
  const targetPlatforms = Array.isArray(body.targetPlatforms)
    ? body.targetPlatforms
        .filter((p): p is string => typeof p === "string")
        .filter((p) => p !== sourcePlatform)
        .slice(0, MAX_TARGETS)
    : [];

  if (!sourceContent) return new Response("Source content required", { status: 400 });
  if (!sourcePlatform) return new Response("Source platform required", { status: 400 });
  if (targetPlatforms.length === 0) {
    return new Response("At least one target platform required", { status: 400 });
  }

  try {
    await requireMuseAccess(user.id);
  } catch (err) {
    if (err instanceof MuseAccessRequiredError) {
      return new Response(err.message, { status: 403 });
    }
    throw err;
  }

  try {
    await assertCostCap(user.id);
  } catch (err) {
    if (err instanceof CostCapExceededError) {
      return new Response(err.message, { status: 402 });
    }
    throw err;
  }

  await registerPrompts();
  const voice = await loadCurrentVoice(user.id);
  const channelDeltas = await loadChannelVoices(user.id, targetPlatforms);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };

      await Promise.all(
        targetPlatforms.map(async (target) => {
          send({ platform: target, type: "start" });
          try {
            const { stream: chunks, done } = await generateStream({
              userId: user.id,
              feature: "composer.fanout",
              template: PROMPTS.composerFanout,
              vars: {
                sourcePlatform,
                targetPlatform: target,
                platformConstraints: constraintsFor(target),
                voiceBlock: buildVoiceBlock(voice, channelDeltas[target], target),
              },
              userMessage: sourceContent,
              temperature: 0.7,
            });

            let full = "";
            for await (const delta of chunks) {
              full += delta;
              send({ platform: target, type: "chunk", text: delta });
            }
            await done;
            send({ platform: target, type: "done", text: full.trim() });
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            send({ platform: target, type: "error", message });
          }
        }),
      );

      send({ type: "all_done" });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
