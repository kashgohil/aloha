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
  
  // AI
  GEMINI_API_KEY: z.string().min(1),
  
  // QStash
  QSTASH_URL: z.string().url().optional(),
  QSTASH_TOKEN: z.string().min(1),
  QSTASH_CURRENT_SIGNING_KEY: z.string().min(1),
  QSTASH_NEXT_SIGNING_KEY: z.string().min(1),
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
