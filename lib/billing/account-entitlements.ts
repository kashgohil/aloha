// Unified entitlement resolver. Aggregates every subscription row across
// every workspace a user owns and projects it down to:
//   - account-level quotas (workspace count)
//   - per-workspace quotas (channel count, member count)
//
// This is the single source of truth the gating layer reads from. UI
// affordances, server-action guards, and downgrade soft-caps all go
// through here instead of poking the subscriptions table directly.
//
// Model:
//   - Base plan ("basic" / "bundle") lives on a specific workspace and
//     provides channel seats for that workspace.
//   - "workspace_addon" seats live on any workspace the owner owns
//     (typically the primary billing workspace). Each seat:
//       * grants permission to own one extra workspace, AND
//       * implicitly adds +3 channels and +3 member slots to any one
//         add-on workspace (see applyAddonBundling below).
//   - "member_addon" seats are per-workspace; each seat adds one member
//     slot to that workspace's allowance.

import { and, eq, gt, inArray, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import {
	subscriptions,
	workspaceInvites,
	workspaceMembers,
	workspaces,
} from "@/db/schema";
import {
	BASE_PLAN_MEMBERS_INCLUDED,
	BASE_PLAN_WORKSPACES_INCLUDED,
	FREE_TIER_CHANNELS,
	WORKSPACE_ADDON_CHANNELS_INCLUDED,
	WORKSPACE_ADDON_MEMBERS_INCLUDED,
} from "./pricing";

const FREE_TIER_MEMBERS = 3;

export type AccountEntitlements = {
	userId: string;
	plan: "free" | "basic" | "basic_muse";
	museEnabled: boolean;
	isPaid: boolean;
	workspaces: {
		included: number; // 1 always
		addonSeats: number; // sum of active workspace_addon seats
		total: number; // included + addonSeats
		used: number; // owned workspace count
		remaining: number;
	};
};

export type WorkspaceQuota = {
	workspaceId: string;
	isOwnerPaid: boolean;
	hasBasePlan: boolean; // this workspace has its own basic/bundle sub
	hasAddonCoverage: boolean; // owner has workspace_addon seats
	channels: {
		included: number; // free slots (FREE_TIER / addon bundling / 0)
		paidSeats: number; // base sub seats on this workspace
		total: number;
		// `used` is supplied by the caller since "channels connected" lives
		// across multiple credential/account tables.
	};
	members: {
		included: number; // free-tier or base-plan included slots
		addonSeats: number; // member_addon seats on this workspace
		total: number;
		members: number; // accepted memberships only
		pendingInvites: number; // non-expired, non-revoked invites
		used: number; // members + pendingInvites
		remaining: number;
	};
};

// Fetches every subscription row on every workspace the user owns. Used
// to derive both account-level and per-workspace entitlements in one
// round-trip.
async function loadOwnedSubscriptions(userId: string) {
	const owned = await db
		.select({ id: workspaces.id })
		.from(workspaces)
		.where(eq(workspaces.ownerUserId, userId));
	if (owned.length === 0) {
		return { workspaceIds: [] as string[], rows: [] as Array<SubRow> };
	}
	const workspaceIds = owned.map((r) => r.id);
	const rows = await db
		.select({
			id: subscriptions.id,
			workspaceId: subscriptions.workspaceId,
			productKey: subscriptions.productKey,
			status: subscriptions.status,
			seats: subscriptions.seats,
		})
		.from(subscriptions)
		.where(
			and(
				inArray(subscriptions.workspaceId, workspaceIds),
				or(
					eq(subscriptions.status, "active"),
					eq(subscriptions.status, "past_due"),
				),
			),
		);
	return { workspaceIds, rows };
}

type SubRow = {
	id: string;
	workspaceId: string;
	productKey: "basic" | "bundle" | "workspace_addon" | "member_addon";
	status: "incomplete" | "active" | "past_due" | "canceled" | "revoked";
	seats: number;
};

export async function getAccountEntitlements(
	userId: string,
): Promise<AccountEntitlements> {
	const { workspaceIds, rows } = await loadOwnedSubscriptions(userId);

	const basePlanRow = rows.find(
		(r) => r.productKey === "basic" || r.productKey === "bundle",
	);
	const isPaid = !!basePlanRow;
	const plan: AccountEntitlements["plan"] = !basePlanRow
		? "free"
		: basePlanRow.productKey === "bundle"
			? "basic_muse"
			: "basic";

	const addonSeats = rows
		.filter((r) => r.productKey === "workspace_addon")
		.reduce((sum, r) => sum + r.seats, 0);

	const included = BASE_PLAN_WORKSPACES_INCLUDED;
	const total = included + addonSeats;
	const used = workspaceIds.length;

	return {
		userId,
		plan,
		museEnabled: plan === "basic_muse",
		isPaid,
		workspaces: {
			included,
			addonSeats,
			total,
			used,
			remaining: Math.max(0, total - used),
		},
	};
}

// Computes the per-workspace quota for channels and members. Channel
// usage counting spans credential + accounts tables and is deliberately
// left to the caller — this function returns allowances only.
export async function getWorkspaceQuota(
	workspaceId: string,
): Promise<WorkspaceQuota> {
	const [ws] = await db
		.select({ ownerUserId: workspaces.ownerUserId })
		.from(workspaces)
		.where(eq(workspaces.id, workspaceId))
		.limit(1);
	if (!ws) {
		throw new Error(`Workspace ${workspaceId} not found`);
	}

	const [ownerSubs, memberCount, pendingCount] = await Promise.all([
		loadOwnedSubscriptions(ws.ownerUserId),
		db
			.select({ userId: workspaceMembers.userId })
			.from(workspaceMembers)
			.where(eq(workspaceMembers.workspaceId, workspaceId))
			.then((rows) => rows.length),
		db
			.select({ id: workspaceInvites.id })
			.from(workspaceInvites)
			.where(
				and(
					eq(workspaceInvites.workspaceId, workspaceId),
					isNull(workspaceInvites.acceptedAt),
					isNull(workspaceInvites.revokedAt),
					gt(workspaceInvites.expiresAt, new Date()),
				),
			)
			.then((rows) => rows.length),
	]);

	const isOwnerPaid = ownerSubs.rows.some(
		(r) => r.productKey === "basic" || r.productKey === "bundle",
	);
	const hasBasePlan = ownerSubs.rows.some(
		(r) =>
			(r.productKey === "basic" || r.productKey === "bundle") &&
			r.workspaceId === workspaceId,
	);
	const totalAddonSeats = ownerSubs.rows
		.filter((r) => r.productKey === "workspace_addon")
		.reduce((sum, r) => sum + r.seats, 0);
	const hasAddonCoverage = totalAddonSeats > 0;

	// Channel included allowance per workspace:
	//   - Has its own base sub: 0 free (seats carry total channels).
	//   - Is an add-on workspace (owner has workspace_addon seats,
	//     this workspace is not the primary): 3 free from the add-on.
	//   - Free tier primary: FREE_TIER_CHANNELS.
	// Note: `paidSeats` is the base sub's seat count on THIS workspace.
	const basePlanSeats = ownerSubs.rows
		.filter(
			(r) =>
				(r.productKey === "basic" || r.productKey === "bundle") &&
				r.workspaceId === workspaceId,
		)
		.reduce((sum, r) => sum + r.seats, 0);

	let channelsIncluded: number;
	if (hasBasePlan) {
		// Seats already carry the full allowance.
		channelsIncluded = 0;
	} else if (hasAddonCoverage) {
		channelsIncluded = WORKSPACE_ADDON_CHANNELS_INCLUDED;
	} else {
		channelsIncluded = FREE_TIER_CHANNELS;
	}

	// Member included allowance per workspace:
	//   - This workspace has base plan: BASE_PLAN_MEMBERS_INCLUDED (5).
	//   - Add-on covered: WORKSPACE_ADDON_MEMBERS_INCLUDED (3).
	//   - Free tier: FREE_TIER_MEMBERS (3).
	const membersIncluded = hasBasePlan
		? BASE_PLAN_MEMBERS_INCLUDED
		: hasAddonCoverage
			? WORKSPACE_ADDON_MEMBERS_INCLUDED
			: FREE_TIER_MEMBERS;

	const memberAddonSeats = ownerSubs.rows
		.filter(
			(r) =>
				r.productKey === "member_addon" &&
				r.workspaceId === workspaceId,
		)
		.reduce((sum, r) => sum + r.seats, 0);

	const memberTotal = membersIncluded + memberAddonSeats;
	const memberUsed = memberCount + pendingCount;

	return {
		workspaceId,
		isOwnerPaid,
		hasBasePlan,
		hasAddonCoverage,
		channels: {
			included: channelsIncluded,
			paidSeats: basePlanSeats,
			total: channelsIncluded + basePlanSeats,
		},
		members: {
			included: membersIncluded,
			addonSeats: memberAddonSeats,
			total: memberTotal,
			members: memberCount,
			pendingInvites: pendingCount,
			used: memberUsed,
			remaining: Math.max(0, memberTotal - memberUsed),
		},
	};
}
