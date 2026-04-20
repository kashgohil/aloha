import { PricingCalculator } from "@/app/(marketing)/pricing/_components/pricing-calculator";
import { WishlistForm } from "@/app/(marketing)/pricing/_components/wishlist-form";
import { auth } from "@/auth";
import { db } from "@/db";
import { accounts, users, wishlist } from "@/db/schema";
import { effectivePrice, FREE_TIER_CHANNELS } from "@/lib/billing/pricing";
import { getLogicalSubscription, listInvoices } from "@/lib/billing/service";
import { AUTH_ONLY_PROVIDERS } from "@/lib/auth-providers";
import { routes } from "@/lib/routes";
import { and, eq, notInArray } from "drizzle-orm";
import { CheckCircle2, Sparkle } from "lucide-react";
import { redirect } from "next/navigation";
import { ChannelAdjuster } from "./_components/channel-adjuster";
import { DangerZone } from "./_components/danger-zone";
import { IntervalSwitch } from "./_components/interval-switch";
import { InvoicesList } from "./_components/invoices";
import { MuseToggleSection } from "./_components/muse-toggle-section";
import { PastDueBanner } from "./_components/past-due-banner";

const IS_DEV = process.env.NODE_ENV === "development";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) =>
	Array.isArray(v) ? v[0] : v;

function formatMoney(n: number) {
	const r = Math.round(n * 100) / 100;
	return Number.isInteger(r) ? `${r}` : r.toFixed(2);
}

function formatDate(d: Date) {
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(d);
}

export default async function BillingPage({
	searchParams,
}: {
	searchParams: SearchParams;
}) {
	const session = await auth();
	if (!session?.user?.id) redirect(routes.signin);

	const userId = session.user.id;
	const params = await searchParams;
	const sub = await getLogicalSubscription(userId);
	const flash = first(params.success)
		? "checkout"
		: first(params.canceled)
			? "canceled"
			: null;

	const channelRows = await db
		.select({ provider: accounts.provider })
		.from(accounts)
		.where(
			and(
				eq(accounts.userId, userId),
				notInArray(accounts.provider, AUTH_ONLY_PROVIDERS),
			),
		);
	const connectedChannels = channelRows.length;

	if (!IS_DEV) {
		const [userRow] = await db
			.select({ name: users.name, email: users.email })
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);
		const email = userRow?.email ?? "";
		const name = userRow?.name?.trim() || email.split("@")[0] || "";
		const existing = email
			? await db
					.select({ id: wishlist.id })
					.from(wishlist)
					.where(eq(wishlist.email, email))
					.limit(1)
			: [];
		const alreadyJoined = existing.length > 0;

		return (
			<div className="max-w-4xl space-y-8">
				<FreePlanHero connectedChannels={connectedChannels} />
				<BillingComingSoon
					prefill={email ? { name, email } : undefined}
					alreadyJoined={alreadyJoined}
				/>
			</div>
		);
	}

	if (sub.plan === "free") {
		return (
			<div className="max-w-4xl space-y-8">
				{flash ? <FlashBanner kind={flash} /> : null}
				<FreePlanHero connectedChannels={connectedChannels} />
				<UpgradeBlock initialChannels={Math.max(5, connectedChannels)} />
			</div>
		);
	}

	const price = effectivePrice(sub.channels, {
		muse: sub.museEnabled,
		interval: sub.interval ?? "month",
	});
	const interval = sub.interval ?? "month";
	const currentPeriodEndISO = sub.currentPeriodEnd
		? sub.currentPeriodEnd.toISOString()
		: null;

	const invoices = await listInvoices(userId);

	return (
		<div className="max-w-4xl space-y-8">
			{sub.pastDue ? <PastDueBanner /> : null}
			{flash ? <FlashBanner kind={flash} /> : null}

			<PlanSummary
				plan={sub.plan}
				channels={sub.channels}
				interval={interval}
				perMonth={price.effectivePerMonth}
				annualTotal={price.annualTotal}
				nextBilling={sub.currentPeriodEnd}
				cancelAtPeriodEnd={sub.cancelAtPeriodEnd}
			/>

			<ChannelAdjuster
				current={sub.channels}
				connected={connectedChannels}
				interval={interval}
				museEnabled={sub.museEnabled}
				currentPeriodEndISO={currentPeriodEndISO}
			/>

			<MuseToggleSection
				enabled={sub.museEnabled}
				channels={sub.channels}
				interval={interval}
				currentPeriodEndISO={currentPeriodEndISO}
			/>

			<IntervalSwitch
				interval={interval}
				channels={sub.channels}
				museEnabled={sub.museEnabled}
				currentPeriodEndISO={currentPeriodEndISO}
			/>

			<InvoicesList invoices={invoices} />

			<DangerZone
				cancelAtPeriodEnd={sub.cancelAtPeriodEnd}
				currentPeriodEndISO={currentPeriodEndISO}
				freeTierChannels={FREE_TIER_CHANNELS}
				currentChannels={sub.channels}
			/>
		</div>
	);
}

function FlashBanner({ kind }: { kind: "checkout" | "canceled" }) {
	const isCancel = kind === "canceled";
	return (
		<div
			role="status"
			className="flex items-start gap-3 rounded-2xl border border-peach-300 bg-peach-100 px-4 py-3 text-[13.5px] text-ink"
		>
			<CheckCircle2 className="w-4 h-4 mt-[2px] text-ink shrink-0" />
			{isCancel
				? "Your plan is set to cancel at the end of this period."
				: "Your subscription is up to date."}
		</div>
	);
}

function FreePlanHero({ connectedChannels }: { connectedChannels: number }) {
	return (
		<div className="rounded-3xl bg-background-elev border border-border overflow-hidden">
			<div className="px-8 lg:px-12 py-8 bg-peach-100 border-b border-border">
				<p className="text-[10.5px] font-mono uppercase tracking-[0.22em] text-ink/60 mb-3">
					Current plan
				</p>
				<div className="flex flex-wrap items-end justify-between gap-4">
					<p className="font-display text-[44px] lg:text-[56px] leading-[0.95] tracking-[-0.025em]">
						Free
					</p>
					<p className="text-[13px] text-ink/65 font-mono">
						{connectedChannels} of {FREE_TIER_CHANNELS} channels in use
					</p>
				</div>
			</div>
			<div className="px-8 lg:px-12 py-7 grid sm:grid-cols-3 gap-6 text-[13px] text-ink/75">
				<Bullet>Up to {FREE_TIER_CHANNELS} connected channels</Bullet>
				<Bullet>AI companion (50 generations / mo)</Bullet>
				<Bullet>Calendar, scheduling, link-in-bio</Bullet>
			</div>
		</div>
	);
}

function Bullet({ children }: { children: React.ReactNode }) {
	return (
		<p className="flex items-start gap-2.5">
			<span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
			<span className="leading-[1.55]">{children}</span>
		</p>
	);
}

function UpgradeBlock({ initialChannels }: { initialChannels: number }) {
	return (
		<section className="space-y-5">
			<div>
				<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
					Upgrade
				</p>
				<h2 className="mt-1.5 font-display text-[28px] leading-[1.1] tracking-[-0.015em] text-ink">
					Pick a plan that fits how you publish.
				</h2>
				<p className="mt-2 text-[13.5px] text-ink/65 leading-[1.55] max-w-2xl">
					Channel-based pricing — pay only for what you connect. Add Muse for
					style-trained voice. Annual saves 20%.
				</p>
			</div>
			<PricingCalculator
				initialChannels={initialChannels}
				submitLabel="Continue to checkout"
			/>
		</section>
	);
}

function PlanSummary({
	plan,
	channels,
	interval,
	perMonth,
	annualTotal,
	nextBilling,
	cancelAtPeriodEnd,
}: {
	plan: "basic" | "basic_muse";
	channels: number;
	interval: "month" | "year";
	perMonth: number;
	annualTotal: number;
	nextBilling: Date | null;
	cancelAtPeriodEnd: boolean;
}) {
	return (
		<div className="rounded-3xl bg-background-elev border border-border overflow-hidden">
			<div className="px-8 lg:px-12 py-8 bg-peach-100 border-b border-border">
				<div className="flex flex-wrap items-start justify-between gap-6">
					<div>
						<p className="text-[10.5px] font-mono uppercase tracking-[0.22em] text-ink/60 mb-3 inline-flex items-center gap-2">
							{plan === "basic_muse" ? (
								<>
									<Sparkle className="w-3 h-3 text-primary" />
									Basic + Muse
								</>
							) : (
								"Basic"
							)}
							<span className="text-ink/40">·</span>
							<span>
								{interval === "year" ? "billed yearly" : "billed monthly"}
							</span>
						</p>
						<p className="font-display text-[48px] lg:text-[64px] leading-[0.95] tracking-[-0.025em]">
							${formatMoney(perMonth)}
							<span className="text-[18px] lg:text-[22px] text-ink/50 font-mono ml-3">
								/ mo
							</span>
						</p>
						<p className="mt-2 text-[13px] text-ink/65">
							{channels} channel{channels === 1 ? "" : "s"}
							{interval === "year" ? (
								<>
									<span className="text-ink/40"> · </span>
									<span className="font-mono">
										${Math.round(annualTotal).toLocaleString()} / yr
									</span>
								</>
							) : null}
						</p>
					</div>
					<div className="text-right">
						<p className="text-[10.5px] font-mono uppercase tracking-[0.22em] text-ink/55 mb-1">
							{cancelAtPeriodEnd ? "Cancels on" : "Renews on"}
						</p>
						<p className="font-display text-[22px] tracking-[-0.005em]">
							{nextBilling ? formatDate(nextBilling) : "—"}
						</p>
						<form action="/api/billing/portal" method="post" className="mt-2">
							<button
								type="submit"
								className="pencil-link text-[11.5px] text-ink/55 hover:text-ink font-medium"
							>
								Update payment method
							</button>
						</form>
					</div>
				</div>
			</div>
		</div>
	);
}

function BillingComingSoon({
	prefill,
	alreadyJoined,
}: {
	prefill?: { name: string; email: string };
	alreadyJoined: boolean;
}) {
	return (
		<div className="max-w-4xl space-y-8">
			<section className="rounded-3xl bg-background-elev border border-border p-8 lg:p-10">
				<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
					Paid plans
				</p>
				<h2 className="font-display text-[28px] leading-[1.1] tracking-[-0.015em] text-ink">
					Pricing is coming soon.
				</h2>
				<p className="mt-3 text-[14.5px] text-ink/65 leading-[1.55] max-w-2xl">
					You're on the free tier — 3 channels, scheduling, calendar, and 50 AI
					generations a month. Enjoy it while we finalize paid plans.
				</p>
			</section>

			<section className="rounded-3xl bg-peach-100 border border-border p-8 lg:p-10">
				<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-4">
					Coming soon
				</p>
				<h2 className="font-display text-[28px] leading-[1.1] tracking-[-0.015em] text-ink">
					Muse — AI that sounds like you.
				</h2>
				<p className="mt-3 text-[14.5px] text-ink/65 leading-[1.55] max-w-2xl">
					Style-trained writing, per-channel variants, fan-out, advanced
					campaigns. We're opening beta access to a small group. Sign up
					and we'll be in touch.
				</p>
				<div className="mt-8 pt-6 border-t border-ink/10">
					<p className="text-[12.5px] text-ink/65 mb-4">
						<span className="font-medium text-ink">
							{alreadyJoined
								? "You're on the Muse beta wishlist"
								: "Join the Muse beta wishlist"}
						</span>
						<span className="text-ink/45">
							{" "}· we'll pick select participants
						</span>
					</p>
					<WishlistForm prefill={prefill} alreadyJoined={alreadyJoined} />
				</div>
			</section>
		</div>
	);
}

