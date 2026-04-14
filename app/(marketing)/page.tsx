import {
	ArrowRight,
	ArrowUpRight,
	Check,
	Flame,
	Leaf,
	Smile,
	Sparkle,
} from "lucide-react";
import Link from "next/link";
import { SOCIAL_ICONS } from "./_components/social-icons";
import { EngageInbox } from "./engage-inbox";
import { FaqList } from "./faq-list";

const FAQ = [
	{
		q: "Is there really a free plan, or is this a trial in disguise?",
		a: "Really free. Up to three channels, ten scheduled posts per channel per month, no card. We only ask for a card when you pick a paid plan.",
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
			{/* ─── HERO ──────────────────────────────────────────────────────── */}
			<header className="relative overflow-hidden bg-peach-200 min-h-[calc(100vh-72px)] flex flex-col">
				{/* sparse decorative marks — Buffer-style playful restraint */}
				<span
					aria-hidden
					className="absolute top-[14%] left-[6%] font-display text-[28px] text-ink/30 rotate-[-8deg] select-none"
				>
					✳
				</span>
				<span
					aria-hidden
					className="absolute top-[70%] left-[12%] font-display text-[22px] text-primary/60 rotate-12 select-none"
				>
					+
				</span>
				<span
					aria-hidden
					className="absolute top-[22%] right-[8%] font-display text-[40px] text-ink/15 rotate-18 select-none"
				>
					✳
				</span>
				<span
					aria-hidden
					className="absolute top-[84%] right-[14%] font-display text-[18px] text-ink/30 select-none"
				>
					※
				</span>
				<span
					aria-hidden
					className="absolute top-[50%] left-[3%] w-2 h-2 rounded-full bg-primary/50"
				/>
				<span
					aria-hidden
					className="absolute top-[10%] right-[26%] w-1.5 h-1.5 rounded-full bg-ink/30"
				/>
				<span
					aria-hidden
					className="absolute top-[58%] right-[4%] w-3 h-3 rounded-full border border-ink/30"
				/>

				<div className="relative flex-1 max-w-[1320px] w-full mx-auto px-6 lg:px-10 pt-16 lg:pt-28 pb-20 lg:pb-32 grid grid-cols-12 gap-x-0 gap-y-12 lg:gap-8 items-end">
					<div className="col-span-12 lg:col-span-7 relative">
						<div className="inline-flex items-center gap-2 mb-6 lg:mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
							The calm social media OS
						</div>

						<h1 className="font-display font-normal text-ink leading-[0.95] sm:leading-[0.92] tracking-[-0.035em] text-[44px] sm:text-[72px] lg:text-[112px]">
							Show up
							<br />
							everywhere
							<span className="text-ink/20">,</span>
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

						<div className="mt-10 lg:mt-12 flex flex-wrap items-center gap-3 sm:gap-5 text-[12.5px] text-ink/60">
							<div className="flex -space-x-2">
								{[
									"bg-peach-100",
									"bg-peach-200",
									"bg-peach-300",
									"bg-peach-400",
									"bg-primary-soft",
								].map((c, i) => (
									<span
										key={i}
										className={`w-7 h-7 rounded-full border-2 border-background ${c} inline-block`}
									/>
								))}
							</div>
							<span>
								<strong className="text-ink font-semibold">140,482</strong>{" "}
								creators posting with Aloha this week.
							</span>
						</div>
					</div>

					{/* Hero visual — campaign card */}
					<div className="col-span-12 lg:col-span-5 relative">
						<div className="relative animate-[float-soft_9s_ease-in-out_infinite]">
							<div className="rounded-3xl bg-background-elev border border-border-strong shadow-[0_30px_60px_-20px_rgba(23,20,18,0.25)] overflow-hidden">
								{/* top bar */}
								<div className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3 border-b border-border bg-muted/40">
									<div className="flex items-center gap-2 text-[10px] sm:text-[10.5px] font-mono uppercase tracking-[0.14em] sm:tracking-[0.18em] text-ink/60 min-w-0">
										<span className="relative flex w-2 h-2 shrink-0">
											<span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
											<span className="relative w-2 h-2 rounded-full bg-primary" />
										</span>
										<span className="truncate">campaign · monday note</span>
									</div>
									<span className="text-[10px] sm:text-[10.5px] text-ink/50 font-mono shrink-0">
										TUE · 13 APR
									</span>
								</div>

								{/* hero image — editorial */}
								<div className="aspect-5/4 bg-primary-soft relative overflow-hidden">
									{/* grain-ish noise via svg */}
									<svg
										aria-hidden
										viewBox="0 0 400 320"
										className="absolute inset-0 w-full h-full opacity-20 mix-blend-multiply"
									>
										<filter id="grain">
											<feTurbulence
												type="fractalNoise"
												baseFrequency="0.9"
												numOctaves="2"
											/>
										</filter>
										<rect width="100%" height="100%" filter="url(#grain)" />
									</svg>
									<span className="absolute top-4 left-5 text-[10px] font-mono uppercase tracking-[0.2em] text-primary-deep/70">
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
										<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink/50">
											Shipping to
										</p>
										<p className="text-[10px] font-mono text-ink/40">
											4 networks · all on voice
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
														<span className="text-ink/55 text-[11.5px] sm:text-[12px] block sm:truncate leading-snug">
															{p.meta}
														</span>
													</div>
												</div>
												<span className="text-[11.5px] text-ink/55 font-mono shrink-0 mt-0.5">
													{p.t}
												</span>
											</li>
										))}
									</ul>
								</div>

								{/* footer */}
								<div className="px-4 sm:px-5 py-3 border-t border-border bg-muted/40 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
									<span className="text-[11px] text-ink/55">ready to ship</span>
									<div className="flex items-center gap-3 flex-wrap">
										<a
											href="#"
											className="text-[11.5px] text-ink/70 pencil-link"
										>
											Preview each
										</a>
										<button className="inline-flex items-center gap-1.5 h-8 px-3 sm:px-3.5 rounded-full bg-ink text-background text-[11.5px] font-medium">
											Schedule all
											<ArrowRight className="w-3 h-3" />
										</button>
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
								<span className="text-[11px] text-ink/50 font-mono">
									LinkedIn · 2h
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* hairline with inline stats */}
				<div className="relative border-y border-border bg-background-elev">
					<div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-5 flex flex-wrap items-center gap-x-5 sm:gap-x-10 gap-y-3 text-[13px]">
						<span className="font-semibold text-ink">In good company →</span>
						{[
							"Temporal",
							"Upstash",
							"Raycast",
							"Linear",
							"Plausible",
							"Beehiiv",
							"Resend",
						].map((b, i, arr) => (
							<span
								key={b}
								className="font-display text-ink/80 text-[16px] sm:text-[18px] tracking-tight"
							>
								{b}
								{i < arr.length - 1 && (
									<span className="ml-5 sm:ml-10 text-ink/20 font-sans">·</span>
								)}
							</span>
						))}
					</div>
				</div>
			</header>

			{/* ─── MANIFESTO PULLQUOTE ───────────────────────────────────────── */}
			<section className="bg-peach-200">
				<div className="py-20 pb-28 sm:py-24 sm:pb-32 lg:py-32 lg:pb-40 bg-background wavy">
					<div className="max-w-4xl mx-auto px-6 text-center">
						<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/50 mb-6 sm:mb-8">
							Why we built this
						</p>
						<blockquote className="font-display text-[26px] sm:text-[42px] lg:text-[54px] leading-[1.15] sm:leading-[1.08] tracking-[-0.02em] text-ink">
							We started Aloha the week a founder we loved quietly
							<span className="text-primary"> quit posting. </span>
							Not because she stopped having things to say - because the tools
							had made the saying{" "}
							<span className="text-peach-400">joyless</span>. We're trying to
							undo that.
						</blockquote>
						<div className="mt-10 flex items-center justify-center gap-3 text-[13px] text-ink/60">
							<span className="w-8 h-px bg-ink/30" />
							<span className="font-display text-[15px] text-ink">
								kash &amp; jonah, founders
							</span>
							<span className="w-8 h-px bg-ink/30" />
						</div>
					</div>
				</div>
			</section>

			{/* ─── FEATURE · PUBLISH (peach block) ────────────────────────────── */}
			<section id="product" className="relative wavy">
				<div className="bg-peach-200 pb-8">
					<div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-20 lg:py-32 grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 items-center">
						<div className="col-span-12 lg:col-span-5">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-6">
								Publish
							</p>
							<h2 className="font-display text-[36px] sm:text-[44px] lg:text-[64px] leading-[0.96] tracking-[-0.025em] text-ink">
								Write once.
								<br />
								<span className="text-primary">Tailor everywhere.</span>
							</h2>
							<p className="mt-8 max-w-[440px] text-[16.5px] leading-[1.55] text-ink/75">
								The Composer writes a native version for each platform in the
								tone you've taught it — long for LinkedIn, sharp for X, soft for
								Instagram — without turning one post into six jobs.
							</p>

							<ul className="mt-10 space-y-4 text-[15px]">
								{[
									"Per-platform previews that actually match what will ship.",
									"A tone-of-voice you train once and edit when it drifts.",
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
								href="#"
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
										<p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/50">
											This week
										</p>
										<p className="font-display text-[22px] leading-tight">
											April 13 — 19
										</p>
									</div>
									<div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11.5px] sm:text-[12px] text-ink/60">
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
																<p className="text-[9.5px] font-semibold tracking-[0.15em] text-ink/50">
																	{d}
																</p>
																<p className="font-display text-[18px] leading-none mt-0.5 text-ink">
																	{13 + i}
																</p>
															</div>
															<div className="flex-1 min-w-0 flex flex-wrap gap-1.5">
																{items.length === 0 ? (
																	<span className="text-[11.5px] text-ink/35 italic mt-1">
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
																<span className="text-[10px] font-semibold tracking-[0.15em] text-ink/50">
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

			{/* ─── FEATURE · ANALYZE (cream, inverted layout) ─────────────────── */}
			<section className="bg-ink">
				<div className="py-24 pb-32 lg:py-32 lg:pb-40 wavy bg-background">
					<div className="max-w-[1320px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 items-center">
						<div className="col-span-12 lg:col-span-7 order-2 lg:order-1">
							{/* Analytics mock */}
							<div className="rounded-3xl bg-background-elev border border-border p-5 sm:p-7 lg:p-9 overflow-hidden">
								<div className="flex items-start justify-between mb-6">
									<div>
										<p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/50">
											Reach · last 30 days
										</p>
										<p className="font-display text-[40px] leading-none mt-2">
											421.8<span className="text-ink/30">K</span>
										</p>
									</div>
									<span className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary bg-primary-soft px-2.5 py-1 rounded-full">
										<ArrowUpRight className="w-3 h-3" /> +28.4%
									</span>
								</div>

								{/* bar chart, pure svg */}
								<svg viewBox="0 0 600 180" className="w-full h-44">
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
											<p className="text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] sm:tracking-[0.2em] text-ink/50">
												{s.l}
											</p>
											<p className="font-display text-[18px] sm:text-[22px] mt-1">
												{s.v}
											</p>
											<p className="text-[12px] text-ink/60 mt-0.5">{s.d}</p>
										</div>
									))}
								</div>
							</div>
						</div>

						<div className="col-span-12 lg:col-span-5 order-1 lg:order-2 lg:pl-8">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-6">
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
										<p className="font-display text-[13px] text-ink/50">
											{x.n}
										</p>
										<p className="mt-1 font-medium text-[15px]">{x.t}</p>
										<p className="mt-1 text-[13px] text-ink/60 leading-snug">
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
							<p className="mt-8 max-w-[480px] text-[16.5px] leading-[1.55] text-background-elev/70">
								The Logic Matrix is a drag-to-connect flow for the things you'd
								otherwise forget to do — welcome DMs, cross-posts, re-queues,
								warm replies to comments that deserve one.
							</p>
							<a
								href="#"
								className="pencil-link inline-flex mt-10 items-center gap-2 text-[15px] font-medium text-peach-300"
							>
								Poke at a live blueprint
								<ArrowUpRight className="w-4 h-4" />
							</a>
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
								<div className="relative mt-6 flex items-center justify-between text-[12px] text-background-elev/60 font-mono">
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
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60 mb-6">
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
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Channels
							</p>
							<h2 className="font-display text-[30px] sm:text-[36px] lg:text-[48px] leading-[1.05] sm:leading-none tracking-[-0.02em] max-w-xl">
								Wherever you publish,
								<span className="text-primary"> we already live there.</span>
							</h2>
						</div>
						<p className="text-[14px] text-ink/60 max-w-sm">
							Eight platforms today, three more shipping this quarter. We build
							for the API, not the marketing page — if it breaks, we tell you
							before the audience notices.
						</p>
					</div>

					<ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 border-t border-l border-border">
						{[
							{
								n: "Instagram",
								tag: "Posts · Reels · Stories",
								dot: "bg-peach-400",
							},
							{ n: "X", tag: "Threads · Long-form", dot: "bg-ink" },
							{ n: "LinkedIn", tag: "Company · Personal", dot: "bg-primary" },
							{ n: "TikTok", tag: "Short form · Drafts", dot: "bg-ink" },
							{ n: "Threads", tag: "Native cross-post", dot: "bg-ink" },
							{ n: "Facebook", tag: "Pages · Groups", dot: "bg-primary" },
							{ n: "Pinterest", tag: "Pins · Boards", dot: "bg-peach-400" },
							{ n: "YouTube", tag: "Shorts · Community", dot: "bg-peach-400" },
						].map((c) => {
							const icon = SOCIAL_ICONS.find((i) => i.n === c.n);
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
											<p className="mt-1.5 sm:mt-2 text-[12px] sm:text-[12.5px] text-ink/55">
												{c.tag}
											</p>
										</div>
									</div>
									<span
										className={`w-2 h-2 rounded-full ${c.dot} mt-2 sm:mt-3 group-hover:scale-125 transition-transform shrink-0`}
									/>
								</li>
							);
						})}
					</ul>
					<div className="mt-8 text-[13px] text-ink/60 flex flex-wrap items-center gap-x-2 gap-y-1">
						<span className="inline-flex items-center gap-2">
							<Sparkle className="w-3.5 h-3.5 text-primary shrink-0" />
							Coming next quarter:
						</span>
						<span className="font-display text-ink">
							Bluesky, Substack Notes, Mastodon.
						</span>
					</div>
				</div>
			</section>

			{/* ─── STATS BAND (indigo) ────────────────────────────────────────── */}
			<section className="bg-primary text-primary-foreground">
				<div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-16 sm:py-20 lg:py-24 grid grid-cols-2 lg:grid-cols-4 lg:divide-x divide-white/20 gap-y-10 gap-x-6">
					{[
						{ v: "140K", l: "Creators posting", s: "across 94 countries" },
						{ v: "6.2M", l: "Scheduled this year", s: "and counting" },
						{ v: "38 min", l: "Saved per day", s: "on average, per user" },
						{ v: "99.98%", l: "Uptime", s: "last twelve months" },
					].map((s, i) => (
						<div
							key={i}
							className="lg:px-6 lg:first:pl-0 lg:last:pr-0 lg:py-4 min-w-0"
						>
							<p className="font-display text-[40px] sm:text-[56px] lg:text-[84px] leading-[0.95] tracking-[-0.03em]">
								{s.v}
							</p>
							<p className="mt-3 text-[13px] font-medium">{s.l}</p>
							<p className="text-[12px] text-white/60">{s.s}</p>
						</div>
					))}
				</div>
			</section>

			{/* ─── TESTIMONIALS ───────────────────────────────────────────────── */}
			<section className="bg-peach-200">
				<section
					id="stories"
					className="pb-24 sm:pb-8 bg-background-elev py-24 lg:py-32 wavy"
				>
					<div className="max-w-[1320px] mx-auto px-6 lg:px-10">
						<div className="max-w-3xl mb-16">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								In their words
							</p>
							<h2 className="font-display text-[30px] sm:text-[36px] lg:text-[52px] leading-[1.05] sm:leading-none tracking-[-0.02em]">
								Not a single one of these was
								<span className="text-primary"> paid for.</span>
							</h2>
						</div>

						<div className="grid grid-cols-12 auto-rows-[minmax(170px,auto)] gap-x-0 sm:gap-x-4 lg:gap-x-6 gap-y-4 lg:gap-y-6 grid-flow-dense">
							{/* 1 — hero quote (7 col × 2 row) */}
							<figure className="col-span-12 md:col-span-7 md:row-span-2 bg-peach-200 rounded-3xl p-7 sm:p-10 lg:p-12 flex flex-col justify-between gap-8">
								<blockquote className="font-display text-[24px] sm:text-[28px] lg:text-[38px] leading-[1.12] tracking-[-0.015em]">
									"I stopped dreading Mondays. That sounds small, but Mondays
									were when the week's posting panic began. Aloha made my
									Mondays quiet."
								</blockquote>
								<figcaption className="mt-10 flex items-center gap-4">
									<span className="w-12 h-12 rounded-full bg-ink text-peach-300 font-display text-xl flex items-center justify-center">
										N
									</span>
									<div>
										<p className="font-medium">Naledi O.</p>
										<p className="text-[13px] text-ink/60">
											Founder, Braid Studio · 84K followers
										</p>
									</div>
								</figcaption>
							</figure>

							{/* 2 — Theo, mid */}
							<figure className="col-span-12 md:col-span-5 bg-peach-400 rounded-3xl p-8 lg:p-9 flex flex-col justify-between">
								<blockquote className="font-display text-[21px] lg:text-[24px] leading-tight tracking-[-0.01em]">
									"Replaced three tools, two spreadsheets, and a group chat
									called 'ugh'."
								</blockquote>
								<figcaption className="mt-6 flex items-center gap-3">
									<span className="w-9 h-9 rounded-full bg-ink text-background-elev font-display flex items-center justify-center">
										T
									</span>
									<div>
										<p className="font-medium text-[14px]">Theo A.</p>
										<p className="text-[12.5px] text-ink/60">
											Newsletter writer · 24K subs
										</p>
									</div>
								</figcaption>
							</figure>

							{/* 3 — Leah, mid */}
							<figure className="col-span-12 md:col-span-5 bg-primary-soft rounded-3xl p-8 lg:p-9 flex flex-col justify-between">
								<blockquote className="font-display text-[21px] lg:text-[24px] leading-tight tracking-[-0.01em]">
									"The automation matrix saved me 11 hours last month. I
									checked."
								</blockquote>
								<figcaption className="mt-6 flex items-center gap-3">
									<span className="w-9 h-9 rounded-full bg-ink text-background-elev font-display flex items-center justify-center">
										L
									</span>
									<div>
										<p className="font-medium text-[14px]">Leah S.</p>
										<p className="text-[12.5px] text-ink/60">
											Agency owner · 6 clients
										</p>
									</div>
								</figcaption>
							</figure>

							{/* 4 — Maya, tall long-form (5 col × 2 row) */}
							<figure className="col-span-12 md:col-span-5 md:row-span-2 bg-peach-100 rounded-3xl p-8 lg:p-9 flex flex-col justify-between">
								<div>
									<span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/55 mb-5">
										<span className="w-3 h-px bg-ink/40" />
										Content lead
									</span>
									<blockquote className="font-display text-[19px] lg:text-[21px] leading-[1.35] tracking-[-0.005em] text-ink/90">
										"Our Monday stand-up used to be 'what are we posting this
										week.' Now it's 'what did we learn last week.' That shift is
										worth the subscription."
									</blockquote>
								</div>
								<figcaption className="mt-6 flex items-center gap-3">
									<span className="w-9 h-9 rounded-full bg-ink text-background-elev font-display flex items-center justify-center">
										M
									</span>
									<div>
										<p className="font-medium text-[14px]">Maya R.</p>
										<p className="text-[12.5px] text-ink/60">
											Head of content · Fermi
										</p>
									</div>
								</figcaption>
							</figure>

							{/* 5 — Deniz, wide */}
							<figure className="col-span-12 md:col-span-7 bg-peach-300 rounded-3xl p-8 lg:p-9 flex flex-col justify-between">
								<div>
									<span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/55 mb-4">
										<span className="w-3 h-px bg-ink/40" />
										Switched from Buffer
									</span>
									<blockquote className="font-display text-[19px] lg:text-[22px] leading-[1.3] tracking-[-0.005em] text-ink/90">
										"I migrated from Buffer in an afternoon. The importer didn't
										drop a single scheduled post — even the recurring ones
										landed right."
									</blockquote>
								</div>
								<figcaption className="mt-6 flex items-center gap-3">
									<span className="w-9 h-9 rounded-full bg-ink text-background-elev font-display flex items-center justify-center">
										D
									</span>
									<div>
										<p className="font-medium text-[14px]">Deniz K.</p>
										<p className="text-[12.5px] text-ink/60">
											Indie maker · 11K followers
										</p>
									</div>
								</figcaption>
							</figure>

							{/* 6 — Priya, wide, dark standout */}
							<figure className="col-span-12 md:col-span-7 bg-ink text-background-elev rounded-3xl p-8 lg:p-9 flex flex-col justify-between">
								<div>
									<span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-peach-200 mb-4">
										<span className="w-3 h-px bg-peach-200/60" />
										LinkedIn
									</span>
									<blockquote className="font-display text-[19px] lg:text-[22px] leading-[1.3] tracking-[-0.005em]">
										"The voice model writes in my cadence now. My editor can't
										always tell which drafts I wrote and which Aloha did — and
										she's been editing me for four years."
									</blockquote>
								</div>
								<figcaption className="mt-6 flex items-center gap-3">
									<span className="w-9 h-9 rounded-full bg-peach-200 text-ink font-display flex items-center justify-center">
										P
									</span>
									<div>
										<p className="font-medium text-[14px]">Priya N.</p>
										<p className="text-[12.5px] text-background-elev/60">
											Ghostwriter · 38K on LinkedIn
										</p>
									</div>
								</figcaption>
							</figure>

							{/* 7–10 — social mentions, bento-packed */}
							{[
								{
									q: "if you post on more than two platforms and you're not using this you're just doing chores",
									n: "@leahmakes",
									r: "on Threads · 840 likes",
									platform: "Threads",
									initial: "L",
									bg: "bg-primary-soft",
									span: "col-span-12 md:col-span-4",
									quote:
										"font-display text-[17px] lg:text-[19px] leading-[1.3] tracking-[-0.005em] text-ink/90",
									padding: "p-6 lg:p-7",
								},
								{
									q: "the analytics export alone paid for a year. my CFO agrees (I am the CFO).",
									n: "@thenoahco",
									r: "on LinkedIn · 312 reactions",
									platform: "LinkedIn",
									initial: "N",
									bg: "bg-peach-200",
									span: "col-span-12 md:col-span-3",
									quote:
										"font-display text-[15px] lg:text-[16px] leading-[1.35] tracking-[-0.003em] text-ink/90",
									padding: "p-6",
								},
								{
									q: "finally a tool that doesn't make me feel like i'm running a call center",
									n: "@ainslee.design",
									r: "on Instagram · 2.3K likes",
									platform: "Instagram",
									initial: "A",
									bg: "bg-peach-300",
									span: "col-span-12 md:col-span-7",
									quote:
										"font-display text-[19px] lg:text-[22px] leading-[1.3] tracking-[-0.005em] text-ink/90",
									padding: "p-8 lg:p-9",
								},
								{
									q: "okay aloha's calendar view is the first scheduler that respects my eyes",
									n: "@samwritesstuff",
									r: "on X · 1.2K likes",
									platform: "X",
									initial: "S",
									bg: "bg-peach-100",
									span: "col-span-12 md:col-span-5 md:row-span-2",
									quote:
										"font-display text-[22px] lg:text-[28px] leading-[1.2] tracking-[-0.01em]",
									padding: "p-8 lg:p-9",
								},
							].map((m, i) => (
								<figure
									key={i}
									className={`${m.span} ${m.bg} ${m.padding} rounded-3xl flex flex-col justify-between`}
								>
									<div>
										<span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/55 mb-4">
											<span className="w-3 h-px bg-ink/40" />
											{m.platform}
										</span>
										<blockquote className={m.quote}>"{m.q}"</blockquote>
									</div>
									<figcaption className="mt-6 flex items-center gap-3">
										<span className="w-9 h-9 rounded-full bg-ink text-background-elev font-display flex items-center justify-center">
											{m.initial}
										</span>
										<div>
											<p className="font-mono text-[13px] text-ink">{m.n}</p>
											<p className="text-[12px] text-ink/60">{m.r}</p>
										</div>
									</figcaption>
								</figure>
							))}
						</div>

						{/* CTA under testimonials */}
						<div className="mt-16 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pt-10 border-t border-border">
							<p className="font-display text-[22px] lg:text-[26px] leading-[1.2] tracking-[-0.01em] max-w-xl">
								Want to see your name here in a few months?
								<span className="text-ink/55"> We read every reply.</span>
							</p>
							<div className="flex items-center gap-5">
								<Link
									href="/auth/signin"
									className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
								>
									Start free
									<ArrowRight className="w-4 h-4" />
								</Link>
								<a
									href="#stories"
									className="pencil-link text-[14px] font-medium text-ink"
								>
									Read 40+ more
								</a>
							</div>
						</div>
					</div>
				</section>
			</section>

			{/* ─── PLANS (Built for + Pricing, merged) ────────────────────────── */}
			<section
				id="pricing"
				className="bg-peach-200 py-24 pb-32 lg:py-32 lg:pb-40 wavy"
			>
				<div className="max-w-[1320px] mx-auto px-6 lg:px-10">
					<div className="grid grid-cols-12 gap-x-0 gap-y-6 lg:gap-10 mb-12 lg:mb-14">
						<div className="col-span-12 lg:col-span-5">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Built for
							</p>
							<h2 className="font-display text-[32px] sm:text-[40px] lg:text-[56px] leading-[0.98] tracking-[-0.02em]">
								Pick the shape of
								<br />
								<span className="text-primary">your week.</span>
							</h2>
						</div>
						<p className="col-span-12 lg:col-span-6 lg:col-start-7 text-[16px] text-ink/70 leading-[1.6]">
							Three starting points with opinions baked in — you can still turn
							every knob. Switch any time; your data moves with you. No
							asterisks, no trial countdowns.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
						{[
							{
								name: "Solo creator",
								icon: Smile,
								tagline: "Everything personal",
								desc: "Link-in-bio, a smart queue, AI that learns your voice, and the calendar view that fits a one-human team.",
								features: [
									"3 channels",
									"10 posts / channel / month",
									"Unlimited drafts",
									"Weekly nudges",
									"Community support",
								],
								priceLine: "Free forever",
								priceSub: "no card, no expiry",
								cta: "Get going",
								accent: "bg-peach-100",
							},
							{
								name: "Working team",
								icon: Leaf,
								tagline: "Ship without stepping on toes",
								desc: "Roles, approvals, a shared voice, and brand kits so a junior hire can write as confidently as the founder.",
								features: [
									"8 channels · 3 seats",
									"Unlimited scheduling",
									"AI Composer + brand voice",
									"Approval workflows & brand kits",
									"Logic Matrix automation",
									"Email support",
								],
								priceLine: "$16 / month",
								priceSub: "billed yearly · 14-day trial",
								cta: "Start free trial",
								accent: "bg-primary-soft",
								featured: true,
							},
							{
								name: "Agency",
								icon: Flame,
								tagline: "Many brands, one head",
								desc: "Isolated client workspaces, white-labeled reports, and bulk scheduling for the person who runs it all.",
								features: [
									"Unlimited workspaces",
									"White-labeled PDFs",
									"Priority + Slack support",
									"SSO + SCIM",
									"Dedicated onboarding",
								],
								priceLine: "$49 / month",
								priceSub: "billed yearly · talk first",
								cta: "Talk to us",
								accent: "bg-peach-300",
							},
						].map((u, i) => (
							<article
								key={i}
								className={`relative rounded-3xl p-8 lg:p-10 ${u.accent} flex flex-col ${
									u.featured ? "lg:-translate-y-3" : ""
								}`}
							>
								{u.featured && (
									<span className="absolute top-5 right-5 inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink bg-background-elev px-2 py-1 rounded-full">
										<Sparkle className="w-3 h-3 text-primary" /> Most-picked
									</span>
								)}
								<u.icon className="w-6 h-6 text-ink" />
								<h3 className="mt-6 font-display text-[30px] leading-tight">
									{u.name}
								</h3>
								<p className="mt-1 text-[13px] text-ink/70">{u.tagline}</p>
								<p className="mt-5 text-[14.5px] text-ink/80 leading-[1.55]">
									{u.desc}
								</p>

								<ul className="mt-7 space-y-2.5 text-[13.5px] text-ink/80 flex-1">
									{u.features.map((f) => (
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
										<span className="font-medium text-ink">{u.priceLine}</span>
										<span className="text-ink/45"> · {u.priceSub}</span>
									</p>
									<Link
										href="/auth/signin"
										className={`inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full font-medium text-[13.5px] transition-colors w-full ${
											u.featured
												? "bg-primary text-primary-foreground hover:bg-primary-deep"
												: "bg-ink text-background-elev hover:bg-primary"
										}`}
									>
										{u.cta}
										<ArrowRight className="w-4 h-4" />
									</Link>
								</div>
							</article>
						))}
					</div>

					<p className="mt-10 text-[13px] text-ink/60 flex flex-wrap items-center gap-x-6 gap-y-2">
						<span>
							<span className="font-display text-ink">
								Nonprofits, students, and open-source maintainers
							</span>
							<span className="text-ink/55"> — 40% off, just ask.</span>
						</span>
						<span className="text-ink/30">·</span>
						<span>
							Move between plans any time. Your content comes with you.
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
								<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
									Field notes
								</p>
								<h2 className="font-display text-[30px] sm:text-[36px] lg:text-[48px] leading-[1.05] sm:leading-none tracking-[-0.02em]">
									We write about the work,
									<br />
									<span className="text-primary">not ourselves.</span>
								</h2>
							</div>
							<a
								href="#"
								className="pencil-link inline-flex items-center gap-2 text-[14px] font-medium self-start md:self-auto"
							>
								Read all field notes <ArrowUpRight className="w-4 h-4" />
							</a>
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
								<a key={i} href="#" className="group block">
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
									<p className="mt-3 text-[12px] text-ink/50 font-mono">
										{r.read} read
									</p>
								</a>
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
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
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
						<p className="text-[12px] text-background-elev/50 font-mono">
							or &nbsp;
							<a href="#" className="pencil-link">
								book a 20-min walkthrough →
							</a>
						</p>
					</div>
				</div>
			</section>
		</>
	);
}
