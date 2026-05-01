// One-shot, idempotent setup of Polar products and the webhook endpoint.
// Run with: `bun run scripts/polar-setup.ts`
//
// What it does:
//   1. Looks up existing products by name and skips ones that exist.
//   2. Creates the base-plan products (Basic monthly/yearly, Bundle
//      monthly/yearly) with seat-based GRADUATED tiers matching
//      lib/billing/pricing.ts.
//   3. Creates the add-on products (workspace_addon, member_addon) with
//      flat per-seat pricing using a single graduated tier with an
//      unlimited ceiling.
//   4. Registers a webhook endpoint at ${APP_URL}/api/webhooks/polar
//      (skipped if one already points at the same URL).
//   5. Prints the env vars to paste into .env.local.
//
// Re-running is safe: existing products + webhooks are detected and reused.
//
// PRICE CHANGES: this script does NOT update prices on existing Polar
// products. If you change a constant in lib/billing/pricing.ts (e.g. the
// $25 → $10 workspace_addon move), the existing Polar SKU keeps its old
// price until you either (a) archive it in the Polar dashboard and
// re-run this script, or (b) edit the price directly in Polar. The
// script logs a "STALE PRICE" warning when it detects a mismatch.

import "dotenv/config";
import { Polar } from "@polar-sh/sdk";
import {
	ANNUAL_DISCOUNT,
	BANDS,
	CREDIT_BOOST_MONTHLY_USD,
	CREDIT_BOOST_YEARLY_USD,
	CREDIT_TOPUP_USD,
	MEMBER_ADDON_MONTHLY_USD,
	MEMBER_ADDON_YEARLY_USD,
	WORKSPACE_ADDON_MONTHLY_USD,
	WORKSPACE_ADDON_YEARLY_USD,
} from "../lib/billing/pricing.js";

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

type Slot =
	| "basic_month"
	| "basic_year"
	| "bundle_month"
	| "bundle_year"
	| "workspace_addon_month"
	| "workspace_addon_year"
	| "member_addon_month"
	| "member_addon_year"
	| "credits_boost_month"
	| "credits_boost_year"
	| "credits_topup";

type ProductPlan =
	| "basic"
	| "bundle"
	| "workspace_addon"
	| "member_addon"
	| "credits_boost"
	| "credits_topup";

// One-off products have no recurringInterval — the field is null at the
// type level so a top-up def can't accidentally be created as recurring.
type ProductDef = {
	slot: Slot;
	name: string;
	description: string;
	plan: ProductPlan;
	interval: "month" | "year" | null;
};

const PRODUCT_DEFS: Array<ProductDef> = [
	{
		slot: "basic_month",
		name: "Aloha Basic — Monthly",
		description: "Aloha scheduling, calendar, and the AI companion.",
		plan: "basic",
		interval: "month",
	},
	{
		slot: "basic_year",
		name: "Aloha Basic — Yearly",
		description: "Aloha scheduling, calendar, and the AI companion.",
		plan: "basic",
		interval: "year",
	},
	{
		slot: "bundle_month",
		name: "Aloha Basic + Muse — Monthly",
		description: "Aloha scheduling + Muse — style-trained AI voice and advanced campaigns.",
		plan: "bundle",
		interval: "month",
	},
	{
		slot: "bundle_year",
		name: "Aloha Basic + Muse — Yearly",
		description: "Aloha scheduling + Muse — style-trained AI voice and advanced campaigns.",
		plan: "bundle",
		interval: "year",
	},
	{
		slot: "workspace_addon_month",
		name: "Aloha Workspace — Monthly",
		description:
			"Extra tenant workspace. Each seat includes +3 channels and +3 member slots.",
		plan: "workspace_addon",
		interval: "month",
	},
	{
		slot: "workspace_addon_year",
		name: "Aloha Workspace — Yearly",
		description:
			"Extra tenant workspace. Each seat includes +3 channels and +3 member slots.",
		plan: "workspace_addon",
		interval: "year",
	},
	{
		slot: "member_addon_month",
		name: "Aloha Member Seat — Monthly",
		description: "Additional member seat on a single workspace, beyond the included allowance.",
		plan: "member_addon",
		interval: "month",
	},
	{
		slot: "member_addon_year",
		name: "Aloha Member Seat — Yearly",
		description: "Additional member seat on a single workspace, beyond the included allowance.",
		plan: "member_addon",
		interval: "year",
	},
	{
		slot: "credits_boost_month",
		name: "Aloha Credit Boost — Monthly",
		description:
			"Recurring extra Aloha credits each month, on top of the plan's normal monthly grant.",
		plan: "credits_boost",
		interval: "month",
	},
	{
		slot: "credits_boost_year",
		name: "Aloha Credit Boost — Yearly",
		description:
			"Recurring extra Aloha credits each month, on top of the plan's normal monthly grant.",
		plan: "credits_boost",
		interval: "year",
	},
	{
		slot: "credits_topup",
		name: "Aloha Credit Top-up",
		description:
			"One-off pack of Aloha credits. Consumed alongside the current period's grant; does not roll over.",
		plan: "credits_topup",
		interval: null,
	},
];

// Base-plan graduated tiers match the BANDS in lib/billing/pricing.ts.
function baseTiers(plan: "basic" | "bundle", interval: "month" | "year") {
	const yearlyMultiplier = interval === "year" ? 12 * (1 - ANNUAL_DISCOUNT) : 1;
	return BANDS.map((b, i) => {
		const perSeat = plan === "bundle" ? b.basic + b.muse : b.basic;
		const dollars = perSeat * yearlyMultiplier;
		return {
			minSeats: b.from,
			maxSeats: i === BANDS.length - 1 ? null : b.to,
			pricePerSeat: Math.round(dollars * 100), // cents
		};
	});
}

// Add-on / boost tiers: single tier with unlimited ceiling so seat
// quantity scales without re-provisioning. Polar still requires the
// graduated tier shape even when there's only one band.
function addonTiers(
	plan: "workspace_addon" | "member_addon" | "credits_boost",
	interval: "month" | "year",
) {
	let dollars: number;
	switch (plan) {
		case "workspace_addon":
			dollars =
				interval === "year"
					? WORKSPACE_ADDON_YEARLY_USD
					: WORKSPACE_ADDON_MONTHLY_USD;
			break;
		case "member_addon":
			dollars =
				interval === "year"
					? MEMBER_ADDON_YEARLY_USD
					: MEMBER_ADDON_MONTHLY_USD;
			break;
		case "credits_boost":
			dollars =
				interval === "year"
					? CREDIT_BOOST_YEARLY_USD
					: CREDIT_BOOST_MONTHLY_USD;
			break;
	}
	return [
		{
			minSeats: 1,
			maxSeats: null,
			pricePerSeat: Math.round(dollars * 100), // cents
		},
	];
}

// Best-effort extraction of the per-seat price (cents) from an existing
// add-on product. Polar's product shape has the price under a couple of
// possible paths depending on SDK version; we probe both. Returns null
// if we can't read it — the warning is informational only, so missing
// data just suppresses the warning.
function readSeatPrice(product: unknown): number | null {
	const prices = (product as { prices?: unknown }).prices;
	if (!Array.isArray(prices)) return null;
	for (const p of prices) {
		const tiers = (p as { seatTiers?: { tiers?: Array<{ pricePerSeat?: number }> } })
			.seatTiers?.tiers;
		const first = tiers?.[0]?.pricePerSeat;
		if (typeof first === "number") return first;
	}
	return null;
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

async function ensureProduct(def: ProductDef) {
	const existing = await findProductByName(def.name);

	// One-off top-up: fixed-price, no recurringInterval, no seat tiers.
	if (def.plan === "credits_topup") {
		if (existing) {
			console.log(`✓ ${def.slot} already exists (${existing.id})`);
			return existing.id;
		}
		const created = await polar.products.create({
			name: def.name,
			description: def.description,
			recurringInterval: null,
			organizationId,
			prices: [
				{
					amountType: "fixed",
					priceCurrency: "usd",
					priceAmount: Math.round(CREDIT_TOPUP_USD * 100),
				},
			],
		});
		console.log(`+ created ${def.slot} → ${created.id}`);
		return created.id;
	}

	// Recurring path. From here on, def.interval is guaranteed non-null.
	const interval = def.interval;
	if (!interval) {
		throw new Error(`Recurring product ${def.slot} is missing an interval`);
	}

	const tiers =
		def.plan === "basic" || def.plan === "bundle"
			? baseTiers(def.plan, interval)
			: addonTiers(def.plan, interval);

	if (existing) {
		// Detect stale prices on flat per-seat SKUs (single-tier graduated).
		// Base plans have multi-tier shape — skipping the deep diff there.
		if (
			def.plan === "workspace_addon" ||
			def.plan === "member_addon" ||
			def.plan === "credits_boost"
		) {
			const expected = tiers[0]?.pricePerSeat;
			const live = readSeatPrice(existing);
			if (expected != null && live != null && expected !== live) {
				console.warn(
					`⚠ STALE PRICE on ${def.slot} (${existing.id}): live=${live}¢ expected=${expected}¢. Archive it in Polar and re-run to apply.`,
				);
			}
		}
		console.log(`✓ ${def.slot} already exists (${existing.id})`);
		return existing.id;
	}

	const created = await polar.products.create({
		name: def.name,
		description: def.description,
		recurringInterval: interval,
		organizationId,
		prices: [
			{
				amountType: "seat_based",
				priceCurrency: "usd",
				seatTiers: {
					seatTierType: "graduated",
					tiers,
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
	if (ids.workspace_addon_month)
		console.log(`POLAR_PRODUCT_WORKSPACE_ADDON_MONTH=${ids.workspace_addon_month}`);
	if (ids.workspace_addon_year)
		console.log(`POLAR_PRODUCT_WORKSPACE_ADDON_YEAR=${ids.workspace_addon_year}`);
	if (ids.member_addon_month)
		console.log(`POLAR_PRODUCT_MEMBER_ADDON_MONTH=${ids.member_addon_month}`);
	if (ids.member_addon_year)
		console.log(`POLAR_PRODUCT_MEMBER_ADDON_YEAR=${ids.member_addon_year}`);
	if (ids.credits_boost_month)
		console.log(`POLAR_PRODUCT_CREDITS_BOOST_MONTH=${ids.credits_boost_month}`);
	if (ids.credits_boost_year)
		console.log(`POLAR_PRODUCT_CREDITS_BOOST_YEAR=${ids.credits_boost_year}`);
	if (ids.credits_topup)
		console.log(`POLAR_PRODUCT_CREDITS_TOPUP=${ids.credits_topup}`);
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
