"use server";

import { revalidatePath } from "next/cache";
import { ROLES } from "@/lib/workspaces/roles";
import { assertRole } from "@/lib/workspaces/assert-role";
import {
	addMemberAddonSeats,
	addWorkspaceAddonSeats,
	purchaseCreditTopUp,
	removeMemberAddonSeats,
	removeWorkspaceAddonSeats,
	startCreditBoost,
	stopCreditBoost,
	type AddonPurchaseResult,
} from "@/lib/billing/addons";

// All four actions require ADMIN on the active workspace. Owners pay,
// admins can adjust seat counts — matches existing billing UX where
// admins can flip Muse on/off or change channel seat counts.

export async function buyWorkspaceSeats(count: number): Promise<AddonPurchaseResult> {
	const ctx = await assertRole(ROLES.ADMIN);
	if (!Number.isInteger(count) || count < 1) {
		throw new Error("Count must be a positive integer.");
	}
	const result = await addWorkspaceAddonSeats(ctx.user.id, count);
	revalidatePath("/app/settings/billing");
	revalidatePath("/app", "layout");
	return result;
}

export async function releaseWorkspaceSeats(
	count: number,
): Promise<{ seats: number; canceledAtPeriodEnd: boolean }> {
	const ctx = await assertRole(ROLES.ADMIN);
	if (!Number.isInteger(count) || count < 1) {
		throw new Error("Count must be a positive integer.");
	}
	const result = await removeWorkspaceAddonSeats(ctx.user.id, count);
	revalidatePath("/app/settings/billing");
	revalidatePath("/app", "layout");
	return result;
}

export async function buyMemberSeats(count: number): Promise<AddonPurchaseResult> {
	const ctx = await assertRole(ROLES.ADMIN);
	if (!Number.isInteger(count) || count < 1) {
		throw new Error("Count must be a positive integer.");
	}
	// Seats are account-pooled — always purchased against the owner's
	// billing workspace, regardless of the active tenant.
	const result = await addMemberAddonSeats(ctx.workspace.ownerUserId, count);
	revalidatePath("/app/settings/billing");
	revalidatePath("/app/settings/members");
	return result;
}

export async function releaseMemberSeats(
	count: number,
): Promise<{ seats: number; canceledAtPeriodEnd: boolean }> {
	const ctx = await assertRole(ROLES.ADMIN);
	if (!Number.isInteger(count) || count < 1) {
		throw new Error("Count must be a positive integer.");
	}
	const result = await removeMemberAddonSeats(ctx.workspace.ownerUserId, count);
	revalidatePath("/app/settings/billing");
	revalidatePath("/app/settings/members");
	return result;
}

// ---------- Credit boost (recurring monthly) ------------------------------

export async function startCreditBoostAction(): Promise<AddonPurchaseResult> {
	const ctx = await assertRole(ROLES.ADMIN);
	const result = await startCreditBoost(ctx.workspace.ownerUserId);
	revalidatePath("/app/settings/billing");
	revalidatePath("/app", "layout");
	return result;
}

export async function stopCreditBoostAction(): Promise<
	| { canceledAtPeriodEnd: true }
	| { canceledAtPeriodEnd: false; reason: string }
> {
	const ctx = await assertRole(ROLES.ADMIN);
	const result = await stopCreditBoost(ctx.workspace.ownerUserId);
	revalidatePath("/app/settings/billing");
	revalidatePath("/app", "layout");
	return result;
}

// ---------- Credit top-up (one-off) --------------------------------------

export async function purchaseCreditTopUpAction(): Promise<{ url: string }> {
	const ctx = await assertRole(ROLES.ADMIN);
	return purchaseCreditTopUp(ctx.workspace.ownerUserId);
}
