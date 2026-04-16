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
  AUTH_TIKTOK_ID: z.string().optional(),
  AUTH_TIKTOK_SECRET: z.string().optional(),
  AUTH_MEDIUM_ID: z.string().optional(),
  AUTH_MEDIUM_SECRET: z.string().optional(),
  
  // Email
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().default("Aloha <hey@usealoha.app>"),

  // AI
  GEMINI_API_KEY: z.string().min(1),
  
  // QStash
  QSTASH_URL: z.string().url().optional(),
  QSTASH_TOKEN: z.string().min(1),
  QSTASH_CURRENT_SIGNING_KEY: z.string().min(1),
  QSTASH_NEXT_SIGNING_KEY: z.string().min(1),

  // Billing — Polar
  POLAR_ACCESS_TOKEN: z.string().min(1),
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
