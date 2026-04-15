"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import {
	cancelSubscription,
	createCheckout,
	setMuseEnabled,
	syncChannelQuantity,
} from "@/lib/billing/service";

async function requireUserId(): Promise<string> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error("Unauthorized");
	}
	return session.user.id;
}

async function currentChannelCount(userId: string): Promise<number> {
	const rows = await db
		.select({ provider: accounts.provider })
		.from(accounts)
		.where(eq(accounts.userId, userId));
	return rows.length;
}

export async function startCheckout(formData: FormData) {
	const userId = await requireUserId();
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
	const enable = formData.get("enable") === "1";
	await setMuseEnabled(userId, enable);
	revalidatePath("/app/settings/billing");
}

export async function updateChannels(formData: FormData) {
	const userId = await requireUserId();
	const channels = Math.max(1, Number(formData.get("channels") ?? 1));
	await syncChannelQuantity(userId, channels);
	revalidatePath("/app/settings/billing");
}

export async function cancelMyPlan() {
	const userId = await requireUserId();
	await cancelSubscription(userId);
	revalidatePath("/app/settings/billing");
}

// Applies a combined change (Muse toggle + channel count) after the user
// has reviewed the proration preview on /app/settings/billing/confirm.
// Runs Muse toggle first (migrates product), then seats (quantity) so
// the seat charge uses the freshly-migrated product's pricing.
export async function applyChange(formData: FormData) {
	const userId = await requireUserId();
	const channels = Math.max(1, Number(formData.get("channels") ?? 1));
	const wantMuse = formData.get("muse") === "1";

	await setMuseEnabled(userId, wantMuse);
	await syncChannelQuantity(userId, channels);

	revalidatePath("/app/settings/billing");
	redirect("/app/settings/billing?success=1");
}
