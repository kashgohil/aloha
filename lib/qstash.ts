import "server-only";

import { Client } from "@upstash/qstash";
import { env } from "@/lib/env";

// Single QStash client for the whole app. Imports as a const because
// `env` is evaluated once at module-load and the SDK keeps no per-call
// state — a single instance is safe for concurrent use. Centralizing
// avoids the kind of drift we hit with `actions/campaigns.ts` once
// missing `baseUrl`, which silently routed campaign-launch messages to
// prod QStash even in dev.
export const qstashClient = new Client({
  token: env.QSTASH_TOKEN,
  baseUrl: env.QSTASH_URL,
});
