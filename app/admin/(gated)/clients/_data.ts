import "server-only";

import { and, count, desc, eq, gte, inArray, sum } from "drizzle-orm";

import { db } from "@/db";
import {
	creditLedger,
	subscriptions,
	users,
	workspaceMembers,
	workspaces,
} from "@/db/schema";
import { PERIOD_LENGTH_MS } from "@/lib/billing/credits";

export type ClientRow = {
	ownerUserId: string;
	email: string;
	name: string | null;
	createdAt: Date;
	plan: "free" | "basic" | "basic_muse";
	planSeats: number; // base sub seats (channels)
	addonWorkspaceSeats: number;
	addonMemberSeats: number;
	workspaceCount: number;
	frozenWorkspaceCount: number;
	memberHeads: number; // distinct user IDs across owned workspaces
	creditsBalance: number;
	creditsConsumedThisPeriod: number;
	monthlyGrant: number;
	trialEndsAt: Date | null;
};

const PERIOD_MS = PERIOD_LENGTH_MS;

// Cross-tenant snapshot for the god-view. Walks every workspace owner
// and aggregates plan, add-ons, workspaces, members, and credits so the
// table can render in one render pass.
export async function loadAllClients(): Promise<ClientRow[]> {
	// 1. Every distinct owner with their identity columns.
	const owners = await db
		.selectDistinct({
			id: users.id,
			email: users.email,
			name: users.name,
			createdAt: users.createdAt,
		})
		.from(users)
		.innerJoin(workspaces, eq(workspaces.ownerUserId, users.id));

	if (owners.length === 0) return [];

	const ownerIds = owners.map((o) => o.id);

	// 2. Every subscription on every workspace owned by these users.
	const ownedWorkspaces = await db
		.select({
			id: workspaces.id,
			ownerUserId: workspaces.ownerUserId,
			frozenAt: workspaces.frozenAt,
			trialEndsAt: workspaces.trialEndsAt,
		})
		.from(workspaces)
		.where(inArray(workspaces.ownerUserId, ownerIds));

	const wsByOwner = new Map<string, typeof ownedWorkspaces>();
	for (const w of ownedWorkspaces) {
		const list = wsByOwner.get(w.ownerUserId) ?? [];
		list.push(w);
		wsByOwner.set(w.ownerUserId, list);
	}

	const wsIds = ownedWorkspaces.map((w) => w.id);
	const subRows =
		wsIds.length === 0
			? []
			: await db
					.select({
						workspaceId: subscriptions.workspaceId,
						productKey: subscriptions.productKey,
						seats: subscriptions.seats,
						status: subscriptions.status,
					})
					.from(subscriptions)
					.where(
						and(
							inArray(subscriptions.workspaceId, wsIds),
							inArray(subscriptions.status, ["active", "past_due"]),
						),
					);

	// 3. Member heads per owner — distinct userIds across all owned
	//    workspaces. One round-trip with grouping.
	const memberRows =
		wsIds.length === 0
			? []
			: await db
					.selectDistinct({
						workspaceId: workspaceMembers.workspaceId,
						memberUserId: workspaceMembers.userId,
					})
					.from(workspaceMembers)
					.where(inArray(workspaceMembers.workspaceId, wsIds));

	const memberHeadsByOwner = new Map<string, Set<string>>();
	const wsToOwner = new Map(ownedWorkspaces.map((w) => [w.id, w.ownerUserId]));
	for (const m of memberRows) {
		const owner = wsToOwner.get(m.workspaceId);
		if (!owner) continue;
		const set = memberHeadsByOwner.get(owner) ?? new Set<string>();
		set.add(m.memberUserId);
		memberHeadsByOwner.set(owner, set);
	}

	// 4. Credit balance + consumed-this-period per owner.
	const lastGrants = await db
		.select({
			ownerUserId: creditLedger.ownerUserId,
			createdAt: creditLedger.createdAt,
		})
		.from(creditLedger)
		.where(
			and(
				inArray(creditLedger.ownerUserId, ownerIds),
				eq(creditLedger.reason, "monthly_grant"),
			),
		)
		.orderBy(desc(creditLedger.createdAt));

	const latestGrant = new Map<string, Date>();
	for (const g of lastGrants) {
		if (!latestGrant.has(g.ownerUserId)) {
			latestGrant.set(g.ownerUserId, g.createdAt);
		}
	}

	const balanceByOwner = new Map<string, number>();
	const consumedByOwner = new Map<string, number>();
	const grantByOwner = new Map<string, number>();

	for (const ownerId of ownerIds) {
		const anchor = latestGrant.get(ownerId);
		if (!anchor) {
			balanceByOwner.set(ownerId, 0);
			consumedByOwner.set(ownerId, 0);
			grantByOwner.set(ownerId, 0);
			continue;
		}

		const [balanceRow] = await db
			.select({ total: sum(creditLedger.delta) })
			.from(creditLedger)
			.where(
				and(
					eq(creditLedger.ownerUserId, ownerId),
					gte(creditLedger.createdAt, anchor),
				),
			);
		balanceByOwner.set(ownerId, Number(balanceRow?.total ?? 0));

		const [consumedRow] = await db
			.select({ total: sum(creditLedger.delta) })
			.from(creditLedger)
			.where(
				and(
					eq(creditLedger.ownerUserId, ownerId),
					eq(creditLedger.reason, "consume"),
					gte(creditLedger.createdAt, anchor),
				),
			);
		consumedByOwner.set(
			ownerId,
			Math.abs(Number(consumedRow?.total ?? 0)),
		);

		const [grantRow] = await db
			.select({ total: sum(creditLedger.delta) })
			.from(creditLedger)
			.where(
				and(
					eq(creditLedger.ownerUserId, ownerId),
					eq(creditLedger.reason, "monthly_grant"),
					gte(creditLedger.createdAt, anchor),
				),
			);
		grantByOwner.set(ownerId, Number(grantRow?.total ?? 0));
	}

	// 5. Compose rows.
	const rows: ClientRow[] = owners.map((o) => {
		const myWs = wsByOwner.get(o.id) ?? [];
		const wsIds = myWs.map((w) => w.id);
		const mySubs = subRows.filter((s) => wsIds.includes(s.workspaceId));

		const baseSub = mySubs.find(
			(s) => s.productKey === "basic" || s.productKey === "bundle",
		);
		const plan: ClientRow["plan"] = !baseSub
			? "free"
			: baseSub.productKey === "bundle"
				? "basic_muse"
				: "basic";

		const addonWorkspaceSeats = mySubs
			.filter((s) => s.productKey === "workspace_addon")
			.reduce((n, s) => n + s.seats, 0);
		const addonMemberSeats = mySubs
			.filter((s) => s.productKey === "member_addon")
			.reduce((n, s) => n + s.seats, 0);

		const frozen = myWs.filter((w) => w.frozenAt).length;
		const earliestTrialEnd = myWs.reduce<Date | null>((acc, w) => {
			if (!w.trialEndsAt) return acc;
			if (!acc || w.trialEndsAt < acc) return w.trialEndsAt;
			return acc;
		}, null);

		return {
			ownerUserId: o.id,
			email: o.email,
			name: o.name,
			createdAt: o.createdAt,
			plan,
			planSeats: baseSub?.seats ?? 0,
			addonWorkspaceSeats,
			addonMemberSeats,
			workspaceCount: myWs.length,
			frozenWorkspaceCount: frozen,
			memberHeads: memberHeadsByOwner.get(o.id)?.size ?? 0,
			creditsBalance: balanceByOwner.get(o.id) ?? 0,
			creditsConsumedThisPeriod: consumedByOwner.get(o.id) ?? 0,
			monthlyGrant: grantByOwner.get(o.id) ?? 0,
			trialEndsAt: earliestTrialEnd,
		};
	});

	rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
	return rows;
}

export async function loadClientCount(): Promise<number> {
	const [row] = await db
		.select({ c: count(workspaces.ownerUserId) })
		.from(workspaces);
	return Number(row?.c ?? 0);
}

// Suppress unused-symbol warning when PERIOD_LENGTH_MS isn't actively used
// — keeps the import live so future logic that needs the window has it.
void PERIOD_MS;
