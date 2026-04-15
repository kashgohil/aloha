// Migrate an existing Polar org from the old two-product Muse model to the
// new Bundle model. Run once after refactoring the billing code.
//
//   bun run scripts/polar-migrate-to-bundle.ts
//
// What it does:
//   1. Revokes every active / past_due / trialing subscription (sandbox
//      cleanup — these were all test data on the old model).
//   2. Archives the two "Aloha Muse — …" products so they're hidden from
//      checkout. Polar doesn't allow hard-delete; archiving is the idiom.
//   3. Leaves "Aloha Basic — …" products untouched.
//   4. Does NOT create the new Bundle products — run `polar-setup.ts`
//      afterwards to do that.
//   5. Does NOT touch the local DB. Delete stale rows in subscriptions
//      yourself with Drizzle Studio or `DELETE FROM subscriptions;`.
//
// Safe to re-run — archiving and revoking are idempotent.

import "dotenv/config";
import { Polar } from "@polar-sh/sdk";

const accessToken = process.env.POLAR_ACCESS_TOKEN;
if (!accessToken) {
	console.error("Missing POLAR_ACCESS_TOKEN in env");
	process.exit(1);
}
const server = (process.env.POLAR_SERVER ?? "sandbox") as "sandbox" | "production";
const organizationId = process.env.POLAR_ORGANIZATION_ID || undefined;

const polar = new Polar({ accessToken, server });

const OLD_MUSE_NAMES = new Set([
	"Aloha Muse — Monthly",
	"Aloha Muse — Yearly",
]);

const ACTIVE_STATUSES = new Set(["active", "past_due", "trialing"]);

async function revokeActiveSubscriptions() {
	console.log("Scanning subscriptions…");
	const list = await polar.subscriptions.list({ organizationId, limit: 100 });

	let found = 0;
	let revoked = 0;
	let skipped = 0;

	for await (const page of list) {
		for (const sub of page.result.items ?? []) {
			found++;
			if (!ACTIVE_STATUSES.has(sub.status)) {
				skipped++;
				continue;
			}
			try {
				await polar.subscriptions.revoke({ id: sub.id });
				console.log(`  revoked ${sub.id} (status=${sub.status})`);
				revoked++;
			} catch (err) {
				console.error(`  ! failed to revoke ${sub.id}:`, err);
			}
		}
	}

	console.log(`Subscriptions: ${found} total, ${revoked} revoked, ${skipped} skipped (already inactive).\n`);
}

async function archiveOldMuseProducts() {
	console.log("Scanning products for old Muse entries…");
	const list = await polar.products.list({ organizationId, limit: 100 });

	let archived = 0;
	for await (const page of list) {
		for (const product of page.result.items ?? []) {
			if (!OLD_MUSE_NAMES.has(product.name)) continue;
			if (product.isArchived) {
				console.log(`  ✓ "${product.name}" already archived`);
				continue;
			}
			try {
				await polar.products.update({
					id: product.id,
					productUpdate: { isArchived: true },
				});
				console.log(`  archived "${product.name}" (${product.id})`);
				archived++;
			} catch (err) {
				console.error(`  ! failed to archive ${product.id}:`, err);
			}
		}
	}

	console.log(`Old Muse products archived: ${archived}\n`);
}

async function main() {
	console.log(`Polar migration → server=${server} org=${organizationId ?? "(from token)"}\n`);

	await revokeActiveSubscriptions();
	await archiveOldMuseProducts();

	console.log("Next steps:");
	console.log("  1. In Drizzle Studio (or psql), clear the subscriptions table:");
	console.log("       DELETE FROM subscriptions;");
	console.log("  2. Run `bun run scripts/polar-setup.ts` to create the new Bundle products.");
	console.log("  3. Paste the printed POLAR_PRODUCT_BUNDLE_* env vars into .env.local.");
	console.log("  4. Remove the now-unused POLAR_PRODUCT_MUSE_* env vars.");
	console.log("  5. Restart `bun dev` and try a fresh checkout.");
}

main().catch((err) => {
	console.error("migration failed:", err);
	process.exit(1);
});
