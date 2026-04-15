import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { createCheckout } from "@/lib/billing/service";
import { env } from "@/lib/env";

const checkoutSchema = z.object({
	plan: z.enum(["basic", "bundle"]),
	interval: z.enum(["month", "year"]),
	channels: z.coerce.number().int().min(1).max(1000),
});

// Accepts both POST (from form submissions) and GET (from <a href="...">
// CTAs) so the marketing pricing page can deep-link directly into checkout.
async function handle(req: NextRequest, params: URLSearchParams) {
	const session = await auth();
	if (!session?.user?.id) {
		const next = `/api/billing/checkout?${params.toString()}`;
		return NextResponse.redirect(
			new URL(`/auth/signup?next=${encodeURIComponent(next)}`, env.APP_URL),
		);
	}

	const parsed = checkoutSchema.safeParse({
		plan: params.get("plan"),
		interval: params.get("interval"),
		channels: params.get("channels"),
	});
	if (!parsed.success) {
		return NextResponse.json(
			{ error: "Invalid checkout parameters", details: parsed.error.flatten() },
			{ status: 400 },
		);
	}

	try {
		const { url } = await createCheckout({
			userId: session.user.id,
			plan: parsed.data.plan,
			interval: parsed.data.interval,
			channels: parsed.data.channels,
		});
		return NextResponse.redirect(url, { status: 303 });
	} catch (err) {
		console.error("[checkout] failed", err);
		return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
	}
}

export async function GET(req: NextRequest) {
	return handle(req, new URL(req.url).searchParams);
}

export async function POST(req: NextRequest) {
	const form = await req.formData();
	const params = new URLSearchParams();
	for (const [k, v] of form.entries()) params.set(k, String(v));
	return handle(req, params);
}
