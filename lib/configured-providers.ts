import { env } from "@/lib/env";

// OAuth channel providers gated on env credentials being present. Non-OAuth
// channels (bluesky, mastodon, telegram) have their own connect flows and
// aren't listed here. Used by auth.ts to skip registration and by the
// channels settings page to disable the connect button.
export const OAUTH_CHANNEL_PROVIDERS = {
  twitter: Boolean(env.AUTH_TWITTER_ID && env.AUTH_TWITTER_SECRET),
  linkedin: Boolean(env.AUTH_LINKEDIN_ID && env.AUTH_LINKEDIN_SECRET),
  facebook: Boolean(env.AUTH_FACEBOOK_ID && env.AUTH_FACEBOOK_SECRET),
  instagram: Boolean(env.AUTH_INSTAGRAM_ID && env.AUTH_INSTAGRAM_SECRET),
  threads: Boolean(env.AUTH_THREADS_ID && env.AUTH_THREADS_SECRET),
  tiktok: Boolean(env.AUTH_TIKTOK_ID && env.AUTH_TIKTOK_SECRET),
  medium: Boolean(env.AUTH_MEDIUM_ID && env.AUTH_MEDIUM_SECRET),
  reddit: Boolean(env.AUTH_REDDIT_ID && env.AUTH_REDDIT_SECRET),
  youtube: Boolean(env.AUTH_YOUTUBE_ID && env.AUTH_YOUTUBE_SECRET),
  pinterest: Boolean(env.AUTH_PINTEREST_ID && env.AUTH_PINTEREST_SECRET),
} as const;

export function isProviderConfigured(id: string): boolean {
  if (id in OAUTH_CHANNEL_PROVIDERS) {
    return OAUTH_CHANNEL_PROVIDERS[id as keyof typeof OAUTH_CHANNEL_PROVIDERS];
  }
  return true;
}
