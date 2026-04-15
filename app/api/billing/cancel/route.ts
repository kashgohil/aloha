import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { cancelSubscription } from "@/lib/billing/service";
import { env } from "@/lib/env";

export async function POST() {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.redirect(new URL("/auth/signin", env.APP_URL));
	}

	try {
		await cancelSubscription(session.user.id);
	} catch (err) {
		console.error("[billing.cancel] failed", err);
		return NextResponse.json({ error: "Cancel failed" }, { status: 500 });
	}

	return NextResponse.redirect(
		new URL("/app/settings/billing?canceled=1", env.APP_URL),
		{ status: 303 },
	);
}
