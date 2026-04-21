// Per-channel variant streaming endpoint.
//
// Takes a topic + list of platforms. Runs one `generateStream()` per
// platform in parallel. Each token as it arrives is multiplexed onto a
// single SSE stream tagged with its platform, so the client can route
// chunks into per-platform cards.
//
// SSE event payloads (JSON on each `data:` line):
//   { platform, type: "start" }
//   { platform, type: "chunk", text: string }
//   { platform, type: "done",  text: string }     // full text, trimmed
//   { platform, type: "error", message: string }
//   {           type: "all_done" }

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { generateStream } from "@/lib/ai/router";
import { PROMPTS, registerPrompts } from "@/lib/ai/prompts";
import { loadChannelVoices, loadCurrentVoice } from "@/lib/ai/voice";
import { buildVoiceBlock, constraintsFor } from "@/lib/ai/voice-context";
import { assertCostCap, CostCapExceededError } from "@/lib/ai/cost-cap";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_PLATFORMS = 10;

type Body = { topic?: unknown; platforms?: unknown };

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Body;
  const topic = typeof body.topic === "string" ? body.topic.trim() : "";
  const platforms = Array.isArray(body.platforms)
    ? body.platforms.filter((p): p is string => typeof p === "string").slice(0, MAX_PLATFORMS)
    : [];

  if (!topic) {
    return new Response("Topic is required", { status: 400 });
  }
  if (platforms.length === 0) {
    return new Response("At least one platform is required", { status: 400 });
  }

  // Single gate up front: if the user is over their cap, don't open the
  // stream at all. Each per-platform `generateStream` also checks, which
  // catches the (rare) case where we cross the cap mid-fanout.
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
  const channelDeltas = await loadChannelVoices(user.id, platforms);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };

      // Run all platforms in parallel; each writes to the same SSE stream.
      await Promise.all(
        platforms.map(async (platform) => {
          send({ platform, type: "start" });
          try {
            const { stream: chunks, done } = await generateStream({
              userId: user.id,
              feature: "composer.variants",
              template: PROMPTS.composerGenerate,
              vars: {
                platform,
                platformConstraints: constraintsFor(platform),
                voiceBlock: buildVoiceBlock(voice, channelDeltas[platform], platform),
              },
              userMessage: `Topic / brief: ${topic}`,
              temperature: 0.8,
            });

            let full = "";
            for await (const delta of chunks) {
              full += delta;
              send({ platform, type: "chunk", text: delta });
            }
            // Wait for the log row to land so downstream UX (e.g. feedback)
            // can use the generation id later if we surface one.
            await done;
            send({ platform, type: "done", text: full.trim() });
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            send({ platform, type: "error", message });
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
