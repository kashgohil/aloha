// Add-on subscription mutations: workspace_addon and member_addon.
//
// Both follow the same shape:
//   - First purchase → create a Polar checkout; webhook reconciles on return.
//   - Seat bump → polar.subscriptions.update({ seats }) directly, no checkout.
//   - Seat removal → same update path; dropping to zero cancels at period end.
//
// Interval is inherited from the owner's base plan. A user on a yearly
// base plan buys the yearly add-on variant so everything renews together.
// Users without a base plan can't buy add-ons; the mutation throws.

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions, users, workspaces } from "@/db/schema";
import { polar } from "./polar";
import {
	productId,
	productSlot,
	type Interval,
	type ProductKey,
} from "./products";
import { reconcileOwnerQuota } from "./quota-reconciler";
import { env } from "@/lib/env";

// Locate the owner's billing workspace (their primary — where base plan
// lives). Workspace add-on subscriptions also anchor here by convention.
async function loadBillingContext(userId: string) {
	const [row] = await db
		.select({
			userId: users.id,
			email: users.email,
			name: users.name,
			workspaceId: workspaces.id,
			workspaceName: workspaces.name,
			polarCustomerId: workspaces.polarCustomerId,
		})
		.from(users)
		.innerJoin(workspaces, eq(workspaces.id, users.activeWorkspaceId))
		.where(eq(users.id, userId))
		.limit(1);
	return row ?? null;
}

// Returns the interval on the owner's active base subscription. Add-ons
// always match that interval so renewals line up.
async function resolveBaseInterval(userId: string): Promise<Interval | null> {
	const owned = await db
		.select({ id: workspaces.id })
		.from(workspaces)
		.where(eq(workspaces.ownerUserId, userId));
	if (owned.length === 0) return null;
	const [row] = await db
		.select({ interval: subscriptions.interval })
		.from(subscriptions)
		.where(
			and(
				inArray(
					subscriptions.workspaceId,
					owned.map((o) => o.id),
				),
				inArray(subscriptions.productKey, ["basic", "bundle"]),
				inArray(subscriptions.status, ["active", "past_due"]),
			),
		)
		.limit(1);
	return row?.interval ?? null;
}

// Finds an existing active/past_due add-on subscription of the given
// productKey on the given workspace. Returns null if none exists —
// caller should spin up a checkout in that case.
async function findAddonSub(workspaceId: string, productKey: ProductKey) {
	const [row] = await db
		.select({
			id: subscriptions.id,
			polarSubscriptionId: subscriptions.polarSubscriptionId,
			seats: subscriptions.seats,
		})
		.from(subscriptions)
		.where(
			and(
				eq(subscriptions.workspaceId, workspaceId),
				eq(subscriptions.productKey, productKey),
				inArray(subscriptions.status, ["active", "past_due"]),
			),
		)
		.limit(1);
	return row ?? null;
}

export type AddonPurchaseResult =
	| { kind: "updated"; seats: number }
	| { kind: "checkout"; url: string };

// ---------- Workspace add-on ---------------------------------------------

// Adds `count` workspace-addon seats for the owner. Seats live on the
// billing workspace (primary). First purchase returns a Polar checkout
// URL; subsequent buys bump the seat quantity directly and return
// `{ kind: "updated" }`.
export async function addWorkspaceAddonSeats(
	userId: string,
	count: number,
): Promise<AddonPurchaseResult> {
	if (count < 1) throw new Error("Must add at least one seat.");
	const ctx = await loadBillingContext(userId);
	if (!ctx) throw new Error("No billing workspace for user.");
	const interval = await resolveBaseInterval(userId);
	if (!interval) {
		throw new Error("A paid base plan is required before buying add-ons.");
	}

	const existing = await findAddonSub(ctx.workspaceId, "workspace_addon");
	if (existing) {
		const nextSeats = existing.seats + count;
		await polar.subscriptions.update({
			id: existing.polarSubscriptionId,
			subscriptionUpdate: { seats: nextSeats },
		});
		await db
			.update(subscriptions)
			.set({ seats: nextSeats, updatedAt: new Date() })
			.where(eq(subscriptions.id, existing.id));
		// Seat count grew — unfreeze any workspace that was over cap.
		await reconcileOwnerQuota(userId);
		return { kind: "updated", seats: nextSeats };
	}

	const slot = productSlot("workspace_addon", interval);
	const checkout = await polar.checkouts.create({
		products: [productId(slot)],
		seats: count,
		externalCustomerId: ctx.workspaceId,
		customerEmail: ctx.email,
		customerName: ctx.name ?? undefined,
		successUrl: `${env.APP_URL}/app/settings/billing?addon=workspace&success=1`,
		metadata: {
			internal_workspace_id: ctx.workspaceId,
			internal_user_id: ctx.userId,
			addon: "workspace_addon",
			interval,
		},
	});
	return { kind: "checkout", url: checkout.url };
}

// Decrements `count` seats. Cancels at period end if the result is 0.
// Returns the resulting seat count (0 if canceled).
export async function removeWorkspaceAddonSeats(
	userId: string,
	count: number,
): Promise<{ seats: number; canceledAtPeriodEnd: boolean }> {
	if (count < 1) throw new Error("Must remove at least one seat.");
	const ctx = await loadBillingContext(userId);
	if (!ctx) throw new Error("No billing workspace for user.");
	const existing = await findAddonSub(ctx.workspaceId, "workspace_addon");
	if (!existing) throw new Error("No workspace add-on subscription to modify.");

	const nextSeats = Math.max(0, existing.seats - count);

	if (nextSeats === 0) {
		await polar.subscriptions.update({
			id: existing.polarSubscriptionId,
			subscriptionUpdate: { cancelAtPeriodEnd: true },
		});
		await db
			.update(subscriptions)
			.set({ cancelAtPeriodEnd: true, updatedAt: new Date() })
			.where(eq(subscriptions.id, existing.id));
		// cancelAtPeriodEnd keeps the row active until period end — no
		// need to reconcile yet. The revoked webhook will freeze overage
		// when the period actually ends.
		return { seats: existing.seats, canceledAtPeriodEnd: true };
	}

	await polar.subscriptions.update({
		id: existing.polarSubscriptionId,
		subscriptionUpdate: { seats: nextSeats },
	});
	await db
		.update(subscriptions)
		.set({ seats: nextSeats, updatedAt: new Date() })
		.where(eq(subscriptions.id, existing.id));
	// Seat count just dropped — reconcile so overage workspaces freeze
	// immediately instead of waiting for the next webhook round-trip.
	await reconcileOwnerQuota(userId);
	return { seats: nextSeats, canceledAtPeriodEnd: false };
}

// ---------- Member add-on (per-workspace) ---------------------------------

// Adds `count` member-addon seats on a specific workspace. Caller must
// have already authorized (role check at the server action layer).
export async function addMemberAddonSeats(
	userId: string,
	workspaceId: string,
	count: number,
): Promise<AddonPurchaseResult> {
	if (count < 1) throw new Error("Must add at least one seat.");
	const ctx = await loadBillingContext(userId);
	if (!ctx) throw new Error("No billing workspace for user.");
	const interval = await resolveBaseInterval(userId);
	if (!interval) {
		throw new Error("A paid base plan is required before buying add-ons.");
	}

	const existing = await findAddonSub(workspaceId, "member_addon");
	if (existing) {
		const nextSeats = existing.seats + count;
		await polar.subscriptions.update({
			id: existing.polarSubscriptionId,
			subscriptionUpdate: { seats: nextSeats },
		});
		await db
			.update(subscriptions)
			.set({ seats: nextSeats, updatedAt: new Date() })
			.where(eq(subscriptions.id, existing.id));
		return { kind: "updated", seats: nextSeats };
	}

	const slot = productSlot("member_addon", interval);
	const checkout = await polar.checkouts.create({
		products: [productId(slot)],
		seats: count,
		// member_addon is scoped to the target workspace — stamp it so
		// the webhook reconciler writes the row against the right one.
		externalCustomerId: ctx.workspaceId,
		customerEmail: ctx.email,
		customerName: ctx.name ?? undefined,
		successUrl: `${env.APP_URL}/app/settings/billing?addon=member&success=1`,
		metadata: {
			internal_workspace_id: workspaceId,
			internal_user_id: ctx.userId,
			addon: "member_addon",
			interval,
		},
	});
	return { kind: "checkout", url: checkout.url };
}

export async function removeMemberAddonSeats(
	userId: string,
	workspaceId: string,
	count: number,
): Promise<{ seats: number; canceledAtPeriodEnd: boolean }> {
	if (count < 1) throw new Error("Must remove at least one seat.");
	const existing = await findAddonSub(workspaceId, "member_addon");
	if (!existing) throw new Error("No member add-on subscription to modify.");

	// Ownership check: caller's context must match the target workspace's
	// owner. This prevents an admin in workspace A from yanking seats off
	// workspace B via a crafted payload.
	const [ws] = await db
		.select({ ownerUserId: workspaces.ownerUserId })
		.from(workspaces)
		.where(eq(workspaces.id, workspaceId))
		.limit(1);
	if (!ws) throw new Error("Workspace not found.");

	const nextSeats = Math.max(0, existing.seats - count);

	if (nextSeats === 0) {
		await polar.subscriptions.update({
			id: existing.polarSubscriptionId,
			subscriptionUpdate: { cancelAtPeriodEnd: true },
		});
		await db
			.update(subscriptions)
			.set({ cancelAtPeriodEnd: true, updatedAt: new Date() })
			.where(eq(subscriptions.id, existing.id));
		return { seats: existing.seats, canceledAtPeriodEnd: true };
	}

	await polar.subscriptions.update({
		id: existing.polarSubscriptionId,
		subscriptionUpdate: { seats: nextSeats },
	});
	await db
		.update(subscriptions)
		.set({ seats: nextSeats, updatedAt: new Date() })
		.where(eq(subscriptions.id, existing.id));
	return { seats: nextSeats, canceledAtPeriodEnd: false };
}
