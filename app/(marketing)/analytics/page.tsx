import { routes } from "@/lib/routes";
import { makeMetadata } from "@/lib/seo";
import {
	ArrowRight,
	ArrowUpRight,
	Check,
	Download,
	Sparkle,
} from "lucide-react";
import Link from "next/link";
import { FeatureDetails } from "../_components/feature-details";
import { ScreenshotPlaceholder } from "../_components/screenshot-placeholder";

export const metadata = makeMetadata({
	title: "Analytics — numbers that lead to the next post",
	description:
		"Aloha's analytics turn vanity metrics into useful decisions. See what's working, across every channel, with the context you'd want from a human editor.",
	path: routes.product.analytics,
});

// Fake chart bars for the hero mock — 12 bands from bg-peach-100 to peach-400.
const BARS = [28, 44, 36, 52, 40, 68, 72, 58, 80, 62, 90, 76];

export default function AnalyticsPage() {
	return (
		<>
			{/* ─── HERO ────────────────────────────────────────────────────── */}
			<header className="relative overflow-hidden bg-peach-200">
				<span
					aria-hidden
					className="absolute top-[12%] left-[5%] font-display text-[26px] text-ink/25 rotate-[-8deg] select-none"
				>
					✳
				</span>
				<span
					aria-hidden
					className="absolute top-[64%] left-[10%] font-display text-[22px] text-primary/55 rotate-14 select-none"
				>
					+
				</span>
				<span
					aria-hidden
					className="absolute top-[20%] right-[7%] font-display text-[38px] text-ink/15 rotate-18select-none"
				>
					※
				</span>
				<span
					aria-hidden
					className="absolute top-[54%] right-[4%] w-3 h-3 rounded-full border border-ink/30"
				/>
			</header>

			<section className="bg-peach-200 wavy">
				<div className="relative max-w-[1320px] w-full mx-auto px-6 lg:px-10 pt-20 lg:pt-28 pb-32 lg:pb-40 grid grid-cols-12 gap-x-0 gap-y-8 lg:gap-12 items-center">
					<div className="col-span-12 lg:col-span-7">
						<div className="inline-flex items-center gap-2 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
							Analytics
						</div>

						<h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[92px]">
							Numbers that
							<br />
							<span className="text-primary font-light">lead to the</span>
							<br />
							next post.
						</h1>

						<p className="mt-8 max-w-[520px] text-[17px] lg:text-[18px] leading-[1.55] text-ink/70">
							Vanity metrics don't tell you what to write Monday. Aloha's
							analytics frame every number against a useful question — what
							landed, what repeated, what's worth a second shot — then tell you
							where to go next.
						</p>

						<div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
							<Link
								href={routes.signin}
								className="inline-flex items-center gap-2 h-14 px-7 rounded-full bg-primary text-primary-foreground font-medium text-[15px] shadow-[0_8px_0_-2px_rgba(46,42,133,0.35)] hover:shadow-[0_10px_0_-2px_rgba(46,42,133,0.4)] hover:-translate-y-0.5 transition-all"
							>
								See your numbers
								<ArrowRight className="w-4 h-4" />
							</Link>
							<a
								href="#insights"
								className="pencil-link inline-flex items-center gap-2 text-[15px] font-medium text-ink"
							>
								How the insights read
								<ArrowUpRight className="w-4 h-4" />
							</a>
						</div>

						<div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-[12.5px] text-ink/60">
							<span className="inline-flex items-center gap-2">
								<Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
								Historical — never truncated on plan change
							</span>
							<span className="inline-flex items-center gap-2">
								<Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
								CSV export on every view
							</span>
							<span className="inline-flex items-center gap-2">
								<Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
								Platform API gaps flagged, not hidden
							</span>
						</div>
					</div>

					{/* Hero visual — analytics card */}
					<div className="col-span-12 lg:col-span-5 relative">
						<div className="relative animate-[float-soft_9s_ease-in-out_infinite]">
							<div className="rounded-3xl bg-background-elev border border-border-strong shadow-[0_30px_60px_-20px_rgba(23,20,18,0.25)] overflow-hidden">
								<div className="px-5 py-3 flex items-center justify-between border-b border-border bg-muted/40">
									<div className="flex items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.18em] text-ink/60">
										engagement · 12 weeks
									</div>
									<span className="text-[10.5px] text-ink/50 font-mono">
										all channels
									</span>
								</div>

								{/* big stat */}
								<div className="px-6 pt-6 pb-4 border-b border-border">
									<p className="text-[11px] font-mono uppercase tracking-[0.22em] text-ink/50">
										Engagement · rolling
									</p>
									<p className="mt-2 font-display text-[52px] leading-none tracking-[-0.02em]">
										14,204
									</p>
									<p className="mt-1.5 text-[12.5px] text-ink/60">
										<span className="text-primary font-medium">+2,760</span> vs
										last 12w
									</p>
								</div>

								{/* bar chart */}
								<div className="px-6 pt-5 pb-2 flex items-end gap-1.5 h-[120px]">
									{BARS.map((h, i) => (
										<div
											key={i}
											className={`flex-1 rounded-t-sm ${
												i === BARS.length - 2 ? "bg-primary" : "bg-peach-300"
											}`}
											style={{ height: `${h}%` }}
										/>
									))}
								</div>

								{/* insight row */}
								<div className="mx-6 mb-6 mt-1 p-4 rounded-2xl bg-peach-100 border border-peach-300/30 flex items-start gap-3">
									<Sparkle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
									<p className="text-[12.5px] leading-normal text-ink/85">
										<span className="font-semibold text-ink">Friday 9am</span>{" "}
										is your quiet sweet-spot. Posts there get{" "}
										<span className="font-semibold text-ink">1.8× reach</span>{" "}
										with half the comment noise.
									</p>
								</div>

								<div className="px-5 py-3 border-t border-border bg-muted/40 flex items-center justify-between">
									<span className="text-[11px] text-ink/55">
										data through today
									</span>
									<button className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-ink text-background text-[11.5px] font-medium">
										<Download className="w-3 h-3" />
										Export CSV
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ─── FEATURE 1 · USEFUL INSIGHTS ─────────────────────────────── */}
			<section className="bg-background-elev">
				<section
					id="insights"
					className="py-24 lg:py-32 pb-32 lg:pb-40 bg-background wavy"
				>
					<div className="max-w-[1320px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-16 items-center">
						<div className="col-span-12 lg:col-span-6">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Useful insights
							</p>
							<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
								Context before
								<br />
								<span className="text-primary">the metric.</span>
							</h2>
							<p className="mt-6 text-[16px] lg:text-[17px] text-ink/75 leading-[1.6] max-w-lg">
								Every dashboard tells you impressions were up. Aloha tells you
								which three posts caused it, what they have in common, and
								whether you can reasonably repeat it. The numbers read like
								notes from a careful editor, not a scoreboard.
							</p>

							<ul className="mt-8 space-y-3 text-[14.5px] text-ink/85">
								{[
									"Best-time windows by channel, updated weekly.",
									"Repeatability score — distinguishes one-off spikes from patterns (after 8 weeks of data).",
									"Top posts surfaced with the exact line that carried them.",
								].map((f) => (
									<li key={f} className="flex items-start gap-3">
										<Check
											className="w-4 h-4 mt-[3px] text-primary shrink-0"
											strokeWidth={2.5}
										/>
										{f}
									</li>
								))}
							</ul>
						</div>

						<div className="col-span-12 lg:col-span-6">
							<ScreenshotPlaceholder
								id="insights"
								label="Dashboard — reach, engagement, and the cards that surface what to do next."
								notes="Needed: /app/dashboard screenshot. Show reach + engagement cards with weekly deltas, the channels card, and the knowledge card visible. 5:3 crop."
								aspect="aspect-[5/3]"
								tone="bg-peach-100"
							/>
						</div>
					</div>
				</section>
			</section>

			{/* ─── FEATURE 2 · CHANNEL COMPARE (bento) ─────────────────────── */}
			<section className="py-24 lg:py-32 bg-background-elev wavy">
				<div className="max-w-[1320px] mx-auto px-6 lg:px-10 pb-8 lg:pb-12">
					<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 mb-14">
						<div className="col-span-12 lg:col-span-6">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Channel compare
							</p>
							<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
								Which channel
								<br />
								<span className="text-primary">earns its slot?</span>
							</h2>
						</div>
						<p className="col-span-12 lg:col-span-5 lg:col-start-8 text-[16px] text-ink/70 leading-[1.6] self-end">
							Reach per post, per channel, with a 12-week delta. You'll find
							that one channel pays back 3× what another does — and that the
							polite time-sinks stand out quickly. Aloha just shows the math.
						</p>
					</div>

					{/* bento of mini-metrics */}
					<div className="grid grid-cols-12 gap-x-0 gap-y-4 lg:gap-6">
						{[
							{
								n: "LinkedIn",
								v: "4,820",
								s: "reach / post",
								delta: "+31%",
								tone: "bg-primary-soft",
								span: "lg:col-span-5",
							},
							{
								n: "Instagram",
								v: "2,140",
								s: "reach / post",
								delta: "+8%",
								tone: "bg-peach-200",
								span: "lg:col-span-4",
							},
							{
								n: "X",
								v: "1,680",
								s: "reach / post",
								delta: "-2%",
								tone: "bg-peach-100",
								span: "lg:col-span-3",
							},
							{
								n: "Threads",
								v: "1,210",
								s: "reach / post",
								delta: "+44%",
								tone: "bg-peach-300",
								span: "lg:col-span-3",
							},
							{
								n: "TikTok",
								v: "3,540",
								s: "reach / post",
								delta: "+12%",
								tone: "bg-peach-400",
								span: "lg:col-span-4",
							},
							{
								n: "YouTube",
								v: "6,022",
								s: "reach / post",
								delta: "+19%",
								tone: "bg-primary-soft",
								span: "lg:col-span-5",
							},
						].map((c) => (
							<div
								key={c.n}
								className={`col-span-12 md:col-span-6 ${c.span} ${c.tone} rounded-3xl p-6 lg:p-7 flex flex-col justify-between min-h-[160px]`}
							>
								<div className="flex items-center justify-between">
									<span className="text-[11px] font-semibold text-ink">
										{c.n}
									</span>
									<span
										className={`text-[10.5px] font-mono ${c.delta.startsWith("-") ? "text-ink/50" : "text-primary"}`}
									>
										{c.delta}
									</span>
								</div>
								<div>
									<p className="font-display text-[30px] lg:text-[36px] leading-none tracking-[-0.02em]">
										{c.v}
									</p>
									<p className="mt-2 text-[11.5px] text-ink/60">{c.s}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ─── FEATURE 3 · EXPORTS + HISTORY ──────────────────────────── */}
			<section className="bg-primary-soft">
				<section className="py-24 lg:py-32 pb-32 lg:pb-40 bg-background wavy">
					<div className="max-w-[1320px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-16 items-center">
						<div className="col-span-12 lg:col-span-6 order-2 lg:order-1">
							<ScreenshotPlaceholder
								id="export"
								label="Export panel — CSV, JSON, or a Notion-friendly markdown digest."
								notes="Coming soon. No analytics export surface shipped yet; placeholder stays illustrative until it does."
								aspect="aspect-[4/3]"
								tone="bg-primary-soft"
								comingSoon
							/>
						</div>

						<div className="col-span-12 lg:col-span-6 order-1 lg:order-2">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Exports &amp; history
							</p>
							<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
								Your data,
								<br />
								<span className="text-primary">always yours.</span>
							</h2>
							<p className="mt-6 text-[16px] lg:text-[17px] text-ink/75 leading-[1.6] max-w-lg">
								CSV for the spreadsheet-inclined. JSON for the API-inclined. And
								a monthly digest you can paste into Notion for your team review.
								History doesn't truncate when you change plans, and nothing is
								held hostage behind an 'email us for a link'.
							</p>

							<ul className="mt-8 space-y-3 text-[14.5px] text-ink/85">
								{[
									"Full 24-month history on every plan, including Free.",
									"Platform-API gaps get a visible marker, never a silent zero.",
									"Weekly digest email — opt in, opt out, one click either way.",
								].map((f) => (
									<li key={f} className="flex items-start gap-3">
										<Check
											className="w-4 h-4 mt-[3px] text-primary shrink-0"
											strokeWidth={2.5}
										/>
										{f}
									</li>
								))}
							</ul>
						</div>
					</div>
				</section>
			</section>

			{/* ─── FEATURE DETAILS ──────────────────────────────────────────── */}
			<section className="relative bg-ink">
				<div
					aria-hidden
					className="absolute inset-0 top-2.5 opacity-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<section className="py-24 lg:py-28 bg-primary-soft wavy">
					<div className="max-w-[1320px] mx-auto px-6 lg:px-10 pb-8 lg:pb-12">
						<FeatureDetails
							eyebrow="On the dashboard"
							heading={
								<>
									Numbers that lead somewhere.
									<br />
									<span className="text-primary">Not a vanity wall.</span>
								</>
							}
							intro="Every card answers a question you'd actually ask on a Monday. Context first, chart second — never the other way around."
							details={[
								{
									title: "Reach card",
									body: "Weekly delta measured against the trailing four weeks, not a twelve-month mean. You see movement you can act on, not noise.",
								},
								{
									title: "Engagement that names the hook",
									body: "The top three posts with the exact line that carried them. Copy the pattern, don't reverse-engineer it blind.",
								},
								{
									title: "Channel breakdown",
									body: "Which network earned its slot this week, and which one you can skip guilt-free. Per-channel deltas on one row.",
								},
								{
									title: "Feed digest",
									body: "What your audience is actually reading — separate from what you posted. Borrowed curiosity, not just your own.",
								},
								{
									title: "Knowledge card",
									body: "Patterns Muse has noticed across your writing. Click to turn any of them straight into a composer prompt.",
								},
								{
									title: "Active campaign tracking",
									body: "Progress against the brief you set when you started the campaign. No drift, no orphaned posts, no open loops.",
								},
							]}
						/>
					</div>
				</section>
			</section>

			{/* ─── FINAL CTA ────────────────────────────────────────────────── */}
			<section className="relative overflow-hidden bg-ink text-background-elev wavy">
				<div
					aria-hidden
					className="absolute inset-0 top-2.5! -z-10 opacity-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-24 lg:py-32 pb-32! lg:pb-42!">
					<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 items-end">
						<div className="col-span-12 lg:col-span-8">
							<h2 className="font-display text-[44px] sm:text-[56px] lg:text-[80px] leading-[0.98] tracking-[-0.025em]">
								Stop refreshing.
								<br />
								<span className="text-peach-300">Start answering.</span>
							</h2>
						</div>
						<div className="col-span-12 lg:col-span-4 flex flex-col gap-4 lg:items-end">
							<Link
								href={routes.signin}
								className="inline-flex items-center gap-2 h-14 px-7 rounded-full font-medium text-[15px] bg-primary transition-colors"
							>
								Start free — no card
								<ArrowRight className="w-4 h-4" />
							</Link>
							<Link
								href={routes.tools.bestTimeFinder}
								className="pencil-link inline-flex items-center gap-2 text-[14.5px] font-medium"
							>
								Try the free best-time finder
								<ArrowUpRight className="w-4 h-4" />
							</Link>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
