// Image generation pipeline. Moderates the prompt, calls the image provider,
// stores the result in Vercel Blob, records an `assets` row, and logs a
// `generations` row for cost accounting.
//
// Provider note: image generation doesn't flow through the text LLM router
// (chat-completions doesn't carry image bytes cleanly). We call Google's
// Generative AI image endpoint directly. Cost + tokens are still logged to
// `generations` so the cost-cap and cost-dashboard code don't need to know
// about two pipelines. When we swap the provider, the call site changes —
// nothing else does.

import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { assets } from "@/db/schema";
import { db } from "@/db";
import { env } from "@/lib/env";
import { assertCostCap } from "./cost-cap";
import { logGeneration } from "./generations";
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
const IMAGE_MODEL = "google/imagen-3";

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
    });
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
  });

  const [asset] = await db
    .insert(assets)
    .values({
      userId: input.userId,
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

// Google Imagen 3 (via Generative Language API). The predict endpoint takes
// a prompt + aspect ratio and returns base64-encoded image bytes. When we
// swap providers (or move to OpenRouter's images endpoint once it's stable
// for Imagen), this is the only function that changes.
async function callImageProvider(
  prompt: string,
  aspect: ImageAspect,
): Promise<{ bytes: ArrayBuffer; mimeType: string }> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${env.GEMINI_API_KEY}`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: aspect,
        personGeneration: "allow_adult",
      },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Image provider ${res.status}: ${body.slice(0, 400)}`,
    );
  }
  const json = (await res.json()) as {
    predictions?: Array<{
      bytesBase64Encoded?: string;
      mimeType?: string;
    }>;
  };
  const pred = json.predictions?.[0];
  if (!pred?.bytesBase64Encoded) {
    throw new Error("Image provider returned no image data");
  }
  const mimeType = pred.mimeType ?? "image/png";
  const bytes = Uint8Array.from(
    Buffer.from(pred.bytesBase64Encoded, "base64"),
  ).buffer;
  return { bytes, mimeType };
}
