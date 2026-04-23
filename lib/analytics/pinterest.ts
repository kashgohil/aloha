// Fetches analytics data from Pinterest API.
// Pinterest's analytics requires additional OAuth scopes: pins:read
// and Pinterest for Business access for full metrics.

import { getFreshToken, forceRefresh } from "@/lib/publishers/tokens";
import { db } from "@/db";
import { postDeliveries, posts } from "@/db/schema";
import { and, eq, desc, gte } from "drizzle-orm";

export type PinterestAnalytics = {
	totalPins: number;
	publishedPins: number;
	failedPins: number;
	engagementRate: number | null;
};

type PinterestUserAnalytics = {
	impressions?: number;
	saves?: number;
	clicks?: number;
	follower_count?: number;
};

type AnalyticsResponse = {
	data?: PinterestUserAnalytics;
	summary?: string;
};

async function fetchUserAnalytics(accessToken: string): Promise<PinterestUserAnalytics> {
	const res = await fetch(
		"https://api.pinterest.com/v5/user_account/analytics?metric_types=impressions,saves,clicks,follower_count",
		{
			headers: { Authorization: `Bearer ${accessToken}` },
		},
	);

	if (!res.ok) {
		throw new Error(`Pinterest analytics API failed: ${res.status}`);
	}

	const data = (await res.json()) as AnalyticsResponse;
	return data.data ?? {};
}

export async function getPinterestAnalytics(userId: string): Promise<PinterestAnalytics> {
	let account;
	try {
		account = await getFreshToken(userId, "pinterest");
	} catch {
		return {
			totalPins: 0,
			publishedPins: 0,
			failedPins: 0,
			engagementRate: null,
		};
	}

	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

	const deliveries = await db
		.select({
			status: postDeliveries.status,
		})
		.from(postDeliveries)
		.innerJoin(posts, eq(postDeliveries.postId, posts.id))
		.where(
			and(
				eq(posts.createdByUserId, userId),
				eq(postDeliveries.platform, "pinterest"),
				gte(postDeliveries.createdAt, thirtyDaysAgo),
			),
		)
		.orderBy(desc(postDeliveries.createdAt));

	const totalPins = deliveries.length;
	const publishedPins = deliveries.filter((d) => d.status === "published").length;
	const failedPins = deliveries.filter((d) => d.status === "failed").length;

	let engagementRate: number | null = null;
	try {
		const pinterestMetrics = await fetchUserAnalytics(account.accessToken);
		if (pinterestMetrics.impressions && pinterestMetrics.impressions > 0) {
			engagementRate =
				((pinterestMetrics.saves ?? 0) + (pinterestMetrics.clicks ?? 0)) /
				pinterestMetrics.impressions;
		}
	} catch {
		// Pinterest analytics requires additional permissions; fail silently
	}

	return {
		totalPins,
		publishedPins,
		failedPins,
		engagementRate,
	};
}

export async function getPinterestAnalyticsWithRefresh(
	userId: string,
): Promise<PinterestAnalytics> {
	try {
		await getFreshToken(userId, "pinterest");
	} catch {
		return {
			totalPins: 0,
			publishedPins: 0,
			failedPins: 0,
			engagementRate: null,
		};
	}

	const analytics = await getPinterestAnalytics(userId);

	try {
		if (analytics.engagementRate === null) {
			const freshAccount = await forceRefresh(userId, "pinterest");
			const metrics = await fetchUserAnalytics(freshAccount.accessToken);
			if (metrics.impressions && metrics.impressions > 0) {
				analytics.engagementRate =
					((metrics.saves ?? 0) + (metrics.clicks ?? 0)) / metrics.impressions;
			}
		}
	} catch {
		// Silently fail if analytics API call fails
	}

	return analytics;
}
