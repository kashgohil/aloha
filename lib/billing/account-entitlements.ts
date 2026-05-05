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
//   - "workspace_addon" seats grant the right to own additional
//     workspaces. Each new workspace buys its own channels independently;
//     no channels or members are bundled with the workspace add-on.
//   - "member_addon" seats are per-workspace today (account-pooled in a
//     later phase); each seat adds one member slot to that workspace's
//     allowance.

import { cache } from "react";
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
		included: number; // free slots (FREE_TIER / 0 for add-on tenants)
		paidSeats: number; // base sub seats on this workspace
		total: number;
		// `used` is supplied by the caller since "channels connected" lives
		// across multiple credential/account tables.
	};
};

// Account-level seat pool. One seat = one human, assignable to any number
// of workspaces the owner controls. Replaces the old per-workspace member
// quota: a teammate added to three of your workspaces still consumes
// exactly one seat.
export type AccountSeats = {
	included: number; // BASE_PLAN_MEMBERS_INCLUDED (paid) or FREE_TIER_MEMBERS
	addonSeats: number; // sum of member_addon seats across owned workspaces
	total: number;
	used: number; // distinct accepted member user IDs across all owned workspaces
	pendingInvites: number; // distinct pending-invite emails across owned workspaces
	consumed: number; // used + pendingInvites
	remaining: number;
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
	productKey:
		| "basic"
		| "bundle"
		| "workspace_addon"
		| "member_addon"
		| "credits_boost";
	status: "incomplete" | "active" | "past_due" | "canceled" | "revoked";
	seats: number;
};

// Per-request memoized: settings/billing, app/layout (via workspace-
// limits), and admin/_data all read this. Subscription rows mutate via
// Polar webhooks (separate request) so cross-request caching isn't
// useful; per-request dedup is always safe.
export const getAccountEntitlements = cache(_getAccountEntitlements);

async function _getAccountEntitlements(
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

	const ownerSubs = await loadOwnedSubscriptions(ws.ownerUserId);

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
	//   - Is an add-on tenant: 0 free (channels are bought independently).
	//   - Free tier primary: FREE_TIER_CHANNELS.
	const basePlanSeats = ownerSubs.rows
		.filter(
			(r) =>
				(r.productKey === "basic" || r.productKey === "bundle") &&
				r.workspaceId === workspaceId,
		)
		.reduce((sum, r) => sum + r.seats, 0);

	const channelsIncluded =
		hasBasePlan || hasAddonCoverage ? 0 : FREE_TIER_CHANNELS;

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
	};
}

// Account-level seat pool resolver. Sums member_addon seats across every
// workspace the owner controls and counts distinct human heads (members +
// pending invites by email) across the same set. One human in N workspaces
// still costs one seat.
export async function getAccountSeats(userId: string): Promise<AccountSeats> {
	const { workspaceIds, rows } = await loadOwnedSubscriptions(userId);

	const isPaid = rows.some(
		(r) => r.productKey === "basic" || r.productKey === "bundle",
	);
	const included = isPaid ? BASE_PLAN_MEMBERS_INCLUDED : FREE_TIER_MEMBERS;

	const addonSeats = rows
		.filter((r) => r.productKey === "member_addon")
		.reduce((sum, r) => sum + r.seats, 0);

	if (workspaceIds.length === 0) {
		const total = included + addonSeats;
		return {
			included,
			addonSeats,
			total,
			used: 0,
			pendingInvites: 0,
			consumed: 0,
			remaining: total,
		};
	}

	const memberRows = await db
		.selectDistinct({ userId: workspaceMembers.userId })
		.from(workspaceMembers)
		.where(inArray(workspaceMembers.workspaceId, workspaceIds));

	const inviteRows = await db
		.selectDistinct({ email: workspaceInvites.email })
		.from(workspaceInvites)
		.where(
			and(
				inArray(workspaceInvites.workspaceId, workspaceIds),
				isNull(workspaceInvites.acceptedAt),
				isNull(workspaceInvites.revokedAt),
				gt(workspaceInvites.expiresAt, new Date()),
			),
		);

	const used = memberRows.length;
	const pendingInvites = inviteRows.length;
	const consumed = used + pendingInvites;
	const total = included + addonSeats;

	return {
		included,
		addonSeats,
		total,
		used,
		pendingInvites,
		consumed,
		remaining: Math.max(0, total - consumed),
	};
}
