// Fetches a valid access token for (workspaceId, provider), refreshing the
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

async function loadAccount(workspaceId: string, provider: string): Promise<ProviderAccount | null> {
	const [row] = await db
		.select({
			access_token: accounts.access_token,
			refresh_token: accounts.refresh_token,
			expires_at: accounts.expires_at,
			providerAccountId: accounts.providerAccountId,
			scope: accounts.scope,
		})
		.from(accounts)
		.where(and(eq(accounts.workspaceId, workspaceId), eq(accounts.provider, provider)))
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
	workspaceId: string,
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
		.where(and(eq(accounts.workspaceId, workspaceId), eq(accounts.provider, provider)));
}

async function refreshLinkedIn(workspaceId: string, refreshToken: string) {
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
	await writeRefreshedTokens(workspaceId, "linkedin", json);
	return json.access_token;
}

async function refreshX(workspaceId: string, refreshToken: string) {
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
	await writeRefreshedTokens(workspaceId, "twitter", json);
	return json.access_token;
}

// Best-effort revoke of an X (Twitter) OAuth 2.0 token. Per RFC 7009 / X docs,
// revoking a refresh_token also invalidates derived access tokens. Failures
// are swallowed — we still want the local disconnect to proceed even if X
// rejects the call (token already invalid, network blip, etc).
export async function revokeX(token: string, hint: "access_token" | "refresh_token" = "refresh_token") {
	if (!env.AUTH_TWITTER_ID || !env.AUTH_TWITTER_SECRET || !token) return;
	const basic = Buffer.from(
		`${env.AUTH_TWITTER_ID}:${env.AUTH_TWITTER_SECRET}`,
	).toString("base64");
	const body = new URLSearchParams({ token, token_type_hint: hint });
	try {
		await fetch("https://api.x.com/2/oauth2/revoke", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				Authorization: `Basic ${basic}`,
			},
			body,
		});
	} catch (err) {
		console.error("[tokens] X revoke failed", err);
	}
}

async function refreshMedium(workspaceId: string, refreshToken: string) {
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
	await writeRefreshedTokens(workspaceId, "medium", {
		access_token: json.access_token,
		refresh_token: json.refresh_token,
		expires_in: json.expires_at - Math.floor(Date.now() / 1000),
	});
	return json.access_token;
}

async function refreshFacebook(workspaceId: string, refreshToken: string) {
	if (!env.AUTH_FACEBOOK_ID || !env.AUTH_FACEBOOK_SECRET) {
		throw new PublishError(
			"needs_reauth",
			"Facebook client credentials missing",
		);
	}
	const body = new URLSearchParams({
		grant_type: "fb_exchange_token",
		fb_exchange_token: refreshToken,
		client_id: env.AUTH_FACEBOOK_ID,
		client_secret: env.AUTH_FACEBOOK_SECRET,
	});
	const res = await fetch("https://graph.facebook.com/v22.0/oauth/access_token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body,
	});
	if (!res.ok) {
		throw new PublishError(
			"needs_reauth",
			`Facebook token refresh failed: ${res.status} ${await res.text().catch(() => "")}`,
		);
	}
	const json = (await res.json()) as {
		access_token: string;
		expires_in: number;
	};
	await writeRefreshedTokens(workspaceId, "facebook", { ...json });
	return json.access_token;
}

async function refreshInstagram(workspaceId: string, accessToken: string) {
	const res = await fetch(
		`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(accessToken)}`,
	);
	if (!res.ok) {
		throw new PublishError(
			"needs_reauth",
			`Instagram token refresh failed: ${res.status} ${await res.text().catch(() => "")}`,
		);
	}
	const json = (await res.json()) as {
		access_token: string;
		expires_in: number;
	};
	await writeRefreshedTokens(workspaceId, "instagram", { ...json });
	return json.access_token;
}

async function refreshThreads(workspaceId: string, accessToken: string) {
	const res = await fetch(
		`https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token&access_token=${encodeURIComponent(accessToken)}`,
	);
	if (!res.ok) {
		throw new PublishError(
			"needs_reauth",
			`Threads token refresh failed: ${res.status} ${await res.text().catch(() => "")}`,
		);
	}
	const json = (await res.json()) as {
		access_token: string;
		expires_in: number;
	};
	await writeRefreshedTokens(workspaceId, "threads", { ...json });
	return json.access_token;
}

async function refreshReddit(workspaceId: string, refreshToken: string) {
	if (!env.AUTH_REDDIT_ID || !env.AUTH_REDDIT_SECRET) {
		throw new PublishError(
			"needs_reauth",
			"Reddit client credentials missing",
		);
	}
	const body = new URLSearchParams({
		grant_type: "refresh_token",
		refresh_token: refreshToken,
		client_id: env.AUTH_REDDIT_ID,
		client_secret: env.AUTH_REDDIT_SECRET,
	});
	const res = await fetch("https://www.reddit.com/api/v1/access_token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body,
	});
	if (!res.ok) {
		throw new PublishError(
			"needs_reauth",
			`Reddit token refresh failed: ${res.status} ${await res.text().catch(() => "")}`,
		);
	}
	const json = (await res.json()) as {
		access_token: string;
		refresh_token?: string;
		expires_in: number;
	};
	await writeRefreshedTokens(workspaceId, "reddit", json);
	return json.access_token;
}

async function refreshPinterest(workspaceId: string, refreshToken: string) {
	if (!env.AUTH_PINTEREST_ID || !env.AUTH_PINTEREST_SECRET) {
		throw new PublishError(
			"needs_reauth",
			"Pinterest client credentials missing",
		);
	}
	const body = new URLSearchParams({
		grant_type: "refresh_token",
		refresh_token: refreshToken,
		client_id: env.AUTH_PINTEREST_ID,
		client_secret: env.AUTH_PINTEREST_SECRET,
	});
	const res = await fetch("https://api.pinterest.com/v5/oauth/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body,
	});
	if (!res.ok) {
		throw new PublishError(
			"needs_reauth",
			`Pinterest token refresh failed: ${res.status} ${await res.text().catch(() => "")}`,
		);
	}
	const json = (await res.json()) as {
		access_token: string;
		refresh_token?: string;
		expires_in: number;
	};
	await writeRefreshedTokens(workspaceId, "pinterest", json);
	return json.access_token;
}

async function refreshYouTube(workspaceId: string, refreshToken: string) {
	if (!env.AUTH_YOUTUBE_ID || !env.AUTH_YOUTUBE_SECRET) {
		throw new PublishError(
			"needs_reauth",
			"YouTube client credentials missing",
		);
	}
	const body = new URLSearchParams({
		grant_type: "refresh_token",
		refresh_token: refreshToken,
		client_id: env.AUTH_YOUTUBE_ID,
		client_secret: env.AUTH_YOUTUBE_SECRET,
	});
	const res = await fetch("https://oauth2.googleapis.com/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body,
	});
	if (!res.ok) {
		throw new PublishError(
			"needs_reauth",
			`YouTube token refresh failed: ${res.status} ${await res.text().catch(() => "")}`,
		);
	}
	const json = (await res.json()) as {
		access_token: string;
		refresh_token?: string;
		expires_in: number;
	};
	// Google rarely rotates the refresh_token on refresh — preserve ours.
	await writeRefreshedTokens(workspaceId, "youtube", json);
	return json.access_token;
}

// Returns a valid access token, refreshing if needed. Throws PublishError
// with category "needs_reauth" if the account is missing, has no refresh
// token, or the refresh call fails.
export async function getFreshToken(
	workspaceId: string,
	provider: "linkedin" | "twitter" | "medium" | "bluesky" | "facebook" | "instagram" | "threads" | "reddit" | "pinterest" | "youtube" | "tiktok",
): Promise<ProviderAccount> {
	if (provider === "bluesky") {
		throw new PublishError(
			"needs_reauth",
			"Bluesky uses app password auth. Token refresh not applicable.",
		);
	}
	const account = await loadAccount(workspaceId, provider);
	if (!account) {
		throw new PublishError(
			"needs_reauth",
			`No ${provider} account connected for workspace ${workspaceId}`,
		);
	}
	if (!isExpired(account.expiresAt)) return account;

	// Instagram and Threads refresh using the current access token itself
	// (long-lived tokens, no separate refresh_token).
	if (provider === "instagram") {
		const fresh = await refreshInstagram(workspaceId, account.accessToken);
		return { ...account, accessToken: fresh };
	}
	if (provider === "threads") {
		const fresh = await refreshThreads(workspaceId, account.accessToken);
		return { ...account, accessToken: fresh };
	}

	if (!account.refreshToken) {
		throw new PublishError(
			"needs_reauth",
			`${provider} access token expired and no refresh token available`,
		);
	}

	let fresh: string;
	if (provider === "linkedin") {
		fresh = await refreshLinkedIn(workspaceId, account.refreshToken);
	} else if (provider === "medium") {
		fresh = await refreshMedium(workspaceId, account.refreshToken);
	} else if (provider === "twitter") {
		fresh = await refreshX(workspaceId, account.refreshToken);
	} else if (provider === "reddit") {
		fresh = await refreshReddit(workspaceId, account.refreshToken);
	} else if (provider === "pinterest") {
		fresh = await refreshPinterest(workspaceId, account.refreshToken);
	} else if (provider === "youtube") {
		fresh = await refreshYouTube(workspaceId, account.refreshToken);
	} else {
		fresh = await refreshFacebook(workspaceId, account.refreshToken);
	}

	return { ...account, accessToken: fresh };
}

// Forces a refresh without checking expiry — used after a 401 response
// when the stored expires_at says "still valid" but the provider disagrees.
export async function forceRefresh(
	workspaceId: string,
	provider: "linkedin" | "twitter" | "medium" | "bluesky" | "facebook" | "instagram" | "threads" | "reddit" | "pinterest" | "youtube" | "tiktok",
): Promise<ProviderAccount> {
	if (provider === "bluesky") {
		throw new PublishError(
			"needs_reauth",
			"Bluesky uses app password auth. Force refresh not applicable.",
		);
	}
	const account = await loadAccount(workspaceId, provider);
	if (!account) {
		throw new PublishError(
			"needs_reauth",
			`${provider} account cannot be refreshed`,
		);
	}

	if (provider === "instagram") {
		const fresh = await refreshInstagram(workspaceId, account.accessToken);
		return { ...account, accessToken: fresh };
	}
	if (provider === "threads") {
		const fresh = await refreshThreads(workspaceId, account.accessToken);
		return { ...account, accessToken: fresh };
	}

	if (!account.refreshToken) {
		throw new PublishError(
			"needs_reauth",
			`${provider} account cannot be refreshed`,
		);
	}
	let fresh: string;
	if (provider === "linkedin") {
		fresh = await refreshLinkedIn(workspaceId, account.refreshToken);
	} else if (provider === "medium") {
		fresh = await refreshMedium(workspaceId, account.refreshToken);
	} else if (provider === "twitter") {
		fresh = await refreshX(workspaceId, account.refreshToken);
	} else if (provider === "reddit") {
		fresh = await refreshReddit(workspaceId, account.refreshToken);
	} else if (provider === "pinterest") {
		fresh = await refreshPinterest(workspaceId, account.refreshToken);
	} else if (provider === "youtube") {
		fresh = await refreshYouTube(workspaceId, account.refreshToken);
	} else {
		fresh = await refreshFacebook(workspaceId, account.refreshToken);
	}
	return { ...account, accessToken: fresh };
}
