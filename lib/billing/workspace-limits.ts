// Thin gating façade over getAccountEntitlements + getWorkspaceQuota.
// Server-action guards and UI affordances call these to get an
// allow/deny + reason string without re-deriving the arithmetic.
//
// See lib/billing/account-entitlements.ts for the actual subscription
// aggregation. This module just projects the quota into the
// allow/deny shape the caller needs.

import {
	getAccountEntitlements,
	getWorkspaceQuota,
} from "./account-entitlements";

export type WorkspaceCreationEntitlement = {
	allowed: boolean;
	ownedCount: number;
	limit: number; // Infinity when add-on seats are effectively unbounded
	isPaid: boolean;
	reason?: string;
};

export type WorkspaceMemberEntitlement = {
	allowed: boolean;
	current: number; // members + pending invites
	members: number;
	pendingInvites: number;
	limit: number;
	isPaid: boolean;
	reason?: string;
};

export async function getWorkspaceCreationEntitlement(
	userId: string,
): Promise<WorkspaceCreationEntitlement> {
	const ent = await getAccountEntitlements(userId);
	const { workspaces } = ent;
	const allowed = workspaces.used < workspaces.total;

	let reason: string | undefined;
	if (!allowed) {
		reason = ent.isPaid
			? `You've used all ${workspaces.total} workspace${workspaces.total === 1 ? "" : "s"} included on your plan. Add more workspaces from billing.`
			: `Free plan is limited to ${workspaces.total} workspace. Upgrade to add more.`;
	}

	return {
		allowed,
		ownedCount: workspaces.used,
		limit: workspaces.total,
		isPaid: ent.isPaid,
		reason,
	};
}

export async function getWorkspaceMemberEntitlement(
	workspaceId: string,
): Promise<WorkspaceMemberEntitlement> {
	const quota = await getWorkspaceQuota(workspaceId);
	const allowed = quota.members.remaining > 0;

	let reason: string | undefined;
	if (!allowed) {
		reason = quota.isOwnerPaid
			? `This workspace is at its ${quota.members.total}-member cap. Add seats from billing to invite more.`
			: `Free plan is limited to ${quota.members.total} members per workspace. Upgrade to add more.`;
	}

	return {
		allowed,
		current: quota.members.used,
		members: quota.members.members,
		pendingInvites: quota.members.pendingInvites,
		limit: quota.members.total,
		isPaid: quota.isOwnerPaid,
		reason,
	};
}
