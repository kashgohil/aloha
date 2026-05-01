import "server-only";

import { and, desc, eq, gte, inArray, sum } from "drizzle-orm";

import { db } from "@/db";
import {
	creditLedger,
	users,
	workspaceMembers,
	workspaces,
} from "@/db/schema";
import { getAccountSeats } from "@/lib/billing/account-entitlements";
import { getCreditsSnapshot } from "@/lib/billing/credits";
import { getLogicalSubscription } from "@/lib/billing/service";
import { getConnectedChannels } from "@/lib/channels/connected";

export type SeatRow = {
	userId: string;
	name: string | null;
	email: string;
	image: string | null;
	assignments: Array<{
		workspaceId: string;
		workspaceName: string;
		role: string;
	}>;
};

export type WorkspaceRow = {
	id: string;
	name: string;
	channelCount: number;
	memberCount: number;
	frozen: boolean;
	trialEndsAt: Date | null;
	createdAt: Date;
};

export type UsageGroup = {
	workspaceId: string | null;
	workspaceName: string;
	creditsUsed: number;
	byFeature: Array<{ feature: string; cost: number }>;
};

// Bundles every read needed to render the admin overview into one
// round-trip. Heavy queries are scoped to the owner's workspaces.
export async function loadAdminOverview(ownerUserId: string) {
	const [seats, credits, sub] = await Promise.all([
		getAccountSeats(ownerUserId),
		getCreditsSnapshot(ownerUserId),
		getLogicalSubscription(ownerUserId),
	]);

	const owned = await db
		.select({
			id: workspaces.id,
			name: workspaces.name,
			frozenAt: workspaces.frozenAt,
			trialEndsAt: workspaces.trialEndsAt,
			createdAt: workspaces.createdAt,
		})
		.from(workspaces)
		.where(eq(workspaces.ownerUserId, ownerUserId))
		.orderBy(workspaces.createdAt);

	const ownedIds = owned.map((w) => w.id);
	const wsName = new Map(owned.map((w) => [w.id, w.name]));

	if (ownedIds.length === 0) {
		return {
			seats,
			credits,
			plan: sub,
			workspaces: [] as WorkspaceRow[],
			seatRows: [] as SeatRow[],
			usage: [] as UsageGroup[],
		};
	}

	// Per-workspace channel + member counts. Channels live in posts'
	// connectedProviders; we approximate via member count + frozen
	// state for v1, since "channels connected" spans multiple credential
	// tables and computing it precisely belongs in the billing module.
	const memberCounts = await db
		.select({
			workspaceId: workspaceMembers.workspaceId,
		})
		.from(workspaceMembers)
		.where(inArray(workspaceMembers.workspaceId, ownedIds));

	const memberCountByWs = memberCounts.reduce<Record<string, number>>(
		(acc, r) => {
			acc[r.workspaceId] = (acc[r.workspaceId] ?? 0) + 1;
			return acc;
		},
		{},
	);

	// Resolve connected-channel counts per workspace in parallel — N is
	// bounded by workspace count (typically <20), so this is cheap.
	const channelCounts = await Promise.all(
		owned.map((w) => getConnectedChannels(w.id).then((c) => c.perAccountCount)),
	);

	const workspaceRows: WorkspaceRow[] = owned.map((w, i) => ({
		id: w.id,
		name: w.name,
		channelCount: channelCounts[i] ?? 0,
		memberCount: memberCountByWs[w.id] ?? 0,
		frozen: !!w.frozenAt,
		trialEndsAt: w.trialEndsAt,
		createdAt: w.createdAt,
	}));

	// Seats: every distinct user across all owned workspaces, with their
	// per-workspace role assignments.
	const memberRows = await db
		.select({
			userId: workspaceMembers.userId,
			workspaceId: workspaceMembers.workspaceId,
			role: workspaceMembers.role,
			name: users.name,
			email: users.email,
			image: users.image,
		})
		.from(workspaceMembers)
		.innerJoin(users, eq(users.id, workspaceMembers.userId))
		.where(inArray(workspaceMembers.workspaceId, ownedIds));

	const seatMap = new Map<string, SeatRow>();
	for (const r of memberRows) {
		const existing = seatMap.get(r.userId);
		const assignment = {
			workspaceId: r.workspaceId,
			workspaceName: wsName.get(r.workspaceId) ?? "(unknown)",
			role: r.role,
		};
		if (existing) {
			existing.assignments.push(assignment);
		} else {
			seatMap.set(r.userId, {
				userId: r.userId,
				name: r.name,
				email: r.email,
				image: r.image,
				assignments: [assignment],
			});
		}
	}
	const seatRows = Array.from(seatMap.values()).sort((a, b) =>
		(a.name ?? a.email).localeCompare(b.name ?? b.email),
	);

	// Credit usage breakdown for the current period. Sums consume rows
	// per (workspaceId, feature) since the period anchor.
	const periodAnchor = credits.periodEndsAt
		? new Date(credits.periodEndsAt.getTime() - 30 * 24 * 60 * 60 * 1000)
		: null;

	const usage: UsageGroup[] = [];
	if (periodAnchor) {
		const consumeRows = await db
			.select({
				workspaceId: creditLedger.workspaceId,
				feature: creditLedger.feature,
				delta: sum(creditLedger.delta).as("delta"),
			})
			.from(creditLedger)
			.where(
				and(
					eq(creditLedger.ownerUserId, ownerUserId),
					eq(creditLedger.reason, "consume"),
					gte(creditLedger.createdAt, periodAnchor),
				),
			)
			.groupBy(creditLedger.workspaceId, creditLedger.feature);

		const grouped = new Map<string, UsageGroup>();
		for (const r of consumeRows) {
			const key = r.workspaceId ?? "_account";
			const cost = Math.abs(Number(r.delta ?? 0));
			const wsLabel =
				r.workspaceId == null
					? "Account-level"
					: (wsName.get(r.workspaceId) ?? "Deleted workspace");
			let bucket = grouped.get(key);
			if (!bucket) {
				bucket = {
					workspaceId: r.workspaceId,
					workspaceName: wsLabel,
					creditsUsed: 0,
					byFeature: [],
				};
				grouped.set(key, bucket);
			}
			bucket.creditsUsed += cost;
			bucket.byFeature.push({ feature: r.feature ?? "unknown", cost });
		}
		for (const g of grouped.values()) {
			g.byFeature.sort((a, b) => b.cost - a.cost);
			usage.push(g);
		}
		usage.sort((a, b) => b.creditsUsed - a.creditsUsed);
	}

	return {
		seats,
		credits,
		plan: sub,
		workspaces: workspaceRows,
		seatRows,
		usage,
	};
}

// Recent ledger entries — last 20 events, used in the activity strip.
export async function loadRecentLedger(ownerUserId: string, limit = 20) {
	return db
		.select({
			id: creditLedger.id,
			delta: creditLedger.delta,
			reason: creditLedger.reason,
			feature: creditLedger.feature,
			workspaceId: creditLedger.workspaceId,
			createdAt: creditLedger.createdAt,
		})
		.from(creditLedger)
		.where(eq(creditLedger.ownerUserId, ownerUserId))
		.orderBy(desc(creditLedger.createdAt))
		.limit(limit);
}
