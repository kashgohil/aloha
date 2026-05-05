// BillingService: one Polar subscription per user, on either the "basic"
// or "bundle" (Basic+Muse) product. Toggling Muse is a product migration
// via polar.subscriptions.update — no second checkout.

import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions, users, workspaces } from "@/db/schema";
import { polar } from "./polar";
import {
	productId,
	productSlot,
	type Interval,
	type ProductKey,
	type SubscriptionProductKey,
} from "./products";
import { env } from "@/lib/env";

// Resolves the billing workspace for a given user. Billing rides on the
// user's active workspace — `polarCustomerId` moved from `users` to
// `workspaces` in Slice 2.7, so every call that previously hit
// `users.polarCustomerId` now goes through here.
// Per-request memoized — getLogicalSubscription, listInvoices,
// createCustomerPortalUrl, and createCheckout each call this. One render
// can fan out to several of them (settings/billing) so dedup matters.
const loadBillingWorkspace = cache(
	async (
		userId: string,
	): Promise<{
		workspaceId: string;
		polarCustomerId: string | null;
	} | null> => {
		const [row] = await db
			.select({
				workspaceId: workspaces.id,
				polarCustomerId: workspaces.polarCustomerId,
			})
			.from(users)
			.innerJoin(workspaces, eq(workspaces.id, users.activeWorkspaceId))
			.where(eq(users.id, userId))
			.limit(1);
		return row ?? null;
	},
);

export type LogicalSubscription = {
	plan: "free" | "basic" | "basic_muse";
	museEnabled: boolean;
	channels: number;
	interval: Interval | null;
	currentPeriodEnd: Date | null;
	cancelAtPeriodEnd: boolean;
	polarSubscriptionId: string | null;
	// Raw status for UI treatments that care about past_due vs active.
	status: "active" | "past_due" | null;
	pastDue: boolean;
};

// Per-request memoized: 22 indirect callsites (trial, credits, account-
// entitlements, syncChannelQuantity, setMuseEnabled, setBillingInterval,
// cancelSubscription, resumeSubscription). Plan changes go through
// upsertSubscriptionFromPolar in a webhook (separate request), so cross-
// request invalidation isn't needed; the next page load sees fresh state.
export const getLogicalSubscription = cache(_getLogicalSubscription);

async function _getLogicalSubscription(
	userId: string,
): Promise<LogicalSubscription> {
	const ws = await loadBillingWorkspace(userId);
	const rows = ws
		? await db
				.select()
				.from(subscriptions)
				.where(eq(subscriptions.workspaceId, ws.workspaceId))
		: [];

	// Only the base plan row represents the "logical subscription". Add-on
	// rows (workspace_addon, member_addon) live alongside but are surfaced
	// through getAccountEntitlements, not here.
	const active = rows.find(
		(r) =>
			(r.productKey === "basic" || r.productKey === "bundle") &&
			(r.status === "active" || r.status === "past_due"),
	);

	if (!active) {
		return {
			plan: "free",
			museEnabled: false,
			channels: 0,
			interval: null,
			currentPeriodEnd: null,
			cancelAtPeriodEnd: false,
			polarSubscriptionId: null,
			status: null,
			pastDue: false,
		};
	}

	const status = active.status === "past_due" ? "past_due" : "active";
	return {
		plan: active.productKey === "bundle" ? "basic_muse" : "basic",
		museEnabled: active.productKey === "bundle",
		channels: active.seats,
		interval: active.interval,
		currentPeriodEnd: active.currentPeriodEnd,
		cancelAtPeriodEnd: active.cancelAtPeriodEnd,
		polarSubscriptionId: active.polarSubscriptionId,
		status,
		pastDue: status === "past_due",
	};
}

// Creates a signed Polar customer portal URL the user can visit briefly
// to update their payment method. This is the only hand-off to Polar's
// hosted UI — required because card entry must be PCI-compliant.
export async function createCustomerPortalUrl(userId: string): Promise<string | null> {
	const ws = await loadBillingWorkspace(userId);
	if (!ws?.polarCustomerId) return null;

	const session = await polar.customerSessions.create({
		customerId: ws.polarCustomerId,
	});
	return session.customerPortalUrl;
}

export async function createCheckout(args: {
	userId: string;
	plan: ProductKey;
	interval: Interval;
	channels: number;
}) {
	const [user] = await db
		.select({
			id: users.id,
			email: users.email,
			name: users.name,
		})
		.from(users)
		.where(eq(users.id, args.userId))
		.limit(1);
	if (!user) throw new Error("User not found");
	const ws = await loadBillingWorkspace(user.id);
	if (!ws) throw new Error("User has no active workspace for billing");

	const seats = Math.max(1, args.channels);
	const slot = productSlot(args.plan, args.interval);
	const checkout = await polar.checkouts.create({
		products: [productId(slot)],
		seats,
		// Polar identifies the customer by externalCustomerId. We key on
		// workspaceId now that billing is tenant-scoped; the webhook reads
		// it back via `internal_workspace_id` metadata too (belt & braces).
		externalCustomerId: ws.workspaceId,
		customerEmail: user.email,
		customerName: user.name ?? undefined,
		successUrl: `${env.APP_URL}/app/settings/billing?success=1`,
		metadata: {
			internal_workspace_id: ws.workspaceId,
			internal_user_id: user.id,
			plan: args.plan,
			interval: args.interval,
		},
	});

	return { url: checkout.url };
}

export async function syncChannelQuantity(userId: string, channels: number) {
	const sub = await getLogicalSubscription(userId);
	if (!sub.polarSubscriptionId) return;

	const seats = Math.max(1, channels);
	await polar.subscriptions.update({
		id: sub.polarSubscriptionId,
		subscriptionUpdate: { seats },
	});

	await db
		.update(subscriptions)
		.set({ seats, updatedAt: new Date() })
		.where(eq(subscriptions.polarSubscriptionId, sub.polarSubscriptionId));
}

// Migrate the active subscription to the bundle product (adds Muse) or
// back to the basic product (removes Muse). Polar handles proration.
export async function setMuseEnabled(userId: string, enabled: boolean) {
	const sub = await getLogicalSubscription(userId);
	if (!sub.polarSubscriptionId || !sub.interval) {
		throw new Error("No active subscription to modify");
	}
	if (sub.museEnabled === enabled) return;

	const targetKey: ProductKey = enabled ? "bundle" : "basic";
	const targetSlot = productSlot(targetKey, sub.interval);

	await polar.subscriptions.update({
		id: sub.polarSubscriptionId,
		subscriptionUpdate: { productId: productId(targetSlot) },
	});
	// Webhook subscription.updated will reconcile the DB row.
}

// Flip the billing interval (monthly ↔ yearly). Same mechanism as Muse
// toggle — migrates to a different product ID while keeping seats.
export async function setBillingInterval(userId: string, nextInterval: Interval) {
	const sub = await getLogicalSubscription(userId);
	if (!sub.polarSubscriptionId || !sub.interval) {
		throw new Error("No active subscription to modify");
	}
	if (sub.interval === nextInterval) return;

	const currentKey: ProductKey = sub.museEnabled ? "bundle" : "basic";
	const targetSlot = productSlot(currentKey, nextInterval);

	await polar.subscriptions.update({
		id: sub.polarSubscriptionId,
		subscriptionUpdate: { productId: productId(targetSlot) },
	});
}

// Cancel at period end — user keeps paid features until currentPeriodEnd,
// then drops to the free tier. Use .update with SubscriptionCancel rather
// than .revoke (which would terminate access immediately).
export async function cancelSubscription(userId: string) {
	const sub = await getLogicalSubscription(userId);
	if (!sub.polarSubscriptionId) return;
	await polar.subscriptions.update({
		id: sub.polarSubscriptionId,
		subscriptionUpdate: { cancelAtPeriodEnd: true },
	});
}

// Undo a pending cancellation — the subscription renews normally again.
// Only meaningful while cancelAtPeriodEnd=true; no-op after the period ends.
export async function resumeSubscription(userId: string) {
	const sub = await getLogicalSubscription(userId);
	if (!sub.polarSubscriptionId) return;
	await polar.subscriptions.update({
		id: sub.polarSubscriptionId,
		subscriptionUpdate: { cancelAtPeriodEnd: false },
	});
}

export type InvoiceRow = {
	id: string;
	createdAt: Date;
	invoiceNumber: string;
	totalAmount: number; // cents
	currency: string;
	status: string; // paid | refunded | partially_refunded | pending
};

// Fetches the user's billing history. Returns newest-first. Invoice PDF
// download goes through /api/billing/invoice/[id] since Polar only
// exposes the URL via a separate API call.
export async function listInvoices(userId: string, limit = 12): Promise<InvoiceRow[]> {
	const ws = await loadBillingWorkspace(userId);
	if (!ws?.polarCustomerId) return [];

	const page = await polar.orders.list({
		customerId: ws.polarCustomerId,
		limit,
	});
	const rows: InvoiceRow[] = [];
	for await (const p of page) {
		for (const o of p.result.items ?? []) {
			rows.push({
				id: o.id,
				createdAt: o.createdAt,
				invoiceNumber: o.invoiceNumber,
				totalAmount: o.totalAmount,
				currency: o.currency,
				status: o.status,
			});
		}
		break; // first page only — `limit` already caps it
	}
	return rows;
}

export async function getInvoiceUrl(userId: string, orderId: string): Promise<string | null> {
	const ws = await loadBillingWorkspace(userId);
	if (!ws?.polarCustomerId) return null;

	const invoice = await polar.orders.invoice({ id: orderId });
	return invoice?.url ?? null;
}

// Idempotent upsert from a Polar subscription payload. Called by the
// webhook handler on subscription.created/updated/canceled/revoked/past_due.
export async function upsertSubscriptionFromPolar(payload: {
	id: string;
	productId: string;
	status: string;
	seats?: number | null;
	currentPeriodEnd?: Date | null;
	cancelAtPeriodEnd?: boolean | null;
	externalCustomerId?: string | null;
	// Polar's customer id (distinct from our internal ids). Stamped on
	// `workspaces.polarCustomerId` so portal/invoice lookups can find
	// the right customer without asking Polar.
	polarCustomerId?: string | null;
	metadata?: Record<string, unknown> | null;
}) {
	// Identity resolution has three possible shapes, in order of preference:
	//   1. New subs carry `internal_workspace_id` metadata and externalCustomerId = workspace.id
	//   2. Legacy subs carry `internal_user_id` metadata and externalCustomerId = user.id
	//   3. Old rows may only have externalCustomerId (pre-metadata).
	const metadataWorkspaceId =
		(payload.metadata?.internal_workspace_id as string | undefined) ??
		undefined;
	const metadataUserId =
		(payload.metadata?.internal_user_id as string | undefined) ?? undefined;
	const externalId = payload.externalCustomerId ?? undefined;

	let workspaceId: string | null = metadataWorkspaceId ?? null;
	let userId: string | null = metadataUserId ?? null;

	// If we still have gaps, try resolving externalId as either id.
	if (!workspaceId && externalId) {
		const [ws] = await db
			.select({ id: workspaces.id, ownerUserId: workspaces.ownerUserId })
			.from(workspaces)
			.where(eq(workspaces.id, externalId))
			.limit(1);
		if (ws) {
			workspaceId = ws.id;
			if (!userId) userId = ws.ownerUserId;
		}
	}
	if (!workspaceId && externalId) {
		// Legacy path: externalCustomerId was user.id.
		const [u] = await db
			.select({ id: users.id, workspaceId: users.activeWorkspaceId })
			.from(users)
			.where(eq(users.id, externalId))
			.limit(1);
		if (u) {
			userId = userId ?? u.id;
			workspaceId = u.workspaceId ?? null;
		}
	}

	if (!userId && workspaceId) {
		const [ws] = await db
			.select({ ownerUserId: workspaces.ownerUserId })
			.from(workspaces)
			.where(eq(workspaces.id, workspaceId))
			.limit(1);
		userId = ws?.ownerUserId ?? null;
	}

	if (!userId || !workspaceId) {
		throw new Error(
			`Polar subscription ${payload.id} could not be resolved to a user + workspace (externalCustomerId=${externalId ?? "null"}).`,
		);
	}

	const productKey = productKeyFromPolarProductId(payload.productId);
	const interval = intervalFromPolarProductId(payload.productId);
	if (!productKey || !interval) {
		throw new Error(
			`Unknown Polar product ${payload.productId} on subscription ${payload.id}`,
		);
	}

	const status = mapPolarStatus(payload.status);

	const existing = await db
		.select()
		.from(subscriptions)
		.where(eq(subscriptions.polarSubscriptionId, payload.id))
		.limit(1);

	const values = {
		createdByUserId: userId,
		workspaceId,
		polarSubscriptionId: payload.id,
		productKey,
		status,
		interval,
		seats: payload.seats ?? 1,
		currentPeriodEnd: payload.currentPeriodEnd ?? null,
		cancelAtPeriodEnd: payload.cancelAtPeriodEnd ?? false,
		updatedAt: new Date(),
	};

	if (existing.length > 0) {
		await db
			.update(subscriptions)
			.set(values)
			.where(eq(subscriptions.polarSubscriptionId, payload.id));
	} else {
		await db.insert(subscriptions).values(values);
	}

	// Stamp polarCustomerId on the workspace the first time we see it, so
	// portal / invoice lookups don't need to round-trip to Polar.
	if (payload.polarCustomerId) {
		await db
			.update(workspaces)
			.set({ polarCustomerId: payload.polarCustomerId, updatedAt: new Date() })
			.where(eq(workspaces.id, workspaceId));
	}

	// Workspace add-on changes (seat count, cancellation) can flip the
	// owner's quota below their current usage. Run the reconciler so any
	// overage workspaces freeze and any newly-in-quota ones unfreeze.
	if (productKey === "workspace_addon") {
		const { reconcileOwnerQuota } = await import("./quota-reconciler");
		await reconcileOwnerQuota(userId);
	}
}

function productKeyFromPolarProductId(
	id: string,
): SubscriptionProductKey | null {
	if (id === env.POLAR_PRODUCT_BASIC_MONTH || id === env.POLAR_PRODUCT_BASIC_YEAR) {
		return "basic";
	}
	if (id === env.POLAR_PRODUCT_BUNDLE_MONTH || id === env.POLAR_PRODUCT_BUNDLE_YEAR) {
		return "bundle";
	}
	if (
		id === env.POLAR_PRODUCT_WORKSPACE_ADDON_MONTH ||
		id === env.POLAR_PRODUCT_WORKSPACE_ADDON_YEAR
	) {
		return "workspace_addon";
	}
	if (
		id === env.POLAR_PRODUCT_MEMBER_ADDON_MONTH ||
		id === env.POLAR_PRODUCT_MEMBER_ADDON_YEAR
	) {
		return "member_addon";
	}
	if (
		id === env.POLAR_PRODUCT_CREDITS_BOOST_MONTH ||
		id === env.POLAR_PRODUCT_CREDITS_BOOST_YEAR
	) {
		return "credits_boost";
	}
	// credits_topup is intentionally not handled here — it's a one-off
	// order, not a subscription. The webhook handles order.paid separately.
	return null;
}

function intervalFromPolarProductId(id: string): Interval | null {
	if (
		id === env.POLAR_PRODUCT_BASIC_MONTH ||
		id === env.POLAR_PRODUCT_BUNDLE_MONTH ||
		id === env.POLAR_PRODUCT_WORKSPACE_ADDON_MONTH ||
		id === env.POLAR_PRODUCT_MEMBER_ADDON_MONTH ||
		id === env.POLAR_PRODUCT_CREDITS_BOOST_MONTH
	) {
		return "month";
	}
	if (
		id === env.POLAR_PRODUCT_BASIC_YEAR ||
		id === env.POLAR_PRODUCT_BUNDLE_YEAR ||
		id === env.POLAR_PRODUCT_WORKSPACE_ADDON_YEAR ||
		id === env.POLAR_PRODUCT_MEMBER_ADDON_YEAR ||
		id === env.POLAR_PRODUCT_CREDITS_BOOST_YEAR
	) {
		return "year";
	}
	return null;
}

function mapPolarStatus(
	status: string,
): "incomplete" | "active" | "past_due" | "canceled" | "revoked" {
	switch (status) {
		case "active":
		case "trialing":
			return "active";
		case "past_due":
			return "past_due";
		case "canceled":
			return "canceled";
		case "revoked":
		case "unpaid":
			return "revoked";
		default:
			return "incomplete";
	}
}
