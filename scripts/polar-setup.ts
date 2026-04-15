// One-shot, idempotent setup of Polar products and the webhook endpoint.
// Run with: `bun run scripts/polar-setup.ts`
//
// What it does:
//   1. Looks up existing products by name and skips ones that exist.
//   2. Creates the 4 products (Basic monthly/yearly, Muse monthly/yearly)
//      with seat-based GRADUATED tiers matching lib/billing/pricing.ts.
//   3. Registers a webhook endpoint at ${APP_URL}/api/webhooks/polar
//      (skipped if one already points at the same URL).
//   4. Prints the env vars to paste into .env.local.
//
// Re-running is safe: existing products + webhooks are detected and reused.

import "dotenv/config";
import { Polar } from "@polar-sh/sdk";
import { ANNUAL_DISCOUNT, BANDS } from "../lib/billing/pricing.js";

const accessToken = process.env.POLAR_ACCESS_TOKEN;
if (!accessToken) {
	console.error("Missing POLAR_ACCESS_TOKEN in env");
	process.exit(1);
}
const server = (process.env.POLAR_SERVER ?? "sandbox") as "sandbox" | "production";
const appUrl = process.env.APP_URL ?? "http://localhost:5010";
// Override when developing through a tunnel — Polar requires https for webhooks.
const webhookUrl = process.env.POLAR_WEBHOOK_URL ?? `${appUrl}/api/webhooks/polar`;
const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
const organizationId = process.env.POLAR_ORGANIZATION_ID || undefined;

const polar = new Polar({ accessToken, server });

type Slot = "basic_month" | "basic_year" | "bundle_month" | "bundle_year";

const PRODUCT_DEFS: Array<{
	slot: Slot;
	name: string;
	plan: "basic" | "bundle";
	interval: "month" | "year";
}> = [
	{ slot: "basic_month", name: "Aloha Basic — Monthly", plan: "basic", interval: "month" },
	{ slot: "basic_year", name: "Aloha Basic — Yearly", plan: "basic", interval: "year" },
	{ slot: "bundle_month", name: "Aloha Basic + Muse — Monthly", plan: "bundle", interval: "month" },
	{ slot: "bundle_year", name: "Aloha Basic + Muse — Yearly", plan: "bundle", interval: "year" },
];

function tiersFor(plan: "basic" | "bundle", interval: "month" | "year") {
	const yearlyMultiplier = interval === "year" ? 12 * (1 - ANNUAL_DISCOUNT) : 1;
	return BANDS.map((b, i) => {
		// Bundle = Basic + Muse combined price, since they stack at the same quantity.
		const perSeat = plan === "bundle" ? b.basic + b.muse : b.basic;
		const dollars = perSeat * yearlyMultiplier;
		return {
			minSeats: b.from,
			maxSeats: i === BANDS.length - 1 ? null : b.to,
			pricePerSeat: Math.round(dollars * 100), // cents
		};
	});
}

async function findProductByName(name: string) {
	const list = await polar.products.list({
		organizationId,
		query: name,
		limit: 50,
	});
	for await (const page of list) {
		for (const p of page.result.items ?? []) {
			if (p.name === name) return p;
		}
	}
	return null;
}

async function ensureProduct(def: (typeof PRODUCT_DEFS)[number]) {
	const existing = await findProductByName(def.name);
	if (existing) {
		console.log(`✓ ${def.slot} already exists (${existing.id})`);
		return existing.id;
	}

	const created = await polar.products.create({
		name: def.name,
		description:
			def.plan === "basic"
				? "Aloha scheduling, calendar, and the AI companion."
				: "Aloha scheduling + Muse — style-trained AI voice and advanced campaigns.",
		recurringInterval: def.interval,
		organizationId,
		prices: [
			{
				amountType: "seat_based",
				priceCurrency: "usd",
				seatTiers: {
					seatTierType: "graduated",
					tiers: tiersFor(def.plan, def.interval),
				},
			},
		],
	});
	console.log(`+ created ${def.slot} → ${created.id}`);
	return created.id;
}

const WEBHOOK_EVENTS = [
	"subscription.created",
	"subscription.updated",
	"subscription.canceled",
	"subscription.revoked",
	"subscription.past_due",
	"order.paid",
	"checkout.updated",
] as const;

async function ensureWebhook() {
	if (!webhookUrl.startsWith("https://")) {
		console.log(
			`↷ skipping webhook registration — Polar requires https. Start a tunnel (e.g. \`cloudflared tunnel --url ${appUrl}\`), then re-run with POLAR_WEBHOOK_URL=https://<your-tunnel>/api/webhooks/polar`,
		);
		return null;
	}

	const existingList = await polar.webhooks.listWebhookEndpoints({
		organizationId,
		limit: 100,
	});
	for await (const page of existingList) {
		const hit = (page.result.items ?? []).find((w) => w.url === webhookUrl);
		if (hit) {
			console.log(`✓ webhook already registered (${hit.id})`);
			console.log(
				`  → POLAR_WEBHOOK_SECRET=${hit.secret} (paste into .env.local if not already set)`,
			);
			return hit.id;
		}
	}

	const created = await polar.webhooks.createWebhookEndpoint({
		url: webhookUrl,
		format: "raw",
		events: [...WEBHOOK_EVENTS],
		organizationId,
	});
	console.log(`+ webhook registered → ${created.id} (${webhookUrl})`);
	console.log(`  → POLAR_WEBHOOK_SECRET=${created.secret}`);
	if (webhookSecret && webhookSecret !== created.secret) {
		console.warn(
			"  ⚠ existing POLAR_WEBHOOK_SECRET differs from the one Polar generated — replace it with the value above.",
		);
	}
	return created.id;
}

function printEnvBlock(ids: Partial<Record<Slot, string>>) {
	console.log("\n--- Add these to .env.local ---\n");
	if (ids.basic_month) console.log(`POLAR_PRODUCT_BASIC_MONTH=${ids.basic_month}`);
	if (ids.basic_year) console.log(`POLAR_PRODUCT_BASIC_YEAR=${ids.basic_year}`);
	if (ids.bundle_month) console.log(`POLAR_PRODUCT_BUNDLE_MONTH=${ids.bundle_month}`);
	if (ids.bundle_year) console.log(`POLAR_PRODUCT_BUNDLE_YEAR=${ids.bundle_year}`);
}

async function main() {
	console.log(`Polar setup → server=${server} org=${organizationId ?? "(from token)"}\n`);

	const ids: Partial<Record<Slot, string>> = {};
	for (const def of PRODUCT_DEFS) {
		ids[def.slot] = await ensureProduct(def);
	}

	console.log("");
	try {
		await ensureWebhook();
	} catch (err) {
		console.error("⚠ webhook setup failed (products are still saved):", err);
	}

	printEnvBlock(ids);
}

main().catch((err) => {
	console.error("setup failed:", err);
	process.exit(1);
});
