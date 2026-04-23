import NextAuth, { CredentialsSignin } from "next-auth";
import type { Provider } from "next-auth/providers";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import authConfig from "./auth.config";
import { db } from "./db";
import {
  accounts,
  authenticators,
  sessions,
  users,
  verificationTokens,
} from "./db/schema";
import { and, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { env } from "@/lib/env";
import Credentials from "next-auth/providers/credentials";

class EmailNotVerifiedError extends CredentialsSignin {
  code = "EmailNotVerified";
}
import GitHub from "next-auth/providers/github";
import Twitter from "next-auth/providers/twitter";
import LinkedIn from "next-auth/providers/linkedin";
import Google from "next-auth/providers/google";
import TikTok from "next-auth/providers/tiktok";
import Medium from "next-auth/providers/medium";
import { OAUTH_CHANNEL_PROVIDERS } from "@/lib/configured-providers";
import { refreshOAuthChannelProfile } from "@/lib/channels/profiles";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
    authenticatorsTable: authenticators,
  }),
  debug: process.env.NODE_ENV !== "production",
  providers: [
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (creds) => {
        const parsed = credentialsSchema.safeParse(creds);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email.toLowerCase()))
          .limit(1);

        if (!user?.passwordHash) return null;
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        if (!user.emailVerified) {
          throw new EmailNotVerifiedError();
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
    ...(env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET
      ? [
          GitHub({
            clientId: env.AUTH_GITHUB_ID,
            clientSecret: env.AUTH_GITHUB_SECRET,
          }),
        ]
      : []),
    ...(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: env.AUTH_GOOGLE_ID,
            clientSecret: env.AUTH_GOOGLE_SECRET,
          }),
        ]
      : []),
    ...(OAUTH_CHANNEL_PROVIDERS.twitter
      ? [
          Twitter({
            clientId: env.AUTH_TWITTER_ID,
            clientSecret: env.AUTH_TWITTER_SECRET,
            authorization: {
              url: "https://x.com/i/oauth2/authorize",
              params: {
                scope:
                  "tweet.read tweet.write users.read media.write dm.read dm.write offline.access",
              },
            },
          }),
        ]
      : []),
    ...(OAUTH_CHANNEL_PROVIDERS.linkedin
      ? [
          LinkedIn({
            clientId: env.AUTH_LINKEDIN_ID,
            clientSecret: env.AUTH_LINKEDIN_SECRET,
            authorization: {
              params: { scope: "openid profile email w_member_social" },
            },
          }),
        ]
      : []),
    ...(OAUTH_CHANNEL_PROVIDERS.facebook
      ? [{
      id: "facebook",
      name: "Facebook",
      type: "oauth",
      checks: ["state"],
      authorization: {
        url: "https://www.facebook.com/v22.0/dialog/oauth",
        params: {
          scope: "public_profile,email",
        },
      },
      token: "https://graph.facebook.com/v22.0/oauth/access_token",
      userinfo: "https://graph.facebook.com/v22.0/me?fields=id,name,email,picture",
      async profile(profile: {
        id: string;
        name: string;
        email?: string;
        picture?: { data?: { url?: string } };
      }) {
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email ?? null,
          image: profile.picture?.data?.url ?? null,
        };
      },
      clientId: env.AUTH_FACEBOOK_ID,
      clientSecret: env.AUTH_FACEBOOK_SECRET,
    }]
      : []),
    ...(OAUTH_CHANNEL_PROVIDERS.instagram
      ? [{
      id: "instagram",
      name: "Instagram",
      type: "oauth",
      authorization: {
        url: "https://api.instagram.com/oauth/authorize",
        params: {
          scope:
            "instagram_business_basic,instagram_business_content_publish,instagram_business_manage_comments",
        },
      },
      token: "https://api.instagram.com/oauth/access_token",
      userinfo:
        "https://graph.instagram.com/v22.0/me?fields=user_id,username,name,profile_picture_url",
      client: {
        token_endpoint_auth_method: "client_secret_post",
      },
      async profile(profile: {
        user_id: string;
        username: string;
        name?: string;
        profile_picture_url?: string;
      }) {
        return {
          id: profile.user_id,
          name: profile.name ?? profile.username,
          email: null,
          image: profile.profile_picture_url ?? null,
        };
      },
      clientId: env.AUTH_INSTAGRAM_ID,
      clientSecret: env.AUTH_INSTAGRAM_SECRET,
    }]
      : []),
    ...(OAUTH_CHANNEL_PROVIDERS.threads
      ? [{
      id: "threads",
      name: "Threads",
      type: "oauth",
      authorization: {
        url: "https://threads.net/oauth/authorize",
        params: {
          scope:
            "threads_basic,threads_content_publish,threads_manage_replies,threads_read_replies",
        },
      },
      token: "https://graph.threads.net/oauth/access_token",
      userinfo:
        "https://graph.threads.net/v1.0/me?fields=id,username,name,threads_profile_picture_url",
      async profile(profile: {
        id: string;
        username: string;
        name?: string;
        threads_profile_picture_url?: string;
      }) {
        return {
          id: profile.id,
          name: profile.name ?? profile.username,
          email: null,
          image: profile.threads_profile_picture_url ?? null,
        };
      },
      clientId: env.AUTH_THREADS_ID,
      clientSecret: env.AUTH_THREADS_SECRET,
    }]
      : []),
    ...(OAUTH_CHANNEL_PROVIDERS.tiktok
      ? [
          TikTok({
            clientId: env.AUTH_TIKTOK_ID,
            clientSecret: env.AUTH_TIKTOK_SECRET,
          }),
        ]
      : []),
    ...(OAUTH_CHANNEL_PROVIDERS.medium
      ? [
          Medium({
            clientId: env.AUTH_MEDIUM_ID!,
            clientSecret: env.AUTH_MEDIUM_SECRET!,
          }),
        ]
      : []),
    ...(OAUTH_CHANNEL_PROVIDERS.reddit
      ? [{
      id: "reddit",
      name: "Reddit",
      type: "oauth",
      checks: ["state"],
      authorization: {
        url: "https://www.reddit.com/api/v1/authorize",
        params: {
          scope: "submit read identity",
        },
      },
      token: "https://www.reddit.com/api/v1/access_token",
      userinfo: "https://oauth.reddit.com/api/v1/me",
      async profile(profile: { id: string; name: string }) {
        return {
          id: profile.id,
          name: profile.name,
          email: null,
          image: null,
        };
      },
      clientId: env.AUTH_REDDIT_ID,
      clientSecret: env.AUTH_REDDIT_SECRET,
    }]
      : []),
    ...(OAUTH_CHANNEL_PROVIDERS.youtube
      ? [{
      id: "youtube",
      name: "YouTube",
      type: "oauth",
      checks: ["state", "pkce"],
      authorization: {
        url: "https://accounts.google.com/o/oauth2/v2/auth",
        params: {
          // `offline` + `consent` are both required to reliably receive a
          // refresh_token on reconnect — Google omits it otherwise.
          access_type: "offline",
          prompt: "consent",
          scope: [
            "openid",
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/youtube.upload",
            "https://www.googleapis.com/auth/youtube.readonly",
            "https://www.googleapis.com/auth/youtube.force-ssl",
          ].join(" "),
        },
      },
      token: "https://oauth2.googleapis.com/token",
      userinfo: "https://openidconnect.googleapis.com/v1/userinfo",
      async profile(profile: {
        sub: string;
        name?: string;
        picture?: string;
        email?: string;
      }) {
        return {
          id: profile.sub,
          name: profile.name ?? "YouTube",
          email: profile.email ?? null,
          image: profile.picture ?? null,
        };
      },
      clientId: env.AUTH_YOUTUBE_ID,
      clientSecret: env.AUTH_YOUTUBE_SECRET,
    }]
      : []),
    ...(OAUTH_CHANNEL_PROVIDERS.pinterest
      ? [{
      id: "pinterest",
      name: "Pinterest",
      type: "oauth",
      checks: ["state"],
      authorization: {
        url: "https://www.pinterest.com/oauth/",
        params: {
          scope: "pins:read,pins:write,boards:read,boards:write,user_accounts:read",
        },
      },
      token: "https://api.pinterest.com/v5/oauth/token",
      userinfo: "https://api.pinterest.com/v5/user_account",
      async profile(profile: {
        id: string;
        username: string;
        first_name?: string;
        last_name?: string;
        profile_image_url?: string;
      }) {
        return {
          id: profile.id,
          name: [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.username,
          email: null,
          image: profile.profile_image_url ?? null,
        };
      },
      clientId: env.AUTH_PINTEREST_ID,
      clientSecret: env.AUTH_PINTEREST_SECRET,
    }]
      : []),
  ] as Provider[],
  callbacks: {
    ...authConfig.callbacks,
    // Runs only on sign-in (`user` present) and on `unstable_update`
    // (`trigger === "update"`). Hydrates the JWT with user-row fields
    // so getCurrentUser() can skip the DB on subsequent requests.
    async jwt({ token, user, trigger, session }) {
      if (user?.id) {
        token.sub = user.id;
        const [row] = await db
          .select({
            name: users.name,
            email: users.email,
            image: users.image,
            workspaceName: users.workspaceName,
            role: users.role,
            timezone: users.timezone,
            onboardedAt: users.onboardedAt,
          })
          .from(users)
          .where(eq(users.id, user.id))
          .limit(1);
        if (row) {
          token.name = row.name;
          token.email = row.email;
          token.picture = row.image;
          token.workspaceName = row.workspaceName;
          token.role = row.role;
          token.timezone = row.timezone;
          token.onboardedAt = row.onboardedAt
            ? row.onboardedAt.toISOString()
            : null;
        }
      }

      // Refresh path. Runs when:
      //  - `trigger === "update"` (server action called unstable_update), or
      //  - the token predates the fields we now stash in the JWT (migration
      //    for users whose session cookie was issued before this deploy —
      //    they'd otherwise look "not onboarded" and get bounced).
      const needsBackfill = token.sub && !("onboardedAt" in token);
      if ((trigger === "update" && token.sub) || needsBackfill) {
        const [row] = await db
          .select({
            name: users.name,
            image: users.image,
            workspaceName: users.workspaceName,
            role: users.role,
            timezone: users.timezone,
            onboardedAt: users.onboardedAt,
          })
          .from(users)
          .where(eq(users.id, token.sub!))
          .limit(1);
        if (row) {
          token.name = row.name;
          token.picture = row.image;
          token.workspaceName = row.workspaceName;
          token.role = row.role;
          token.timezone = row.timezone;
          token.onboardedAt = row.onboardedAt
            ? row.onboardedAt.toISOString()
            : null;
        }
        // Avoid unused-var warning; session payload is ignored by design.
        void session;
      }

      return token;
    },
  },
  events: {
    // When a user re-links an OAuth account (used by Aloha to "reconnect"
    // a channel after token expiry), clear any stale reauth flag — fresh
    // tokens have just been written by the adapter.
    async linkAccount({ user, account }) {
      if (!user.id || !account.provider) return;
      // Drizzle adapter inserts accounts without knowing about our workspace
      // layer. Stamp workspaceId on the row here so tenant-scoped queries
      // find it. Falls back to null if the user has no active workspace yet
      // (edge case during first-ever sign-in — backfilled on next link).
      const [userRow] = await db
        .select({ workspaceId: users.activeWorkspaceId })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);
      await db
        .update(accounts)
        .set({
          reauthRequired: false,
          ...(userRow?.workspaceId
            ? { workspaceId: userRow.workspaceId }
            : {}),
        })
        .where(
          and(
            eq(accounts.userId, user.id),
            eq(accounts.provider, account.provider),
          ),
        );

      // Instagram and Threads return short-lived tokens (~1 hr) from OAuth.
      // Exchange for long-lived tokens (~60 days) immediately.
      if (account.provider === "instagram" && account.access_token) {
        try {
          const res = await fetch(
            `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${env.AUTH_INSTAGRAM_SECRET}&access_token=${account.access_token}`,
          );
          if (res.ok) {
            const json = (await res.json()) as {
              access_token: string;
              expires_in: number;
            };
            await db
              .update(accounts)
              .set({
                access_token: json.access_token,
                expires_at: Math.floor(Date.now() / 1000) + json.expires_in,
              })
              .where(
                and(
                  eq(accounts.userId, user.id),
                  eq(accounts.provider, "instagram"),
                ),
              );
          }
        } catch (err) {
          console.error("[instagram] long-lived token exchange failed", err);
        }
      }

      if (account.provider === "threads" && account.access_token) {
        try {
          const res = await fetch(
            `https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=${env.AUTH_THREADS_SECRET}&access_token=${account.access_token}`,
          );
          if (res.ok) {
            const json = (await res.json()) as {
              access_token: string;
              expires_in: number;
            };
            await db
              .update(accounts)
              .set({
                access_token: json.access_token,
                expires_at: Math.floor(Date.now() / 1000) + json.expires_in,
              })
              .where(
                and(
                  eq(accounts.userId, user.id),
                  eq(accounts.provider, "threads"),
                ),
              );
          }
        } catch (err) {
          console.error("[threads] long-lived token exchange failed", err);
        }
      }

      // Cache profile details (avatar, handle, follower count) so the
      // channel list + composer can render them without re-hitting the API.
      // Swallowed on failure — a missing profile never blocks connection.
      await refreshOAuthChannelProfile(user.id, account.provider);
    },
    async signIn({ user, account }) {
      if (!user.id || !account?.provider) return;
      await db
        .update(accounts)
        .set({ reauthRequired: false })
        .where(
          and(
            eq(accounts.userId, user.id),
            eq(accounts.provider, account.provider),
          ),
        );
    },
  },
});
