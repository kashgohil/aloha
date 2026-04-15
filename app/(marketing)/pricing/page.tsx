import { JsonLd } from "@/lib/json-ld";
import { routes } from "@/lib/routes";
import {
	absoluteUrl,
	breadcrumbJsonLd,
	faqJsonLd,
	makeMetadata,
} from "@/lib/seo";
import {
	ArrowRight,
	ArrowUpRight,
	Check,
	Flame,
	MessageCircle,
	Minus,
	PenLine,
	Radar,
	Smile,
	Sparkle,
	Wand2,
	Waves,
} from "lucide-react";
import Link from "next/link";
import { FaqList } from "../faq-list";
import { PricingCalculator } from "./_components/pricing-calculator";

export const metadata = makeMetadata({
	title: "Pricing — Basic $5/channel, add Muse for AI that sounds like you",
	description:
		"Aloha pricing: free for 3 channels. Basic at $5/channel covers scheduling, calendar, automations, and an AI companion. Add Muse for another $5/channel and unlock style-trained voice, per-channel variants, and advanced campaigns. Prices decline by $0.50 every 5 channels past 10.",
	path: routes.pricing,
});

// ─── Free tier card ─────────────────────────────────────────────────────────

const FREE_FEATURES = [
	"3 connected channels",
	"Manual posting + scheduling, calendar view",
	"Link-in-bio + landing page",
	"AI companion (50 generations / mo) — write, refine, suggest",
	"Basic analytics (last 30 days)",
	"Community support",
];

// ─── Sample bills ───────────────────────────────────────────────────────────

const SAMPLE_BILLS = [
	{ label: "Just LinkedIn", channels: 1, basic: 5, muse: 10 },
	{ label: "Core three", channels: 3, basic: 15, muse: 30 },
	{ label: "Active creator", channels: 5, basic: 25, muse: 50 },
	{ label: "All core social", channels: 7, basic: 35, muse: 70 },
	{ label: "Power user", channels: 10, basic: 50, muse: 100 },
	{ label: "Multi-brand", channels: 15, basic: 72.5, muse: 145 },
	{ label: "Agency", channels: 25, basic: 110, muse: 220 },
	{ label: "Heavy agency", channels: 50, basic: 185, muse: 370 },
];

// ─── What Muse unlocks ──────────────────────────────────────────────────────

const MUSE_FEATURES = [
	{
		Icon: PenLine,
		title: "Style-trained writing",
		desc: "Muse learns from your past posts, docs, and tone sliders until generations land in your cadence — per channel, so LinkedIn-Muse and TikTok-Muse are legitimately different.",
	},
	{
		Icon: Wand2,
		title: "Per-channel variants in one stream",
		desc: "Write once, get native-length, native-structure drafts for every selected channel — hashtags, threads, carousels, scripts, captions — each one pinned to that platform's rules.",
	},
	{
		Icon: Waves,
		title: "Fan-out + repurposing",
		desc: "Paste a blog, YouTube URL, podcast, or a long post. Muse returns a thread, a LinkedIn essay, a carousel outline, a Reel script, and a Pinterest pin — all linked back to the source.",
	},
	{
		Icon: Radar,
		title: "Advanced campaigns",
		desc: "Muse turns a goal and a date range into a beat sheet — teaser, announce, social proof, urgency, recap — across every channel in the plan, with an asset checklist.",
	},
	{
		Icon: Sparkle,
		title: "Best-time + virality score",
		desc: "Pre-publish chip reads your draft (length, hook, CTA, media) against your historical engagement and tells you what to tweak — and when to fire it.",
	},
	{
		Icon: MessageCircle,
		title: "Inbox replies in your voice",
		desc: "Comments and DMs land in a unified inbox with suggested replies in your style — classify, edit in-place, one-click send. Phased by platform ToS.",
	},
];

// ─── Add-ons ────────────────────────────────────────────────────────────────

const ADD_ONS = [
	{
		name: "Generation overage",
		price: "$10 / 1,000 credits",
		desc: "Each channel includes enough generation for normal use. If a campaign runs hot we auto-top-up and cap at 2× your monthly bill. Warnings at 80% and 100% — no surprise invoices.",
	},
	{
		name: "Video seconds",
		price: "$1 / second",
		desc: "Reels, TikTok, Shorts. Priced separately because video costs 10–100× more to generate than text. Packs of 45s ($30) and 150s ($90).",
	},
	{
		name: "Extra style profile",
		price: "$5 / mo each",
		desc: "For creators juggling genuinely distinct personas. Most users ship better work with one profile — add more only when it earns its keep.",
	},
	{
		name: "Dedicated onboarding",
		price: "$500 once",
		desc: "For annual customers running Muse on 15+ channels. We wire up your style, import past posts, and ship your first campaign together.",
	},
];

// ─── Matrix ─────────────────────────────────────────────────────────────────

type MatrixRow = {
	label: string;
	note?: string;
	free: boolean | string;
	basic: boolean | string;
	muse: boolean | string;
};

type MatrixSection = {
	heading: string;
	rows: MatrixRow[];
};

const MATRIX: MatrixSection[] = [
	{
		heading: "Channels + publishing",
		rows: [
			{
				label: "Connected channels",
				note: "X, LinkedIn, Facebook, Instagram, Threads, TikTok, YouTube",
				free: "3",
				basic: "Per channel · declines at 10, 15, 20, 25",
				muse: "Same",
			},
			{
				label: "Manual posting + scheduling",
				free: true,
				basic: true,
				muse: true,
			},
			{
				label: "Calendar + drag-to-reschedule",
				free: true,
				basic: true,
				muse: true,
			},
			{
				label: "Link-in-bio + landing pages",
				free: "1",
				basic: true,
				muse: true,
			},
			{ label: "Automation engine", free: false, basic: true, muse: true },
		],
	},
	{
		heading: "AI companion (in Basic)",
		rows: [
			{
				label: "Write a post from a prompt",
				free: "50 gens / mo",
				basic: "fair use",
				muse: "fair use",
			},
			{
				label: "Refine, shorten, expand, translate",
				free: true,
				basic: true,
				muse: true,
			},
			{
				label: "Hook + caption suggestions",
				free: true,
				basic: true,
				muse: true,
			},
			{
				label: "Simple recurring campaigns",
				note: "weekly digest, Tuesday tips, evergreen drip",
				free: false,
				basic: true,
				muse: true,
			},
		],
	},
	{
		heading: "Muse · style-trained AI",
		rows: [
			{
				label: "Writes in your style",
				note: "trained on your past posts, docs, tone sliders",
				free: false,
				basic: false,
				muse: true,
			},
			{
				label: "Per-channel native variants",
				note: "LinkedIn long, X short, TikTok hook — same stream",
				free: false,
				basic: false,
				muse: true,
			},
			{ label: "Fan-out + repurposing", free: false, basic: false, muse: true },
			{
				label: "Advanced campaign beat sheets",
				note: "teaser → announce → proof → urgency → recap",
				free: false,
				basic: false,
				muse: true,
			},
			{
				label: "Best-time + virality score",
				free: false,
				basic: false,
				muse: true,
			},
			{
				label: "Performance commentary",
				free: false,
				basic: false,
				muse: true,
			},
			{
				label: "Inbox AI replies",
				note: "phased; gated by platform ToS",
				free: false,
				basic: false,
				muse: true,
			},
			{
				label: "Short-form video (Reels, TikTok, Shorts)",
				note: "priced by the second",
				free: false,
				basic: false,
				muse: "add-on",
			},
		],
	},
	{
		heading: "Analytics",
		rows: [
			{
				label: "Analytics history",
				free: "30 days",
				basic: "1 year",
				muse: "2 years",
			},
			{ label: "CSV export", free: false, basic: true, muse: true },
			{ label: "Scheduled reports", free: false, basic: false, muse: true },
		],
	},
	{
		heading: "Billing + support",
		rows: [
			{ label: "Annual discount", free: "—", basic: "20%", muse: "20%" },
			{
				label: "Mid-cycle add/remove channel",
				free: "—",
				basic: "prorated",
				muse: "prorated",
			},
			{
				label: "Overage handling",
				note: "auto-billed at posted rates; capped at 2× bill",
				free: "blocks at 0",
				basic: true,
				muse: true,
			},
			{
				label: "Support",
				free: "Community",
				basic: "Email",
				muse: "Email · priority on 15+ channels",
			},
		],
	},
];

// ─── Competitors ────────────────────────────────────────────────────────────

const VS = [
	{
		n: "Buffer",
		us: "$5/ch Basic matches Buffer · add Muse for $5/ch more and get style-trained AI, not a shared assistant",
		them: "$6 / channel flat · AI Assistant is bundled but shallow (one shared tone, no voice training, no per-channel variants)",
		href: "/compare/buffer",
	},
	{
		n: "Kit (ConvertKit)",
		us: "Pay per channel you actually use · AI is a separate switch, not a hidden part of the bill",
		them: "$66/mo Creator Pro · AI is a subject-line generator · priced by subscribers, not by channels",
		href: "/compare/kit",
	},
	{
		n: "Hootsuite",
		us: "No tier cliff · 50 channels with Muse = $6/ch at the 26th and stays there forever",
		them: "From $99/mo · 10-channel cap on Professional · jumps to Team ($249) for more",
		href: "/compare/hootsuite",
	},
];

// ─── FAQ ────────────────────────────────────────────────────────────────────

const FAQ = [
	{
		q: "What's Muse?",
		a: "Muse is the AI layer that sits on top of Basic. It's trained on your writing — past posts, docs, tone sliders — so every generation sounds like you, per channel. It also covers advanced campaigns (beat sheets), fan-out (one long post → threads, carousels, scripts), best-time + virality scoring, performance commentary, and inbox replies in your style. Basic has a simpler AI companion; Muse is the full creative partner.",
	},
	{
		q: "Why are Basic and Muse priced the same per channel?",
		a: "Because they scale the same way. Each connected channel costs us real money to read, schedule, and publish to, and each Muse-enabled channel costs us another slice of model time. Same shape, same band discounts — add them up for your bill. Simpler to reason about than two different curves.",
	},
	{
		q: "How does the discount work past 10 channels?",
		a: "Same-price flat for the first 10 channels, then −$0.50 per channel every 5 channels through 25, then flat from there. So channels 1–10 are $5 (basic) or $10 (with Muse); 11–15 drop to $4.50/$9; 16–20 to $4/$8; 21–25 to $3.50/$7; and from the 26th onward it's $3/$6 forever.",
	},
	{
		q: "What's in the AI companion that Free and Basic users get?",
		a: "Single-shot, generic: write a post from a prompt, refine this text, shorten/expand/translate, suggest a hook or caption. It's not trained on your past work — think of it as a smart draft button. Free users get 50 generations a month, Basic users get fair-use unlimited. If you want the AI to sound like you, that's Muse.",
	},
	{
		q: "Can I turn Muse on for some channels and not others?",
		a: "Yes. Muse is a per-channel switch. A 5-channel user might run Muse on their 3 most important channels and leave the other 2 on Basic. Billing updates at the next cycle; credits pool across the Muse-enabled channels.",
	},
	{
		q: "What about generation limits on Muse?",
		a: "Each Muse channel includes enough generation for normal use. If you run a heavy campaign, we auto-top-up at $10 per 1,000 credits and cap total overage at 2× your monthly bill. You'll see warnings at 80% and 100% of the pool — never a surprise invoice.",
	},
	{
		q: "What's the free tier actually good for?",
		a: "Three connected channels, manual posting, scheduling, the calendar, link-in-bio, and the AI companion with 50 generations a month. Stay here as long as you like — Free never expires, no card at signup.",
	},
	{
		q: "What about video?",
		a: "Reels, TikTok, and Shorts generation is priced separately at $1/second because video costs 10–100× more to generate than text. Available as a Muse add-on: packs of 45 seconds ($30) or 150 seconds ($90).",
	},
	{
		q: "Nonprofit / student / OSS discounts?",
		a: "Yes — 40% off Basic and Muse for registered nonprofits, full-time students, and maintainers of OSS projects with 1,000+ stars. Email sales@usealoha.app with proof.",
	},
	{
		q: "Is there a team or multi-brand plan?",
		a: "Multi-brand today is the 'extra style profile' add-on ($5/mo each). Teams/workspaces are a separate initiative we'll ship after the AI-native core lands — we won't rush a multi-tenant model that doesn't hold up.",
	},
];

// ─── JSON-LD ────────────────────────────────────────────────────────────────

const PRICING_SOFTWARE_APP = {
	"@context": "https://schema.org",
	"@type": "SoftwareApplication",
	name: "Aloha",
	url: absoluteUrl(routes.pricing),
	applicationCategory: "BusinessApplication",
	operatingSystem: "Web, iOS, Android",
	description:
		"Aloha is an AI-native social content OS. Free tier with 3 channels. Basic at $5/channel covers scheduling and an AI companion; add Muse (+$5/channel) for style-trained voice, per-channel variants, and advanced campaigns. Per-channel prices decline by $0.50 every 5 channels past 10.",
	offers: {
		"@type": "AggregateOffer",
		offerCount: 3,
		lowPrice: "0",
		highPrice: "10",
		priceCurrency: "USD",
		offers: [
			{
				"@type": "Offer",
				name: "Free",
				description:
					"3 channels, AI companion (50 generations / mo), scheduling, calendar, link-in-bio.",
				price: "0",
				priceCurrency: "USD",
				availability: "https://schema.org/InStock",
				url: absoluteUrl(routes.pricing),
			},
			{
				"@type": "Offer",
				name: "Basic",
				description:
					"Per-channel scheduling, calendar, automations, and AI companion. $5/channel declining to $3 on the 26th channel.",
				price: "5",
				priceCurrency: "USD",
				availability: "https://schema.org/InStock",
				url: absoluteUrl(routes.pricing),
			},
			{
				"@type": "Offer",
				name: "Muse",
				description:
					"Style-trained voice, per-channel variants, fan-out, advanced campaigns, commentary, and inbox replies. Adds $5/channel to Basic, same declining shape.",
				price: "5",
				priceCurrency: "USD",
				availability: "https://schema.org/InStock",
				url: absoluteUrl(routes.pricing),
			},
		],
	},
};

// ─── Page ───────────────────────────────────────────────────────────────────

export default function PricingPage() {
	return (
		<>
			<JsonLd
				data={[
					PRICING_SOFTWARE_APP,
					breadcrumbJsonLd([
						{ name: "Home", path: routes.home },
						{ name: "Pricing", path: routes.pricing },
					]),
					faqJsonLd(FAQ),
				]}
			/>

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
				<span
					aria-hidden
					className="absolute top-[28%] right-[10%] font-display text-[38px] text-ink/15 rotate-18 select-none"
				>
					※
				</span>
			</header>

			<section className="bg-peach-200 wavy">
				<div className="relative max-w-[1320px] mx-auto px-6 lg:px-10 pt-20 lg:pt-28 pb-32 lg:pb-40">
					<div className="max-w-3xl">
						<div className="inline-flex items-center gap-2 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
							Pricing
						</div>
						<h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[96px]">
							$5 a channel.
							<br />
							<span className="text-primary font-light">Muse for $5 more.</span>
						</h1>
						<p className="mt-8 max-w-2xl text-[17px] lg:text-[18px] leading-[1.6] text-ink/75">
							Basic is scheduling, calendars, automations, and a smart AI
							companion that writes the first draft. Muse is the AI that
							actually sounds like you — trained on your writing, native to
							every channel. Flip it on per channel, pay only for what you use.
						</p>

						<div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-ink/65">
							<span className="inline-flex items-center gap-2">
								<Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
								Free for 3 channels
							</span>
							<span className="inline-flex items-center gap-2">
								<Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
								20% off annual
							</span>
							<span className="inline-flex items-center gap-2">
								<Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
								Muse is a per-channel switch
							</span>
						</div>
					</div>
				</div>
			</section>

			{/* ─── CALCULATOR ──────────────────────────────────────────────── */}
			<section className="bg-background-elev">
				<section className="bg-background py-16 lg:py-24 wavy pb-32 lg:pb-40">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
						<div className="mb-10 lg:mb-14 max-w-2xl">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Build your bill
							</p>
							<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
								Drag the slider.
								<br />
								<span className="text-primary">Toggle Muse.</span>
							</h2>
							<p className="mt-6 text-[15.5px] text-ink/70 leading-[1.55]">
								Each channel is $5 for Basic, $10 with Muse on top, up to your
								10th. After that every band of 5 is $0.50 cheaper, until it
								settles at $3 / $6 from the 26th onward.
							</p>
						</div>

						<PricingCalculator />

						{/* sample bills */}
						<div className="mt-16">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-6">
								What the bill looks like
							</p>
							<div className="rounded-3xl bg-background-elev border border-border overflow-hidden">
								<div className="grid grid-cols-12 px-6 lg:px-8 py-4 text-[11px] font-mono uppercase tracking-[0.18em] text-ink/55 border-b border-border">
									<div className="col-span-6">Shape</div>
									<div className="col-span-2 text-center">Channels</div>
									<div className="col-span-2 text-right">Basic</div>
									<div className="col-span-2 text-right">+ Muse</div>
								</div>
								{SAMPLE_BILLS.map((row) => (
									<div
										key={row.label}
										className="grid grid-cols-12 px-6 lg:px-8 py-4 border-t border-border text-[14px] items-center"
									>
										<div className="col-span-6 text-ink">{row.label}</div>
										<div className="col-span-2 text-center font-mono text-[13px]">
											{row.channels}
										</div>
										<div className="col-span-2 text-right font-display text-[17px] tracking-[-0.005em] text-ink/75">
											${formatPrice(row.basic)}
										</div>
										<div className="col-span-2 text-right font-display text-[18px] tracking-[-0.005em]">
											${formatPrice(row.muse)}
										</div>
									</div>
								))}
							</div>
							<p className="mt-4 text-[12px] text-ink/55 font-mono">
								Monthly billing shown · annual is 20% less
							</p>
						</div>
					</div>
				</section>
			</section>

			{/* ─── WHAT MUSE UNLOCKS ──────────────────────────────────────── */}
			<section className="bg-background-elev py-24 lg:py-32 wavy">
				<div className="max-w-[1320px] mx-auto px-6 lg:px-10">
					<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 mb-14 items-end">
						<div className="col-span-12 lg:col-span-7">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4 inline-flex items-center gap-2">
								<Sparkle className="w-3 h-3 text-primary" />
								Meet Muse
							</p>
							<h2 className="font-display text-[40px] lg:text-[64px] leading-[1.02] tracking-[-0.02em]">
								The AI that sounds
								<br />
								<span className="text-primary">like you wrote it.</span>
							</h2>
						</div>
						<p className="col-span-12 lg:col-span-5 text-[15.5px] text-ink/70 leading-[1.6]">
							Muse is trained on your own writing. Flip it on for a channel and
							every generation from that channel — posts, threads, carousels,
							campaign beats, inbox replies — comes out in your cadence, not
							generic AI slop.
						</p>
					</div>

					<ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
						{MUSE_FEATURES.map((f) => (
							<li
								key={f.title}
								className="rounded-3xl bg-background border border-border p-7 lg:p-8 flex flex-col"
							>
								<f.Icon className="w-5 h-5 text-primary" strokeWidth={2} />
								<h3 className="mt-5 font-display text-[22px] leading-tight tracking-[-0.005em]">
									{f.title}
								</h3>
								<p className="mt-3 text-[13.5px] text-ink/70 leading-[1.6]">
									{f.desc}
								</p>
							</li>
						))}
					</ul>
				</div>
			</section>

			{/* ─── FREE TIER + AGENCY ─────────────────────────────────────── */}
			<section className="bg-background-elev">
				<section className="bg-background py-24 lg:py-32 wavy">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
						<div className="mb-12 lg:mb-14 max-w-2xl">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Either end of the curve
							</p>
							<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
								Free to start.
								<br />
								<span className="text-primary">Fair past fifty.</span>
							</h2>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
							{/* Free */}
							<article className="rounded-3xl bg-peach-100 p-8 lg:p-10 flex flex-col">
								<Smile className="w-6 h-6 text-ink" />
								<h3 className="mt-6 font-display text-[30px] leading-tight">
									Free
								</h3>
								<p className="mt-1 text-[13px] text-ink/70">
									Three channels, no card, no expiry
								</p>
								<p className="mt-5 text-[14.5px] text-ink/80 leading-[1.55]">
									The AI companion is included — 50 generations a month to
									write, refine, and suggest. Muse is not. Stay here as long as
									you like.
								</p>
								<ul className="mt-7 space-y-2.5 text-[13.5px] text-ink/80 flex-1">
									{FREE_FEATURES.map((f) => (
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
										<span className="text-ink/45"> · no card, no expiry</span>
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

							{/* Agency */}
							<article className="rounded-3xl bg-peach-300 p-8 lg:p-10 flex flex-col">
								<Flame className="w-6 h-6 text-ink" />
								<h3 className="mt-6 font-display text-[30px] leading-tight">
									Running an agency?
								</h3>
								<p className="mt-1 text-[13px] text-ink/70">
									Many brands, one dashboard
								</p>
								<p className="mt-5 text-[14.5px] text-ink/80 leading-[1.55]">
									The 26th channel is $3 on Basic, $6 with Muse — and it stays
									there for the 50th, 100th, and beyond. No enterprise SKU, no
									contact-sales wall.
								</p>
								<ul className="mt-7 space-y-2.5 text-[13.5px] text-ink/80 flex-1">
									<li className="flex items-start gap-2.5">
										<Check
											className="w-3.5 h-3.5 mt-[3px] text-ink/70 shrink-0"
											strokeWidth={2.5}
										/>
										Floor holds at $3 / $6 past the 25th channel
									</li>
									<li className="flex items-start gap-2.5">
										<Check
											className="w-3.5 h-3.5 mt-[3px] text-ink/70 shrink-0"
											strokeWidth={2.5}
										/>
										Dedicated onboarding bundled on 15+ Muse channels, annual
									</li>
									<li className="flex items-start gap-2.5">
										<Check
											className="w-3.5 h-3.5 mt-[3px] text-ink/70 shrink-0"
											strokeWidth={2.5}
										/>
										Quarterly roadmap call, no extra cost
									</li>
									<li className="flex items-start gap-2.5">
										<Check
											className="w-3.5 h-3.5 mt-[3px] text-ink/70 shrink-0"
											strokeWidth={2.5}
										/>
										Extra style profiles ($5/mo each) for multi-brand
									</li>
								</ul>
								<div className="mt-8 pt-6 border-t border-ink/10">
									<p className="text-[12.5px] text-ink/65 mb-4">
										<span className="font-medium text-ink">
											Drag the slider past 15
										</span>
										<span className="text-ink/45">
											{" "}
											· or get on a call first
										</span>
									</p>
									<Link
										href="mailto:sales@usealoha.app"
										className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full font-medium text-[13.5px] transition-colors w-full bg-ink text-background-elev hover:bg-primary"
									>
										Talk to us
										<ArrowUpRight className="w-4 h-4" />
									</Link>
								</div>
							</article>
						</div>
					</div>
				</section>
			</section>

			{/* ─── ADD-ONS ─────────────────────────────────────────────────── */}
			<section className="bg-background-elev py-24 lg:py-32 wavy">
				<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
					<div className="mb-12 lg:mb-14 max-w-2xl">
						<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
							Add-ons · only if you need them
						</p>
						<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
							A few things
							<br />
							<span className="text-primary">priced as they should be.</span>
						</h2>
						<p className="mt-6 text-[15.5px] text-ink/70 leading-[1.55]">
							Video, overage top-ups, and extra style profiles stay separate.
							Folding them into the per-channel price would overcharge the
							minority who use them or starve the majority who don't.
						</p>
					</div>

					<ul className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
						{ADD_ONS.map((a) => (
							<li
								key={a.name}
								className="rounded-3xl bg-background border border-border p-7 lg:p-8 flex flex-col"
							>
								<div className="flex items-baseline justify-between gap-4">
									<p className="font-display text-[22px] leading-tight tracking-[-0.005em]">
										{a.name}
									</p>
									<p className="font-mono text-[13px] text-ink/70 shrink-0">
										{a.price}
									</p>
								</div>
								<p className="mt-4 text-[13.5px] text-ink/75 leading-[1.55]">
									{a.desc}
								</p>
							</li>
						))}
					</ul>
				</div>
			</section>

			{/* ─── FEATURE MATRIX ──────────────────────────────────────────── */}
			<section className="bg-background-elev">
				<section className="bg-background py-24 lg:py-32 wavy">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
						<div className="mb-12 lg:mb-14 max-w-2xl">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Full comparison
							</p>
							<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
								Every row,
								<br />
								<span className="text-primary">every plan.</span>
							</h2>
							<p className="mt-6 text-[15.5px] text-ink/70 leading-[1.55]">
								Free, Basic, and Basic + Muse side by side. No gated enterprise
								shelf — if it's shipped, it's here.
							</p>
						</div>

						<div className="rounded-3xl bg-background-elev border border-border overflow-hidden">
							<div className="grid grid-cols-12 px-6 lg:px-8 py-4 text-[11px] font-mono uppercase tracking-[0.18em] text-ink/55 border-b border-border sticky top-0 bg-background-elev z-10">
								<div className="col-span-6">Feature</div>
								<div className="col-span-2 text-center">Free</div>
								<div className="col-span-2 text-center">Basic</div>
								<div className="col-span-2 text-center">+ Muse</div>
							</div>

							{MATRIX.map((section) => (
								<div key={section.heading}>
									<div className="px-6 lg:px-8 py-3 bg-peach-100/40 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/70">
										{section.heading}
									</div>
									{section.rows.map((row) => (
										<div
											key={row.label}
											className="grid grid-cols-12 px-6 lg:px-8 py-4 border-t border-border text-[14px] items-center"
										>
											<div className="col-span-6 text-ink">
												<span>{row.label}</span>
												{row.note && (
													<span className="ml-2 text-[12px] text-ink/55">
														— {row.note}
													</span>
												)}
											</div>
											<MatrixCell value={row.free} />
											<MatrixCell value={row.basic} />
											<MatrixCell value={row.muse} />
										</div>
									))}
								</div>
							))}
						</div>
					</div>
				</section>
			</section>

			{/* ─── VS COMPETITORS ──────────────────────────────────────────── */}
			<section className="bg-primary-soft">
				<section className="bg-background-elev py-24 lg:py-32 wavy">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
						<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 mb-10 items-end">
							<div className="col-span-12 lg:col-span-7">
								<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
									The quick math
								</p>
								<h2 className="font-display text-[32px] lg:text-[44px] leading-[1.02] tracking-[-0.02em]">
									What you'd pay
									<br />
									<span className="text-primary">everywhere else.</span>
								</h2>
							</div>
							<p className="col-span-12 lg:col-span-4 text-[15.5px] text-ink/70 leading-[1.55]">
								Apples to apples, year 2026. Public pricing pulled from each
								vendor's page; we re-verify quarterly.
							</p>
						</div>

						<ul className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
							{VS.map((v) => (
								<li
									key={v.n}
									className="rounded-3xl bg-peach-100 p-7 lg:p-8 flex flex-col"
								>
									<p className="font-display text-[24px] leading-tight tracking-[-0.01em]">
										Aloha vs {v.n}
									</p>
									<dl className="mt-6 space-y-4 text-[13.5px] text-ink/80 flex-1">
										<div>
											<dt className="text-[10.5px] font-mono uppercase tracking-[0.22em] text-ink/55 mb-1">
												Aloha
											</dt>
											<dd>{v.us}</dd>
										</div>
										<div>
											<dt className="text-[10.5px] font-mono uppercase tracking-[0.22em] text-ink/55 mb-1">
												{v.n}
											</dt>
											<dd>{v.them}</dd>
										</div>
									</dl>
									<Link
										href={v.href}
										className="mt-6 pencil-link inline-flex items-center gap-1.5 text-[13px] font-medium text-ink"
									>
										Full comparison <ArrowUpRight className="w-3.5 h-3.5" />
									</Link>
								</li>
							))}
						</ul>
					</div>
				</section>
			</section>

			{/* ─── FAQ ─────────────────────────────────────────────────────── */}
			<section className="bg-ink relative">
				<div
					aria-hidden
					className="absolute inset-0 top-2.5 opacity-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<section className="bg-primary-soft py-24 lg:py-32 wavy">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-x-0 gap-y-8 lg:gap-10">
						<div className="col-span-12 lg:col-span-4 mb-12 lg:mb-14 max-w-2xl">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Pricing FAQ
							</p>
							<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
								The questions
								<br />
								<span className="text-primary">we actually get.</span>
							</h2>
						</div>

						<div className="col-span-12 lg:col-span-8">
							<FaqList items={FAQ} />
						</div>
					</div>
				</section>
			</section>

			{/* ─── FINAL CTA ───────────────────────────────────────────────── */}
			<section className="relative overflow-hidden bg-ink text-background-elev wavy">
				<div
					aria-hidden
					className="absolute inset-0 opacity-10 -z-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-24 lg:py-32">
					<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 items-end">
						<div className="col-span-12 lg:col-span-8">
							<h2 className="font-display text-[44px] sm:text-[56px] lg:text-[80px] leading-[0.98] tracking-[-0.025em]">
								Start free.
								<br />
								<span className="text-peach-300">
									Flip on Muse when you're ready.
								</span>
							</h2>
						</div>
						<div className="col-span-12 lg:col-span-4 flex flex-col gap-4 lg:items-end">
							<Link
								href={routes.signup}
								className="inline-flex items-center gap-2 h-14 px-7 rounded-full text-background font-medium text-[15px] bg-primary transition-colors"
							>
								Start free — no card
								<ArrowRight className="w-4 h-4" />
							</Link>
							<Link
								href={routes.compare.whyDifferent}
								className="pencil-link inline-flex items-center gap-2 text-[14.5px] font-medium"
							>
								Why Aloha is different
								<ArrowUpRight className="w-4 h-4" />
							</Link>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}

function MatrixCell({ value }: { value: boolean | string }) {
	return (
		<div className="col-span-2 text-center text-[13.5px] text-ink/80">
			{value === true ? (
				<Check className="inline w-4 h-4 text-primary" strokeWidth={2.5} />
			) : value === false ? (
				<Minus className="inline w-4 h-4 text-ink/25" strokeWidth={2.5} />
			) : (
				<span>{value}</span>
			)}
		</div>
	);
}

function formatPrice(n: number) {
	const rounded = Math.round(n * 100) / 100;
	return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(2);
}
