// Feature → model mapping for the router, plus per-model cost table.
// Changing which model backs a feature is a one-line edit here; feature code
// should never reference model slugs directly.
//
// Prices are USD micros per 1M tokens, pulled from OpenRouter's published
// rates. Tune against real `generations` cost data after Phase 1.

export type FeatureKey =
  | "composer.refine"
  | "composer.generate"
  | "composer.variants"
  | "composer.fanout"
  | "composer.hashtags"
  | "composer.image"
  | "voice.train"
  | "voice.sample"
  | "plan.generate"
  | "repurpose.fanout"
  | "campaign.beatsheet"
  | "inbox.triage"
  | "inbox.reply"
  | "insights.commentary"
  | "vision.altText";

type Tier = "flash" | "pro" | "sonnet";

export const MODELS: Record<Tier, string> = {
  flash: "google/gemini-2.0-flash-001",
  pro: "google/gemini-2.5-pro",
  sonnet: "anthropic/claude-sonnet-4",
};

const FEATURE_TIER: Record<FeatureKey, Tier> = {
  "composer.refine": "flash",
  "composer.generate": "flash",
  "composer.variants": "flash",
  "composer.fanout": "flash",
  "composer.hashtags": "flash",
  "composer.image": "pro",
  "voice.train": "pro",
  "voice.sample": "flash",
  "plan.generate": "pro",
  "repurpose.fanout": "flash",
  "campaign.beatsheet": "sonnet",
  "inbox.triage": "sonnet",
  "inbox.reply": "pro",
  "insights.commentary": "pro",
  "vision.altText": "pro",
};

export function defaultModelFor(feature: FeatureKey): string {
  return MODELS[FEATURE_TIER[feature]];
}

type Price = { inPerMillion: number; outPerMillion: number };

// USD micros per 1M tokens. `null` means "unknown — fall back to a flat
// estimate". Keep conservative so cost dashboards don't underreport.
const PRICES: Record<string, Price> = {
  "google/gemini-2.0-flash-001": {
    inPerMillion: 100_000,
    outPerMillion: 400_000,
  },
  "google/gemini-2.5-pro": {
    inPerMillion: 1_250_000,
    outPerMillion: 10_000_000,
  },
  "anthropic/claude-sonnet-4": {
    inPerMillion: 3_000_000,
    outPerMillion: 15_000_000,
  },
};

export function costMicrosFor(
  model: string,
  tokensIn: number,
  tokensOut: number,
): number {
  const price = PRICES[model];
  if (!price) return 0;
  const inCost = (price.inPerMillion * tokensIn) / 1_000_000;
  const outCost = (price.outPerMillion * tokensOut) / 1_000_000;
  return Math.round(inCost + outCost);
}
