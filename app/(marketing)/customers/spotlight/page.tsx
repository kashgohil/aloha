import { routes } from "@/lib/routes";
import { makeMetadata } from "@/lib/seo";
import {
	ArrowRight,
	ArrowUpRight,
	Mail,
	MessageSquareQuote,
} from "lucide-react";
import Link from "next/link";
import { StockPhotoPlaceholder } from "../../_components/stock-photo-placeholder";

export const metadata = makeMetadata({
	title: "Creator spotlight — quick reads with people we admire",
	description:
		"Three-question spotlights with creators whose voice moves us. Shorter than a case study, richer than a testimonial.",
	path: routes.customers.creatorSpotlight,
});

type Spotlight = {
	name: string;
	handle: string;
	role: string;
	location: string;
	ini: string;
	accent: string;
	qa: { q: string; a: string }[];
	bestPosts: { channel: string; title: string; note: string }[];
	photoNotes: string;
};

const SPOTLIGHTS: Spotlight[] = [
	{
		name: "Ainslee Dunn",
		handle: "@ainslee.design",
		role: "Studio owner · slow design",
		location: "Brooklyn",
		ini: "A",
		accent: "bg-peach-200",
		qa: [
			{
				q: "What's the one habit that's changed how you post?",
				a: "Writing the caption before picking the image. The sentence forces me to know what the post is actually for. Aloha's Composer waits for the text before letting me add media — that constraint is the feature.",
			},
			{
				q: "Favourite feature you reach for daily?",
				a: "Voice-match score. It's honest. When a draft comes back at 71% I know the hook is off; I don't need anyone to tell me.",
			},
			{
				q: "Something you wish more creators knew?",
				a: "Post less. Post better. The week I published two posts instead of five was the week I got booked out for a quarter.",
			},
		],
		bestPosts: [
			{
				channel: "Instagram",
				title: "Slow design in five objects",
				note: "Carousel · 14K likes",
			},
			{
				channel: "Threads",
				title: "On writing before picking the photo",
				note: "Native · 3.2K likes",
			},
			{
				channel: "LinkedIn",
				title: "How a studio waits for its audience",
				note: "Long-form · 820 reactions",
			},
		],
		photoNotes:
			"Ainslee in her Brooklyn studio — ceramic pieces on a work table, warm natural light, camera at a tilt. 4:5 vertical. Hands visible, face optional.",
	},
	{
		name: "Jun Han",
		handle: "@junhan",
		role: "Operations @ mid-size B2B SaaS",
		location: "Toronto",
		ini: "J",
		accent: "bg-primary-soft",
		qa: [
			{
				q: "What's the one habit that's changed how you post?",
				a: "I stopped 'posting' — I started running a weekly publishing ritual. Fridays: ten minutes of writing, ten minutes of scheduling. Everything else is drift.",
			},
			{
				q: "Favourite feature you reach for daily?",
				a: "The Calendar's conflict chips. It calls out the week I scheduled two LinkedIns on a Tuesday because I forgot Monday. Never fails to save me.",
			},
			{
				q: "Something you wish more creators knew?",
				a: "The funnel doesn't end at the click. We pipe Aloha's analytics into our warehouse via webhook. I know exactly which LinkedIn post drove the pipeline, not 'people visited the site.'",
			},
		],
		bestPosts: [
			{
				channel: "LinkedIn",
				title: "The content-ops stack for a 30-person company",
				note: "Long-form · 1.1K reactions",
			},
			{
				channel: "X",
				title: "Webhook > attribution tool · a thread",
				note: "9-tweet · 3.4K likes",
			},
			{
				channel: "LinkedIn",
				title: "What we stopped measuring",
				note: "Text post · 620 reactions",
			},
		],
		photoNotes:
			"Jun at a window-lit desk — two screens, notebook open. 4:5 vertical. Feels focused, not staged. Toronto cityscape hint out the window if it fits.",
	},
	{
		name: "Tara Hollings",
		handle: "@tarahollings",
		role: "Food blogger · 340K monthly Pinterest views",
		location: "Austin",
		ini: "T",
		accent: "bg-peach-300",
		qa: [
			{
				q: "What's the one habit that's changed how you post?",
				a: "I treat Pinterest like a long-tail SEO channel, not a social channel. One pin this week could still be driving traffic in 18 months — Aloha makes that cadence sustainable.",
			},
			{
				q: "Favourite feature you reach for daily?",
				a: "The bulk-pin upload from a CSV. I batch-write pin descriptions on the train once a month; Aloha spreads them across the right boards for me.",
			},
			{
				q: "Something you wish more creators knew?",
				a: "Pinterest isn't dead. It just needs a tool that takes it seriously. Most schedulers ship a Pinterest option then forget to maintain it.",
			},
		],
		bestPosts: [
			{
				channel: "Pinterest",
				title: "30-minute weeknight dinners",
				note: "Idea pin · 2.4M impressions",
			},
			{
				channel: "Pinterest",
				title: "Sourdough starter, no fuss",
				note: "Pin · 800K impressions",
			},
			{
				channel: "Instagram",
				title: "Behind the scenes of a pin that hit",
				note: "Reel · 48K views",
			},
		],
		photoNotes:
			"Tara in a warm kitchen — midday light, ingredients in the frame, phone on a tripod for a shot. 4:5 vertical. Feels alive, not styled.",
	},
];

export default function SpotlightPage() {
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
					className="absolute top-[68%] right-[10%] font-display text-[22px] text-primary/55 rotate-14 select-none"
				>
					+
				</span>
			</header>

			<section className="bg-peach-200 wavy">
				<div className="relative max-w-[1180px] mx-auto px-6 lg:px-10 pt-20 lg:pt-28 pb-32 lg:pb-40">
					<div className="inline-flex items-center gap-3 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
						<Link href={routes.customers.caseStudies} className="pencil-link">
							Customer stories
						</Link>
						<span className="text-ink/25">·</span>
						<span>Creator spotlight</span>
					</div>
					<h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[96px]">
						Three questions,
						<br />
						<span className="text-primary font-light">three creators.</span>
					</h1>
					<p className="mt-8 max-w-2xl text-[17px] lg:text-[18px] leading-[1.6] text-ink/75">
						Shorter than a case study, richer than a testimonial. Each spotlight
						is three questions, three best posts, and a portrait. No sales
						pitch, no affiliate disclosures, no "wonderful partnership with."
						Just the work.
					</p>
				</div>
			</section>

			{/* ─── SPOTLIGHTS ─────────────────────────────────────────────── */}
			<section className="bg-ink relative">
				<div
					aria-hidden
					className="absolute inset-0 opacity-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<section className="py-16 lg:py-20 space-y-10 lg:space-y-14 wavy bg-background pb-32 lg:pb-40">
					{SPOTLIGHTS.map((s, index) => (
						<article
							key={s.handle}
							className="max-w-[1180px] mx-auto px-6 lg:px-10"
						>
							<div className={`${s.accent} rounded-3xl overflow-hidden`}>
								<div className="grid grid-cols-12 gap-x-0 gap-y-0 lg:gap-0">
									{/* portrait */}
									<div className="col-span-12 lg:col-span-5 p-8 lg:p-10 lg:border-r border-ink/10">
										<StockPhotoPlaceholder
											id={`spot-${s.handle}`}
											label={`Portrait of ${s.name} at work — ${s.location}.`}
											notes={s.photoNotes}
											aspect="aspect-[4/5]"
											tone="bg-background-elev"
										/>

										<div className="mt-6">
											<div className="flex items-center gap-3">
												<span className="w-11 h-11 rounded-full bg-ink text-background-elev font-display text-[18px] flex items-center justify-center">
													{s.ini}
												</span>
												<div>
													<p className="font-display text-[22px] leading-[1.1] tracking-[-0.005em] text-ink">
														{s.name}
													</p>
													<p className="text-[12.5px] text-ink/60 font-mono">
														{s.handle} · {s.location}
													</p>
												</div>
											</div>
											<p className="mt-4 text-[13.5px] text-ink/70 leading-[1.55]">
												{s.role}
											</p>
										</div>
									</div>

									{/* q&a */}
									<div className="col-span-12 lg:col-span-7 p-8 lg:p-10 flex flex-col">
										<div className="flex items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.22em] text-ink/55 mb-8">
											<MessageSquareQuote className="w-3 h-3" />
											Spotlight · {String(index + 1).padStart(2, "0")}
										</div>

										<ol className="space-y-8">
											{s.qa.map((x, i) => (
												<li key={i}>
													<p className="font-display text-[18px] lg:text-[19px] leading-[1.3] tracking-[-0.005em] text-ink/75">
														Q{i + 1} · {x.q}
													</p>
													<p className="mt-3 text-[15.5px] leading-[1.7] text-ink">
														{x.a}
													</p>
												</li>
											))}
										</ol>

										<div className="mt-10 pt-8 border-t border-ink/10">
											<p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
												Their best three posts
											</p>
											<ul className="space-y-3">
												{s.bestPosts.map((p, i) => (
													<li
														key={i}
														className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-background-elev/60 border border-ink/8"
													>
														<div className="min-w-0 flex-1">
															<p className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink/55 mb-1">
																{p.channel}
															</p>
															<p className="font-display text-[16px] leading-[1.2] tracking-[-0.005em] text-ink truncate">
																{p.title}
															</p>
														</div>
														<span className="text-[11px] text-ink/60 font-mono shrink-0">
															{p.note}
														</span>
													</li>
												))}
											</ul>
										</div>
									</div>
								</div>
							</div>
						</article>
					))}
				</section>
			</section>

			{/* ─── PITCH ──────────────────────────────────────────────────── */}
			<section className="py-16 lg:py-20 bg-ink relative wavy text-background-elev">
				<div
					aria-hidden
					className="absolute inset-0 opacity-10 -z-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<div className="max-w-[1180px] mx-auto px-6 lg:px-10  pb-16 lg:pb-20">
					<div className="p-10 lg:p-14 rounded-3xl bg-ink text-background-elev overflow-hidden relative">
						<div
							aria-hidden
							className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
						/>
						<div className="relative grid grid-cols-12 gap-x-0 gap-y-8 lg:gap-8 items-center">
							<div className="col-span-12 lg:col-span-8">
								<Mail className="w-7 h-7 text-peach-300 mb-5" />
								<h2 className="font-display text-[32px] lg:text-[44px] leading-[1.05] tracking-[-0.015em]">
									Know a creator
									<br />
									<span className="text-peach-300">we should spotlight?</span>
								</h2>
								<p className="mt-5 text-[15px] text-background-elev/75 leading-[1.6] max-w-xl">
									Self-nominations welcome. We're specifically looking for
									creators whose voice is the product — not necessarily the
									biggest account, just one with a strong shape.
								</p>
							</div>
							<div className="col-span-12 lg:col-span-4 flex flex-col gap-3 lg:items-end">
								<a
									href="mailto:spotlight@usealoha.app"
									className="inline-flex items-center gap-2 h-12 px-6 rounded-full text-[14px] font-medium bg-primary transition-colors"
								>
									spotlight@usealoha.app
									<ArrowRight className="w-4 h-4" />
								</a>
								<Link
									href={routes.customers.caseStudies}
									className="pencil-link inline-flex items-center gap-2 text-[13.5px]"
								>
									Read the longer case studies
									<ArrowUpRight className="w-3.5 h-3.5" />
								</Link>
							</div>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
