import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
  // App
  APP_URL: z.string().url().default("http://localhost:5010"),
  
  // Auth.js
  AUTH_SECRET: z.string().min(1),
  
  // Auth Channels
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  AUTH_GITHUB_ID: z.string().optional(),
  AUTH_GITHUB_SECRET: z.string().optional(),
  
  // Deployment Platforms
  AUTH_TWITTER_ID: z.string().optional(),
  AUTH_TWITTER_SECRET: z.string().optional(),
  AUTH_LINKEDIN_ID: z.string().optional(),
  AUTH_LINKEDIN_SECRET: z.string().optional(),
  AUTH_FACEBOOK_ID: z.string().optional(),
  AUTH_FACEBOOK_SECRET: z.string().optional(),
  AUTH_INSTAGRAM_ID: z.string().optional(),
  AUTH_INSTAGRAM_SECRET: z.string().optional(),
  AUTH_THREADS_ID: z.string().optional(),
  AUTH_THREADS_SECRET: z.string().optional(),
  AUTH_TIKTOK_ID: z.string().optional(),
  AUTH_TIKTOK_SECRET: z.string().optional(),
  AUTH_MEDIUM_ID: z.string().optional(),
  AUTH_MEDIUM_SECRET: z.string().optional(),
  AUTH_REDDIT_ID: z.string().optional(),
  AUTH_REDDIT_SECRET: z.string().optional(),
  AUTH_PINTEREST_ID: z.string().optional(),
  AUTH_PINTEREST_SECRET: z.string().optional(),
  AUTH_YOUTUBE_ID: z.string().optional(),
  AUTH_YOUTUBE_SECRET: z.string().optional(),
  // Notion workspace ingest (Muse brand-corpus).
  NOTION_OAUTH_CLIENT_ID: z.string().optional(),
  NOTION_OAUTH_CLIENT_SECRET: z.string().optional(),

  // Email
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().default("Aloha <hey@usealoha.app>"),
  // Resend webhooks are signed via Svix. Grab the secret from Resend's
  // dashboard → Webhooks; starts with `whsec_`. Optional so dev without
  // webhooks set up doesn't fail to boot.
  RESEND_WEBHOOK_SECRET: z.string().optional(),

  // AI
  OPENROUTER_API_KEY: z.string().min(1),
  
  // QStash
  QSTASH_URL: z.string().url().optional(),
  QSTASH_TOKEN: z.string().min(1),
  QSTASH_CURRENT_SIGNING_KEY: z.string().min(1),
  QSTASH_NEXT_SIGNING_KEY: z.string().min(1),

  // Billing — Polar
  // Optional while pricing is disabled in prod. Required once the Polar
  // subscription flow is live — the billing routes will fail loudly if
  // they're hit without a token.
  POLAR_ACCESS_TOKEN: z.string().optional(),
  POLAR_WEBHOOK_SECRET: z.string().min(1).optional(),
  POLAR_SERVER: z.enum(["sandbox", "production"]).default("sandbox"),
  POLAR_ORGANIZATION_ID: z.string().optional(),
  POLAR_PRODUCT_BASIC_MONTH: z.string().optional(),
  POLAR_PRODUCT_BASIC_YEAR: z.string().optional(),
  POLAR_PRODUCT_BUNDLE_MONTH: z.string().optional(),
  POLAR_PRODUCT_BUNDLE_YEAR: z.string().optional(),

  // Vercel Blob — keep dev and prod on separate stores. Create one "development"
  // Blob store and one "production" Blob store on Vercel, then set this token
  // per environment. Local dev uses the development store's token in .env.local.
  BLOB_READ_WRITE_TOKEN: z.string().min(1),

  // Cron secret for scheduled cleanup jobs
  CRON_SECRET: z.string().optional(),

  // Telegram MTProto (from my.telegram.org/apps). Optional — publisher
  // warns and no-ops when absent so dev without Telegram set up still boots.
  TELEGRAM_API_ID: z.string().optional(),
  TELEGRAM_API_HASH: z.string().optional(),

  // Early-access allowlist for the broadcast/email add-on. Comma-separated
  // emails. Placeholder until the Polar email SKU ships — any address on
  // this list gets broadcast entitlement regardless of Basic/Muse plan.
  BROADCASTS_ALLOWLIST: z.string().optional(),

// Observability — all optional. App boots without them; logging falls
  // back to stdout/pretty and Sentry no-ops when DSN is absent.
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // Langfuse — LLM tracing. Optional: router falls back to a no-op client
  // when either key is missing, so dev without Langfuse still boots.
  LANGFUSE_PUBLIC_KEY: z.string().optional(),
  LANGFUSE_SECRET_KEY: z.string().optional(),
  LANGFUSE_BASE_URL: z.string().url().default("https://us.cloud.langfuse.com"),
});

// Validate process.env
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:", parsedEnv.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsedEnv.data;

// Type definition for use elsewhere if needed
declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envSchema> {}
  }
}
