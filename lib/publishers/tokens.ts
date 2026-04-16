// Fetches a valid access token for (userId, provider), refreshing the
// stored OAuth tokens when they're expired. DrizzleAdapter stores everything
// we need in the accounts table: access_token, refresh_token, expires_at.

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { env } from "@/lib/env";
import { PublishError } from "./errors";

export type ProviderAccount = {
	accessToken: string;
	refreshToken: string | null;
	expiresAt: number | null; // unix seconds
	providerAccountId: string;
	scope: string | null;
};

const REFRESH_LEEWAY_SECONDS = 60;

async function loadAccount(userId: string, provider: string): Promise<ProviderAccount | null> {
	const [row] = await db
		.select({
			access_token: accounts.access_token,
			refresh_token: accounts.refresh_token,
			expires_at: accounts.expires_at,
			providerAccountId: accounts.providerAccountId,
			scope: accounts.scope,
		})
		.from(accounts)
		.where(and(eq(accounts.userId, userId), eq(accounts.provider, provider)))
		.limit(1);
	if (!row?.access_token) return null;
	return {
		accessToken: row.access_token,
		refreshToken: row.refresh_token,
		expiresAt: row.expires_at,
		providerAccountId: row.providerAccountId,
		scope: row.scope,
	};
}

function isExpired(expiresAt: number | null): boolean {
	if (!expiresAt) return false;
	return expiresAt <= Math.floor(Date.now() / 1000) + REFRESH_LEEWAY_SECONDS;
}

async function writeRefreshedTokens(
	userId: string,
	provider: string,
	tokens: {
		access_token: string;
		refresh_token?: string | null;
		expires_in: number;
	},
) {
	const expiresAt = Math.floor(Date.now() / 1000) + tokens.expires_in;
	await db
		.update(accounts)
		.set({
			access_token: tokens.access_token,
			// Some providers rotate refresh tokens, others don't — preserve if absent.
			...(tokens.refresh_token
				? { refresh_token: tokens.refresh_token }
				: {}),
			expires_at: expiresAt,
		})
		.where(and(eq(accounts.userId, userId), eq(accounts.provider, provider)));
}

async function refreshLinkedIn(userId: string, refreshToken: string) {
	if (!env.AUTH_LINKEDIN_ID || !env.AUTH_LINKEDIN_SECRET) {
		throw new PublishError(
			"needs_reauth",
			"LinkedIn client credentials missing",
		);
	}
	const body = new URLSearchParams({
		grant_type: "refresh_token",
		refresh_token: refreshToken,
		client_id: env.AUTH_LINKEDIN_ID,
		client_secret: env.AUTH_LINKEDIN_SECRET,
	});
	const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body,
	});
	if (!res.ok) {
		throw new PublishError(
			"needs_reauth",
			`LinkedIn token refresh failed: ${res.status} ${await res.text().catch(() => "")}`,
		);
	}
	const json = (await res.json()) as {
		access_token: string;
		refresh_token?: string;
		expires_in: number;
	};
	await writeRefreshedTokens(userId, "linkedin", json);
	return json.access_token;
}

async function refreshX(userId: string, refreshToken: string) {
	if (!env.AUTH_TWITTER_ID || !env.AUTH_TWITTER_SECRET) {
		throw new PublishError(
			"needs_reauth",
			"X (Twitter) client credentials missing",
		);
	}
	const basic = Buffer.from(
		`${env.AUTH_TWITTER_ID}:${env.AUTH_TWITTER_SECRET}`,
	).toString("base64");
	const body = new URLSearchParams({
		grant_type: "refresh_token",
		refresh_token: refreshToken,
		client_id: env.AUTH_TWITTER_ID,
	});
	const res = await fetch("https://api.x.com/2/oauth2/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Authorization: `Basic ${basic}`,
		},
		body,
	});
	if (!res.ok) {
		throw new PublishError(
			"needs_reauth",
			`X token refresh failed: ${res.status} ${await res.text().catch(() => "")}`,
		);
	}
	const json = (await res.json()) as {
		access_token: string;
		refresh_token?: string;
		expires_in: number;
	};
	await writeRefreshedTokens(userId, "twitter", json);
	return json.access_token;
}

async function refreshMedium(userId: string, refreshToken: string) {
	if (!env.AUTH_MEDIUM_ID || !env.AUTH_MEDIUM_SECRET) {
		throw new PublishError(
			"needs_reauth",
			"Medium client credentials missing",
		);
	}
	const body = new URLSearchParams({
		grant_type: "refresh_token",
		refresh_token: refreshToken,
		client_id: env.AUTH_MEDIUM_ID,
		client_secret: env.AUTH_MEDIUM_SECRET,
	});
	const res = await fetch("https://api.medium.com/v1/tokens", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body,
	});
	if (!res.ok) {
		throw new PublishError(
			"needs_reauth",
			`Medium token refresh failed: ${res.status} ${await res.text().catch(() => "")}`,
		);
	}
	const json = (await res.json()) as {
		access_token: string;
		refresh_token?: string;
		expires_at: number;
	};
	await writeRefreshedTokens(userId, "medium", {
		access_token: json.access_token,
		refresh_token: json.refresh_token,
		expires_in: json.expires_at - Math.floor(Date.now() / 1000),
	});
	return json.access_token;
}

// Returns a valid access token, refreshing if needed. Throws PublishError
// with category "needs_reauth" if the account is missing, has no refresh
// token, or the refresh call fails.
export async function getFreshToken(
	userId: string,
	provider: "linkedin" | "twitter" | "medium" | "bluesky",
): Promise<ProviderAccount> {
	if (provider === "bluesky") {
		throw new PublishError(
			"needs_reauth",
			"Bluesky uses app password auth. Token refresh not applicable.",
		);
	}
	const account = await loadAccount(userId, provider);
	if (!account) {
		throw new PublishError(
			"needs_reauth",
			`No ${provider} account connected for user ${userId}`,
		);
	}
	if (!isExpired(account.expiresAt)) return account;

	if (!account.refreshToken) {
		throw new PublishError(
			"needs_reauth",
			`${provider} access token expired and no refresh token available`,
		);
	}

	const fresh =
		provider === "linkedin"
			? await refreshLinkedIn(userId, account.refreshToken)
			: provider === "medium"
				? await refreshMedium(userId, account.refreshToken)
				: await refreshX(userId, account.refreshToken);

	return { ...account, accessToken: fresh };
}

// Forces a refresh without checking expiry — used after a 401 response
// when the stored expires_at says "still valid" but the provider disagrees.
export async function forceRefresh(
	userId: string,
	provider: "linkedin" | "twitter" | "medium" | "bluesky",
): Promise<ProviderAccount> {
	if (provider === "bluesky") {
		throw new PublishError(
			"needs_reauth",
			"Bluesky uses app password auth. Force refresh not applicable.",
		);
	}
	const account = await loadAccount(userId, provider);
	if (!account?.refreshToken) {
		throw new PublishError(
			"needs_reauth",
			`${provider} account cannot be refreshed`,
		);
	}
	const fresh =
		provider === "linkedin"
			? await refreshLinkedIn(userId, account.refreshToken)
			: provider === "medium"
				? await refreshMedium(userId, account.refreshToken)
				: await refreshX(userId, account.refreshToken);
	return { ...account, accessToken: fresh };
}
