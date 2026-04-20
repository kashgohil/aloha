import { routes } from "@/lib/routes";
import { makeMetadata } from "@/lib/seo";
import {
	ArrowRight,
	ArrowUpRight,
	Check,
	FileText,
	Sparkle,
	Users,
	Wand2,
} from "lucide-react";
import Link from "next/link";
import { FeatureDetails } from "../_components/feature-details";
import { ScreenshotPlaceholder } from "../_components/screenshot-placeholder";

export const metadata = makeMetadata({
	title: "Composer — write once, sound like you on every channel",
	description:
		"Aloha's Composer, powered by Muse — the voice model trained on your writing that rewrites a single draft into native posts for every channel, without flattening your cadence into mush.",
	path: routes.product.composer,
});

// ─── Page ────────────────────────────────────────────────────────────────
export default function ComposerPage() {
	return (
		<>
			{/* ─── HERO ────────────────────────────────────────────────────── */}
			<header className="relative overflow-hidden">
				{/* sparse decorative marks — same family as landing */}
				<span
					aria-hidden
					className="absolute top-[12%] left-[5%] font-display text-[26px] text-ink/25 rotate-[-10deg] select-none"
				>
					✳
				</span>
				<span
					aria-hidden
					className="absolute top-[64%] left-[9%] font-display text-[20px] text-primary/55 rotate-14 select-none"
				>
					+
				</span>
				<span
					aria-hidden
					className="absolute top-[20%] right-[7%] font-display text-[36px] text-ink/15 rotate-20 select-none"
				>
					※
				</span>
				<span
					aria-hidden
					className="absolute top-[54%] left-[3%] w-2 h-2 rounded-full bg-primary/50"
				/>
				<span
					aria-hidden
					className="absolute top-[10%] right-[24%] w-1.5 h-1.5 rounded-full bg-ink/30"
				/>
			</header>

			<section className="bg-peach-200 wavy">
				<div className="relative max-w-[1320px] w-full mx-auto px-6 lg:px-10 pt-20 lg:pt-28 pb-32 lg:pb-40 grid grid-cols-12 gap-x-0 gap-y-8 lg:gap-12 items-center">
					{/* Copy */}
					<div className="col-span-12 lg:col-span-7 relative">
						<div className="inline-flex items-center gap-2 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
							The Composer · powered by Muse
						</div>

						<h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[92px]">
							Write once.
							<br />
							<span className="text-primary font-light">Sound like you</span>
							<br />
							on every channel.
						</h1>

						<p className="mt-8 max-w-[520px] text-[17px] lg:text-[18px] leading-[1.55] text-ink/70">
							Composer is the editor;{" "}
							<span className="font-medium text-ink">Muse</span> is the voice
							model inside it. Muse learns your cadence — the way you start
							sentences, when you dash, how long you go before a break — and
							rewrites a single draft into native posts for each network. Long
							for LinkedIn. Sharp for X. Soft for Instagram. Your voice, eight
							ways, no mush.
						</p>

						<div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
							<Link
								href={routes.signin}
								className="inline-flex items-center gap-2 h-14 px-7 rounded-full bg-primary text-primary-foreground font-medium text-[15px] shadow-[0_8px_0_-2px_rgba(46,42,133,0.35)] hover:shadow-[0_10px_0_-2px_rgba(46,42,133,0.4)] hover:-translate-y-0.5 transition-all"
							>
								Try the Composer
								<ArrowRight className="w-4 h-4" />
							</Link>
							<a
								href="#muse"
								className="pencil-link inline-flex items-center gap-2 text-[15px] font-medium text-ink"
							>
								Meet Muse
								<ArrowUpRight className="w-4 h-4" />
							</a>
						</div>

						{/* quiet stat row */}
						<div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-[12.5px] text-ink/60">
							<span className="inline-flex items-center gap-2">
								<Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
								8 networks
							</span>
							<span className="inline-flex items-center gap-2">
								<Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
								One draft, one click
							</span>
							<span className="inline-flex items-center gap-2">
								<Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
								Nothing ever auto-publishes without you
							</span>
						</div>
					</div>

					{/* Visual — composer mock card */}
					<div className="col-span-12 lg:col-span-5 relative">
						<div className="relative animate-[float-soft_9s_ease-in-out_infinite]">
							<div className="rounded-3xl bg-background-elev border border-border-strong shadow-[0_30px_60px_-20px_rgba(23,20,18,0.25)] overflow-hidden">
								{/* top bar */}
								<div className="px-5 py-3 flex items-center justify-between border-b border-border bg-muted/40">
									<div className="flex items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.18em] text-ink/60">
										<Wand2 className="w-3 h-3" />
										composer · draft
									</div>
									<span className="text-[10.5px] text-ink/50 font-mono">
										autosaved · 2s
									</span>
								</div>

								{/* raw draft — your voice */}
								<div className="px-5 py-4 border-b border-border">
									<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink/50 mb-2">
										Your draft
									</p>
									<p className="text-[14px] leading-[1.55] text-ink">
										monday reminder: the thing you're avoiding is usually the
										thing you should write about. even the writing about it is
										part of the work.
									</p>
								</div>

								{/* voice match bar */}
								<div className="px-5 py-3 border-b border-border flex items-center justify-between bg-peach-100/50">
									<div className="flex items-center gap-2 text-[11px] text-ink/75">
										<Sparkle className="w-3 h-3 text-primary" />
										<span className="font-medium">Muse match</span>
										<span className="font-mono text-ink/50">· 94%</span>
									</div>
									<button className="text-[11px] text-primary font-medium pencil-link">
										Teach me
									</button>
								</div>

								{/* per-channel rewrites */}
								<ul className="divide-y divide-border">
									{[
										{
											n: "LinkedIn",
											tone: "long-form",
											preview:
												"The thing you're avoiding is often the thing worth writing. Not because it's cathartic (it is) but because the avoidance is the signal.",
										},
										{
											n: "X",
											tone: "119/280",
											preview:
												"monday rule: the thing you're avoiding = the thing you should write about. the avoidance is the signal.",
										},
										{
											n: "Instagram",
											tone: "soft",
											preview:
												"a monday note: the thing you're avoiding is usually the thing worth writing about ☕",
										},
									].map((r) => (
										<li
											key={r.n}
											className="px-5 py-3.5 hover:bg-muted/30 transition-colors"
										>
											<div className="flex items-center justify-between mb-1.5">
												<span className="text-[11.5px] font-semibold text-ink">
													{r.n}
												</span>
												<span className="text-[10px] font-mono text-ink/45">
													{r.tone}
												</span>
											</div>
											<p className="text-[12.5px] leading-normal text-ink/75">
												{r.preview}
											</p>
										</li>
									))}
								</ul>

								{/* footer */}
								<div className="px-5 py-3 bg-muted/40 flex items-center justify-between">
									<span className="text-[11px] text-ink/55">
										all rewrites on-voice · Muse
									</span>
									<button className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-ink text-background text-[11.5px] font-medium">
										Schedule all
										<ArrowRight className="w-3 h-3" />
									</button>
								</div>
							</div>

							{/* floating chip */}
							<div className="hidden sm:flex absolute -bottom-5 -left-6 lg:-left-10 items-center gap-2.5 bg-background-elev text-ink border border-border-strong rounded-full pl-3 pr-4 py-2 shadow-[0_14px_30px_-16px_rgba(23,20,18,0.35)] -rotate-3">
								<span className="w-2 h-2 rounded-full bg-primary" />
								<span className="text-[11.5px] font-medium">
									sounds like you
								</span>
								<span className="text-[11px] text-ink/50 font-mono">
									· trained on 248 posts
								</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ─── FEATURE 1 · MEET MUSE ────────────────────────────────────── */}
			<section className="bg-background-elev">
				<section
					id="muse"
					className="py-24 pb-32 lg:pb-40 bg-background lg:py-32 wavy"
				>
					<div className="max-w-[1320px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-16 items-center">
						<div className="col-span-12 lg:col-span-5 order-2 lg:order-1">
							<ScreenshotPlaceholder
								label="Muse — the voice model reads your best posts and copies the patterns."
								notes="Needed: /app/settings/muse screenshot. Shows the trained-on count, sample posts with toggles, and the tone sliders. 5:4 crop, cream bg preserved."
								aspect="aspect-[5/4]"
								tone="bg-peach-100"
							/>
						</div>

						<div className="col-span-12 lg:col-span-6 lg:col-start-7 order-1 lg:order-2">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4 inline-flex items-center gap-2">
								<Sparkle className="w-3 h-3 text-primary" />
								Meet Muse
							</p>
							<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
								Your cadence,
								<br />
								<span className="text-primary">not a template.</span>
							</h2>
							<p className="mt-6 text-[16px] lg:text-[17px] text-ink/75 leading-[1.6] max-w-lg">
								Most AI writing tools pick a flavor — chirpy, corporate, "viral"
								— and flatten you into it. Muse studies the posts you liked
								writing and copies <em>those</em> patterns. The way you open.
								Where you break. When you don't use periods. The sentence
								fragments you lean on. It's less magic than careful listening.
							</p>

							<ul className="mt-8 space-y-3 text-[14.5px] text-ink/85">
								{[
									"Trains on the posts you mark as sounding like you — not your entire archive.",
									"Runs privately per account; we never pool voices across users.",
									"Re-trainable in two clicks when your style shifts.",
									"A per-channel switch — flip Muse on where it earns its keep, leave the rest on the AI companion.",
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
								href={routes.pricing}
								className="pencil-link mt-8 inline-flex items-center gap-2 text-[14.5px] font-medium text-ink"
							>
								Request Muse beta access
								<ArrowUpRight className="w-4 h-4" />
							</Link>
						</div>
					</div>
				</section>
			</section>

			{/* ─── FEATURE 2 · PER-CHANNEL REWRITES ─────────────────────────── */}
			<section className="py-24 pb-32 lg:pb-40 lg:py-32 bg-background-elev wavy">
				<div className="max-w-[1320px] mx-auto px-6 lg:px-10">
					<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 mb-14">
						<div className="col-span-12 lg:col-span-6">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								One draft, native everywhere
							</p>
							<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
								Long for LinkedIn.
								<br />
								<span className="text-primary">Sharp for X.</span>
								<br />
								Soft for Instagram.
							</h2>
						</div>
						<p className="col-span-12 lg:col-span-5 lg:col-start-8 text-[16px] text-ink/70 leading-[1.6] self-end">
							Writing the same post five times isn't a workflow — it's a tax.
							The Composer ships rewrites that respect each channel's weird
							little rules, with diffs you can redline in ten seconds.
						</p>
					</div>

					{/* 4-column rewrite grid — bento style */}
					<div className="grid grid-cols-12 auto-rows-[minmax(180px,auto)] gap-x-0 gap-y-4 lg:gap-6">
						{/* source draft — 6 col × 2 row */}
						<div className="col-span-12 lg:col-span-6 lg:row-span-2 bg-peach-200 rounded-3xl p-8 lg:p-10 flex flex-col">
							<div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-ink/60 mb-6">
								<FileText className="w-3 h-3" />
								source draft
							</div>
							<p className="font-display text-[22px] lg:text-[26px] leading-[1.3] tracking-[-0.01em] text-ink">
								"Launching a product is 20% work, 80% caring enough to tell
								people about it the seventh time. The 7th time is when the
								audience you weren't sure existed finally answers."
							</p>
							<div className="mt-auto pt-6 flex items-center gap-3 text-[12px] text-ink/60">
								<span className="font-mono">247 chars</span>
								<span className="text-ink/25">·</span>
								<span>on voice · 96%</span>
							</div>
						</div>

						{/* LinkedIn rewrite */}
						<article className="col-span-12 md:col-span-6 lg:col-span-6 bg-primary-soft rounded-3xl p-6 lg:p-7">
							<div className="flex items-center justify-between mb-3">
								<span className="text-[11.5px] font-semibold text-ink">
									LinkedIn
								</span>
								<span className="text-[10px] font-mono text-ink/45">
									long-form · +hook
								</span>
							</div>
							<p className="text-[14px] leading-[1.55] text-ink/85">
								Launching a product teaches you the brutal ratio:{" "}
								<span className="font-medium text-ink">
									20% building, 80% telling
								</span>
								. And the 80% isn't the first telling — it's the seventh. The
								seventh time is when the people who weren't sure they cared
								finally answer.
							</p>
						</article>

						{/* X rewrite */}
						<article className="col-span-6 md:col-span-3 lg:col-span-3 bg-background rounded-3xl p-6 lg:p-7 border border-border">
							<div className="flex items-center justify-between mb-3">
								<span className="text-[11.5px] font-semibold text-ink">X</span>
								<span className="text-[10px] font-mono text-ink/45">
									119/280
								</span>
							</div>
							<p className="text-[13px] leading-normal text-ink/85">
								launching = 20% work, 80% telling people the 7th time. the 7th
								is when the audience you weren't sure existed answers.
							</p>
						</article>

						{/* Instagram rewrite */}
						<article className="col-span-6 md:col-span-3 lg:col-span-3 bg-peach-100 rounded-3xl p-6 lg:p-7">
							<div className="flex items-center justify-between mb-3">
								<span className="text-[11.5px] font-semibold text-ink">
									Instagram
								</span>
								<span className="text-[10px] font-mono text-ink/45">
									soft · caption
								</span>
							</div>
							<p className="text-[13px] leading-[1.55] text-ink/85">
								launching a thing is 20% work and 80% caring enough to say it
								seven times ☕ the seventh is when the people answer.
							</p>
						</article>
					</div>

					{/* supporting claims */}
					<div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
						{[
							{
								h: "Platform rules, built in",
								p: "Character counts, hashtag etiquette, link placement — enforced per channel without you thinking about it.",
							},
							{
								h: "Diffs you can redline",
								p: "See exactly what the rewrite changed. Keep the turns of phrase you like, reject the ones you don't.",
							},
							{
								h: "Ship or sit",
								p: "Nothing auto-publishes. Composer hands you a queue; you press go.",
							},
						].map((c) => (
							<div
								key={c.h}
								className="p-7 rounded-3xl bg-background border border-border"
							>
								<p className="font-display text-[20px] leading-tight tracking-[-0.01em]">
									{c.h}
								</p>
								<p className="mt-3 text-[14px] text-ink/70 leading-[1.55]">
									{c.p}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ─── FEATURE 3 · DRAFTS & APPROVALS ───────────────────────────── */}
			<section className="bg-background-elev">
				<section className="py-24 pb-32 lg:pb-40 lg:py-32 bg-background wavy">
					<div className="max-w-[1320px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-16 items-center">
						<div className="col-span-12 lg:col-span-6">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Drafts &amp; approvals
							</p>
							<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
								A quiet handoff
								<br />
								<span className="text-primary">between writer and editor.</span>
							</h2>
							<p className="mt-6 text-[16px] lg:text-[17px] text-ink/75 leading-[1.6] max-w-lg">
								Drafts land in one place. Editors comment inline, suggest a
								tighter hook, and approve. No forwarded Google Docs. No
								screenshots in Slack. No "final_final_v3.docx." The Composer
								treats the review step like a first-class citizen.
							</p>

							<ul className="mt-8 space-y-3 text-[14.5px] text-ink/85">
								{[
									"Inline suggestions — accept or reject without leaving the draft.",
									"Per-brand voice on Team plan; juniors ship as confidently as founders.",
									"Audit log of every change, so a surprise edit never lands in prod.",
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
								How teams use Aloha
								<ArrowUpRight className="w-4 h-4" />
							</Link>
						</div>

						<div className="col-span-12 lg:col-span-6">
							<ScreenshotPlaceholder
								label="Approvals queue — editor's view of drafts awaiting sign-off."
								notes="Coming soon. Approvals/comment-thread workflow isn't shipped yet; placeholder stays illustrative until the feature lands."
								aspect="aspect-[5/3]"
								tone="bg-peach-100"
								comingSoon
							/>
						</div>
					</div>
				</section>
			</section>

			{/* ─── TEMPLATE LAUNCHPAD ───────────────────────────────────────── */}
			<section className="relative">
				<section className="py-24 pb-32 lg:pb-40 lg:py-28 bg-background-elev wavy">
					<div className="max-w-[1320px] mx-auto px-6 lg:px-10">
						<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 items-end mb-10">
							<div className="col-span-12 lg:col-span-7">
								<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
									Start from a template
								</p>
								<h2 className="font-display text-[32px] lg:text-[44px] leading-[1.02] tracking-[-0.02em]">
									Blank pages are
									<span className="text-primary"> optional.</span>
								</h2>
							</div>
							<p className="col-span-12 lg:col-span-4 text-[15.5px] text-ink/70 leading-[1.55]">
								Pick a template, and the Composer preloads the voice, channel
								mix, and posting cadence. Edit the text, schedule, done.
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
							{[
								{
									name: "Weekly field note",
									desc: "One long-form post Monday, sharp X thread Wednesday, Instagram recap Friday.",
									tone: "bg-peach-100",
									count: "3 posts",
								},
								{
									name: "Product launch (7-beat)",
									desc: "Teaser → drop → social proof → answer the objection → repost → FAQ → 'last call'.",
									tone: "bg-peach-200",
									count: "7 posts",
								},
								{
									name: "Monthly digest",
									desc: "Summary newsletter → LinkedIn carousel → Threads excerpt → evergreen pin.",
									tone: "bg-primary-soft",
									count: "4 posts",
								},
							].map((t) => (
								<article
									key={t.name}
									className={`group relative rounded-3xl p-6 lg:p-7 ${t.tone} flex flex-col min-h-[220px]`}
								>
									<div className="flex items-center justify-between mb-auto">
										<span className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink/55">
											Template
										</span>
										<span className="text-[10.5px] font-medium text-ink/60">
											{t.count}
										</span>
									</div>
									<h3 className="mt-10 font-display text-[24px] leading-[1.15] tracking-[-0.01em]">
										{t.name}
									</h3>
									<p className="mt-3 text-[13.5px] text-ink/70 leading-normal">
										{t.desc}
									</p>
									<Link
										href={routes.resources.templates}
										className="mt-6 self-start pencil-link text-[13px] font-medium text-ink inline-flex items-center gap-1.5"
									>
										Open in Composer
										<ArrowUpRight className="w-3.5 h-3.5" />
									</Link>
								</article>
							))}
						</div>

						<div className="mt-10 text-[13.5px] text-ink/60">
							<Link
								href={routes.resources.templates}
								className="pencil-link inline-flex items-center gap-2"
							>
								Browse the whole library
								<ArrowUpRight className="w-3.5 h-3.5" />
							</Link>
						</div>
					</div>
				</section>
			</section>

			{/* ─── FEATURE DETAILS ──────────────────────────────────────────── */}
			<section className="relative bg-ink">
				<div
					aria-hidden
					className="absolute inset-0 top-2.5! opacity-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<div className="bg-background py-24 pb-32 lg:pb-40 lg:py-28 wavy">
					<div className="max-w-[1320px] mx-auto px-6 lg:px-10">
						<FeatureDetails
							eyebrow="Under the hood"
							heading={
								<>
									What the Composer actually does,
									<br />
									<span className="text-primary">without asking twice.</span>
								</>
							}
							intro="A single editor with the panels that matter stitched in — scoring, variants, fanout, scheduling. No mode-switching, no second tab."
							details={[
								{
									title: "Voice-match score",
									body: "Every draft gets a live match percentage and a tone read. Muse pulls from your last 200 best-performing posts so the bar is yours, not a template's.",
								},
								{
									title: "Per-channel rewrites",
									body: "The fanout panel drafts native variants for each connected channel — length, cadence, and platform convention, all respected, no copy-paste gymnastics.",
								},
								{
									title: "Variants on demand",
									body: "Ask for another angle and get three rewrites side-by-side. Keep one, fork another, ditch the rest.",
								},
								{
									title: "Library at your elbow",
									body: "Pull a past post, an asset, or a saved idea into the editor without leaving the page. Nothing you've written ever has to be retyped.",
								},
								{
									title: "Preview-accurate",
									body: "See how LinkedIn, X, Instagram, and Threads will actually render your post — line breaks, link cards, truncation — before you schedule it.",
								},
								{
									title: "Schedule in place",
									body: "Pick a slot from inside the composer; the calendar updates without a round-trip. Ship the whole set in one move.",
								},
							]}
						/>
					</div>
				</div>
			</section>

			{/* ─── FINAL CTA ────────────────────────────────────────────────── */}
			<section className="relative overflow-hidden bg-ink wavy text-background-elev">
				<div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-24 pb-32 lg:pb-40 lg:py-32 z-10">
					<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 items-end">
						<div className="col-span-12 lg:col-span-8">
							<h2 className="font-display text-[44px] sm:text-[56px] lg:text-[80px] leading-[0.98] tracking-[-0.025em]">
								Write the post once.
								<br />
								<span className="text-peach-300">
									Let the Composer do the rest.
								</span>
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
								href={routes.for.teams}
								className="pencil-link inline-flex items-center gap-2 text-[14.5px] font-medium"
							>
								<Users className="w-4 h-4" />
								Working with a team? Read this
							</Link>
						</div>
					</div>
				</div>
				<div
					aria-hidden
					className="absolute -z-10 inset-0 top-2! opacity-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
			</section>
		</>
	);
}
