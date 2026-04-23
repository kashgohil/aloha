// Free-tier caps on workspace ownership and membership.
//
// Rules:
//   - A user on the free tier (no active/past_due subscription on any
//     workspace they own) can own at most ONE workspace.
//   - A workspace whose owner is on the free tier can have at most THREE
//     members total. "Members" here counts accepted memberships plus
//     pending (non-expired, non-revoked) invites — so race conditions
//     where five invites all accept at once can't slip past the cap.
//
// A workspace is considered "paid" if its owner has at least one Polar
// subscription in active or past_due state on any workspace they own.
// Billing is per-workspace, so one paid sub elsewhere doesn't elevate
// another free workspace's caps — we key off the owner's profile so an
// owner paying for workspace A can create workspace B without hitting
// the cap-at-1 rule.

import { and, eq, gt, inArray, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import {
	subscriptions,
	workspaceInvites,
	workspaceMembers,
	workspaces,
} from "@/db/schema";

export const FREE_TIER_MAX_OWNED_WORKSPACES = 1;
export const FREE_TIER_MAX_MEMBERS = 3;

export type WorkspaceCreationEntitlement = {
	allowed: boolean;
	ownedCount: number;
	limit: number;
	isPaid: boolean;
	reason?: string;
};

export type WorkspaceMemberEntitlement = {
	allowed: boolean;
	current: number; // members + pending invites
	members: number;
	pendingInvites: number;
	limit: number; // Infinity for paid plans
	isPaid: boolean;
	reason?: string;
};

// True if the user owns at least one workspace with an active or past_due
// subscription. past_due counts — we want to keep them entitled while
// Polar's dunning flow runs, not cliff them off the product.
async function isUserOnPaidPlan(userId: string): Promise<boolean> {
	const ownedIds = (
		await db
			.select({ id: workspaces.id })
			.from(workspaces)
			.where(eq(workspaces.ownerUserId, userId))
	).map((r) => r.id);
	if (ownedIds.length === 0) return false;

	const [row] = await db
		.select({ id: subscriptions.id })
		.from(subscriptions)
		.where(
			and(
				inArray(subscriptions.workspaceId, ownedIds),
				or(
					eq(subscriptions.status, "active"),
					eq(subscriptions.status, "past_due"),
				),
			),
		)
		.limit(1);
	return !!row;
}

export async function getWorkspaceCreationEntitlement(
	userId: string,
): Promise<WorkspaceCreationEntitlement> {
	const [ownedCount, isPaid] = await Promise.all([
		db
			.select({ id: workspaces.id })
			.from(workspaces)
			.where(eq(workspaces.ownerUserId, userId))
			.then((rows) => rows.length),
		isUserOnPaidPlan(userId),
	]);

	if (isPaid) {
		return {
			allowed: true,
			ownedCount,
			limit: Number.POSITIVE_INFINITY,
			isPaid: true,
		};
	}

	const allowed = ownedCount < FREE_TIER_MAX_OWNED_WORKSPACES;
	return {
		allowed,
		ownedCount,
		limit: FREE_TIER_MAX_OWNED_WORKSPACES,
		isPaid: false,
		reason: allowed
			? undefined
			: `Free plan is limited to ${FREE_TIER_MAX_OWNED_WORKSPACES} workspace. Upgrade to add more.`,
	};
}

export async function getWorkspaceMemberEntitlement(
	workspaceId: string,
): Promise<WorkspaceMemberEntitlement> {
	const [ws] = await db
		.select({ ownerUserId: workspaces.ownerUserId })
		.from(workspaces)
		.where(eq(workspaces.id, workspaceId))
		.limit(1);
	if (!ws) {
		return {
			allowed: false,
			current: 0,
			members: 0,
			pendingInvites: 0,
			limit: 0,
			isPaid: false,
			reason: "Workspace not found.",
		};
	}

	const isPaid = await isUserOnPaidPlan(ws.ownerUserId);

	const [members, pending] = await Promise.all([
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

	const current = members + pending;

	if (isPaid) {
		return {
			allowed: true,
			current,
			members,
			pendingInvites: pending,
			limit: Number.POSITIVE_INFINITY,
			isPaid: true,
		};
	}

	const allowed = current < FREE_TIER_MAX_MEMBERS;
	return {
		allowed,
		current,
		members,
		pendingInvites: pending,
		limit: FREE_TIER_MAX_MEMBERS,
		isPaid: false,
		reason: allowed
			? undefined
			: `Free plan is limited to ${FREE_TIER_MAX_MEMBERS} members per workspace. Upgrade to add more.`,
	};
}
