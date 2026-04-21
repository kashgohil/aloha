// The one façade every AI feature goes through. Feature code names a feature
// key and a template; the router picks the model, calls OpenRouter, logs the
// result, and returns the text plus a generation id for later feedback.
//
// Swapping which model backs a feature is a one-line edit in `./models.ts`.
// Feature code should never import a model slug directly.

import { costMicrosFor, defaultModelFor, type FeatureKey } from "./models";
import { openRouterChat, openRouterChatStream } from "./openrouter";
import { loadTemplate } from "./templates";
import { logGeneration } from "./generations";
import { assertCostCap } from "./cost-cap";
import { langfuse, scheduleLangfuseFlush } from "./langfuse";

export type GenerateInput = {
  userId: string;
  feature: FeatureKey;
  template: { name: string; version: number };
  // Interpolated into the system prompt via `{{var}}` substitution.
  vars?: Record<string, string>;
  userMessage: string;
  // Image URLs attached to the user message. When present the user content
  // becomes a multipart block — requires a vision-capable model (Gemini Pro,
  // etc.). Falls through as text-only when omitted.
  images?: string[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
};

export type GenerateResult = {
  text: string;
  generationId: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  costMicros: number;
  latencyMs: number;
};

export async function generate(input: GenerateInput): Promise<GenerateResult> {
  await assertCostCap(input.userId);
  const model = input.model ?? defaultModelFor(input.feature);
  const template = await loadTemplate(input.template.name, input.template.version);
  const systemPrompt = interpolate(template.systemPrompt, input.vars ?? {});

  const start = Date.now();
  const userContent =
    input.images && input.images.length > 0
      ? [
          { type: "text" as const, text: input.userMessage },
          ...input.images.map((url) => ({
            type: "image_url" as const,
            image_url: { url },
          })),
        ]
      : input.userMessage;

  const trace = langfuse?.trace({
    name: `${input.feature}:${template.name}`,
    userId: input.userId,
    metadata: { templateVersion: template.version },
  });
  const generation = trace?.generation({
    name: input.feature,
    model,
    input: { system: systemPrompt, user: userContent },
    modelParameters: {
      temperature: input.temperature ?? 0.7,
      maxTokens: input.maxTokens ?? null,
    },
  });

  try {
    const { text, tokensIn, tokensOut, raw } = await openRouterChat({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: input.temperature,
      maxTokens: input.maxTokens,
    });
    const latencyMs = Date.now() - start;
    const costMicros = costMicrosFor(model, tokensIn, tokensOut);

    generation?.end({
      output: text,
      usage: {
        input: tokensIn,
        output: tokensOut,
        unit: "TOKENS",
        totalCost: costMicros / 1_000_000,
      },
    });

    const generationId = await logGeneration({
      userId: input.userId,
      feature: input.feature,
      templateName: template.name,
      templateVersion: template.version,
      model,
      input: { vars: input.vars ?? {}, userMessage: input.userMessage },
      output: { text, raw },
      tokensIn,
      tokensOut,
      costMicros,
      latencyMs,
      status: "ok",
      langfuseTraceId: trace?.id,
    });

    return {
      text,
      generationId,
      model,
      tokensIn,
      tokensOut,
      costMicros,
      latencyMs,
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    generation?.end({ level: "ERROR", statusMessage: message });
    await logGeneration({
      userId: input.userId,
      feature: input.feature,
      templateName: template.name,
      templateVersion: template.version,
      model,
      input: { vars: input.vars ?? {}, userMessage: input.userMessage },
      output: {},
      tokensIn: 0,
      tokensOut: 0,
      costMicros: 0,
      latencyMs,
      status: "error",
      errorMessage: message,
      langfuseTraceId: trace?.id,
    });
    throw err;
  } finally {
    await scheduleLangfuseFlush();
  }
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) =>
    key in vars ? vars[key] : "",
  );
}

// Streaming façade. Yields text chunks as the model produces them and logs
// a single generation row on completion. Consumers drive it with `for await`
// on `.stream` and await `.done` for the final `GenerateResult`.
//
// Use this for multi-variant and long-form flows (plan generator, repurposer,
// campaign planner, per-channel variant picker). For synchronous flows (refine,
// hashtag suggest, alt-text) stick with `generate()` — the round-trip cost of
// SSE parsing isn't worth it.
export type GenerateStreamResult = {
  stream: AsyncIterable<string>;
  done: Promise<GenerateResult>;
};

export async function generateStream(
  input: GenerateInput,
): Promise<GenerateStreamResult> {
  await assertCostCap(input.userId);
  const model = input.model ?? defaultModelFor(input.feature);
  const template = await loadTemplate(input.template.name, input.template.version);
  const systemPrompt = interpolate(template.systemPrompt, input.vars ?? {});

  const userContent =
    input.images && input.images.length > 0
      ? [
          { type: "text" as const, text: input.userMessage },
          ...input.images.map((url) => ({
            type: "image_url" as const,
            image_url: { url },
          })),
        ]
      : input.userMessage;

  const start = Date.now();

  // Two halves of the same pipe: the iterable we return to the caller, and
  // the promise that resolves once the upstream finishes and the log lands.
  let resolveDone!: (r: GenerateResult) => void;
  let rejectDone!: (err: unknown) => void;
  const done = new Promise<GenerateResult>((resolve, reject) => {
    resolveDone = resolve;
    rejectDone = reject;
  });

  const source = openRouterChatStream({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    temperature: input.temperature,
    maxTokens: input.maxTokens,
  });

  const trace = langfuse?.trace({
    name: `${input.feature}:${template.name}`,
    userId: input.userId,
    metadata: { templateVersion: template.version, streaming: true },
  });
  const generation = trace?.generation({
    name: input.feature,
    model,
    input: { system: systemPrompt, user: userContent },
    modelParameters: {
      temperature: input.temperature ?? 0.7,
      maxTokens: input.maxTokens ?? null,
    },
  });

  async function* iterate(): AsyncIterable<string> {
    let fullText = "";
    let tokensIn = 0;
    let tokensOut = 0;
    try {
      for await (const ev of source) {
        if (ev.type === "chunk") {
          fullText += ev.text;
          yield ev.text;
        } else {
          tokensIn = ev.tokensIn;
          tokensOut = ev.tokensOut;
        }
      }
      const latencyMs = Date.now() - start;
      const costMicros = costMicrosFor(model, tokensIn, tokensOut);
      generation?.end({
        output: fullText,
        usage: {
          input: tokensIn,
          output: tokensOut,
          unit: "TOKENS",
          totalCost: costMicros / 1_000_000,
        },
      });
      const generationId = await logGeneration({
        userId: input.userId,
        feature: input.feature,
        templateName: template.name,
        templateVersion: template.version,
        model,
        input: { vars: input.vars ?? {}, userMessage: input.userMessage },
        output: { text: fullText },
        tokensIn,
        tokensOut,
        costMicros,
        latencyMs,
        status: "ok",
        langfuseTraceId: trace?.id,
      });
      resolveDone({
        text: fullText,
        generationId,
        model,
        tokensIn,
        tokensOut,
        costMicros,
        latencyMs,
      });
    } catch (err) {
      const latencyMs = Date.now() - start;
      const message = err instanceof Error ? err.message : String(err);
      generation?.end({
        level: "ERROR",
        statusMessage: message,
        output: fullText,
      });
      await logGeneration({
        userId: input.userId,
        feature: input.feature,
        templateName: template.name,
        templateVersion: template.version,
        model,
        input: { vars: input.vars ?? {}, userMessage: input.userMessage },
        output: { text: fullText },
        tokensIn,
        tokensOut,
        costMicros: 0,
        latencyMs,
        status: "error",
        errorMessage: message,
        langfuseTraceId: trace?.id,
      });
      rejectDone(err);
      throw err;
    } finally {
      await scheduleLangfuseFlush();
    }
  }

  return { stream: iterate(), done };
}
