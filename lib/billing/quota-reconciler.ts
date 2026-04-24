// Quota reconciler — brings workspace freeze state in line with the
// owner's current add-on entitlements.
//
// Called whenever the owner's entitlement could change:
//   - subscription.updated / canceled / revoked webhooks
//   - direct seat mutations (addWorkspaceAddonSeats / removeWorkspaceAddonSeats)
//   - workspace delete (frees a slot, may unfreeze another)
//
// Freeze policy: if the owner has `used > total` workspaces, freeze the
// `used - total` most-recently-created ones. The primary/billing
// workspace (oldest) always stays live so the account remains usable.
// If usage fits within quota, unfreeze anything still marked.

import { and, desc, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/db";
import { users, workspaces } from "@/db/schema";
import { createNotification } from "@/lib/notifications";
import { sendEmail } from "@/lib/email/send";
import { workspaceFrozenEmail } from "@/lib/email/templates/workspace-frozen";
import { captureException } from "@/lib/logger";
import { getAccountEntitlements } from "./account-entitlements";

export async function reconcileOwnerQuota(userId: string): Promise<{
	frozen: string[];
	unfrozen: string[];
}> {
	const ent = await getAccountEntitlements(userId);
	const { total, used } = ent.workspaces;

	const owned = await db
		.select({
			id: workspaces.id,
			frozenAt: workspaces.frozenAt,
		})
		.from(workspaces)
		.where(eq(workspaces.ownerUserId, userId))
		.orderBy(desc(workspaces.createdAt));

	// Usage fits quota: unfreeze anything still frozen for this owner.
	if (used <= total) {
		const stillFrozen = owned.filter((w) => w.frozenAt).map((w) => w.id);
		if (stillFrozen.length > 0) {
			await db
				.update(workspaces)
				.set({ frozenAt: null, updatedAt: new Date() })
				.where(
					and(
						inArray(workspaces.id, stillFrozen),
						isNotNull(workspaces.frozenAt),
					),
				);
		}
		return { frozen: [], unfrozen: stillFrozen };
	}

	const overage = used - total;
	// Freeze the N most recent. Oldest (primary) stays live.
	const targets = owned.slice(0, overage);
	const keepers = owned.slice(overage);

	const toFreeze = targets
		.filter((w) => !w.frozenAt)
		.map((w) => w.id);
	const toUnfreeze = keepers
		.filter((w) => w.frozenAt)
		.map((w) => w.id);

	const now = new Date();
	if (toFreeze.length > 0) {
		await db
			.update(workspaces)
			.set({ frozenAt: now, updatedAt: now })
			.where(
				and(inArray(workspaces.id, toFreeze), isNull(workspaces.frozenAt)),
			);
		// Fire-and-forget notification + email to the owner. Failures
		// don't block the freeze transition — the UI banner is the
		// real authoritative surface; email/notification are additive.
		await notifyOwnerFrozen(userId, toFreeze);
	}
	if (toUnfreeze.length > 0) {
		await db
			.update(workspaces)
			.set({ frozenAt: null, updatedAt: now })
			.where(inArray(workspaces.id, toUnfreeze));
	}

	return { frozen: toFreeze, unfrozen: toUnfreeze };
}

async function notifyOwnerFrozen(userId: string, frozenIds: string[]) {
	try {
		const [owner] = await db
			.select({ email: users.email, name: users.name })
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);
		if (!owner) return;

		const frozenRows = await db
			.select({ id: workspaces.id, name: workspaces.name })
			.from(workspaces)
			.where(inArray(workspaces.id, frozenIds));

		for (const ws of frozenRows) {
			await createNotification({
				userId,
				kind: "workspace_frozen",
				title: `${ws.name} is paused`,
				body: "Over your workspace seat allowance. Add a seat or remove another workspace to resume.",
				url: "/app/settings/billing#workspaces",
				metadata: { workspaceId: ws.id, workspaceName: ws.name },
			});

			const tpl = workspaceFrozenEmail({ workspaceName: ws.name });
			await sendEmail({
				to: owner.email,
				subject: tpl.subject,
				html: tpl.html,
				text: tpl.text,
			});
		}
	} catch (err) {
		await captureException(err, {
			tags: { source: "billing.quota-reconciler" },
			extra: { userId, frozenIds: frozenIds.join(",") },
		});
		console.error(
			"[quota-reconciler] owner-frozen notification failed:",
			err,
		);
	}
}

// Convenience: reconcile for the owner of a specific workspace. Used by
// the webhook handler, which gets a subscription update keyed to a
// workspace id rather than an owner id.
export async function reconcileOwnerOfWorkspace(
	workspaceId: string,
): Promise<void> {
	const [row] = await db
		.select({ ownerUserId: workspaces.ownerUserId })
		.from(workspaces)
		.where(eq(workspaces.id, workspaceId))
		.limit(1);
	if (!row) return;
	await reconcileOwnerQuota(row.ownerUserId);
}
