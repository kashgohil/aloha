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
	{ v: "2026", l: "founded" },
	{ v: "1", l: "person · founder-operator" },
	{ v: "India", l: "home base" },
	{ v: "Apr '26", l: "public launch" },
];

const DOWNLOADS = [
	{
		h: "Full brand kit",
		p: "Logo (SVG + PNG), favicon, and the full screenshot pack in one zip.",
		cta: "Download kit.zip",
		href: "/press/aloha-brand-kit.zip",
		tone: "bg-peach-200",
	},
	{
		h: "Logo — wordmark",
		p: "Fraunces wordmark + indigo period. SVG for print and web.",
		cta: "Logo (SVG)",
		href: "/press/aloha-logo.svg",
		tone: "bg-peach-100",
	},
	{
		h: "Screenshot pack",
		p: "Composer, Calendar, Inbox, Logic Matrix, Analytics — WebP originals in one zip.",
		cta: "Screenshots.zip",
		href: "/press/screenshots.zip",
		tone: "bg-primary-soft",
	},
];

const QUOTES = [
	{
		by: "Kashyap Gohil, founder",
		role: "Everything",
		body: "I treat the export button as the feature. If a customer can leave on any Tuesday afternoon, I earn the stay every month.",
	},
	{
		by: "Kashyap Gohil, founder",
		role: "Everything",
		body: "The category is loud. The tools should help you post less, not more. That's the shape of what I'm building.",
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
									href="mailto:press@usealoha.app"
									className="pencil-link text-ink"
								>
									press@usealoha.app
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
								href="mailto:press@usealoha.app"
								className="mt-4 inline-flex items-center gap-2 text-[14px] font-medium text-ink pencil-link"
							>
								<Mail className="w-4 h-4" />
								press@usealoha.app
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
								Founded in 2026 in India by Kashyap Gohil, Aloha was built to be
								the quiet alternative in a loud category. The product entered
								public beta in Q1 2026 and opened to the public in April 2026.
							</p>
							<p>
								Aloha is an indie, bootstrapped project — one person, one desk,
								one roadmap. No outside investors, no growth-loop mechanics, no
								referral programme.
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
									<a
										href={d.href}
										download
										className="mt-auto self-start flex items-center gap-2 h-10 px-5 rounded-full bg-ink text-background text-[12.5px] font-medium hover:bg-primary transition-colors"
									>
										<Download className="w-3.5 h-3.5" />
										{d.cta}
									</a>
								</article>
							))}
						</div>

						<p className="mt-10 text-[12.5px] text-ink/55 max-w-xl font-mono">
							Need something else — a specific crop, a higher-res logo, or a
							vector icon? Email press@usealoha.app and you'll get it back
							within the business day.
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
							notes=""
							aspect="aspect-[16/10]"
							src="/aloha-composer.webp"
							alt="Aloha Composer — a draft with Muse voice-match score and native rewrites for LinkedIn, X, and Instagram."
						/>
						<ScreenshotPlaceholder
							id="press-calendar"
							label="Calendar — week view with chip overlays."
							notes=""
							aspect="aspect-[16/10]"
							src="/aloha-calendar.webp"
							alt="Aloha Calendar week view with scheduled posts across seven days, channel chips, and status indicators."
						/>
						<ScreenshotPlaceholder
							id="press-matrix"
							label="Logic Matrix — cross-channel automation canvas."
							notes=""
							aspect="aspect-[16/10]"
							src="/aloha-automations-edit.webp"
							alt="Aloha Logic Matrix builder — cross-channel Reactflow canvas with trigger, condition, and action nodes plus a human-approve chip."
						/>
						<ScreenshotPlaceholder
							id="press-inbox"
							label="Inbox — unified comments and DMs across channels."
							notes=""
							aspect="aspect-[16/10]"
							src="/aloha-inbox.webp"
							alt="Aloha Inbox — unified comments, DMs, and mentions across Instagram, LinkedIn, X, and Threads in one list."
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
									href="mailto:press@usealoha.app"
									className="pencil-link text-ink"
								>
									press@usealoha.app
								</a>{" "}
								— we turn those around in a day.
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
							{QUOTES.map((q, i) => (
								<figure
									key={`${q.by}-${i}`}
									className={`p-8 lg:p-10 rounded-3xl ${i === 0 ? "bg-peach-300" : "bg-primary-soft"} flex flex-col`}
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
					className="absolute inset-0 opacity-20 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
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
								No form. No triage. Press requests land in the founder's inbox
								and get a reply the same day during business hours.
							</p>
						</div>
						<div className="col-span-12 lg:col-span-4 flex flex-col gap-3 lg:items-end">
							<a
								href="mailto:press@usealoha.app"
								className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-primary text-background text-[14px] font-medium hover:bg-primary/90 transition-colors"
							>
								press@usealoha.app
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
			</section>
		</>
	);
}
