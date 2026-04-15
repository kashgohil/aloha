import { routes } from "@/lib/routes";
import { makeMetadata } from "@/lib/seo";
import {
	AlertTriangle,
	ArrowRight,
	ArrowUpRight,
	CalendarDays,
	Check,
	MessageSquareQuote,
	Move,
} from "lucide-react";
import Link from "next/link";
import { ScreenshotPlaceholder } from "../_components/screenshot-placeholder";

export const metadata = makeMetadata({
	title: "Calendar — see the week before your audience does",
	description:
		"Aloha's Calendar gives you a visual week of every channel at once. Drag to reschedule, spot conflicts, and ship with a clean eye line.",
	path: routes.product.calendar,
});

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Mock schedule used in the hero card. Each entry: day index (0–6), rough
// vertical band, channel color, channel label, time label.
const SCHEDULE = [
	{ d: 0, y: "top-[18%]", tone: "bg-peach-200", n: "IG", t: "09:30" },
	{ d: 0, y: "top-[54%]", tone: "bg-primary-soft", n: "LI", t: "16:00" },
	{ d: 1, y: "top-[32%]", tone: "bg-peach-100", n: "X", t: "08:15" },
	{ d: 2, y: "top-[22%]", tone: "bg-peach-300", n: "TT", t: "11:00" },
	{ d: 2, y: "top-[68%]", tone: "bg-primary-soft", n: "LI", t: "17:30" },
	{ d: 3, y: "top-[44%]", tone: "bg-peach-200", n: "IG", t: "12:00" },
	{ d: 4, y: "top-[28%]", tone: "bg-peach-100", n: "X", t: "09:45" },
	{ d: 4, y: "top-[62%]", tone: "bg-peach-400", n: "YT", t: "19:00" },
	{ d: 5, y: "top-[38%]", tone: "bg-peach-200", n: "IG", t: "10:30" },
	{ d: 6, y: "top-[50%]", tone: "bg-primary-soft", n: "TH", t: "14:00" },
];

export default function CalendarPage() {
	return (
		<>
			{/* ─── HERO ────────────────────────────────────────────────────── */}
			<header className="relative overflow-hidden bg-peach-200">
				<span
					aria-hidden
					className="absolute top-[14%] left-[5%] font-display text-[28px] text-ink/25 rotate-[-8deg] select-none"
				>
					✳
				</span>
				<span
					aria-hidden
					className="absolute top-[70%] left-[11%] font-display text-[22px] text-primary/55 rotate-12 select-none"
				>
					+
				</span>
				<span
					aria-hidden
					className="absolute top-[20%] right-[7%] font-display text-[38px] text-ink/15 rotate-18 select-none"
				>
					※
				</span>
				<span
					aria-hidden
					className="absolute top-[50%] left-[3%] w-2 h-2 rounded-full bg-primary/50"
				/>
			</header>

			<section className="bg-peach-200 wavy">
				<div className="relative max-w-[1320px] w-full mx-auto px-6 lg:px-10 pt-20 lg:pt-28 pb-32 lg:pb-40 grid grid-cols-12 gap-x-0 gap-y-8 lg:gap-12 items-center">
					<div className="col-span-12 lg:col-span-7">
						<div className="inline-flex items-center gap-2 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
							The Calendar
						</div>

						<h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[92px]">
							See the week
							<br />
							<span className="text-primary font-light">before your</span>
							<br />
							audience does.
						</h1>

						<p className="mt-8 max-w-[520px] text-[17px] lg:text-[18px] leading-[1.55] text-ink/70">
							Eight channels, one grid. Drag to reschedule, spot the two-post
							Tuesday before it ships, and trust the queue even when you haven't
							opened it in four days.
						</p>

						<div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
							<Link
								href={routes.signin}
								className="inline-flex items-center gap-2 h-14 px-7 rounded-full bg-primary text-primary-foreground font-medium text-[15px] shadow-[0_8px_0_-2px_rgba(46,42,133,0.35)] hover:shadow-[0_10px_0_-2px_rgba(46,42,133,0.4)] hover:-translate-y-0.5 transition-all"
							>
								Open the Calendar
								<ArrowRight className="w-4 h-4" />
							</Link>
							<a
								href="#drag"
								className="pencil-link inline-flex items-center gap-2 text-[15px] font-medium text-ink"
							>
								See a week in motion
								<ArrowUpRight className="w-4 h-4" />
							</a>
						</div>

						<div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-[12.5px] text-ink/60">
							<span className="inline-flex items-center gap-2">
								<Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
								Month / week / day views
							</span>
							<span className="inline-flex items-center gap-2">
								<Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
								Drag-to-reschedule everywhere
							</span>
							<span className="inline-flex items-center gap-2">
								<Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
								ICS export
							</span>
						</div>
					</div>

					{/* Hero visual — week grid mock */}
					<div className="col-span-12 lg:col-span-5 relative">
						<div className="relative animate-[float-soft_9s_ease-in-out_infinite]">
							<div className="rounded-3xl bg-background-elev border border-border-strong shadow-[0_30px_60px_-20px_rgba(23,20,18,0.25)] overflow-hidden">
								<div className="px-5 py-3 flex items-center justify-between border-b border-border bg-muted/40">
									<div className="flex items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.18em] text-ink/60">
										<CalendarDays className="w-3 h-3" />
										week · 10 posts
									</div>
									<div className="flex items-center gap-1 text-[10px] font-mono text-ink/50">
										<button className="px-2 py-0.5 rounded-full text-ink bg-background">
											Week
										</button>
										<button className="px-2 py-0.5">Month</button>
									</div>
								</div>

								{/* day header */}
								<div className="grid grid-cols-7 border-b border-border text-[10px] font-mono uppercase tracking-[0.18em] text-ink/55">
									{DAYS.map((d) => (
										<div
											key={d}
											className="px-2 py-2.5 text-center border-r border-border last:border-r-0"
										>
											{d}
										</div>
									))}
								</div>

								{/* the grid — fake chips floating on a 7-col canvas */}
								<div className="relative grid grid-cols-7 h-[320px]">
									{DAYS.map((_, i) => (
										<div
											key={i}
											className="relative border-r border-border last:border-r-0"
										>
											{/* hour lines */}
											<div className="absolute inset-0 grid grid-rows-4 pointer-events-none">
												{[0, 1, 2, 3].map((k) => (
													<div
														key={k}
														className="border-b border-border/40 last:border-b-0"
													/>
												))}
											</div>
										</div>
									))}

									{SCHEDULE.map((s, i) => (
										<div
											key={i}
											className={`absolute ${s.y} ${s.tone} rounded-lg px-1.5 py-1 flex items-center justify-between gap-1 text-[9px] font-medium text-ink border border-ink/10 shadow-sm`}
											style={{
												left: `calc(${(s.d / 7) * 100}% + 4px)`,
												width: `calc(${100 / 7}% - 8px)`,
											}}
										>
											<span className="font-semibold">{s.n}</span>
											<span className="font-mono text-ink/55">{s.t}</span>
										</div>
									))}
								</div>

								{/* footer summary */}
								<div className="px-5 py-3 border-t border-border bg-muted/40 flex items-center justify-between">
									<span className="text-[11px] text-ink/55">
										all channels on-voice · Muse
									</span>
									<div className="flex items-center gap-3">
										<button className="text-[11px] text-ink/70 pencil-link">
											Fill gaps
										</button>
										<button className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-ink text-background text-[11.5px] font-medium">
											Ship week
											<ArrowRight className="w-3 h-3" />
										</button>
									</div>
								</div>
							</div>

							{/* floating chip */}
							<div className="hidden sm:flex absolute -bottom-5 -left-6 lg:-left-10 items-center gap-2.5 bg-background-elev text-ink border border-border-strong rounded-full pl-3 pr-4 py-2 shadow-[0_14px_30px_-16px_rgba(23,20,18,0.35)] -rotate-3">
								<Move className="w-3.5 h-3.5 text-primary" />
								<span className="text-[11.5px] font-medium">
									Thu 7pm → Fri 9am
								</span>
								<span className="text-[11px] text-ink/50 font-mono">
									· reschedule
								</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ─── FEATURE 1 · DRAG TO RESCHEDULE ──────────────────────────── */}
			<section id="drag" className="bg-primary-soft">
				<div className="wavy bg-background py-24 pb-32 lg:pb-40 lg:py-32 ">
					<div className="max-w-[1320px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-16 items-center">
						<div className="col-span-12 lg:col-span-6">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Drag to reschedule
							</p>
							<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
								Rearrange the week
								<br />
								<span className="text-primary">without opening the draft.</span>
							</h2>
							<p className="mt-6 text-[16px] lg:text-[17px] text-ink/75 leading-[1.6] max-w-lg">
								Grab a post, move it, done. Calendar updates the schedule queue
								in the same beat; if there's a downstream rule — a reply window,
								a template end — the system tells you instead of silently
								breaking it.
							</p>

							<ul className="mt-8 space-y-3 text-[14.5px] text-ink/85">
								{[
									"Multi-select and bulk move across days.",
									"Snap to your best-time slots, or override freely.",
									"Undo is one keystroke — the queue never forgets.",
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
								id="drag-reschedule"
								label="A post being dragged from Thursday evening to Friday morning."
								notes="Needed: screenshot of Calendar > Week view mid-drag. Show the post's ghost at source, a live preview at target, and the subtle snap-to-best-time indicator. 5:3 crop. Cream bg preserved."
								aspect="aspect-[5/3]"
								tone="bg-peach-100"
							/>
						</div>
					</div>
				</div>
			</section>

			{/* ─── FEATURE 2 · GHOST QUEUE + CONFLICTS ─────────────────────── */}
			<section className="py-24 lg:py-32 bg-primary-soft wavy">
				<div className="max-w-[1320px] mx-auto px-6 lg:px-10 pb-8 lg:pb-12">
					<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 mb-14">
						<div className="col-span-12 lg:col-span-6">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Ghost queue &amp; conflicts
							</p>
							<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
								The week tells you
								<br />
								<span className="text-primary">what's missing.</span>
							</h2>
						</div>
						<p className="col-span-12 lg:col-span-5 lg:col-start-8 text-[16px] text-ink/70 leading-[1.6] self-end">
							Faded ghost slots show where your cadence expects a post. Conflict
							chips flag two LinkedIns in an hour, back-to-back carousels, or a
							day that skipped the channel you promised.
						</p>
					</div>

					{/* two-up visualisation */}
					<div className="grid grid-cols-12 gap-x-0 gap-y-6 lg:gap-8">
						<div className="col-span-12 lg:col-span-7 rounded-3xl bg-background border border-border overflow-hidden">
							<div className="px-6 py-3 border-b border-border flex items-center justify-between">
								<span className="text-[11px] font-mono uppercase tracking-[0.22em] text-ink/50">
									Week · ghost slots
								</span>
								<span className="text-[11px] text-ink/55">3 of 12 filled</span>
							</div>
							<div className="p-6 grid grid-cols-7 gap-2">
								{DAYS.map((d, i) => (
									<div key={d} className="space-y-2">
										<div className="text-[10px] font-mono uppercase tracking-[0.18em] text-ink/45 text-center">
											{d}
										</div>
										{[0, 1, 2].map((slot) => {
											const filled = [0, 3, 5].includes(i) && slot === 1;
											return (
												<div
													key={slot}
													className={`h-9 rounded-md border ${
														filled
															? "bg-peach-200 border-peach-400/40 text-[9px] font-semibold text-ink flex items-center justify-center"
															: "border-dashed border-border-strong/60 bg-muted/30"
													}`}
												>
													{filled && "post"}
												</div>
											);
										})}
									</div>
								))}
							</div>
						</div>

						<div className="col-span-12 lg:col-span-5 rounded-3xl bg-ink text-background-elev p-8 lg:p-10 flex flex-col gap-6">
							<div className="flex items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.22em] text-peach-200">
								<AlertTriangle className="w-3.5 h-3.5" />
								Conflicts this week
							</div>
							<ul className="space-y-5 text-[14px] leading-[1.55]">
								{[
									{
										h: "Two LinkedIn posts within 42 minutes",
										p: "Tue 16:00 and 16:42. Your audience skews one-per-day here.",
									},
									{
										h: "Instagram silent Wed + Thu",
										p: "You've averaged one reel every 36h. Suggest a slot Thu 12:00.",
									},
									{
										h: "Launch beat 4 of 7 missing",
										p: "Template says FAQ post on day 5. Drafted — needs approval.",
									},
								].map((c) => (
									<li key={c.h}>
										<p className="font-display text-[17px] tracking-[-0.005em]">
											{c.h}
										</p>
										<p className="mt-1 text-[13px] text-background-elev/65">
											{c.p}
										</p>
									</li>
								))}
							</ul>
							<button className="mt-auto self-start inline-flex items-center gap-2 h-10 px-5 rounded-full bg-peach-200 text-ink text-[13px] font-medium hover:bg-peach-300 transition-colors">
								Auto-resolve all
								<ArrowRight className="w-3.5 h-3.5" />
							</button>
						</div>
					</div>
				</div>
			</section>

			{/* ─── FEATURE 3 · TEMPLATES + CADENCE ─────────────────────────── */}
			<section className="bg-peach-200">
				<section className="py-24 lg:py-32 pb-32 lg:pb-40 bg-background wavy">
					<div className="max-w-[1320px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-16 items-center">
						<div className="col-span-12 lg:col-span-6 order-2 lg:order-1">
							<ScreenshotPlaceholder
								id="cadence"
								label="Cadence settings — per-channel 'one a day, skip Sundays'."
								notes="Needed: screenshot of Calendar > Cadence. Shows per-channel cards with weekly frequency dial, quiet-hour bars (gray), preferred slots (primary). 4:3 crop."
								aspect="aspect-[4/3]"
								tone="bg-primary-soft"
							/>
						</div>

						<div className="col-span-12 lg:col-span-6 order-1 lg:order-2">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Cadence &amp; templates
							</p>
							<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
								A rhythm you can
								<br />
								<span className="text-primary">actually keep.</span>
							</h2>
							<p className="mt-6 text-[16px] lg:text-[17px] text-ink/75 leading-[1.6] max-w-lg">
								Tell the Calendar your cadence — three a week for LinkedIn,
								daily for X, one a week for YouTube — and it turns the next four
								weeks into a queue you can fill with drafts, templates, or the
								Composer. Miss a week, the cadence pauses, not panics.
							</p>

							<ul className="mt-8 space-y-3 text-[14.5px] text-ink/85">
								{[
									"Quiet hours enforced per channel (no 3am notifications).",
									"Campaign templates auto-place a multi-post arc on the calendar.",
									"Holiday-aware: skips dates you've flagged as off.",
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

							<Link
								href={routes.resources.templates}
								className="pencil-link mt-8 inline-flex items-center gap-2 text-[14.5px] font-medium text-ink"
							>
								Browse campaign templates
								<ArrowUpRight className="w-4 h-4" />
							</Link>
						</div>
					</div>
				</section>
			</section>

			{/* ─── TESTIMONIAL ──────────────────────────────────────────────── */}
			<section className="bg-ink relative">
				<div
					aria-hidden
					className="absolute inset-0 top-2! opacity-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<section className="py-24 lg:py-28 bg-peach-200 wavy">
					<div className="max-w-[1100px] mx-auto px-6 lg:px-10 pb-8 lg:pb-12">
						<figure className="relative bg-peach-200 rounded-3xl p-10 lg:p-14 overflow-hidden">
							<MessageSquareQuote className="w-8 h-8 text-ink/40 mb-6" />
							<blockquote className="font-display text-[26px] lg:text-[34px] leading-[1.2] tracking-[-0.015em] max-w-3xl">
								"Our Monday stand-up used to be 'what are we posting this week.'
								Now it's 'what did we learn last week.' The calendar did that."
							</blockquote>
							<figcaption className="mt-8 flex items-center gap-4">
								<span className="w-11 h-11 rounded-full bg-ink text-background-elev font-display flex items-center justify-center">
									M
								</span>
								<div>
									<p className="font-medium">Maya R.</p>
									<p className="text-[13px] text-ink/60">
										Head of content · Fermi
									</p>
								</div>
							</figcaption>
						</figure>
					</div>
				</section>
			</section>

			{/* ─── FINAL CTA ────────────────────────────────────────────────── */}
			<section className="relative overflow-hidden bg-ink text-background-elev wavy">
				<div
					aria-hidden
					className="absolute inset-0 top-2.5! -z-10 opacity-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-24 lg:py-32 pb-32 lg:pb-40">
					<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 items-end">
						<div className="col-span-12 lg:col-span-8">
							<h2 className="font-display text-[44px] sm:text-[56px] lg:text-[80px] leading-[0.98] tracking-[-0.025em]">
								Plan the month.
								<br />
								<span className="text-peach-300">Ship the week.</span>
								<br />
								Mean it.
							</h2>
						</div>
						<div className="col-span-12 lg:col-span-4 flex flex-col gap-4 lg:items-end">
							<Link
								href={routes.signin}
								className="inline-flex items-center gap-2 h-14 px-7 rounded-full bg-ink text-background font-medium text-[15px] hover:bg-primary transition-colors"
							>
								Start free — no card
								<ArrowRight className="w-4 h-4" />
							</Link>
							<Link
								href={routes.product.composer}
								className="pencil-link inline-flex items-center gap-2 text-[14.5px] font-medium text-ink"
							>
								Pair it with the Composer
								<ArrowUpRight className="w-4 h-4" />
							</Link>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
