import { routes } from "@/lib/routes";
import { makeMetadata } from "@/lib/seo";
import {
	ArrowRight,
	ArrowUpRight,
	Copy,
	Download,
	Mail,
	Newspaper,
	Quote,
} from "lucide-react";
import Link from "next/link";
import { ScreenshotPlaceholder } from "../_components/screenshot-placeholder";

export const metadata = makeMetadata({
	title: "Press kit — logos, screenshots, and the short story",
	description:
		"Downloadable Aloha assets and a short company boilerplate for journalists, partners and analysts. Press contact below.",
	path: routes.company.press,
});

const FAST_FACTS = [
	{ v: "2025", l: "founded" },
	{ v: "6", l: "team members" },
	{ v: "3", l: "cities · Lisbon · Oakland · Jakarta" },
	{ v: "140K+", l: "creators in first 90 days" },
];

const DOWNLOADS = [
	{
		h: "Full brand kit",
		p: "Logo pack (SVG + PNG), wordmark variants, color palette tokens, usage don'ts. 14 MB zip.",
		cta: "Download kit.zip",
		tone: "bg-peach-200",
	},
	{
		h: "Logo — wordmark",
		p: "Fraunces wordmark + indigo period. Primary on cream, inverse on ink. SVG.",
		cta: "Logo (SVG)",
		tone: "bg-peach-100",
	},
	{
		h: "Screenshot pack",
		p: "Composer, Calendar, Inbox, Logic Matrix, Analytics. Cropped 16:10 and 9:16 for mobile press.",
		cta: "Screenshots.zip",
		tone: "bg-primary-soft",
	},
];

const QUOTES = [
	{
		by: "Aarohi Mehta, co-founder",
		role: "Product",
		body: "The category is loud. The tools should help you post less, not more. That's the shape of what we're building.",
	},
	{
		by: "Kashyap Gohil, co-founder",
		role: "Engineering",
		body: "We treat the export button as the feature. If a customer can leave on any Tuesday afternoon, we earn the stay every month.",
	},
];

export default function PressPage() {
	return (
		<>
			{/* ─── HERO ────────────────────────────────────────────────────── */}
			<header className="relative overflow-hidden bg-peach-200 pb-16 lg:pb-20">
				<span
					aria-hidden
					className="absolute top-[14%] left-[5%] font-display text-[28px] text-ink/25 rotate-[-8deg] select-none"
				>
					✳
				</span>
				<span
					aria-hidden
					className="absolute top-[68%] right-[8%] font-display text-[22px] text-primary/55 rotate-14 select-none"
				>
					+
				</span>
			</header>

			<section className="bg-peach-200 wavy">
				<div className="relative max-w-[1180px] mx-auto px-6 lg:px-10 pt-20 lg:pt-28 pb-32 lg:pb-40">
					<div className="grid grid-cols-12 gap-x-0 gap-y-8 lg:gap-12 items-end">
						<div className="col-span-12 lg:col-span-8">
							<div className="inline-flex items-center gap-2 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
								Press kit
							</div>
							<h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[96px]">
								The story,
								<br />
								<span className="text-primary font-light">
									at download speed.
								</span>
							</h1>
							<p className="mt-8 max-w-2xl text-[17px] lg:text-[18px] leading-[1.6] text-ink/75">
								Logos, screenshots, the short company boilerplate, founder
								quotes, and a direct press contact. If you need something that
								isn't here, email{" "}
								<a
									href="mailto:press@aloha.social"
									className="pencil-link text-ink"
								>
									press@aloha.social
								</a>{" "}
								— same-day reply in business hours.
							</p>
						</div>
						<div className="col-span-12 lg:col-span-4">
							<a
								href="#downloads"
								className="inline-flex items-center gap-3 h-14 px-7 rounded-full bg-ink text-background text-[15px] font-medium hover:bg-primary transition-colors"
							>
								<Download className="w-4 h-4" />
								Jump to downloads
							</a>
							<a
								href="mailto:press@aloha.social"
								className="mt-4 inline-flex items-center gap-2 text-[14px] font-medium text-ink pencil-link"
							>
								<Mail className="w-4 h-4" />
								press@aloha.social
							</a>
						</div>
					</div>
				</div>
			</section>

			{/* ─── 30-SECOND STORY ─────────────────────────────────────────── */}
			<section className="py-20 lg:py-24">
				<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
					<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-16">
						<div className="col-span-12 lg:col-span-4">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								In 30 seconds
							</p>
							<h2 className="font-display text-[34px] lg:text-[44px] leading-[1.05] tracking-[-0.015em]">
								The company,
								<br />
								<span className="text-primary">boiled down.</span>
							</h2>
						</div>

						<div className="col-span-12 lg:col-span-8 space-y-5 text-[15.5px] lg:text-[16.5px] leading-[1.7] text-ink/85">
							<p>
								Aloha is a calm social media OS for creators and small teams. It
								schedules posts across eight networks, triages comments and DMs
								in a unified inbox, and automates cross-channel flows without
								code.
							</p>
							<p>
								Founded in March 2025 in Lisbon by Aarohi Mehta and Kashyap
								Gohil, Aloha was built to be the quiet alternative in a loud
								category. The product entered public beta in January 2026 and
								reached 140,000 users in its first 90 days, without a referral
								programme or push-notification growth loops.
							</p>
							<p>
								The company is backed by a small seed round from investors who
								signed an explicit &ldquo;calm tool, not a growth machine&rdquo;
								side letter. The team is six people across Lisbon, Oakland and
								Jakarta.
							</p>
						</div>
					</div>

					{/* copy helpers */}
					<div className="mt-10 flex flex-wrap gap-3">
						<button className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-background-elev border border-border-strong text-[13px] font-medium hover:bg-muted transition-colors">
							<Copy className="w-3.5 h-3.5" />
							Copy 30-second
						</button>
						<button className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-background-elev border border-border-strong text-[13px] font-medium hover:bg-muted transition-colors">
							<Copy className="w-3.5 h-3.5" />
							Copy 5-second ("the calm social OS")
						</button>
					</div>
				</div>
			</section>

			{/* ─── FAST FACTS ─────────────────────────────────────────────── */}
			<section className="py-16 lg:py-20 bg-primary text-primary-foreground">
				<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
					<div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/20">
						{FAST_FACTS.map((f) => (
							<div key={f.l} className="px-6 py-6 first:pl-0">
								<p className="font-display text-[48px] lg:text-[64px] leading-none tracking-[-0.025em]">
									{f.v}
								</p>
								<p className="mt-3 text-[12px]">{f.l}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ─── DOWNLOADS ──────────────────────────────────────────────── */}
			<section className="bg-background-elev">
				<section
					id="downloads"
					className="py-24 lg:py-32 bg-background wavy pb-32 lg:pb-40"
				>
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
						<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 mb-12 items-end">
							<div className="col-span-12 lg:col-span-7">
								<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
									Downloads
								</p>
								<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
									Assets, clean
									<span className="text-primary"> and open.</span>
								</h2>
							</div>
							<p className="col-span-12 lg:col-span-4 text-[15.5px] text-ink/70 leading-[1.55]">
								Free to use under the rules in the{" "}
								<Link
									href={routes.company.brand}
									className="pencil-link text-ink"
								>
									brand guidelines
								</Link>
								. Unmodified logos only; we're okay if you crop, we're not okay
								if you change our colours.
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
							{DOWNLOADS.map((d) => (
								<article
									key={d.h}
									className={`p-7 rounded-3xl ${d.tone} flex flex-col min-h-[240px]`}
								>
									<Download className="w-6 h-6 text-ink" />
									<h3 className="mt-6 font-display text-[22px] leading-[1.15] tracking-[-0.005em]">
										{d.h}
									</h3>
									<p className="mt-3 text-[13.5px] text-ink/75 leading-[1.55]">
										{d.p}
									</p>
									<button
										type="button"
										className="mt-auto self-start flex items-center gap-2 h-10 px-5 rounded-full bg-ink text-background text-[12.5px] font-medium hover:bg-primary transition-colors"
									>
										<Download className="w-3.5 h-3.5" />
										{d.cta}
									</button>
								</article>
							))}
						</div>

						<p className="mt-10 text-[12.5px] text-ink/55 max-w-xl font-mono">
							Asset links in this kit currently resolve to placeholder zips
							(press @ aloha.social to request the real files while we migrate
							the download CDN).
						</p>
					</div>
				</section>
			</section>

			{/* ─── SCREENSHOTS ─────────────────────────────────────────────── */}
			<section className="py-24 lg:py-32 bg-background-elev wavy">
				<div className="max-w-[1180px] mx-auto px-6 lg:px-10 pb-8 lg:pb-12">
					<div className="mb-12">
						<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
							Screenshots
						</p>
						<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
							The product
							<span className="text-primary"> in pictures.</span>
						</h2>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
						<ScreenshotPlaceholder
							id="press-composer"
							label="Composer — draft with voice match and per-channel rewrites."
							notes="Needed: /app/composer screenshot. 16:10 crop. Show the draft editor with voice-match badge visible and three channel rewrites in the right rail. Used in press as primary product hero image."
							aspect="aspect-[16/10]"
							tone="bg-peach-100"
						/>
						<ScreenshotPlaceholder
							id="press-calendar"
							label="Calendar — week view with chip overlays."
							notes="Needed: /app/calendar screenshot. 16:10 crop. Week view mid-week, multiple channel chips visible across 7 columns, floating 'best-time' indicator."
							aspect="aspect-[16/10]"
							tone="bg-primary-soft"
						/>
						<ScreenshotPlaceholder
							id="press-matrix"
							label="Logic Matrix — cross-channel automation canvas."
							notes="Needed: /app/automations screenshot. 16:10 crop. Reactflow canvas with 4-5 nodes and one human-approve chip visible."
							aspect="aspect-[16/10]"
							tone="bg-peach-200"
						/>
						<ScreenshotPlaceholder
							id="press-inbox"
							label="Inbox — unified comments and DMs across channels."
							notes="Needed: /app/inbox screenshot. 16:10 crop. Show three threads from IG / LinkedIn / X with tone chips and the 'reply first' priority highlight."
							aspect="aspect-[16/10]"
							tone="bg-peach-300"
						/>
					</div>
				</div>
			</section>

			{/* ─── FOUNDER QUOTES ─────────────────────────────────────────── */}
			<section className="bg-ink relative">
				<div
					aria-hidden
					className="absolute inset-0 top-2.5! opacity-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<section className="py-24 lg:py-32 bg-background wavy pb-32 lg:pb-40">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
						<div className="mb-12">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Pre-cleared quotes
							</p>
							<h2 className="font-display text-[36px] lg:text-[48px] leading-[1.02] tracking-[-0.02em]">
								Founder quotes,
								<span className="text-primary"> ready to run.</span>
							</h2>
							<p className="mt-5 text-[15.5px] text-ink/70 max-w-xl leading-[1.6]">
								If you want a custom quote for your angle, email{" "}
								<a
									href="mailto:press@aloha.social"
									className="pencil-link text-ink"
								>
									press@aloha.social
								</a>{" "}
								— we turn those around in a day.
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
							{QUOTES.map((q, i) => (
								<figure
									key={q.by}
									className={`p-8 lg:p-10 rounded-3xl ${i === 0 ? "bg-peach-200" : "bg-primary-soft"} flex flex-col`}
								>
									<Quote className="w-7 h-7 text-ink/40 mb-5" />
									<blockquote className="font-display text-[22px] lg:text-[26px] leading-[1.2] tracking-[-0.005em] text-ink">
										"{q.body}"
									</blockquote>
									<figcaption className="mt-6 pt-5 border-t border-ink/10">
										<p className="font-medium text-[14.5px] text-ink">{q.by}</p>
										<p className="text-[12px] text-ink/60 font-mono uppercase tracking-[0.14em]">
											{q.role}
										</p>
									</figcaption>
								</figure>
							))}
						</div>
					</div>
				</section>
			</section>

			{/* ─── PRESS CONTACT ──────────────────────────────────────────── */}
			<section className="py-24 lg:py-32 bg-ink relative wavy pb-32 lg:pb-40 text-background-elev">
				<div
					aria-hidden
					className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
					<div className="p-10 lg:p-14 rounded-3xl overflow-hidden relative">
						<div className="relative grid grid-cols-12 gap-x-0 gap-y-8 lg:gap-8 items-center">
							<div className="col-span-12 lg:col-span-8">
								<Newspaper className="w-7 h-7 text-peach-300 mb-5" />
								<h2 className="font-display text-[32px] lg:text-[44px] leading-[1.05] tracking-[-0.015em]">
									Direct to a human,
									<br />
									<span className="text-peach-300">
										same day in business hours.
									</span>
								</h2>
								<p className="mt-5 text-[15px] text-background-elev/75 leading-[1.6] max-w-xl">
									No form. No triage. Press requests go to Leilani, our
									community + comms lead. She reads every one.
								</p>
							</div>
							<div className="col-span-12 lg:col-span-4 flex flex-col gap-3 lg:items-end">
								<a
									href="mailto:press@aloha.social"
									className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-primary text-background text-[14px] font-medium hover:bg-primary/90 transition-colors"
								>
									press@aloha.social
									<ArrowRight className="w-4 h-4" />
								</a>
								<a
									href="https://twitter.com/alohasocial"
									className="pencil-link inline-flex items-center gap-2 text-[13.5px]"
								>
									@alohasocial on X
									<ArrowUpRight className="w-3.5 h-3.5" />
								</a>
							</div>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
