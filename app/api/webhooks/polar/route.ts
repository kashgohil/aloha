import { NextRequest, NextResponse } from "next/server";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import { captureException } from "@/lib/logger";
import { env } from "@/lib/env";
import { upsertSubscriptionFromPolar } from "@/lib/billing/service";

export async function POST(req: NextRequest) {
	if (!env.POLAR_WEBHOOK_SECRET) {
		return new NextResponse("Webhook secret not configured", { status: 500 });
	}

	const body = await req.text();
	const headers: Record<string, string> = {};
	req.headers.forEach((value, key) => {
		headers[key] = value;
	});

	let event;
	try {
		event = validateEvent(body, headers, env.POLAR_WEBHOOK_SECRET);
	} catch (err) {
		if (err instanceof WebhookVerificationError) {
			return new NextResponse("Invalid signature", { status: 401 });
		}
		console.error("[polar.webhook] parse failed", err);
		return new NextResponse("Invalid payload", { status: 400 });
	}

	try {
		switch (event.type) {
			case "subscription.created":
			case "subscription.updated":
			case "subscription.canceled":
			case "subscription.revoked":
			case "subscription.past_due": {
				const s = event.data;
				console.log(`[polar.webhook] ${event.type}`, {
					id: s.id,
					productId: s.productId,
					status: s.status,
					seats: (s as { seats?: number | null }).seats,
					externalCustomerId: (s.customer as { externalId?: string | null } | null)?.externalId,
					metadata: s.metadata,
				});
				await upsertSubscriptionFromPolar({
					id: s.id,
					productId: s.productId,
					status: s.status,
					seats: (s as { seats?: number | null }).seats ?? null,
					currentPeriodEnd: s.currentPeriodEnd ?? null,
					cancelAtPeriodEnd: s.cancelAtPeriodEnd ?? null,
					externalCustomerId:
						(s.customer as { externalId?: string | null } | null)?.externalId ?? null,
					metadata: (s.metadata ?? null) as Record<string, unknown> | null,
				});
				console.log(`[polar.webhook] ${event.type} written to DB`);
				break;
			}
			case "order.paid":
			case "checkout.updated":
				// Acknowledge — subscription.* covers the entitlement state we care about.
				break;
			default:
				// Ignore other event types we didn't subscribe to.
				break;
		}
	} catch (err) {
		await captureException(err, {
			tags: { source: "polar.webhook", eventType: event.type },
		});
		console.error(`[polar.webhook] handler failed for ${event.type}`, err);
		return new NextResponse("Handler error", { status: 500 });
	}

	return NextResponse.json({ ok: true });
}
