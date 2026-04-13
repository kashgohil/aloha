import { routes } from "@/lib/routes";
import { makeMetadata } from "@/lib/seo";
import {
	ArrowRight,
	ArrowUpRight,
	Check,
	Inbox as InboxIcon,
	MessageSquareQuote,
	Users,
} from "lucide-react";
import Link from "next/link";
import { ScreenshotPlaceholder } from "../_components/screenshot-placeholder";

export const metadata = makeMetadata({
	title: "Inbox — every comment, DM and mention, in one quiet list",
	description:
		"Aloha's Inbox unifies the comments, DMs and mentions across every channel into one triageable feed. Reply once, in your voice.",
	path: routes.product.inbox,
});

const THREADS = [
	{
		n: "Ada K.",
		c: "Instagram",
		tone: "bg-peach-200",
		ini: "A",
		t: "just now",
		tag: "question",
		preview:
			"This completely reframed how I think about launch weeks. Where do I read more?",
	},
	{
		n: "Jun H.",
		c: "LinkedIn",
		tone: "bg-primary-soft",
		ini: "J",
		t: "9m",
		tag: "share",
		preview: "Shared with my team — we're trying the 3-post rule next sprint.",
	},
	{
		n: "Rosa M.",
		c: "X",
		tone: "bg-peach-100",
		ini: "R",
		t: "23m",
		tag: "question",
		preview: "Wait, how did you get your carousel to loop like that?",
	},
];

export default function InboxPage() {
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
					className="absolute top-[68%] left-[11%] font-display text-[22px] text-primary/55 rotate-12 select-none"
				>
					+
				</span>
				<span
					aria-hidden
					className="absolute top-[22%] right-[8%] font-display text-[38px] text-ink/15 rotate-18 select-none"
				>
					※
				</span>
			</header>

			<section className="bg-peach-200 wavy">
				<div className="relative max-w-[1320px] w-full mx-auto px-6 lg:px-10 pt-20 lg:pt-28 pb-32 lg:pb-40 grid grid-cols-12 gap-x-0 gap-y-8 lg:gap-12 items-center">
					<div className="col-span-12 lg:col-span-7">
						<div className="inline-flex items-center gap-2 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
							The Inbox
						</div>

						<h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[92px]">
							One list
							<br />
							for every
							<br />
							<span className="text-primary font-light">
								reply worth giving.
							</span>
						</h1>

						<p className="mt-8 max-w-[520px] text-[17px] lg:text-[18px] leading-[1.55] text-ink/70">
							Comments, DMs, mentions, reposts — every channel in one triageable
							feed. Pin the questions worth answering properly. Knock down the
							easy ones with a tap. Hand off to a teammate when it's theirs to
							own.
						</p>

						<div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
							<Link
								href={routes.signin}
								className="inline-flex items-center gap-2 h-14 px-7 rounded-full bg-primary text-primary-foreground font-medium text-[15px] shadow-[0_8px_0_-2px_rgba(46,42,133,0.35)] hover:shadow-[0_10px_0_-2px_rgba(46,42,133,0.4)] hover:-translate-y-0.5 transition-all"
							>
								Open the Inbox
								<ArrowRight className="w-4 h-4" />
							</Link>
							<a
								href="#triage"
								className="pencil-link inline-flex items-center gap-2 text-[15px] font-medium text-ink"
							>
								See the triage view
								<ArrowUpRight className="w-4 h-4" />
							</a>
						</div>

						<div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-[12.5px] text-ink/60">
							<span className="inline-flex items-center gap-2">
								<Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
								All 8 channels in one feed
							</span>
							<span className="inline-flex items-center gap-2">
								<Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
								AI reply drafts on voice
							</span>
							<span className="inline-flex items-center gap-2">
								<Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
								Team assignments with one tap
							</span>
						</div>
					</div>

					{/* Hero visual — inbox card */}
					<div className="col-span-12 lg:col-span-5 relative">
						<div className="relative animate-[float-soft_9s_ease-in-out_infinite]">
							<div className="rounded-3xl bg-background-elev border border-border-strong shadow-[0_30px_60px_-20px_rgba(23,20,18,0.25)] overflow-hidden">
								<div className="px-5 py-3 flex items-center justify-between border-b border-border bg-muted/40">
									<div className="flex items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.18em] text-ink/60">
										<InboxIcon className="w-3 h-3" />
										inbox · worth replying
									</div>
									<div className="flex gap-1 text-[10px] font-mono text-ink/55">
										<button className="px-2 py-0.5 rounded-full bg-background text-ink">
											Priority
										</button>
										<button className="px-2 py-0.5">All</button>
									</div>
								</div>

								<ul className="divide-y divide-border">
									{THREADS.map((t) => (
										<li
											key={t.n}
											className="px-5 py-4 hover:bg-muted/30 transition-colors"
										>
											<div className="flex items-start gap-3">
												<span
													className={`w-8 h-8 rounded-full ${t.tone} flex items-center justify-center text-[12px] font-display text-ink shrink-0`}
												>
													{t.ini}
												</span>
												<div className="min-w-0 flex-1">
													<div className="flex items-center gap-2 mb-0.5">
														<span className="text-[13px] font-medium text-ink">
															{t.n}
														</span>
														<span className="text-[10px] font-mono text-ink/50">
															· {t.c} · {t.t}
														</span>
														<span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-ink/70 font-medium uppercase tracking-[0.12em]">
															{t.tag}
														</span>
													</div>
													<p className="text-[12.5px] text-ink/75 leading-normal">
														{t.preview}
													</p>
												</div>
											</div>
										</li>
									))}
								</ul>

								<div className="px-5 py-3 border-t border-border bg-muted/40 flex items-center justify-between">
									<span className="text-[11px] text-ink/55">
										9 others auto-triaged as low-touch
									</span>
									<button className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-ink text-background text-[11.5px] font-medium">
										Reply first
										<ArrowRight className="w-3 h-3" />
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ─── FEATURE 1 · TRIAGE ──────────────────────────────────────── */}
			<section className="bg-background-elev">
				<section
					id="triage"
					className="bg-background py-24 lg:py-32 pb-32 lg:pb-40 wavy"
				>
					<div className="max-w-[1320px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-16 items-center">
						<div className="col-span-12 lg:col-span-6">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Triage, not a fire hose
							</p>
							<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
								Sorted by
								<br />
								<span className="text-primary">worth replying to.</span>
							</h2>
							<p className="mt-6 text-[16px] lg:text-[17px] text-ink/75 leading-[1.6] max-w-lg">
								Inbox reads the shape of every message and sorts them into
								buckets — questions, praise, complaints, spam. Questions from
								existing customers go first. "Nice post 🔥" gets a one-tap
								heart. Spam never shows up.
							</p>

							<ul className="mt-8 space-y-3 text-[14.5px] text-ink/85">
								{[
									"Filter by channel, tag, sender history, or the shape of the ask.",
									"Mark an entire class as low-touch — Aloha learns.",
									"Daily digest summarises everything you didn't reply to, and why.",
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
								id="triage"
								label="Triage view with three buckets — Questions, Praise, Needs-review."
								notes="Needed: screenshot of Inbox > Triage. Kanban-style columns with coloured chips per channel and a sender-history annotation ('new' / 'returning' / 'customer'). 5:3 crop."
								aspect="aspect-[5/3]"
								tone="bg-peach-100"
							/>
						</div>
					</div>
				</section>
			</section>

			{/* ─── FEATURE 2 · AI DRAFTS ───────────────────────────────────── */}
			<section className="py-24 lg:py-32 pb-32 lg:pb-40 bg-background-elev wavy">
				<div className="max-w-[1320px] mx-auto px-6 lg:px-10">
					<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 mb-14">
						<div className="col-span-12 lg:col-span-6">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Reply drafts, in your voice
							</p>
							<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
								Never start
								<br />
								<span className="text-primary">from a blank box.</span>
							</h2>
						</div>
						<p className="col-span-12 lg:col-span-5 lg:col-start-8 text-[16px] text-ink/70 leading-[1.6] self-end">
							The same voice model that powers Composer drafts the reply too —
							three variants, short to long, adjusted to the channel convention.
							Edit or send as-is. You're the last set of eyes, always.
						</p>
					</div>

					{/* incoming + drafts mock */}
					<div className="grid grid-cols-12 gap-x-0 gap-y-6 lg:gap-8">
						{/* incoming */}
						<div className="col-span-12 lg:col-span-5 rounded-3xl bg-peach-200 p-8 lg:p-9 flex flex-col gap-4">
							<span className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink/55">
								Incoming · Instagram
							</span>
							<div className="flex items-center gap-3">
								<span className="w-9 h-9 rounded-full bg-ink text-peach-200 font-display flex items-center justify-center">
									A
								</span>
								<div>
									<p className="text-[13.5px] font-medium text-ink">Ada K.</p>
									<p className="text-[11.5px] text-ink/55">
										@ada.reads · returning
									</p>
								</div>
							</div>
							<blockquote className="font-display text-[20px] lg:text-[22px] leading-[1.3] tracking-[-0.01em]">
								"This completely reframed how I think about launch weeks. Where
								do I read more?"
							</blockquote>
						</div>

						{/* 3 draft replies */}
						<div className="col-span-12 lg:col-span-7 space-y-4">
							{[
								{
									len: "Short · 1 line",
									t: "Start with the field note from March — it's where this framework first landed →",
									tone: "bg-peach-100",
								},
								{
									len: "Medium · 2 lines",
									t: "Glad it landed. The thinking started in a field note back in March — that's the best place to start. Happy to send the follow-up essay too if you want to go deeper.",
									tone: "bg-background",
								},
								{
									len: "Long · 3 lines",
									t: "Thanks Ada — that's the nicest version of 'explain more' I've gotten all week. The essay I'd point you at is 'The seventh telling' from March, and then the follow-up on cadence from two weeks ago. Both linked in my bio if you want the direct paths.",
									tone: "bg-peach-300",
								},
							].map((r, i) => (
								<article
									key={i}
									className={`rounded-2xl ${r.tone} border border-border p-5`}
								>
									<div className="flex items-center justify-between mb-2">
										<span className="text-[10.5px] font-mono uppercase tracking-[0.22em] text-ink/55">
											Draft · {r.len}
										</span>
										<span className="text-[11px] text-primary font-medium">
											voice match 92%
										</span>
									</div>
									<p className="text-[13.5px] text-ink/85 leading-[1.55]">
										{r.t}
									</p>
								</article>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* ─── FEATURE 3 · TEAM HANDOFF ────────────────────────────────── */}
			<section className="bg-peach-200">
				<section className="py-24 lg:py-32 pb-32 lg:pb-40 wavy bg-background">
					<div className="max-w-[1320px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-16 items-center">
						<div className="col-span-12 lg:col-span-6 order-2 lg:order-1">
							<ScreenshotPlaceholder
								id="assign"
								label="Assignment view — a thread routed to a teammate with SLA chip."
								notes="Needed: screenshot of Inbox thread detail with 'Assigned to: Maya R.' and an SLA-remaining chip ('replies in 42m'). Include the @mention typeahead open. 4:3 crop."
								aspect="aspect-[4/3]"
								tone="bg-primary-soft"
							/>
						</div>

						<div className="col-span-12 lg:col-span-6 order-1 lg:order-2">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Team handoff
							</p>
							<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
								When it's
								<br />
								<span className="text-primary">someone else's to own.</span>
							</h2>
							<p className="mt-6 text-[16px] lg:text-[17px] text-ink/75 leading-[1.6] max-w-lg">
								Tag a teammate, set an SLA, and the Inbox routes the thread with
								the context they need. Customer questions to support, press asks
								to the right person, "Is this a real partnership?" straight to
								whoever owns it. Nothing goes lost in a group chat.
							</p>

							<ul className="mt-8 space-y-3 text-[14.5px] text-ink/85">
								{[
									"Assign with @mention, or auto-route by rule.",
									"Per-assignee SLA; overdue items bubble to the top.",
									"Shared notes — private team context stays with the thread.",
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
								href={routes.for.teams}
								className="pencil-link mt-8 inline-flex items-center gap-2 text-[14.5px] font-medium text-ink"
							>
								How teams use the Inbox
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
				<section className="py-24 lg:py-28 pb-32 lg:pb-40 wavy bg-peach-200">
					<div className="max-w-[1100px] mx-auto px-6 lg:px-10">
						<figure className="relative rounded-3xl p-10 lg:p-14">
							<MessageSquareQuote className="w-8 h-8 text-primary/60 mb-6" />
							<blockquote className="font-display text-[26px] lg:text-[34px] leading-[1.2] tracking-[-0.015em] max-w-3xl">
								"Finally a tool that doesn't make me feel like I'm running a
								call center."
							</blockquote>
							<figcaption className="mt-8 flex items-center gap-4">
								<span className="w-11 h-11 rounded-full bg-ink text-background-elev font-display flex items-center justify-center">
									A
								</span>
								<div>
									<p className="font-medium">Ainslee D.</p>
									<p className="text-[13px] text-ink/60">
										Studio owner · 14K on Instagram
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
					className="absolute inset-0 top-2! opacity-10 -z-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-24 lg:py-32 pb-32 lg:pb-40">
					<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 items-end">
						<div className="col-span-12 lg:col-span-8">
							<h2 className="font-display text-[44px] sm:text-[56px] lg:text-[80px] leading-[0.98] tracking-[-0.025em]">
								Close 12 tabs.
								<br />
								<span className="text-peach-300">Keep the care.</span>
							</h2>
						</div>
						<div className="col-span-12 lg:col-span-4 flex flex-col gap-4 lg:items-center">
							<Link
								href={routes.signin}
								className="inline-flex items-center gap-2 h-14 px-7 rounded-full text-background font-medium text-[15px] bg-primary transition-colors"
							>
								Start free — no card
								<ArrowRight className="w-4 h-4" />
							</Link>
							<Link
								href={routes.for.teams}
								className="pencil-link inline-flex items-center gap-2 text-[14.5px] font-medium"
							>
								<Users className="w-4 h-4" />
								Built for teams too
							</Link>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
