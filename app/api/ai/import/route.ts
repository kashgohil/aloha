// URL-import + fan-out streaming endpoint. Fetches a URL server-side,
// extracts the article body, then streams native adaptations per target
// platform using the same `composer.fanout` template as /api/ai/fanout.
//
// Event payloads (JSON per data: line):
//   { type: "extracted", title, excerpt, url, content, ogImage }
//   { platform, type: "start" }
//   { platform, type: "chunk", text }
//   { platform, type: "done",  text }
//   { platform, type: "error", message }
//   { type: "all_done" }
//   { type: "fatal", message }     (sent when extraction itself fails)

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { generateStream } from "@/lib/ai/router";
import { PROMPTS, registerPrompts } from "@/lib/ai/prompts";
import { loadChannelVoices, loadCurrentVoice } from "@/lib/ai/voice";
import { buildVoiceBlock, constraintsFor } from "@/lib/ai/voice-context";
import { assertCostCap, CostCapExceededError } from "@/lib/ai/cost-cap";
import { MuseAccessRequiredError, requireMuseAccess } from "@/lib/billing/muse";
import { extractFromUrl, ImporterError } from "@/lib/importer";

export const dynamic = "force-dynamic";
export const maxDuration = 180;

const MAX_TARGETS = 10;
// Cap the content we feed into the prompt. Hits both cost (shorter input)
// and focus (models hallucinate less on tight inputs). The excerpt still
// captures the gist when we truncate.
const MAX_CONTENT_CHARS = 12_000;

type Body = { url?: unknown; targetPlatforms?: unknown };

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Body;
  const url = typeof body.url === "string" ? body.url.trim() : "";
  const targetPlatforms = Array.isArray(body.targetPlatforms)
    ? body.targetPlatforms
        .filter((p): p is string => typeof p === "string")
        .slice(0, MAX_TARGETS)
    : [];

  if (!url) return new Response("url is required", { status: 400 });
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

      // 1) Extract. If this fails, emit a fatal and close — no point
      //    fanning out to targets when we have no source.
      let extracted;
      try {
        extracted = await extractFromUrl(url);
      } catch (err) {
        const message =
          err instanceof ImporterError
            ? err.message
            : "Couldn't import that URL.";
        send({ type: "fatal", message });
        controller.close();
        return;
      }

      const truncated =
        extracted.content.length > MAX_CONTENT_CHARS
          ? extracted.content.slice(0, MAX_CONTENT_CHARS) + "\n\n[...truncated]"
          : extracted.content;

      send({
        type: "extracted",
        url: extracted.url,
        title: extracted.title,
        excerpt: extracted.excerpt,
        ogImage: extracted.ogImage,
        content: truncated,
      });

      // 2) Fan-out in parallel.
      await Promise.all(
        targetPlatforms.map(async (target) => {
          send({ platform: target, type: "start" });
          try {
            const { stream: chunks, done } = await generateStream({
              userId: user.id,
              feature: "composer.fanout",
              template: PROMPTS.composerFanout,
              vars: {
                sourcePlatform: "web article",
                targetPlatform: target,
                platformConstraints: constraintsFor(target),
                voiceBlock: buildVoiceBlock(voice, channelDeltas[target], target),
              },
              userMessage: `Source article: "${extracted.title}"\n\n${truncated}`,
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
