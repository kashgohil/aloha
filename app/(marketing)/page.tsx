import { JsonLd } from "@/lib/json-ld";
import { routes } from "@/lib/routes";
import { faqJsonLd, makeMetadata, softwareApplicationJsonLd } from "@/lib/seo";
import { ArrowRight, ArrowUpRight, Check, Smile, Sparkle } from "lucide-react";
import Link from "next/link";
import { SOCIAL_ICONS } from "./_components/social-icons";
import { EngageInbox } from "./engage-inbox";
import { FaqList } from "./faq-list";

export const metadata = makeMetadata({
	title: "The calm social media OS — with Muse, the AI that sounds like you",
	description:
		"Aloha is the quiet operator behind creators who post on six platforms and still have a life. Plan, write, schedule, automate — with Muse, the voice model trained on your own writing.",
	path: routes.home,
});

const FAQ = [
	{
		q: "Is there really a free plan, or is this a trial in disguise?",
		a: "Really free. Three channels, the AI companion with 50 generations a month, full scheduling and calendar. No card. We only ask for a card when you pick a paid plan.",
	},
	{
		q: "Will I lose my queue if I downgrade?",
		a: "Nothing is deleted. Posts past your plan's limits pause until you publish or remove them — your content is always yours.",
	},
	{
		q: "Do you support teams and client approvals?",
		a: "Yes. Roles, draft approvals, and per-brand permissions ship on the Team plan. Agencies can also separate clients into fully isolated workspaces.",
	},
	{
		q: "How is Aloha different from Buffer or Kit?",
		a: "We borrow the clarity, and add a visual automation matrix so your first post to a new follower doesn't have to be manual. Consider us the quiet operator between the two.",
	},
	{
		q: "What happens to my analytics when a platform changes its API?",
		a: "Historical data stays. For new data we fall back to what the platform permits and flag any gap in the dashboard — no silent blanks.",
	},
	{
		q: "Can I export everything?",
		a: "CSV for analytics, JSON for posts, ICS for the calendar. One click, no email-us-for-a-link.",
	},
];

export default function LandingPage() {
	return (
		<>
			<JsonLd
				data={[
					softwareApplicationJsonLd({
						name: "Aloha",
						path: routes.home,
						description:
							"Aloha is a calm social media OS for creators and communities. Schedule across Instagram, LinkedIn, X, TikTok, Threads, Facebook, Pinterest, YouTube, and Medium from one draft; automate first-follower DMs with the Logic Matrix; see analytics that tell you what to do next.",
						applicationCategory: "BusinessApplication",
					}),
					faqJsonLd(FAQ.map((f) => ({ q: f.q, a: f.a }))),
				]}
			/>
			{/* ─── HERO ──────────────────────────────────────────────────────── */}
			<section className="bg-peach-200 wavy min-h-[calc(100vh-72px)]">
				<div className="relative flex-1 max-w-[1320px] w-full mx-auto px-6 lg:px-10 pt-16 lg:pt-28 pb-20 lg:pb-32 grid grid-cols-12 gap-x-0 gap-y-12 lg:gap-8 items-end">
					<div className="col-span-12 lg:col-span-7 relative">
						<div className="inline-flex items-center gap-2 mb-6 lg:mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/70">
							The calm social media OS
						</div>

						<h1 className="font-display font-normal text-ink leading-[0.95] sm:leading-[1.02] tracking-[-0.035em] text-[44px] sm:text-[72px] lg:text-[112px]">
							Show up
							<br />
							everywhere
							<span className="text-ink/70">,</span>
							<br />
							<span className="text-primary font-light">without losing</span>
							<br />
							<span className="text-primary font-light">yourself to it.</span>
						</h1>

						<p className="mt-6 lg:mt-10 max-w-[520px] text-[15.5px] lg:text-[18px] leading-[1.55] text-ink/70">
							Aloha is the quiet operator behind creators who post on six
							platforms and still have a life. Plan, write, schedule, automate —
							and get the afternoon back.
						</p>

						<div className="mt-8 lg:mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
							<Link
								href="/auth/signin"
								className="inline-flex items-center gap-2 h-14 px-7 rounded-full bg-primary text-primary-foreground font-medium text-[15px] shadow-[0_8px_0_-2px_rgba(46,42,133,0.35)] hover:shadow-[0_10px_0_-2px_rgba(46,42,133,0.4)] hover:-translate-y-0.5 transition-all"
							>
								Start free — no card
								<ArrowRight className="w-4 h-4" />
							</Link>
							<a
								href="#product"
								className="pencil-link inline-flex items-center gap-2 text-[15px] font-medium text-ink"
							>
								See it work
								<ArrowUpRight className="w-4 h-4" />
							</a>
						</div>
					</div>

					{/* Hero visual — campaign card */}
					<div className="col-span-12 lg:col-span-5 relative">
						<div className="relative animate-[float-soft_9s_ease-in-out_infinite]">
							<div className="rounded-3xl bg-background-elev border border-border-strong shadow-[0_30px_60px_-20px_rgba(23,20,18,0.25)] overflow-hidden">
								{/* top bar */}
								<div className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3 border-b border-border bg-muted/40">
									<div className="flex items-center gap-2 text-[10px] sm:text-[10.5px] font-mono uppercase tracking-[0.14em] sm:tracking-[0.18em] text-ink/70 min-w-0">
										<span className="relative flex w-2 h-2 shrink-0">
											<span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
											<span className="relative w-2 h-2 rounded-full bg-primary" />
										</span>
										<span className="truncate">campaign · monday note</span>
									</div>
									<span className="text-[10px] sm:text-[10.5px] text-ink/65 font-mono shrink-0">
										TUE · 13 APR
									</span>
								</div>

								{/* hero image — editorial */}
								<div className="aspect-5/4 bg-primary-soft relative overflow-hidden">
									<span className="absolute top-4 left-5 text-[10px] font-mono uppercase tracking-[0.2em] text-primary-deep/80">
										Field No. 041
									</span>
									<span className="absolute top-4 right-5 w-8 h-8 rounded-full border border-primary-deep/30 grid place-items-center text-primary-deep/70 font-display text-[15px]">
										✳
									</span>
									<div className="absolute bottom-4 left-5 right-5">
										<p className="font-display text-primary-deep text-[40px] sm:text-[46px] lg:text-[52px] leading-[0.9] tracking-[-0.02em]">
											a monday
											<br />
											<span className="text-primary">note.</span>
										</p>
									</div>
								</div>

								{/* caption */}
								<div className="px-5 py-4 border-b border-border">
									<p className="text-[13.5px] leading-[1.55] text-ink">
										Monday reminder: the thing you're avoiding is usually the
										thing you should write about.{" "}
										<span className="text-primary">#creatorlife</span>
									</p>
								</div>

								{/* distribution table */}
								<div className="px-5 pt-4 pb-5">
									<div className="flex items-center justify-between mb-3">
										<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink/65">
											Shipping to
										</p>
										<p className="text-[10px] font-mono text-ink/70">
											4 networks · on-voice · Muse
										</p>
									</div>

									<ul className="divide-y divide-border">
										{[
											{
												n: "Instagram",
												meta: "1 image · caption",
												t: "09:30 a",
												tone: "bg-primary",
											},
											{
												n: "LinkedIn",
												meta: "long-form · hook rewritten",
												t: "07:45 a",
												tone: "bg-primary",
											},
											{
												n: "X",
												meta: "tightened to 119 chars",
												t: "08:15 a",
												tone: "bg-primary",
											},
											{
												n: "Threads",
												meta: "auto-mirror from IG",
												t: "09:00 a",
												tone: "bg-peach-400",
											},
										].map((p) => (
											<li
												key={p.n}
												className="flex items-start justify-between gap-3 py-2.5 text-[13px]"
											>
												<div className="flex items-start gap-2.5 min-w-0 flex-1">
													<span
														className={`w-1.5 h-1.5 rounded-full shrink-0 mt-2 ${p.tone}`}
													/>
													<div className="min-w-0 flex-1 sm:flex sm:items-baseline sm:gap-3">
														<span className="font-medium text-ink sm:w-[84px] sm:shrink-0 block">
															{p.n}
														</span>
														<span className="text-ink/70 text-[11.5px] sm:text-[12px] block sm:truncate leading-snug">
															{p.meta}
														</span>
													</div>
												</div>
												<span className="text-[11.5px] text-ink/70 font-mono shrink-0 mt-0.5">
													{p.t}
												</span>
											</li>
										))}
									</ul>
								</div>

								{/* footer */}
								<div className="px-4 sm:px-5 py-3 border-t border-border bg-muted/40 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
									<span className="text-[11px] text-ink/70">ready to ship</span>
									<div className="flex items-center gap-3 flex-wrap">
										<span
											aria-hidden
											className="text-[11.5px] text-ink/70 pencil-link pointer-events-none"
										>
											Preview each
										</span>
										<span
											aria-hidden
											className="inline-flex items-center gap-1.5 h-8 px-3 sm:px-3.5 rounded-full bg-ink text-background text-[11.5px] font-medium pointer-events-none"
										>
											Schedule all
											<ArrowRight className="w-3 h-3" />
										</span>
									</div>
								</div>
							</div>

							{/* single floating notification — flows inline on mobile, floats absolutely on sm+ */}
							<div className="mt-4 sm:mt-0 sm:absolute sm:-bottom-5 sm:-left-6 lg:-left-10 inline-flex items-center gap-2.5 bg-background-elev text-ink border border-border-strong rounded-full pl-3 pr-4 py-2 shadow-[0_14px_30px_-16px_rgba(23,20,18,0.35)] sm:-rotate-3">
								<span className="relative flex w-2 h-2 shrink-0">
									<span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
									<span className="relative w-2 h-2 rounded-full bg-primary" />
								</span>
								<span className="text-[11.5px] font-medium">
									+248 impressions
								</span>
								<span className="text-[11px] text-ink/65 font-mono">
									LinkedIn · 2h
								</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ─── MANIFESTO PULLQUOTE ───────────────────────────────────────── */}
			<section className="bg-peach-200">
				<div className="py-20 pb-28 sm:py-24 sm:pb-32 lg:py-32 lg:pb-40 bg-background wavy">
					<div className="max-w-4xl mx-auto px-6 text-center">
						<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/65 mb-6 sm:mb-8">
							Why we built this
						</p>
						<blockquote className="font-display text-[26px] sm:text-[42px] lg:text-[54px] leading-[1.15] sm:leading-[1.08] tracking-[-0.02em] text-ink">
							I started Aloha the week a founder I loved quietly
							<span className="text-primary"> quit posting. </span>
							Not because she stopped having things to say — because the tools
							had made the saying{" "}
							<span className="text-peach-400">joyless</span>. I'm trying to
							undo that.
						</blockquote>
						<div className="mt-10 flex items-center justify-center gap-3 text-[13px] text-ink/70">
							<span className="w-8 h-px bg-ink/30" />
							<span className="font-display text-[15px] text-ink">
								kash, founder
							</span>
							<span className="w-8 h-px bg-ink/30" />
						</div>
					</div>
				</div>
			</section>

			{/* ─── FEATURE · PUBLISH (peach block) ────────────────────────────── */}
			<section id="product" className="relative bg-background-elev">
				<div className="bg-peach-200 pb-8 wavy">
					<div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-20 lg:py-32 grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 items-center">
						<div className="col-span-12 lg:col-span-5">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/70 mb-6">
								Publish
							</p>
							<h2 className="font-display text-[36px] sm:text-[44px] lg:text-[64px] leading-[0.96] tracking-[-0.025em] text-ink">
								Write once.
								<br />
								<span className="text-primary">Tailor everywhere.</span>
							</h2>
							<p className="mt-8 max-w-[440px] text-[16.5px] leading-[1.55] text-ink/75">
								The Composer, powered by{" "}
								<span className="font-medium text-ink">Muse</span>, writes a
								native version for each platform in the tone you've taught it —
								long for LinkedIn, sharp for X, soft for Instagram — without
								turning one post into six jobs.
							</p>

							<ul className="mt-10 space-y-4 text-[15px]">
								{[
									"Per-platform previews that actually match what will ship.",
									"Muse — a voice model trained on your own posts, not a template library.",
									"Queues, calendar, and grid view — pick the one your brain prefers.",
								].map((t) => (
									<li key={t} className="flex items-start gap-3">
										<Check
											className="w-5 h-5 mt-0.5 text-primary shrink-0"
											strokeWidth={2.5}
										/>
										<span className="text-ink/80">{t}</span>
									</li>
								))}
							</ul>

							<a
								href={routes.product.composer}
								className="pencil-link inline-flex mt-10 items-center gap-2 text-[15px] font-medium text-ink"
							>
								Take the Composer tour
								<ArrowUpRight className="w-4 h-4" />
							</a>
						</div>

						<div className="col-span-12 lg:col-span-7">
							{/* Calendar mock */}
							<div className="rounded-3xl bg-background-elev border border-ink/10 shadow-[0_30px_60px_-28px_rgba(23,20,18,0.25)] p-4 sm:p-5 lg:p-7 overflow-hidden">
								<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
									<div>
										<p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/65">
											This week
										</p>
										<p className="font-display text-[22px] leading-tight">
											April 13 — 19
										</p>
									</div>
									<div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11.5px] sm:text-[12px] text-ink/70">
										<span className="inline-flex items-center gap-1.5">
											<span className="w-2 h-2 rounded-full bg-primary" />{" "}
											Scheduled
										</span>
										<span className="inline-flex items-center gap-1.5">
											<span className="w-2 h-2 rounded-full bg-peach-400" />{" "}
											Published
										</span>
										<span className="inline-flex items-center gap-1.5">
											<span className="w-2 h-2 rounded-full bg-peach-200" />{" "}
											Draft
										</span>
									</div>
								</div>

								{(() => {
									const days = [
										"MON",
										"TUE",
										"WED",
										"THU",
										"FRI",
										"SAT",
										"SUN",
									];
									const dayItems = (i: number) =>
										[
											{
												c: "bg-primary/90 text-white",
												t: "IG",
												label: "Instagram",
												v: i % 2 === 0,
											},
											{
												c: "bg-peach-400 text-ink",
												t: "X",
												label: "X",
												v: i % 3 !== 0,
											},
											{
												c: "bg-peach-200 text-ink",
												t: "LI",
												label: "LinkedIn",
												v: i === 2 || i === 4,
											},
										].filter((x) => x.v);

									return (
										<>
											{/* Mobile: vertical day list, full content visible */}
											<ul className="sm:hidden divide-y divide-border">
												{days.map((d, i) => {
													const items = dayItems(i);
													return (
														<li
															key={d}
															className="py-3 flex items-start gap-3 first:pt-0 last:pb-0"
														>
															<div className="w-12 shrink-0 pt-0.5">
																<p className="text-[9.5px] font-semibold tracking-[0.15em] text-ink/65">
																	{d}
																</p>
																<p className="font-display text-[18px] leading-none mt-0.5 text-ink">
																	{13 + i}
																</p>
															</div>
															<div className="flex-1 min-w-0 flex flex-wrap gap-1.5">
																{items.length === 0 ? (
																	<span className="text-[11.5px] text-ink/70 italic mt-1">
																		— rest day
																	</span>
																) : (
																	items.map((item, ix) => (
																		<span
																			key={ix}
																			className={`inline-flex items-center gap-1.5 rounded-md ${item.c} text-[10.5px] font-semibold px-2 py-1`}
																		>
																			<span>{item.label}</span>
																			<span className="opacity-70 font-mono">
																				09:{20 + ix * 10}
																			</span>
																		</span>
																	))
																)}
															</div>
														</li>
													);
												})}
											</ul>

											{/* sm and up: 7-column week grid */}
											<div className="hidden sm:grid grid-cols-7 gap-2 lg:gap-3">
												{days.map((d, i) => {
													const items = dayItems(i);
													return (
														<div key={d} className="space-y-2 min-w-0">
															<div className="flex items-baseline justify-between">
																<span className="text-[10px] font-semibold tracking-[0.15em] text-ink/65">
																	{d}
																</span>
																<span className="font-display text-[14px] text-ink">
																	{13 + i}
																</span>
															</div>
															<div className="rounded-xl bg-muted/60 h-40 lg:h-48 p-2 space-y-1.5 border border-ink/5">
																{items.map((item, ix) => (
																	<div
																		key={ix}
																		className={`rounded-md ${item.c} text-[9px] font-semibold px-1.5 py-1 flex items-center justify-between gap-1 min-w-0`}
																	>
																		<span>{item.t}</span>
																		<span className="opacity-70 font-mono">
																			09:{20 + ix * 10}
																		</span>
																	</div>
																))}
															</div>
														</div>
													);
												})}
											</div>
										</>
									);
								})()}
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ─── MUSE SPOTLIGHT ───────────────────────────────────────────── */}
			<section className="bg-background-elev relative wavy">
				<div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-20 lg:py-28 pb-32 lg:pb-40">
					<div className="grid grid-cols-12 gap-x-0 gap-y-8 lg:gap-10 items-end mb-10 lg:mb-14">
						<div className="col-span-12 lg:col-span-7">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/70 mb-4 inline-flex items-center gap-2">
								<Sparkle className="w-3 h-3 text-primary" />
								Meet Muse
							</p>
							<h2 className="font-display text-[36px] sm:text-[44px] lg:text-[60px] leading-[0.98] tracking-[-0.025em] text-ink">
								The AI that sounds
								<br />
								<span className="text-primary">like you wrote it.</span>
							</h2>
						</div>
						<p className="col-span-12 lg:col-span-4 text-[15.5px] text-ink/70 leading-[1.6]">
							Muse is the voice model inside Composer. Trained on your own
							writing, native to every channel. Opening in invite-only beta —
							join the wishlist if you want in.
						</p>
					</div>

					<ul className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
						{[
							{
								t: "Writes in your cadence",
								d: "Trained on the posts you marked as sounding like you — not a generic tone library.",
							},
							{
								t: "Native to every channel",
								d: "LinkedIn long, X short, TikTok hook, Instagram soft — from one draft, in one stream.",
							},
							{
								t: "Whole-campaign brain",
								d: "Beat sheets, fan-out, best-time + virality scoring, inbox replies. All in your style.",
							},
						].map((c) => (
							<li
								key={c.t}
								className="rounded-3xl bg-background border border-border p-7 lg:p-8 flex flex-col"
							>
								<p className="font-display text-[22px] leading-tight tracking-[-0.005em]">
									{c.t}
								</p>
								<p className="mt-3 text-[13.5px] text-ink/70 leading-[1.6]">
									{c.d}
								</p>
							</li>
						))}
					</ul>

					<div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-[14px]">
						<Link
							href={routes.pricing}
							className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-ink text-background-elev font-medium text-[13.5px] hover:bg-primary transition-colors"
						>
							Request Muse beta access
							<ArrowRight className="w-4 h-4" />
						</Link>
						<Link
							href={routes.product.composer}
							className="pencil-link inline-flex items-center gap-1.5 font-medium text-ink"
						>
							See Muse inside Composer <ArrowUpRight className="w-4 h-4" />
						</Link>
					</div>
				</div>
			</section>

			{/* ─── FEATURE · ANALYZE (cream, inverted layout) ─────────────────── */}
			<section className="bg-ink">
				<div className="py-24 pb-32 lg:py-32 lg:pb-40 wavy bg-background">
					<div className="max-w-[1320px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 items-center">
						<div className="col-span-12 lg:col-span-7 order-2 lg:order-1">
							{/* Analytics mock */}
							<div className="rounded-3xl bg-background-elev border border-border p-5 sm:p-7 lg:p-9 overflow-hidden">
								<div className="flex items-start justify-between mb-6">
									<div>
										<p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/65">
											Reach · last 30 days
										</p>
										<p className="font-display text-[40px] leading-none mt-2">
											421.8<span className="text-ink/70">K</span>
										</p>
									</div>
									<span className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary bg-primary-soft px-2.5 py-1 rounded-full">
										<ArrowUpRight className="w-3 h-3" /> +28.4%
									</span>
								</div>

								{/* bar chart, pure svg */}
								<svg
									aria-hidden
									viewBox="0 0 600 180"
									className="w-full h-44"
								>
									{Array.from({ length: 30 }).map((_, i) => {
										const h =
											40 + Math.abs(Math.sin(i * 0.7)) * 110 + (i % 4) * 6;
										return (
											<rect
												key={i}
												x={i * 20 + 3}
												y={180 - h}
												width={14}
												height={h}
												rx={3}
												className={i === 22 ? "fill-primary" : "fill-ink/15"}
											/>
										);
									})}
									<line
										x1="0"
										y1="179"
										x2="600"
										y2="179"
										stroke="currentColor"
										className="text-ink/15"
									/>
								</svg>

								<div className="mt-6 grid grid-cols-3 sm:divide-x sm:divide-border gap-y-4 gap-x-3 sm:gap-x-0">
									{[
										{ l: "Followers", v: "62,109", d: "+4.1%" },
										{ l: "Engagement", v: "7.83%", d: "+0.4pp" },
										{ l: "Best window", v: "Tue 9a", d: "stable" },
									].map((s, i) => (
										<div
											key={i}
											className="sm:px-5 sm:first:pl-0 sm:last:pr-0 min-w-0"
										>
											<p className="text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] sm:tracking-[0.2em] text-ink/65">
												{s.l}
											</p>
											<p className="font-display text-[18px] sm:text-[22px] mt-1">
												{s.v}
											</p>
											<p className="text-[12px] text-ink/70 mt-0.5">{s.d}</p>
										</div>
									))}
								</div>
							</div>
						</div>

						<div className="col-span-12 lg:col-span-5 order-1 lg:order-2 lg:pl-8">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/70 mb-6">
								Analyze
							</p>
							<h2 className="font-display text-[36px] sm:text-[44px] lg:text-[64px] leading-[0.96] tracking-[-0.025em] text-ink">
								The numbers
								<br />
								<span className="text-primary">that matter.</span>
							</h2>
							<p className="mt-8 max-w-[460px] text-[16.5px] leading-[1.55] text-ink/75">
								Skip the vanity dashboard. Aloha ships reports you can forward
								to a skeptical boss — follower quality, best windows, the three
								posts that earned 80% of the attention.
							</p>

							<div className="mt-10 grid grid-cols-2 gap-6 max-w-[460px]">
								{[
									{
										n: "01",
										t: "Content autopsy",
										d: "What worked, quantified.",
									},
									{
										n: "02",
										t: "Channel compare",
										d: "Side by side, not stacked bars.",
									},
									{
										n: "03",
										t: "Audience shape",
										d: "Who followed because of which post.",
									},
									{
										n: "04",
										t: "Client reports",
										d: "Branded PDFs. One click.",
									},
								].map((x) => (
									<div key={x.n} className="border-t border-ink/15 pt-3">
										<p className="font-display text-[13px] text-ink/65">
											{x.n}
										</p>
										<p className="mt-1 font-medium text-[15px]">{x.t}</p>
										<p className="mt-1 text-[13px] text-ink/70 leading-snug">
											{x.d}
										</p>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ─── FEATURE · AUTOMATE (dark ink block) ────────────────────────── */}
			<section className="bg-primary-soft">
				<section className="relative pb-8 bg-ink text-background-elev wavy">
					<div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-24 lg:py-32 grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 items-center">
						<div className="col-span-12 lg:col-span-5">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-peach-200 mb-6">
								Automate
							</p>
							<h2 className="font-display text-[36px] sm:text-[44px] lg:text-[64px] leading-[0.96] tracking-[-0.025em]">
								Wire a routine
								<br />
								<span className="text-peach-300">once.</span> Sleep through it
								<br />
								<span className="text-peach-300">every week after.</span>
							</h2>
							<p className="mt-8 max-w-[480px] text-[16.5px] leading-[1.55] text-background-elev/80">
								The Logic Matrix is a drag-to-connect flow for the things you'd
								otherwise forget to do — welcome DMs, cross-posts, re-queues,
								warm replies to comments that deserve one.
							</p>
							<Link
								href={routes.product.logicMatrix}
								className="pencil-link inline-flex mt-10 items-center gap-2 text-[15px] font-medium text-peach-300"
							>
								Poke at a live blueprint
								<ArrowUpRight className="w-4 h-4" />
							</Link>
						</div>

						<div className="col-span-12 lg:col-span-7">
							{/* flow mock */}
							<div className="relative rounded-3xl border border-background-elev/15 bg-background-elev/4 p-5 sm:p-6 lg:p-10 overflow-hidden">
								<div className="absolute inset-0 opacity-30 bg-[linear-gradient(rgba(255,253,247,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,253,247,0.07)_1px,transparent_1px)]" />
								<div className="relative grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
									{[
										{
											t: "TRIGGER",
											h: "New follower",
											c: "bg-peach-300 text-ink",
										},
										{
											t: "DELAY",
											h: "Wait 2 hours",
											c: "bg-background-elev/10 text-background-elev",
										},
										{
											t: "ACTION",
											h: "Send welcome DM",
											c: "bg-primary text-white",
										},
										{
											t: "ACTION",
											h: "Tag as 'new'",
											c: "bg-background-elev/10 text-background-elev",
										},
										{
											t: "BRANCH",
											h: "Did they reply?",
											c: "bg-peach-200 text-ink",
										},
										{
											t: "ACTION",
											h: "Queue a thank-you",
											c: "bg-peach-100 text-ink",
										},
									].map((n, i) => (
										<div
											key={i}
											className={`rounded-2xl p-3 sm:p-4 ${n.c} shadow-[0_14px_30px_-16px_rgba(0,0,0,0.55)] min-w-0`}
										>
											<p className="text-[9.5px] sm:text-[10px] font-semibold tracking-[0.18em] sm:tracking-[0.2em] opacity-70">
												{n.t}
											</p>
											<p className="font-display text-[16px] sm:text-[19px] mt-1.5 sm:mt-2 leading-tight">
												{n.h}
											</p>
											<div className="mt-2 sm:mt-3 flex items-center justify-between text-[10.5px] sm:text-[11px] font-mono opacity-80">
												<span>node.{String(i + 1).padStart(2, "0")}</span>
												<span>●</span>
											</div>
										</div>
									))}
								</div>
								<div className="relative mt-6 flex items-center justify-between text-[12px] text-background-elev/75 font-mono">
									<span>RUNNING — last tick 3s ago</span>
									<span>17 people in flight</span>
								</div>
							</div>
						</div>
					</div>
				</section>
			</section>

			{/* ─── FEATURE · ENGAGE (primary-soft block) ──────────────────────── */}
			<section className="bg-background">
				<section className="bg-primary-soft pb-8 wavy">
					<div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-24 lg:py-32 grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 items-center">
						<div className="col-span-12 lg:col-span-7">
							<EngageInbox />
						</div>

						<div className="col-span-12 lg:col-span-5 lg:pl-6">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/70 mb-6">
								Engage
							</p>
							<h2 className="font-display text-[36px] sm:text-[44px] lg:text-[64px] leading-[0.96] tracking-[-0.025em] text-ink">
								One inbox.
								<br />
								<span className="text-primary">Every platform.</span>
								<br />
								<span className="text-primary">No tabs.</span>
							</h2>
							<p className="mt-8 max-w-[440px] text-[16.5px] leading-[1.55] text-ink/75">
								Comments, DMs, mentions — sorted by what deserves a human reply
								and what you can close with a heart. Save templates for the
								thirty-seventh "how did you make that?"
							</p>
						</div>
					</div>
				</section>
			</section>

			{/* ─── CHANNELS ───────────────────────────────────────────────────── */}
			<section id="channels" className="py-24 lg:py-28 wavy">
				<div className="max-w-[1320px] mx-auto px-6 lg:px-10">
					<div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
						<div>
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/70 mb-4">
								Channels
							</p>
							<h2 className="font-display text-[30px] sm:text-[36px] lg:text-[48px] leading-[1.05] sm:leading-none tracking-[-0.02em] max-w-xl">
								Wherever you publish,
								<span className="text-primary"> we already live there.</span>
							</h2>
						</div>
						<p className="text-[14px] text-ink/70 max-w-sm">
							Generate content for all twelve platforms. Connect and
							auto-publish for the ones marked{" "}
							<span className="inline-flex items-center gap-1">
								<span className="w-2 h-2 rounded-full bg-ink" /> Live
							</span>
							. More connections shipping as platform approvals land.
						</p>
					</div>

					<ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 border-t border-l border-border">
						{[
							// Live: auto-publish ready
							{
								n: "LinkedIn",
								tag: "Company · Personal",
								status: "live" as const,
							},
							{ n: "X", tag: "Threads · Long-form", status: "live" as const },
							{ n: "Bluesky", tag: "Feeds · Threads", status: "live" as const },
							{
								n: "Mastodon",
								tag: "Federated · Open",
								status: "live" as const,
							},
							// AI-ready: generate content, connect coming soon
							{
								n: "Instagram",
								tag: "AI-ready · Connect soon",
								status: "ai-ready" as const,
							},
							{
								n: "TikTok",
								tag: "AI-ready · Connect soon",
								status: "ai-ready" as const,
							},
							{
								n: "Threads",
								tag: "AI-ready · Connect soon",
								status: "ai-ready" as const,
							},
							{
								n: "Facebook",
								tag: "AI-ready · Connect soon",
								status: "ai-ready" as const,
							},
							{
								n: "Pinterest",
								tag: "AI-ready · Connect soon",
								status: "ai-ready" as const,
							},
							{
								n: "YouTube",
								tag: "AI-ready · Connect soon",
								status: "ai-ready" as const,
							},
							{
								n: "Medium",
								tag: "AI-ready · Connect soon",
								status: "ai-ready" as const,
							},
							{
								n: "Reddit",
								tag: "AI-ready · Connect soon",
								status: "ai-ready" as const,
							},
						].map((c) => {
							const icon = SOCIAL_ICONS.find((i) => i.n === c.n);
							const isLive = c.status === "live";
							return (
								<li
									key={c.n}
									className="p-5 sm:p-6 lg:p-7 flex items-start justify-between gap-3 group hover:bg-muted/40 transition-colors border-r border-b border-border min-w-0"
								>
									<div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 min-w-0">
										{icon && (
											<span className="w-9 h-9 sm:w-10 sm:h-10 grid place-items-center rounded-full border border-border-strong text-ink group-hover:bg-ink group-hover:text-background-elev group-hover:border-ink transition-colors shrink-0">
												<svg
													viewBox="0 0 24 24"
													className="w-[14px] h-[14px] sm:w-[15px] sm:h-[15px]"
													fill={icon.custom ? undefined : "currentColor"}
												>
													{icon.custom ?? <path d={icon.path} />}
												</svg>
											</span>
										)}
										<div className="min-w-0">
											<p className="font-display text-[20px] sm:text-[24px] lg:text-[26px] leading-none tracking-[-0.015em] break-words">
												{c.n}
											</p>
											<p className="mt-1.5 sm:mt-2 text-[12px] sm:text-[12.5px] text-ink/70">
												{c.tag}
											</p>
										</div>
									</div>
									<span
										className={`w-2 h-2 rounded-full mt-2 sm:mt-3 group-hover:scale-125 transition-transform shrink-0 ${
											isLive ? "bg-ink" : "bg-peach-400"
										}`}
									/>
								</li>
							);
						})}
					</ul>
					<div className="mt-8 text-[13px] text-ink/70 flex flex-wrap items-center gap-x-4 gap-y-2">
						<span className="inline-flex items-center gap-2">
							<span className="w-2 h-2 rounded-full bg-ink" />
							<span className="font-medium text-ink">Live</span> — Connect &
							auto-publish
						</span>
						<span className="inline-flex items-center gap-2">
							<span className="w-2 h-2 rounded-full bg-peach-400" />
							<span className="font-medium text-ink">AI-ready</span> — Generate
							now, connect soon
						</span>
						<span className="inline-flex items-center gap-2 ml-auto">
							<Sparkle className="w-3.5 h-3.5 text-primary shrink-0" />
							Coming: Substack Notes
						</span>
					</div>
				</div>
			</section>

			{/* ─── STATS BAND (indigo) ────────────────────────────────────────── */}
			<section className="bg-primary text-primary-foreground">
				<div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-16 sm:py-20 lg:py-24 grid grid-cols-2 lg:grid-cols-4 lg:divide-x divide-white/20 gap-y-10 gap-x-6">
					{[
						{ v: "Apr '26", l: "Public launch", s: "fresh out of beta" },
						{ v: "Solo", l: "One builder", s: "from Bengaluru, India" },
						{ v: "Free", l: "Forever tier", s: "three channels, no card" },
						{ v: "Soon", l: "Status page", s: "live health at /status" },
					].map((s, i) => (
						<div
							key={i}
							className="lg:px-6 lg:first:pl-0 lg:last:pr-0 lg:py-4 min-w-0"
						>
							<p className="font-display text-[40px] sm:text-[56px] lg:text-[84px] leading-[0.95] tracking-[-0.03em]">
								{s.v}
							</p>
							<p className="mt-3 text-[13px] font-medium">{s.l}</p>
							<p className="text-[12px] text-white/80">{s.s}</p>
						</div>
					))}
				</div>
			</section>

			{/* ─── EARLY DAYS (replaces testimonials) ─────────────────────── */}
			<section className="bg-peach-200">
				<section
					id="stories"
					className="pb-24 sm:pb-8 bg-background-elev py-24 lg:py-32 wavy"
				>
					<div className="max-w-[1320px] mx-auto px-6 lg:px-10">
						<div className="max-w-3xl mb-16">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/70 mb-4">
								Early days
							</p>
							<h2 className="font-display text-[30px] sm:text-[36px] lg:text-[52px] leading-[1.05] sm:leading-none tracking-[-0.02em]">
								No user stories to share
								<span className="text-primary"> yet.</span>
							</h2>
							<p className="mt-6 text-[16px] sm:text-[17px] text-ink/75 leading-[1.6] max-w-2xl">
								Aloha just launched. When real creators send something worth
								quoting, I'll put it here — nothing paid, nothing invented.
								Until then, here's what you'd actually see if you signed up
								today.
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
							{[
								{
									h: "Every feature on this page ships today",
									p: "Composer, voice model, calendar, link-in-bio, analytics, automations — all live on the free tier or Basic.",
									bg: "bg-peach-100",
								},
								{
									h: "One inbox, answered by the person who wrote the code",
									p: "hello@usealoha.app reaches me directly. I read every note and reply, usually the same day.",
									bg: "bg-primary-soft",
								},
								{
									h: "The product changes in public",
									p: "What shipped, what broke, what's next — on the changelog. No 'coming soon' that quietly never comes.",
									bg: "bg-peach-300",
								},
							].map((c) => (
								<article
									key={c.h}
									className={`p-7 lg:p-8 rounded-3xl ${c.bg} flex flex-col`}
								>
									<p className="font-display text-[20px] lg:text-[22px] leading-[1.2] tracking-[-0.005em]">
										{c.h}
									</p>
									<p className="mt-4 text-[14.5px] text-ink/75 leading-[1.55]">
										{c.p}
									</p>
								</article>
							))}
						</div>

						<div className="mt-16 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pt-10 border-t border-border">
							<p className="font-display text-[22px] lg:text-[26px] leading-[1.2] tracking-[-0.01em] max-w-xl">
								Want to be the first name here?
								<span className="text-ink/70"> Free tier, no card.</span>
							</p>
							<div className="flex items-center gap-5">
								<Link
									href="/auth/signin"
									className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
								>
									Start free
									<ArrowRight className="w-4 h-4" />
								</Link>
							</div>
						</div>
					</div>
				</section>
			</section>

			{/* ─── PLANS (Free today, Muse by invite) ─────────────────────────── */}
			<section
				id="pricing"
				className="bg-peach-200 py-24 pb-32 lg:py-32 lg:pb-40 wavy"
			>
				<div className="max-w-[1320px] mx-auto px-6 lg:px-10">
					<div className="grid grid-cols-12 gap-x-0 gap-y-6 lg:gap-10 mb-12 lg:mb-14">
						<div className="col-span-12 lg:col-span-5">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/70 mb-4">
								Pricing
							</p>
							<h2 className="font-display text-[32px] sm:text-[40px] lg:text-[56px] leading-[0.98] tracking-[-0.02em]">
								Free to start.
								<br />
								<span className="text-primary">Muse beta by invite.</span>
							</h2>
						</div>
						<p className="col-span-12 lg:col-span-6 lg:col-start-7 text-[16px] text-ink/70 leading-[1.6]">
							Aloha is free right now — connect up to 3 channels, schedule
							posts, use the AI companion. Muse (the AI that writes in your
							voice) is opening to a small beta group first. Paid tiers land
							when Muse is generally available.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
						<article className="rounded-3xl bg-peach-100 p-8 lg:p-10 flex flex-col">
							<Smile className="w-6 h-6 text-ink" />
							<p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
								Available now
							</p>
							<h3 className="mt-2 font-display text-[30px] leading-tight">
								Free
							</h3>
							<p className="mt-1 text-[13px] text-ink/70">
								Three channels, no card, no expiry
							</p>
							<p className="mt-5 text-[14.5px] text-ink/80 leading-[1.55]">
								Everything you need to start publishing — scheduling, calendar,
								link-in-bio, and an AI companion with 50 generations a month.
							</p>
							<ul className="mt-7 space-y-2.5 text-[13.5px] text-ink/80 flex-1">
								{[
									"3 connected channels",
									"AI companion · 50 generations / mo",
									"Scheduling + calendar + link-in-bio",
									"Basic analytics (30 days)",
									"Community support",
								].map((f) => (
									<li key={f} className="flex items-start gap-2.5">
										<Check
											className="w-3.5 h-3.5 mt-[3px] text-ink/70 shrink-0"
											strokeWidth={2.5}
										/>
										{f}
									</li>
								))}
							</ul>
							<div className="mt-8 pt-6 border-t border-ink/10">
								<p className="text-[12.5px] text-ink/65 mb-4">
									<span className="font-medium text-ink">Free forever</span>
									<span className="text-ink/65"> · no card, no expiry</span>
								</p>
								<Link
									href={routes.signup}
									className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full font-medium text-[13.5px] transition-colors w-full bg-ink text-background-elev hover:bg-primary"
								>
									Get going
									<ArrowRight className="w-4 h-4" />
								</Link>
							</div>
						</article>

						<article className="rounded-3xl bg-peach-300 p-8 lg:p-10 flex flex-col">
							<Sparkle className="w-6 h-6 text-ink" />
							<p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
								Coming soon · invite only
							</p>
							<h3 className="mt-2 font-display text-[30px] leading-tight">
								Muse
							</h3>
							<p className="mt-1 text-[13px] text-ink/70">
								AI that actually sounds like you
							</p>
							<p className="mt-5 text-[14.5px] text-ink/80 leading-[1.55]">
								Muse learns from your writing and generates content in your
								voice — per channel, native to every platform. We're opening the
								beta to a small group first. Paid tiers land when Muse is
								generally available.
							</p>
							<ul className="mt-7 space-y-2.5 text-[13.5px] text-ink/80 flex-1">
								{[
									"Style-trained voice per channel",
									"Per-channel native variants",
									"Fan-out + advanced campaigns",
									"Best-time, virality, commentary",
									"Inbox replies in your style",
								].map((f) => (
									<li key={f} className="flex items-start gap-2.5">
										<Check
											className="w-3.5 h-3.5 mt-[3px] text-ink/70 shrink-0"
											strokeWidth={2.5}
										/>
										{f}
									</li>
								))}
							</ul>
							<div className="mt-8 pt-6 border-t border-ink/10">
								<p className="text-[12.5px] text-ink/65 mb-4">
									<span className="font-medium text-ink">
										Join the Muse beta wishlist
									</span>
									<span className="text-ink/65">
										{" "}
										· we'll pick select participants
									</span>
								</p>
								<Link
									href={routes.pricing}
									className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full font-medium text-[13.5px] transition-colors w-full bg-primary text-primary-foreground hover:bg-primary-deep"
								>
									Request beta access
									<ArrowRight className="w-4 h-4" />
								</Link>
							</div>
						</article>
					</div>

					<p className="mt-10 text-[13px] text-ink/70 flex flex-wrap items-center gap-x-6 gap-y-2">
						<span>
							<span className="font-display text-ink">
								Free tier works for every channel we support
							</span>
							<span className="text-ink/70"> — no card, no expiry.</span>
						</span>
						<span className="text-ink/70">·</span>
						<span>
							Muse and Broadcasts are invite-only during beta. Paid tiers to
							follow.
						</span>
					</p>
				</div>
			</section>

			{/* ─── RESOURCES ──────────────────────────────────────────────────── */}
			<section className="bg-primary-soft">
				<div
					id="resources"
					className="bg-background py-24 pb-28 lg:py-28 lg:pb-32 wavy"
				>
					<div className="max-w-[1320px] mx-auto px-6 lg:px-10">
						<div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10 gap-4">
							<div>
								<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/70 mb-4">
									Field notes
								</p>
								<h2 className="font-display text-[30px] sm:text-[36px] lg:text-[48px] leading-[1.05] sm:leading-none tracking-[-0.02em]">
									We write about the work,
									<br />
									<span className="text-primary">not ourselves.</span>
								</h2>
							</div>
							<Link
								href={routes.resources.index}
								className="pencil-link inline-flex items-center gap-2 text-[14px] font-medium self-start md:self-auto"
							>
								Read all field notes <ArrowUpRight className="w-4 h-4" />
							</Link>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
							{[
								{
									tag: "Essay",
									t: "The case against the content calendar",
									d: "What happens when you schedule by feeling, not by slot.",
									read: "7 min",
									bg: "bg-peach-100",
								},
								{
									tag: "Playbook",
									t: "A welcome DM that doesn't feel like a DM",
									d: "Ten templates; the one we actually use; why.",
									read: "4 min",
									bg: "bg-primary-soft",
								},
								{
									tag: "Teardown",
									t: "Why Kit's landing page is a love letter",
									d: "A close read of the best editorial site in SaaS.",
									read: "9 min",
									bg: "bg-peach-200",
								},
							].map((r, i) => (
								<Link
									key={i}
									href={routes.resources.index}
									className="group block"
								>
									<div
										className={`aspect-4/3 rounded-2xl ${r.bg} flex items-end p-6 relative overflow-hidden`}
									>
										<span className="font-display text-[140px] leading-none text-ink/15 absolute -top-10 -right-4 select-none">
											{String(i + 1).padStart(2, "0")}
										</span>
										<span className="text-[10.5px] font-semibold uppercase tracking-[0.2em] bg-background-elev text-ink px-2 py-1 rounded-full relative">
											{r.tag}
										</span>
									</div>
									<h3 className="mt-5 font-display text-[22px] leading-[1.15] tracking-[-0.015em] group-hover:text-primary transition-colors">
										{r.t}
									</h3>
									<p className="mt-2 text-[14px] text-ink/65 leading-normal">
										{r.d}
									</p>
									<p className="mt-3 text-[12px] text-ink/65 font-mono">
										{r.read} read
									</p>
								</Link>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* ─── FAQ ────────────────────────────────────────────────────────── */}
			<section className="bg-ink relative">
				<div
					aria-hidden
					className="absolute inset-0 top-1.5 opacity-20 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<div className="bg-primary-soft py-24 pb-28 lg:py-28 lg:pb-32 wavy">
					<div className="max-w-[1100px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-x-0 gap-y-8 lg:gap-10">
						<div className="col-span-12 lg:col-span-4">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/70 mb-4">
								FAQ
							</p>
							<h2 className="font-display text-[30px] sm:text-[36px] lg:text-[44px] leading-[1.05] sm:leading-[1.02] tracking-[-0.02em]">
								The questions we <br />
								<span className="text-primary">actually get.</span>
							</h2>
							<p className="mt-6 text-[14.5px] text-ink/70 leading-[1.55] max-w-sm">
								Still stuck? Write us at{" "}
								<a
									href="mailto:hello@usealoha.app"
									className="pencil-link text-ink"
								>
									hello@usealoha.app
								</a>{" "}
								— a real human answers within a day.
							</p>
						</div>

						<div className="col-span-12 lg:col-span-8">
							<FaqList items={FAQ} />
						</div>
					</div>
				</div>
			</section>

			{/* ─── FINAL CTA (ink block) ──────────────────────────────────────── */}
			<section className="relative pb-12 bg-ink text-background-elev overflow-hidden wavy">
				<div
					aria-hidden
					className="absolute top-0 left-0 right-0 bottom-0 opacity-20 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<div className="relative max-w-[1320px] mx-auto px-6 lg:px-10 py-20 sm:py-24 lg:py-36 grid grid-cols-12 gap-x-0 gap-y-8 lg:gap-8 items-center">
					<div className="col-span-12 lg:col-span-8">
						<h2 className="font-display text-[40px] sm:text-[68px] lg:text-[104px] leading-[0.95] sm:leading-[0.92] tracking-[-0.03em]">
							Show up
							<span className="text-peach-300"> softer.</span>
							<br />
							Grow <span className="text-peach-300">anyway.</span>
						</h2>
					</div>
					<div className="col-span-12 lg:col-span-4 lg:border-l lg:border-background-elev/20 lg:pl-10 space-y-6">
						<p className="text-[16px] text-background-elev/75 leading-[1.55]">
							Two weeks free. No card, no data hostage, no
							"sales-qualified-lead" email from a man named Brent.
						</p>
						<Link
							href="/auth/signin"
							className="inline-flex items-center gap-2 h-14 px-7 rounded-full bg-peach-300 text-ink font-medium text-[15px] hover:bg-background-elev transition-colors"
						>
							Start free
							<ArrowRight className="w-4 h-4" />
						</Link>
						<p className="text-[12px] text-background-elev/75 font-mono">
							or &nbsp;
							<Link href={routes.company.contact} className="pencil-link">
								book a 20-min walkthrough →
							</Link>
						</p>
					</div>
				</div>
			</section>
		</>
	);
}
