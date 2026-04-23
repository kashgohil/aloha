// Image generation pipeline. Moderates the prompt, calls the image provider,
// stores the result in Vercel Blob, records an `assets` row, and logs a
// `generations` row for cost accounting.
//
// Provider note: image generation rides OpenRouter's chat-completions endpoint
// on an image-capable model. Cost + tokens are still logged to `generations`
// so the cost-cap and cost-dashboard code don't need to know about two
// pipelines. When we swap the model, only `callImageProvider` changes.

import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { assets } from "@/db/schema";
import { db } from "@/db";
import { env } from "@/lib/env";
import { requireActiveWorkspaceId } from "@/lib/workspaces/resolve";
import { assertCostCap } from "./cost-cap";
import { logGeneration } from "./generations";
import { langfuse, scheduleLangfuseFlush } from "./langfuse";
import { requireSafePrompt } from "./moderation";

export type ImageAspect = "1:1" | "4:5" | "16:9" | "9:16";

export type GeneratedImage = {
  assetId: string;
  url: string;
  mimeType: string;
  width: number;
  height: number;
  prompt: string;
  generationId: string;
};

// Approximate per-image cost in USD micros. Imagen / Gemini image pricing
// is ~4¢/image as of writing; tune against real billing data.
const IMAGE_COST_MICROS = 40_000;

// Target pixel dimensions per aspect. Chosen to be close to each native
// platform surface (IG square, IG portrait, X/LinkedIn landscape, Reels).
const DIMENSIONS: Record<ImageAspect, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "4:5": { width: 896, height: 1120 },
  "16:9": { width: 1280, height: 720 },
  "9:16": { width: 720, height: 1280 },
};

// Model slug used in `generations.model`. Keep one place to change it.
const IMAGE_MODEL = "google/gemini-3.1-flash-image-preview";

export type GenerateImageInput = {
  userId: string;
  prompt: string;
  aspect?: ImageAspect;
};

export async function generateImage(
  input: GenerateImageInput,
): Promise<GeneratedImage> {
  const prompt = input.prompt.trim();
  if (!prompt) throw new Error("Prompt is required");

  await assertCostCap(input.userId);
  await requireSafePrompt(input.userId, prompt);

  const aspect = input.aspect ?? "1:1";
  const dims = DIMENSIONS[aspect];

  const trace = langfuse?.trace({
    name: "composer.image",
    userId: input.userId,
    metadata: { aspect, model: IMAGE_MODEL },
  });
  const generation = trace?.generation({
    name: "composer.image",
    model: IMAGE_MODEL,
    input: { prompt, aspect },
  });

  const start = Date.now();
  let bytes: ArrayBuffer;
  let mimeType: string;
  try {
    const result = await callImageProvider(prompt, aspect);
    bytes = result.bytes;
    mimeType = result.mimeType;
  } catch (err) {
    const latencyMs = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    generation?.end({ level: "ERROR", statusMessage: message });
    await logGeneration({
      userId: input.userId,
      feature: "composer.image",
      model: IMAGE_MODEL,
      input: { prompt, aspect },
      output: {},
      tokensIn: 0,
      tokensOut: 0,
      costMicros: 0,
      latencyMs,
      status: "error",
      errorMessage: message,
      langfuseTraceId: trace?.id,
    });
    await scheduleLangfuseFlush();
    throw err;
  }

  const latencyMs = Date.now() - start;
  const ext = mimeType.endsWith("/png") ? "png" : mimeType.endsWith("/webp") ? "webp" : "jpg";
  const key = `generated/${input.userId}/${randomUUID()}.${ext}`;
  const blob = await put(key, Buffer.from(bytes), {
    access: "public",
    contentType: mimeType,
    token: env.BLOB_READ_WRITE_TOKEN,
  });

  generation?.end({
    output: { url: blob.url, mimeType, width: dims.width, height: dims.height },
    usage: { totalCost: IMAGE_COST_MICROS / 1_000_000 },
  });

  const generationId = await logGeneration({
    userId: input.userId,
    feature: "composer.image",
    model: IMAGE_MODEL,
    input: { prompt, aspect },
    output: { url: blob.url, mimeType, width: dims.width, height: dims.height },
    tokensIn: 0,
    tokensOut: 0,
    costMicros: IMAGE_COST_MICROS,
    latencyMs,
    status: "ok",
    langfuseTraceId: trace?.id,
  });
  await scheduleLangfuseFlush();

  const assetWorkspaceId = await requireActiveWorkspaceId(input.userId);
  const [asset] = await db
    .insert(assets)
    .values({
      createdByUserId: input.userId,
      workspaceId: assetWorkspaceId,
      source: "generated",
      url: blob.url,
      mimeType,
      width: dims.width,
      height: dims.height,
      prompt,
      sourceGenerationId: generationId,
      metadata: { aspect, model: IMAGE_MODEL },
    })
    .returning({ id: assets.id });

  return {
    assetId: asset.id,
    url: blob.url,
    mimeType,
    width: dims.width,
    height: dims.height,
    prompt,
    generationId,
  };
}

// ---- provider call -------------------------------------------------------

// OpenRouter exposes image-capable models (e.g. Gemini 2.5 Flash Image) via
// its OpenAI-compatible chat completions endpoint. We request the `image`
// modality and pull the first image out of `message.images`. `data_collection:
// "deny"` tells OpenRouter to route only through providers that won't train
// on our payloads. The `HTTP-Referer` + `X-Title` headers identify Aloha to
// OpenRouter's attribution/leaderboard.
async function callImageProvider(
  prompt: string,
  aspect: ImageAspect,
): Promise<{ bytes: ArrayBuffer; mimeType: string }> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": env.APP_URL,
      "X-Title": "Aloha",
    },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      modalities: ["image", "text"],
      messages: [
        {
          role: "user",
          content: `Generate a single image with a ${aspect} aspect ratio. ${prompt}`,
        },
      ],
      provider: { data_collection: "deny" },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Image provider ${res.status}: ${body.slice(0, 400)}`,
    );
  }
  const json = (await res.json()) as {
    choices?: Array<{
      message?: {
        images?: Array<{ image_url?: { url?: string } }>;
      };
    }>;
  };
  const dataUrl = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!dataUrl) {
    throw new Error("Image provider returned no image data");
  }
  // OpenRouter returns images as `data:<mime>;base64,<payload>` URLs.
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    throw new Error("Image provider returned an unexpected image payload");
  }
  const mimeType = match[1];
  const bytes = Uint8Array.from(Buffer.from(match[2], "base64")).buffer;
  return { bytes, mimeType };
}
