// Trial state resolver. Every workspace gets a 30-day Basic trial at
// creation; after expiry it drops to view-only unless the owner has
// an active paid subscription. Callers gate publish + AI generation
// through `canPublish` rather than re-deriving the date math.

import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { workspaces } from "@/db/schema";
import { getCurrentContext } from "@/lib/current-context";
import { getLogicalSubscription } from "./service";

export type TrialState = {
	// True while trialEndsAt is in the future.
	active: boolean;
	// True when the trial window has closed AND there is no paid sub.
	expired: boolean;
	endsAt: Date | null;
	// Whole days remaining (0 once expired). Useful for the banner.
	daysRemaining: number;
};

// Per-request memoized — layout banner + canPublish gates may both read
// it. Trial expiry is time-driven, not action-driven, so cross-request
// caching isn't useful and per-request dedupe is always safe.
export const getTrialState = cache(_getTrialState);

async function _getTrialState(
	workspaceId: string,
	ownerUserId: string,
): Promise<TrialState> {
	const [ws] = await db
		.select({ trialEndsAt: workspaces.trialEndsAt })
		.from(workspaces)
		.where(eq(workspaces.id, workspaceId))
		.limit(1);

	const sub = await getLogicalSubscription(ownerUserId);
	const isPaid = sub.plan !== "free";

	const endsAt = ws?.trialEndsAt ?? null;
	const now = Date.now();
	const active = !!endsAt && endsAt.getTime() > now;
	const expired = !isPaid && !active;
	const daysRemaining = active
		? Math.max(0, Math.ceil((endsAt!.getTime() - now) / (24 * 60 * 60 * 1000)))
		: 0;

	return { active, expired, endsAt, daysRemaining };
}

// Single gate every publish + AI generation entry point should call.
// Returns false when the workspace is expired-trial without a paid sub.
export async function canPublish(
	workspaceId: string,
	ownerUserId: string,
): Promise<boolean> {
	const sub = await getLogicalSubscription(ownerUserId);
	if (sub.plan !== "free") return true;

	const state = await getTrialState(workspaceId, ownerUserId);
	return state.active;
}

export class TrialExpiredError extends Error {
	constructor(message = "Trial ended — upgrade to continue.") {
		super(message);
		this.name = "TrialExpiredError";
	}
}

// Server-action guard. Throws TrialExpiredError when the active workspace
// has expired without a paid sub. Resolves the active workspace from the
// caller's request context so callers don't need to thread IDs around.
export async function requireCanPublish(
	workspaceId: string,
	ownerUserId: string,
): Promise<void> {
	const ok = await canPublish(workspaceId, ownerUserId);
	if (!ok) {
		throw new TrialExpiredError(
			"Trial ended — upgrade to publish or generate content.",
		);
	}
}

// Ergonomic variant that resolves the active workspace from the request
// context. Use at the top of server actions that don't already have ctx.
export async function requireCanPublishForCurrentContext(): Promise<void> {
	const ctx = await getCurrentContext();
	if (!ctx) throw new Error("Unauthorized");
	await requireCanPublish(ctx.workspace.id, ctx.workspace.ownerUserId);
}
