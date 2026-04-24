"use server";

import { and, eq, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { unstable_update } from "@/auth";
import { db } from "@/db";
import {
	subscriptions,
	users,
	workspaceMembers,
	workspaces,
} from "@/db/schema";
import { polar } from "@/lib/billing/polar";
import { reconcileOwnerQuota } from "@/lib/billing/quota-reconciler";
import { ROLES } from "@/lib/workspaces/roles";
import { assertRole } from "@/lib/workspaces/assert-role";

// Destructive: cancels Polar subscriptions attached to this workspace
// (best-effort), deletes the workspace row (FK cascade handles members,
// invites, posts, credentials, etc.), flips the user's active workspace
// to another one they're a member of, and reconciles quota so any
// overage workspace frozen by the old state unfreezes.
//
// Confirm flow: caller must POST `confirmName` matching the workspace
// name exactly. Mirrors GitHub's "type the name" pattern — prevents
// accidental clicks.
export async function deleteWorkspaceAction(formData: FormData) {
	const ctx = await assertRole(ROLES.OWNER);

	const confirmName = String(formData.get("confirmName") ?? "").trim();
	if (confirmName !== ctx.workspace.name) {
		throw new Error(
			`Confirmation didn't match. Type the workspace name exactly: ${ctx.workspace.name}`,
		);
	}

	const workspaceId = ctx.workspace.id;
	const ownerUserId = ctx.user.id;

	// Refuse to strand the user. Must have at least one other workspace
	// they're a member of (owned or invited-into). Onboarding re-creates
	// a workspace if the count hits zero, which is a much worse UX than
	// blocking the delete here.
	const otherMemberships = await db
		.select({ workspaceId: workspaceMembers.workspaceId })
		.from(workspaceMembers)
		.where(
			and(
				eq(workspaceMembers.userId, ownerUserId),
				ne(workspaceMembers.workspaceId, workspaceId),
			),
		)
		.limit(1);
	if (otherMemberships.length === 0) {
		throw new Error(
			"Can't delete your only workspace. Create another one first, then come back.",
		);
	}

	// Cancel any Polar subscriptions on this workspace (base + add-ons).
	// cancelAtPeriodEnd would leak value — immediate revoke is fair since
	// the owner is deliberately tearing the tenant down.
	const subs = await db
		.select({
			id: subscriptions.id,
			polarSubscriptionId: subscriptions.polarSubscriptionId,
			status: subscriptions.status,
		})
		.from(subscriptions)
		.where(eq(subscriptions.workspaceId, workspaceId));
	for (const s of subs) {
		if (s.status === "canceled" || s.status === "revoked") continue;
		try {
			await polar.subscriptions.revoke({ id: s.polarSubscriptionId });
		} catch (err) {
			// Webhook will eventually reconcile. Log and keep going — a
			// stuck Polar call shouldn't block the delete.
			console.error(
				`[workspace-delete] polar revoke failed for ${s.polarSubscriptionId}:`,
				err,
			);
		}
	}

	// Flip the user's active workspace before deleting, so no window
	// exists where activeWorkspaceId points at a dead row.
	const nextActive = otherMemberships[0].workspaceId;
	await db
		.update(users)
		.set({ activeWorkspaceId: nextActive, updatedAt: new Date() })
		.where(eq(users.id, ownerUserId));

	// Cascade handles: members, invites, posts, deliveries, credentials,
	// channels, subscriptions, everything workspace-scoped. Fast single
	// DELETE at the DB level.
	await db.delete(workspaces).where(eq(workspaces.id, workspaceId));

	// Quota may have loosened — unfreeze anything previously frozen.
	await reconcileOwnerQuota(ownerUserId);

	// Re-mint the JWT so activeWorkspaceId + role refresh on the next
	// request. Without this, the user would briefly see the old frozen
	// workspace state in their session.
	await unstable_update({ user: {} });

	revalidatePath("/app", "layout");
	redirect("/app/dashboard");
}
