// Account-pooled credits. Every AI generation deducts from a shared
// monthly bucket; period rollover is lazy (next consume after 30 days
// since the last grant inserts a fresh grant row). Top-ups stack on the
// current period and are subject to the same expiry.
//
// Tied to the trial / paid plan, NOT to the workspace:
//   - Trial active: TRIAL_MONTHLY_CREDITS (small starter taste)
//   - Paid (basic / basic_muse): BASIC_MONTHLY_CREDITS
//   - Trial expired without paid sub: 0 (no grant inserted)
//
// Balance = sum(delta) for rows >= the most recent monthly_grant.
// Period anchor = that grant row's createdAt; "next reset" = anchor + 30d.

import "server-only";
import { cache } from "react";
import { revalidatePath } from "next/cache";
import { and, desc, eq, gte, inArray, sum } from "drizzle-orm";

import { db } from "@/db";
import { creditLedger, subscriptions, workspaces } from "@/db/schema";
import { getCurrentContext } from "@/lib/current-context";
import { TRIAL_DAYS } from "./pricing";
import { getLogicalSubscription } from "./service";

export const TRIAL_MONTHLY_CREDITS = 100;
export const BASIC_MONTHLY_CREDITS = 500;
export const PERIOD_LENGTH_MS = 30 * 24 * 60 * 60 * 1000;

// Cost map. Keys are the same `feature` strings stamped on the consume
// row so the owner admin view can group spend cleanly.
export const CREDIT_COSTS = {
	"ai.refine": 1,
	"ai.tags": 1,
	"ai.altText": 1,
	"ai.hashtags": 1,
	"ai.draft": 5,
	"ai.richDraft": 5,
	"ai.improve": 3,
	"ai.scorePost": 2,
	"ai.image": 10,
} as const;

export type CreditFeature = keyof typeof CREDIT_COSTS;

export class InsufficientCreditsError extends Error {
	constructor(public readonly need: number, public readonly have: number) {
		super(
			`Out of credits — this action needs ${need}, you have ${have}. Upgrade or top up.`,
		);
		this.name = "InsufficientCreditsError";
	}
}

type Period = {
	monthlyGrant: number; // amount granted on each rollover
	anchor: Date | null; // start of current period; null = no grant yet
	periodEndsAt: Date | null; // anchor + 30d
	isPaid: boolean;
	trialActive: boolean;
};

// Computes the period shape for an owner: how many credits they get per
// month and whether the most recent grant is still in-window. Does NOT
// mutate — call ensurePeriodGrant for that.
async function resolvePeriod(ownerUserId: string): Promise<Period> {
	const sub = await getLogicalSubscription(ownerUserId);
	const isPaid = sub.plan !== "free";

	// Trial state lives on the owner's billing workspace (their primary).
	const [billing] = await db
		.select({ trialEndsAt: workspaces.trialEndsAt })
		.from(workspaces)
		.where(eq(workspaces.ownerUserId, ownerUserId))
		.orderBy(workspaces.createdAt)
		.limit(1);

	const now = Date.now();
	const trialActive = !!billing?.trialEndsAt && billing.trialEndsAt.getTime() > now;
	const monthlyGrant = isPaid
		? BASIC_MONTHLY_CREDITS
		: trialActive
			? TRIAL_MONTHLY_CREDITS
			: 0;

	const [lastGrant] = await db
		.select({ createdAt: creditLedger.createdAt })
		.from(creditLedger)
		.where(
			and(
				eq(creditLedger.ownerUserId, ownerUserId),
				eq(creditLedger.reason, "monthly_grant"),
			),
		)
		.orderBy(desc(creditLedger.createdAt))
		.limit(1);

	const anchor = lastGrant?.createdAt ?? null;
	const periodEndsAt = anchor ? new Date(anchor.getTime() + PERIOD_LENGTH_MS) : null;

	return { monthlyGrant, anchor, periodEndsAt, isPaid, trialActive };
}

// Inserts a grant row when the owner is in a fresh period (no grant yet
// or last grant was >= 30 days ago) and is entitled to one. No-op for
// expired-trial / unpaid accounts. Idempotent within a period.
export async function ensurePeriodGrant(ownerUserId: string): Promise<void> {
	const period = await resolvePeriod(ownerUserId);
	if (period.monthlyGrant === 0) return;

	const now = Date.now();
	const needsGrant =
		!period.anchor || now - period.anchor.getTime() >= PERIOD_LENGTH_MS;
	if (!needsGrant) return;

	await db.insert(creditLedger).values({
		ownerUserId,
		delta: period.monthlyGrant,
		reason: "monthly_grant",
	});
}

export type BoostState =
	| { active: false }
	| { active: true; cancelAtPeriodEnd: boolean; nextRenewal: Date | null };

export type CreditsSnapshot = {
	balance: number;
	monthlyGrant: number;
	periodEndsAt: Date | null;
	isPaid: boolean;
	trialActive: boolean;
	boost: BoostState;
};

async function resolveBoostState(ownerUserId: string): Promise<BoostState> {
	const owned = await db
		.select({ id: workspaces.id })
		.from(workspaces)
		.where(eq(workspaces.ownerUserId, ownerUserId));
	if (owned.length === 0) return { active: false };

	const [row] = await db
		.select({
			cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
			currentPeriodEnd: subscriptions.currentPeriodEnd,
		})
		.from(subscriptions)
		.where(
			and(
				inArray(
					subscriptions.workspaceId,
					owned.map((o) => o.id),
				),
				eq(subscriptions.productKey, "credits_boost"),
				inArray(subscriptions.status, ["active", "past_due"]),
			),
		)
		.limit(1);

	if (!row) return { active: false };
	return {
		active: true,
		cancelAtPeriodEnd: row.cancelAtPeriodEnd,
		nextRenewal: row.currentPeriodEnd,
	};
}

// Per-request memoized: layout + sidebar + billing page may all ask for
// the snapshot in one render. consumeCredits / chargeAi run in server
// actions (not RSC render), so the action path always sees fresh state.
// After a charge, revalidatePath("/app", "layout") (see actions/ai.ts)
// busts the layout render so the sidebar repaints with the new balance.
export const getCreditsSnapshot = cache(_getCreditsSnapshot);

async function _getCreditsSnapshot(
	ownerUserId: string,
): Promise<CreditsSnapshot> {
	await ensurePeriodGrant(ownerUserId);
	const [period, boost] = await Promise.all([
		resolvePeriod(ownerUserId),
		resolveBoostState(ownerUserId),
	]);

	if (!period.anchor) {
		return {
			balance: 0,
			monthlyGrant: period.monthlyGrant,
			periodEndsAt: null,
			isPaid: period.isPaid,
			trialActive: period.trialActive,
			boost,
		};
	}

	const [row] = await db
		.select({ total: sum(creditLedger.delta) })
		.from(creditLedger)
		.where(
			and(
				eq(creditLedger.ownerUserId, ownerUserId),
				gte(creditLedger.createdAt, period.anchor),
			),
		);

	const balance = Number(row?.total ?? 0);
	return {
		balance,
		monthlyGrant: period.monthlyGrant,
		periodEndsAt: period.periodEndsAt,
		isPaid: period.isPaid,
		trialActive: period.trialActive,
		boost,
	};
}

// Lighter helper for callers that only need the integer.
export async function getBalance(ownerUserId: string): Promise<number> {
	const snap = await getCreditsSnapshot(ownerUserId);
	return snap.balance;
}

// Deducts the cost for a feature from the owner's balance. Throws
// InsufficientCreditsError when the balance can't cover it. Caller
// supplies the workspace the action originated in so admin views can
// attribute spend later.
export async function consumeCredits(
	ownerUserId: string,
	feature: CreditFeature,
	workspaceId: string | null,
): Promise<{ balance: number; cost: number }> {
	const cost = CREDIT_COSTS[feature];
	if (cost == null) {
		throw new Error(`Unknown credit feature: ${feature}`);
	}

	// Read latest balance (also triggers a lazy grant if the period rolled).
	const snap = await getCreditsSnapshot(ownerUserId);
	if (snap.balance < cost) {
		throw new InsufficientCreditsError(cost, snap.balance);
	}

	await db.insert(creditLedger).values({
		ownerUserId,
		delta: -cost,
		reason: "consume",
		feature,
		workspaceId,
	});

	return { balance: snap.balance - cost, cost };
}

// Ergonomic wrapper for AI server actions: resolves ctx and routes the
// charge to the workspace owner's pool. Use at the top of any server
// action that calls a paid AI feature.
//
// Also busts the layout render cache so the sidebar credit pill repaints
// with the new balance on the next navigation. Done here (not at every
// callsite) so new AI actions inherit the behavior automatically.
export async function chargeAi(feature: CreditFeature): Promise<void> {
	const ctx = await getCurrentContext();
	if (!ctx) throw new Error("Unauthorized");
	await consumeCredits(ctx.workspace.ownerUserId, feature, ctx.workspace.id);
	revalidatePath("/app", "layout");
}

// Idempotent grant. Called from Polar webhooks (order.paid for top-ups,
// subscription.* for boost renewals). The `idempotencyKey` is a string
// derived by the caller — order ID for top-ups, subscription period
// fingerprint for boost — and we look for an existing ledger row tagged
// with it under `feature` to avoid double-granting on retries.
export async function grantTopUp(
	ownerUserId: string,
	amount: number,
	idempotencyKey?: string,
): Promise<{ granted: boolean }> {
	if (amount <= 0) throw new Error("Top-up must be positive.");

	if (idempotencyKey) {
		const [existing] = await db
			.select({ id: creditLedger.id })
			.from(creditLedger)
			.where(
				and(
					eq(creditLedger.ownerUserId, ownerUserId),
					eq(creditLedger.reason, "topup"),
					eq(creditLedger.feature, idempotencyKey),
				),
			)
			.limit(1);
		if (existing) return { granted: false };
	}

	await db.insert(creditLedger).values({
		ownerUserId,
		delta: amount,
		reason: "topup",
		feature: idempotencyKey ?? null,
	});
	return { granted: true };
}

// Idempotent boost grant. Same shape as grantTopUp but reasons it as a
// "monthly_grant" so balance math (sum since last grant) treats the
// boost as part of the period. The webhook calls this on each renewal.
export async function grantBoostForPeriod(
	ownerUserId: string,
	amount: number,
	periodFingerprint: string,
): Promise<{ granted: boolean }> {
	if (amount <= 0) throw new Error("Boost must be positive.");

	const [existing] = await db
		.select({ id: creditLedger.id })
		.from(creditLedger)
		.where(
			and(
				eq(creditLedger.ownerUserId, ownerUserId),
				eq(creditLedger.reason, "topup"),
				eq(creditLedger.feature, periodFingerprint),
			),
		)
		.limit(1);
	if (existing) return { granted: false };

	await db.insert(creditLedger).values({
		ownerUserId,
		delta: amount,
		// Reasoned as topup so it stacks within the current period rather
		// than resetting balance; periodFingerprint stays in `feature` for
		// idempotency + auditability.
		reason: "topup",
		feature: periodFingerprint,
	});
	return { granted: true };
}

// Days in the period; useful for UI banners that don't want to leak the
// 30-day constant. Re-exported in case product wants to tweak it.
export { TRIAL_DAYS };
