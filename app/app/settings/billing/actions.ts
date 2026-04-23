"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, notInArray } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { accounts, users } from "@/db/schema";
import { AUTH_ONLY_PROVIDERS } from "@/lib/auth-providers";
import {
	cancelSubscription,
	createCheckout,
	resumeSubscription,
	setBillingInterval,
	setMuseEnabled,
	syncChannelQuantity,
} from "@/lib/billing/service";
import { requireContext } from "@/lib/current-context";

async function requireUserId(): Promise<string> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error("Unauthorized");
	}
	return session.user.id;
}

async function currentChannelCount(userId: string): Promise<number> {
	const [userRow] = await db
		.select({ workspaceId: users.activeWorkspaceId })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);
	if (!userRow?.workspaceId) return 0;
	const rows = await db
		.select({ provider: accounts.provider })
		.from(accounts)
		.where(
			and(
				eq(accounts.workspaceId, userRow.workspaceId),
				notInArray(accounts.provider, AUTH_ONLY_PROVIDERS),
			),
		);
	return rows.length;
}

export async function startCheckout(formData: FormData) {
	const userId = await requireUserId();

	const __ctx = await requireContext();

	const workspaceId = __ctx.workspace.id;
	const plan = (formData.get("plan") as "basic" | "bundle") ?? "basic";
	const interval = (formData.get("interval") as "month" | "year") ?? "month";
	const channelsRaw = Number(formData.get("channels") ?? 0);
	const fallback = await currentChannelCount(userId);
	const channels = Math.max(1, channelsRaw || fallback || 1);

	const { url } = await createCheckout({ userId, plan, interval, channels });
	redirect(url);
}

export async function toggleMuse(formData: FormData) {
	const userId = await requireUserId();

	const __ctx = await requireContext();

	const workspaceId = __ctx.workspace.id;
	const enable = formData.get("enable") === "1";
	await setMuseEnabled(userId, enable);
	revalidatePath("/app/settings/billing");
}

export async function updateChannels(formData: FormData) {
	const userId = await requireUserId();

	const __ctx = await requireContext();

	const workspaceId = __ctx.workspace.id;
	const channels = Math.max(1, Number(formData.get("channels") ?? 1));
	await syncChannelQuantity(userId, channels);
	revalidatePath("/app/settings/billing");
}

export async function cancelMyPlan() {
	const userId = await requireUserId();

	const __ctx = await requireContext();

	const workspaceId = __ctx.workspace.id;
	await cancelSubscription(userId);
	revalidatePath("/app/settings/billing");
}

export async function resumeMyPlan() {
	const userId = await requireUserId();

	const __ctx = await requireContext();

	const workspaceId = __ctx.workspace.id;
	await resumeSubscription(userId);
	revalidatePath("/app/settings/billing");
}

// Applies a reviewed change after the user confirms the inline preview.
// Accepts optional interval, Muse, and channel count fields — only
// whichever section initiated the review fills in its dimension. Order:
// interval → Muse → seats, so product migrations land before the quantity
// charge uses the freshly-migrated pricing.
export async function applyChange(formData: FormData) {
	const userId = await requireUserId();

	const __ctx = await requireContext();

	const workspaceId = __ctx.workspace.id;
	const channels = Math.max(1, Number(formData.get("channels") ?? 1));
	const wantMuse = formData.get("muse") === "1";
	const intervalRaw = formData.get("interval");
	const interval =
		intervalRaw === "month" || intervalRaw === "year" ? intervalRaw : null;

	if (interval) {
		await setBillingInterval(userId, interval);
	}
	await setMuseEnabled(userId, wantMuse);
	await syncChannelQuantity(userId, channels);

	revalidatePath("/app/settings/billing");
	redirect("/app/settings/billing?success=1");
}
