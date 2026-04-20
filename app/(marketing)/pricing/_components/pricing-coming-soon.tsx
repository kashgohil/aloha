import { routes } from "@/lib/routes";
import {
	ArrowRight,
	Check,
	MessageCircle,
	PenLine,
	Radar,
	Sparkle,
	Wand2,
	Waves,
} from "lucide-react";
import Link from "next/link";
import { WishlistForm } from "./wishlist-form";

const FREE_FEATURES = [
	"3 connected channels",
	"Manual posting + scheduling, calendar view",
	"Link-in-bio + landing page",
	"AI companion (50 generations / mo)",
	"Basic analytics (last 30 days)",
	"Community support",
];

const MUSE_HIGHLIGHTS = [
	{
		Icon: PenLine,
		title: "Style-trained writing",
		desc: "Muse learns your voice from past posts and tone sliders — per channel.",
	},
	{
		Icon: Wand2,
		title: "Per-channel variants",
		desc: "Write once, get native-length drafts for every selected channel.",
	},
	{
		Icon: Waves,
		title: "Fan-out + repurposing",
		desc: "Paste a blog, YouTube URL, or podcast. Get threads, carousels, scripts — all linked back.",
	},
	{
		Icon: Radar,
		title: "Advanced campaigns",
		desc: "Turn a goal and a date range into a full beat sheet across every channel.",
	},
	{
		Icon: Sparkle,
		title: "Best-time + virality score",
		desc: "Pre-publish scoring reads your draft against your historical engagement.",
	},
	{
		Icon: MessageCircle,
		title: "Inbox replies in your voice",
		desc: "Unified inbox with AI replies in your style. One-click send.",
	},
];

export function PricingComingSoon() {
	return (
		<>
			{/* ─── HERO ──────────────────────────────────────────────────────── */}
			<section className="bg-peach-200 wavy">
				<div className="relative max-w-[1320px] mx-auto px-6 lg:px-10 pt-20 lg:pt-28 pb-32 lg:pb-40">
					<div className="max-w-3xl">
						<div className="inline-flex items-center gap-2 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
							Pricing
						</div>
						<h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[96px]">
							Free to start.
							<br />
							<span className="text-primary font-light">Paid plans soon.</span>
						</h1>
						<p className="mt-8 max-w-2xl text-[17px] lg:text-[18px] leading-[1.6] text-ink/75">
							Aloha is free right now — connect up to 3 channels, schedule
							posts, and use the AI companion. Paid tiers with more channels and
							Muse (AI that writes in your voice) are coming. Join the wishlist
							to get early access.
						</p>

						<div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-ink/65">
							<span className="inline-flex items-center gap-2">
								<Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
								Free for 3 channels
							</span>
							<span className="inline-flex items-center gap-2">
								<Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
								No card required
							</span>
							<span className="inline-flex items-center gap-2">
								<Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
								Muse beta coming soon
							</span>
						</div>
					</div>
				</div>
			</section>

			{/* ─── FREE TIER + MUSE WISHLIST ─────────────────────────────────── */}
			<section className="bg-background-elev">
				<section className="bg-background py-24 lg:py-32 wavy">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
							{/* Free — available now */}
							<article className="rounded-3xl bg-peach-100 p-8 lg:p-10 flex flex-col">
								<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-4">
									Available now
								</p>
								<h3 className="font-display text-[30px] leading-tight">Free</h3>
								<p className="mt-1 text-[13px] text-ink/70">
									Three channels, no card, no expiry
								</p>
								<p className="mt-5 text-[14.5px] text-ink/80 leading-[1.55]">
									Everything you need to start publishing — scheduling,
									calendar, link-in-bio, and an AI companion with 50 generations
									a month.
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
										Get started
										<ArrowRight className="w-4 h-4" />
									</Link>
								</div>
							</article>

							{/* Muse — wishlist */}
							<article className="rounded-3xl bg-peach-300 p-8 lg:p-10 flex flex-col">
								<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-4">
									Coming soon
								</p>
								<h3 className="font-display text-[30px] leading-tight">Muse</h3>
								<p className="mt-1 text-[13px] text-ink/70">
									AI that actually sounds like you
								</p>
								<p className="mt-5 text-[14.5px] text-ink/80 leading-[1.55]">
									Muse learns your writing style and generates content in your
									voice — per channel. We're opening beta access to a small
									group first. Sign up and we'll be in touch.
								</p>
								<div className="mt-8 pt-6 border-t border-ink/10 flex-1 flex flex-col justify-end">
									<p className="text-[12.5px] text-ink/65 mb-4">
										<span className="font-medium text-ink">
											Join the Muse beta wishlist
										</span>
										<span className="text-ink/45">
											{" "}
											· we'll pick select participants
										</span>
									</p>
									<WishlistForm />
								</div>
							</article>
						</div>
					</div>
				</section>
			</section>

			{/* ─── WHAT MUSE WILL DO ─────────────────────────────────────────── */}
			<section className="bg-ink relative">
				<div
					aria-hidden
					className="absolute inset-0 top-2.5! opacity-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<section className="bg-background-elev py-24 lg:py-32 wavy">
					<div className="max-w-[1320px] mx-auto px-6 lg:px-10">
						<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 mb-14 items-end">
							<div className="col-span-12 lg:col-span-7">
								<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4 inline-flex items-center gap-2">
									<Sparkle className="w-3 h-3 text-primary" />
									What Muse will do
								</p>
								<h2 className="font-display text-[40px] lg:text-[64px] leading-[1.02] tracking-[-0.02em]">
									The AI that sounds
									<br />
									<span className="text-primary">like you wrote it.</span>
								</h2>
							</div>
							<p className="col-span-12 lg:col-span-5 text-[15.5px] text-ink/70 leading-[1.6]">
								Muse will be trained on your own writing. Flip it on for a
								channel and every generation comes out in your cadence — not
								generic AI.
							</p>
						</div>

						<ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
							{MUSE_HIGHLIGHTS.map((f) => (
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
			</section>

			{/* ─── FINAL CTA ─────────────────────────────────────────────────── */}
			<section className="relative overflow-hidden bg-ink text-background-elev wavy">
				<div
					aria-hidden
					className="absolute inset-0 opacity-10 -z-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-24 lg:py-32 pb-32 lg:pb-40">
					<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 items-end">
						<div className="col-span-12 lg:col-span-8">
							<h2 className="font-display text-[44px] sm:text-[56px] lg:text-[80px] leading-[0.98] tracking-[-0.025em]">
								Start free today.
								<br />
								<span className="text-peach-300">Muse is on the way.</span>
							</h2>
						</div>
						<div className="col-span-8 lg:col-span-4 flex flex-col gap-4 lg:items-end">
							<Link
								href={routes.signup}
								className="inline-flex items-center gap-2 h-14 px-7 rounded-full text-background font-medium text-[15px] bg-primary transition-colors"
							>
								Start free — no card
								<ArrowRight className="w-4 h-4" />
							</Link>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
