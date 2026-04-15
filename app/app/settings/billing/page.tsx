import { PricingCalculator } from "@/app/(marketing)/pricing/_components/pricing-calculator";
import { auth } from "@/auth";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { previewChange, type PreviewOutput } from "@/lib/billing/preview";
import { effectivePrice, FREE_TIER_CHANNELS } from "@/lib/billing/pricing";
import { getLogicalSubscription } from "@/lib/billing/service";
import { routes } from "@/lib/routes";
import { eq } from "drizzle-orm";
import {
	AlertTriangle,
	ArrowRight,
	ArrowUpRight,
	CheckCircle2,
	Plug,
	Sparkle,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { applyChange, cancelMyPlan } from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) =>
	Array.isArray(v) ? v[0] : v;

function formatMoney(n: number) {
	const r = Math.round(n * 100) / 100;
	return Number.isInteger(r) ? `${r}` : r.toFixed(2);
}

function formatSigned(n: number) {
	const abs = Math.abs(n);
	const r = Math.round(abs * 100) / 100;
	const v = Number.isInteger(r) ? `${r}` : r.toFixed(2);
	return `${n < 0 ? "−" : ""}$${v}`;
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
		.where(eq(accounts.userId, userId));
	const connectedChannels = channelRows.length;

	if (sub.plan === "free") {
		return (
			<div className="space-y-8">
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

	// Which section (if any) is in review mode. The same URL is reused —
	// forms submit with a `review` param plus the proposed values, and the
	// matching section renders its preview inline instead of its controls.
	const review = first(params.review);
	const proposedChannels = Math.max(
		1,
		Number(first(params.channels) ?? sub.channels),
	);
	const wantMuseRaw = first(params.muse);
	const proposedMuse =
		wantMuseRaw === "1" ? true : wantMuseRaw === "0" ? false : sub.museEnabled;

	const needsPreview =
		(review === "channels" && proposedChannels !== sub.channels) ||
		(review === "muse" && proposedMuse !== sub.museEnabled);

	const preview = needsPreview
		? previewChange({
				current: {
					plan: sub.plan,
					channels: sub.channels,
					interval: sub.interval ?? "month",
					currentPeriodEnd: sub.currentPeriodEnd,
				},
				next: {
					plan: proposedMuse ? "basic_muse" : "basic",
					channels: proposedChannels,
					interval: sub.interval ?? "month",
				},
			})
		: null;

	return (
		<div className="space-y-8">
			{flash ? <FlashBanner kind={flash} /> : null}

			<PlanSummary
				plan={sub.plan}
				channels={sub.channels}
				interval={sub.interval ?? "month"}
				perMonth={price.effectivePerMonth}
				annualTotal={price.annualTotal}
				nextBilling={sub.currentPeriodEnd}
				cancelAtPeriodEnd={sub.cancelAtPeriodEnd}
			/>

			<ChannelAdjuster
				current={sub.channels}
				connected={connectedChannels}
				museEnabled={sub.museEnabled}
				reviewActive={review === "channels" && !!preview}
				proposedChannels={proposedChannels}
				preview={review === "channels" ? preview : null}
			/>

			<MuseToggleSection
				enabled={sub.museEnabled}
				channels={sub.channels}
				reviewActive={review === "muse" && !!preview}
				preview={review === "muse" ? preview : null}
			/>

			<DangerZone cancelAtPeriodEnd={sub.cancelAtPeriodEnd} />
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
					</div>
				</div>
			</div>
		</div>
	);
}

function ChannelAdjuster({
	current,
	connected,
	museEnabled,
	reviewActive,
	proposedChannels,
	preview,
}: {
	current: number;
	connected: number;
	museEnabled: boolean;
	reviewActive: boolean;
	proposedChannels: number;
	preview: PreviewOutput | null;
}) {
	return (
		<section
			id="channels"
			className="rounded-3xl border border-border bg-background-elev overflow-hidden"
		>
			<div className="p-6 lg:p-8">
				<div className="grid md:grid-cols-[260px_1fr] gap-6 items-start">
					<div>
						<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
							Channels
						</p>
						<h3 className="mt-1.5 font-display text-[20px] leading-[1.15] tracking-[-0.01em] text-ink">
							Adjust your billable count.
						</h3>
						<p className="mt-2 text-[12.5px] text-ink/60 leading-normal">
							You currently pay for {current}. {connected} channel
							{connected === 1 ? " is" : "s are"} connected.
						</p>
					</div>
					<form
						action="/app/settings/billing"
						method="get"
						className="flex flex-wrap items-center gap-3"
					>
						<input type="hidden" name="review" value="channels" />
						<input type="hidden" name="muse" value={museEnabled ? "1" : "0"} />
						<label
							htmlFor="channels-input"
							className="text-[12px] uppercase tracking-[0.18em] text-ink/55"
						>
							New count
						</label>
						<input
							id="channels-input"
							name="channels"
							type="number"
							min={1}
							max={1000}
							defaultValue={reviewActive ? proposedChannels : current}
							className="w-24 h-11 px-3 rounded-xl bg-background border border-border-strong text-[14px] text-ink text-center focus:outline-none focus:border-ink transition-colors"
						/>
						<button
							type="submit"
							className="inline-flex items-center h-11 px-5 rounded-full bg-ink text-background text-[13.5px] font-medium hover:bg-primary transition-colors"
						>
							Review changes
						</button>
						<Link
							href="/app/settings/channels"
							className="inline-flex items-center gap-1.5 h-11 px-3 text-[12.5px] text-ink/60 hover:text-ink transition-colors"
						>
							<Plug className="w-3.5 h-3.5" />
							Manage channels
							<ArrowUpRight className="w-3 h-3" />
						</Link>
					</form>
				</div>
			</div>

			{reviewActive && preview ? (
				<InlineReview
					preview={preview}
					proposedChannels={proposedChannels}
					proposedMuse={museEnabled}
				/>
			) : null}
		</section>
	);
}

function MuseToggleSection({
	enabled,
	channels,
	reviewActive,
	preview,
}: {
	enabled: boolean;
	channels: number;
	reviewActive: boolean;
	preview: PreviewOutput | null;
}) {
	return (
		<section
			id="muse"
			className="rounded-3xl border border-border bg-background-elev overflow-hidden"
		>
			<div className="p-6 lg:p-8">
				<form
					action="/app/settings/billing"
					method="get"
					className="grid md:grid-cols-[260px_1fr] gap-6 items-center"
				>
					<input type="hidden" name="review" value="muse" />
					<input type="hidden" name="muse" value={enabled ? "0" : "1"} />
					<input type="hidden" name="channels" value={channels} />
					<div>
						<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 inline-flex items-center gap-2">
							<Sparkle className="w-3 h-3 text-primary" />
							Muse add-on
						</p>
						<h3 className="mt-1.5 font-display text-[20px] leading-[1.15] tracking-[-0.01em] text-ink">
							{enabled ? "Muse is active." : "Add Muse to your plan."}
						</h3>
						<p className="mt-2 text-[12.5px] text-ink/60 leading-normal">
							{enabled
								? "Style-trained voice and advanced campaigns are unlocked across your channels. Review any change before it's charged."
								: "Switch to the Basic + Muse plan. You'll see the prorated amount before anything is billed."}
						</p>
					</div>
					<div className="flex justify-end">
						<button
							type="submit"
							className={
								enabled
									? "inline-flex items-center gap-2 h-11 px-5 rounded-full text-[13px] text-ink/65 hover:text-primary-deep hover:bg-peach-100/60 transition-colors"
									: "inline-flex items-center gap-2 h-11 px-5 rounded-full bg-primary text-primary-foreground text-[13.5px] font-medium hover:bg-primary-deep transition-colors"
							}
						>
							<Sparkle className="w-3.5 h-3.5" />
							{enabled ? "Review: Remove Muse" : "Review: Add Muse"}
						</button>
					</div>
				</form>
			</div>

			{reviewActive && preview ? (
				<InlineReview
					preview={preview}
					proposedChannels={channels}
					proposedMuse={!enabled}
				/>
			) : null}
		</section>
	);
}

function InlineReview({
	preview,
	proposedChannels,
	proposedMuse,
}: {
	preview: PreviewOutput;
	proposedChannels: number;
	proposedMuse: boolean;
}) {
	const isCredit = preview.immediateCharge < 0;
	return (
		<div className="border-t border-border bg-peach-100/40">
			<div className="p-6 lg:p-8 space-y-5">
				<div className="flex items-center gap-2">
					<p className="text-[10.5px] font-mono uppercase tracking-[0.22em] text-primary-deep">
						Review
					</p>
					<span className="h-px flex-1 bg-border" />
				</div>

				{preview.summary.length > 0 ? (
					<ul className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-ink/80">
						{preview.summary.map((s) => (
							<li key={s} className="inline-flex items-center gap-2">
								<ArrowRight className="w-3.5 h-3.5 text-primary" />
								{s}
							</li>
						))}
					</ul>
				) : null}

				<div className="grid sm:grid-cols-3 gap-5">
					<ReviewStat
						label="New rate"
						value={`$${formatMoney(preview.newPerMonth)}`}
						trailing="/ mo"
						hint={`was $${formatMoney(preview.oldPerMonth)} / mo`}
					/>
					<ReviewStat
						label={isCredit ? "Credit today" : "Charged today"}
						value={formatSigned(preview.immediateCharge)}
						hint={`Prorated · ${preview.daysRemaining} of ${preview.totalDaysInPeriod} days remain`}
						emphasize
					/>
					<ReviewStat
						label="Next invoice"
						value={`$${formatMoney(preview.nextBillingAmount)}`}
						hint={
							preview.nextBillingDate
								? `on ${formatDate(preview.nextBillingDate)}`
								: undefined
						}
					/>
				</div>

				<form
					action={applyChange}
					className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border"
				>
					<input type="hidden" name="channels" value={proposedChannels} />
					<input type="hidden" name="muse" value={proposedMuse ? "1" : "0"} />
					<p className="text-[11.5px] text-ink/50 inline-flex items-center gap-2 max-w-md">
						<AlertTriangle className="w-3.5 h-3.5" />
						Polar bills your card on file immediately. Receipt arrives by email.
					</p>
					<div className="flex items-center gap-2">
						<Link
							href="/app/settings/billing"
							className="inline-flex items-center h-10 px-4 rounded-full text-[13px] text-ink/65 hover:text-ink transition-colors"
						>
							Cancel
						</Link>
						<button
							type="submit"
							className="inline-flex items-center h-10 px-5 rounded-full bg-ink text-background text-[13.5px] font-medium hover:bg-primary transition-colors"
						>
							Confirm {formatSigned(preview.immediateCharge)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

function ReviewStat({
	label,
	value,
	trailing,
	hint,
	emphasize,
}: {
	label: string;
	value: string;
	trailing?: string;
	hint?: string;
	emphasize?: boolean;
}) {
	return (
		<div>
			<p className="text-[10.5px] font-mono uppercase tracking-[0.18em] text-ink/55 mb-1">
				{label}
			</p>
			<p
				className={
					emphasize
						? "font-display text-[28px] tracking-[-0.015em] text-ink"
						: "font-display text-[22px] tracking-[-0.01em] text-ink"
				}
			>
				{value}
				{trailing ? (
					<span className="text-[13px] text-ink/50 font-mono ml-1.5">
						{trailing}
					</span>
				) : null}
			</p>
			{hint ? <p className="mt-1 text-[11.5px] text-ink/55">{hint}</p> : null}
		</div>
	);
}

function DangerZone({ cancelAtPeriodEnd }: { cancelAtPeriodEnd: boolean }) {
	return (
		<form
			action={cancelMyPlan}
			className="rounded-3xl border border-dashed border-border-strong p-6 lg:p-8"
		>
			<div className="flex items-start gap-4">
				<span className="mt-[2px] w-9 h-9 rounded-full bg-background border border-border-strong grid place-items-center shrink-0">
					<AlertTriangle className="w-4 h-4 text-ink/65" />
				</span>
				<div className="flex-1 min-w-0">
					<p className="text-[13.5px] text-ink font-medium">
						{cancelAtPeriodEnd
							? "Your plan is already set to cancel."
							: "Cancel subscription"}
					</p>
					<p className="mt-1 text-[12.5px] text-ink/60 leading-[1.55] max-w-2xl">
						You&apos;ll keep paid features until the end of the current period,
						then drop back to the free tier ({FREE_TIER_CHANNELS} channels).
						Connected accounts beyond the free limit are paused, not deleted.
					</p>
				</div>
				<button
					type="submit"
					disabled={cancelAtPeriodEnd}
					className="inline-flex items-center h-10 px-4 rounded-full text-[13px] text-ink/65 hover:text-primary-deep hover:bg-peach-100/60 transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-ink/65"
				>
					Cancel plan
				</button>
			</div>
		</form>
	);
}
