import { routes } from "@/lib/routes";
import { makeMetadata } from "@/lib/seo";
import { PricingComingSoon } from "./_components/pricing-coming-soon";

// Pricing is disabled until the Polar SKUs go live. The full pricing page
// (calculator, matrix, FAQ, JSON-LD) lives in git history at
// app/(marketing)/pricing/page.tsx on commit a3b8dfe — restore from there
// when pricing ships.

export const metadata = makeMetadata({
	title: "Pricing — free to start, Muse beta by invite",
	description:
		"Aloha is free right now — connect up to 3 channels and schedule posts. Paid tiers with more channels and Muse (AI trained on your voice) are coming. Join the wishlist for early access.",
	path: routes.pricing,
});

export default function PricingPage() {
	return <PricingComingSoon />;
}
