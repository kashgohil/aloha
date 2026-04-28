// Source-material → fan-out streaming endpoint. Accepts one of three
// input kinds — a URL we scrape, a paste of text the user has on hand, or
// an upload (already saved to /api/upload as an `assets` row) — and
// streams native adaptations per target platform via the same
// `composer.fanout` template.
//
// Event payloads (JSON per data: line):
//   { type: "extracted", title, excerpt, url, content, ogImage }
//   { platform, type: "start" }
//   { platform, type: "chunk", text }
//   { platform, type: "done",  text }
//   { platform, type: "error", message }
//   { type: "all_done" }
//   { type: "fatal", message }     (sent when extraction itself fails)

import { and, eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { assets } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { generateStream } from "@/lib/ai/router";
import { PROMPTS, registerPrompts } from "@/lib/ai/prompts";
import { loadChannelVoices, loadCurrentVoice } from "@/lib/ai/voice";
import { buildVoiceBlock, constraintsFor } from "@/lib/ai/voice-context";
import { assertCostCap, CostCapExceededError } from "@/lib/ai/cost-cap";
import { MuseAccessRequiredError, requireMuseAccess } from "@/lib/billing/muse";
import {
  extractFromUrl,
  ImporterError,
  type ImportedContent,
} from "@/lib/importer";
import {
  extractFromText,
  extractFromPdfAsset,
  extractFromTextAsset,
} from "@/lib/importer-text";

export const dynamic = "force-dynamic";
export const maxDuration = 180;

const MAX_TARGETS = 10;
// Cap the content we feed into the prompt. Hits both cost (shorter input)
// and focus (models hallucinate less on tight inputs). Larger than the
// URL-only cap because pasted source material is the whole point — users
// will throw 30K-character podcast transcripts at this on purpose.
const MAX_CONTENT_CHARS = 50_000;

type Body = {
  kind?: unknown;
  url?: unknown;
  title?: unknown;
  content?: unknown;
  assetId?: unknown;
  targetPlatforms?: unknown;
};

type ImportInput =
  | { kind: "url"; url: string }
  | { kind: "text"; title: string | null; content: string }
  | { kind: "file"; assetId: string };

function parseBody(body: Body): {
  input: ImportInput;
  targetPlatforms: string[];
} | { error: string } {
  const targetPlatforms = Array.isArray(body.targetPlatforms)
    ? body.targetPlatforms
        .filter((p): p is string => typeof p === "string")
        .slice(0, MAX_TARGETS)
    : [];
  if (targetPlatforms.length === 0) {
    return { error: "At least one target platform required" };
  }

  // Default to the legacy URL form when `kind` is absent so existing
  // clients that haven't been redeployed keep working.
  const kind = typeof body.kind === "string" ? body.kind : "url";

  if (kind === "url") {
    const url = typeof body.url === "string" ? body.url.trim() : "";
    if (!url) return { error: "url is required" };
    return { input: { kind: "url", url }, targetPlatforms };
  }
  if (kind === "text") {
    const content = typeof body.content === "string" ? body.content : "";
    if (!content.trim()) return { error: "content is required" };
    const title = typeof body.title === "string" ? body.title : null;
    return {
      input: { kind: "text", title, content },
      targetPlatforms,
    };
  }
  if (kind === "file") {
    const assetId = typeof body.assetId === "string" ? body.assetId : "";
    if (!assetId) return { error: "assetId is required" };
    return { input: { kind: "file", assetId }, targetPlatforms };
  }
  return { error: `unknown kind: ${kind}` };
}

async function loadFromInput(
  input: ImportInput,
  userId: string,
): Promise<ImportedContent> {
  if (input.kind === "url") return extractFromUrl(input.url);
  if (input.kind === "text") {
    return extractFromText({ title: input.title, content: input.content });
  }
  // File: must belong to the requesting user. We don't enforce
  // workspace-match because the asset is already scoped via
  // requireActiveWorkspaceId at upload time, and the user may have
  // uploaded under a different active workspace then switched. Owning
  // the row is enough.
  const [asset] = await db
    .select({
      id: assets.id,
      url: assets.url,
      mimeType: assets.mimeType,
      metadata: assets.metadata,
    })
    .from(assets)
    .where(
      and(eq(assets.id, input.assetId), eq(assets.createdByUserId, userId)),
    )
    .limit(1);
  if (!asset) throw new ImporterError("That upload couldn't be found.");
  const filename =
    typeof asset.metadata?.originalName === "string"
      ? (asset.metadata.originalName as string)
      : null;
  if (asset.mimeType === "application/pdf") {
    return extractFromPdfAsset({ url: asset.url, filename });
  }
  if (
    asset.mimeType === "text/plain" ||
    asset.mimeType === "text/markdown"
  ) {
    return extractFromTextAsset({ url: asset.url, filename });
  }
  throw new ImporterError(
    `Uploaded file type ${asset.mimeType} can't be imported.`,
  );
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Body;
  const parsed = parseBody(body);
  if ("error" in parsed) return new Response(parsed.error, { status: 400 });
  const { input, targetPlatforms } = parsed;

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

      // 1) Resolve the source. Failure here is fatal — no point fanning
      //    out to targets when there's nothing to adapt.
      let extracted: ImportedContent;
      try {
        extracted = await loadFromInput(input, user.id);
      } catch (err) {
        const message =
          err instanceof ImporterError
            ? err.message
            : "Couldn't import that source.";
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

      // The fanout prompt's `sourcePlatform` is a hint to the model about
      // where the source material came from. Different inputs warrant
      // different framings — a podcast transcript reads differently from
      // a blog post.
      const sourcePlatform =
        input.kind === "url"
          ? "web article"
          : input.kind === "text"
            ? "long-form notes / transcript"
            : "uploaded document";

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
                sourcePlatform,
                targetPlatform: target,
                platformConstraints: constraintsFor(target),
                voiceBlock: buildVoiceBlock(voice, channelDeltas[target], target),
              },
              userMessage: `Source ${sourcePlatform}: "${extracted.title}"\n\n${truncated}`,
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
