import NextAuth, { CredentialsSignin } from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
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
import Facebook from "next-auth/providers/facebook";
import Instagram from "next-auth/providers/instagram";
import TikTok from "next-auth/providers/tiktok";
import Medium from "next-auth/providers/medium";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
    authenticatorsTable: authenticators,
  }),
  secret: env.AUTH_SECRET,
  debug: process.env.NODE_ENV !== "production",
  session: { strategy: "jwt" },
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
    GitHub({
      clientId: env.AUTH_GITHUB_ID,
      clientSecret: env.AUTH_GITHUB_SECRET,
    }),
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    }),
    Twitter({
      clientId: env.AUTH_TWITTER_ID,
      clientSecret: env.AUTH_TWITTER_SECRET,
      authorization: {
        url: "https://x.com/i/oauth2/authorize",
        params: {
          scope:
            "tweet.read tweet.write users.read media.write offline.access",
        },
      },
    }),
    LinkedIn({
      clientId: env.AUTH_LINKEDIN_ID,
      clientSecret: env.AUTH_LINKEDIN_SECRET,
      authorization: {
        params: { scope: "openid profile email w_member_social" },
      },
    }),
    Facebook({
      clientId: env.AUTH_FACEBOOK_ID,
      clientSecret: env.AUTH_FACEBOOK_SECRET,
    }),
    Instagram({
      clientId: env.AUTH_INSTAGRAM_ID,
      clientSecret: env.AUTH_INSTAGRAM_SECRET,
    }),
    TikTok({
      clientId: env.AUTH_TIKTOK_ID,
      clientSecret: env.AUTH_TIKTOK_SECRET,
    }),
    Medium({
      clientId: env.AUTH_MEDIUM_ID!,
      clientSecret: env.AUTH_MEDIUM_SECRET!,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
    newUser: "/auth/onboarding/workspace",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  events: {
    // When a user re-links an OAuth account (used by Aloha to "reconnect"
    // a channel after token expiry), clear any stale reauth flag — fresh
    // tokens have just been written by the adapter.
    async linkAccount({ user, account }) {
      if (!user.id || !account.provider) return;
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
