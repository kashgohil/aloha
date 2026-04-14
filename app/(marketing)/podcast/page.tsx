import { routes } from "@/lib/routes";
import { makeMetadata } from "@/lib/seo";
import {
	ArrowRight,
	ArrowUpRight,
	Clock,
	Headphones,
	Mic,
	Play,
	Rss,
} from "lucide-react";
import Link from "next/link";
import { StockPhotoPlaceholder } from "../_components/stock-photo-placeholder";

export const metadata = makeMetadata({
	title: "Podcast — quiet conversations about the creator economy",
	description:
		"Aloha's podcast. Longer conversations with creators, editors and operators about the work behind the posts. 30 minutes, no ads.",
	path: routes.connect.podcast,
});

const EPISODES = [
	{
		n: 12,
		title: "How Naledi O. builds a braid studio without a social media job",
		guest: "Naledi O. · Braid Studio",
		desc: "On slow growth, Instagram as a portfolio, and the permission to post less.",
		length: "42 min",
		date: "Apr 8, 2026",
		tone: "bg-peach-200",
		featured: true,
	},
	{
		n: 11,
		title: "The ghost in the cadence — writing for other people",
		guest: "Priya N. · Ghostwriter",
		desc: "Keeping a voice consistent across 38K followers, eight clients, and four years.",
		length: "36 min",
		date: "Mar 25, 2026",
		tone: "bg-primary-soft",
	},
	{
		n: 10,
		title: "A 21K-follower bakery and what its DMs look like",
		guest: "Marta R. · Neighborhood bakery",
		desc: "What happens when Facebook is actually your most-important channel.",
		length: "31 min",
		date: "Mar 11, 2026",
		tone: "bg-peach-100",
	},
	{
		n: 9,
		title: "The calm-tool side letter",
		guest: "Aarohi M. + two angels",
		desc: "Raising a seed round on the condition you won't become a growth engine.",
		length: "48 min",
		date: "Feb 26, 2026",
		tone: "bg-peach-300",
	},
	{
		n: 8,
		title: "Post critic, revisited",
		guest: "Theo A. · newsletter writer",
		desc: "What actually makes a post work, with 400 annotated examples.",
		length: "54 min",
		date: "Feb 12, 2026",
		tone: "bg-peach-100",
	},
	{
		n: 7,
		title: "Design engineers, field notes",
		guest: "Jonas R. · Aloha",
		desc: "Where the line between design and engineering is productive — and where it's noise.",
		length: "39 min",
		date: "Jan 29, 2026",
		tone: "bg-primary-soft",
	},
];

export default function PodcastPage() {
	const latest = EPISODES[0];

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
					<div className="grid grid-cols-12 gap-x-0 gap-y-8 lg:gap-12 items-end">
						<div className="col-span-12 lg:col-span-7">
							<div className="inline-flex items-center gap-2 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
								Podcast
							</div>
							<h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[96px]">
								Quiet conversations
								<br />
								<span className="text-primary font-light">about the work.</span>
							</h1>
							<p className="mt-8 max-w-2xl text-[17px] lg:text-[18px] leading-[1.6] text-ink/75">
								Long-form interviews with creators, editors and operators about
								the work behind the posts. Thirty-ish minutes. No ads. No
								"before we start, please rate us five stars."
							</p>
						</div>
						<div className="col-span-12 lg:col-span-5">
							<div className="p-6 rounded-3xl bg-background-elev border border-border">
								<div className="text-[10.5px] font-mono uppercase tracking-[0.22em] text-ink/55 mb-3">
									Subscribe
								</div>
								<div className="flex flex-col gap-2">
									{[
										{ n: "Apple Podcasts", ic: "" },
										{ n: "Spotify", ic: "" },
										{ n: "Overcast", ic: "" },
										{ n: "RSS feed", ic: "rss" },
									].map((p) => (
										<a
											key={p.n}
											href="#"
											className="flex items-center justify-between px-4 py-3 rounded-xl bg-background border border-border hover:bg-muted/50 transition-colors group"
										>
											<span className="inline-flex items-center gap-2.5 text-[13.5px] font-medium text-ink">
												{p.ic === "rss" ? (
													<Rss className="w-3.5 h-3.5 text-primary" />
												) : (
													<Headphones className="w-3.5 h-3.5 text-primary" />
												)}
												{p.n}
											</span>
											<ArrowUpRight className="w-3.5 h-3.5 text-ink/30 group-hover:text-primary transition-colors" />
										</a>
									))}
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ─── LATEST EPISODE PLAYER ───────────────────────────────────── */}
			<section className="bg-background-elev">
				<section className="py-20 lg:py-24 pb-32 lg:pb-40 wavy bg-background">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
						<div className="mb-10">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Latest episode
							</p>
							<h2 className="font-display text-[28px] lg:text-[36px] leading-[1.1] tracking-[-0.015em]">
								<span className="text-ink/50">{latest.date} ·</span> Episode{" "}
								{latest.n}
							</h2>
						</div>

						<article
							className={`relative rounded-3xl ${latest.tone} overflow-hidden`}
						>
							<div className="grid grid-cols-12 gap-x-0 gap-y-8 lg:gap-12">
								{/* cover */}
								<div className="col-span-12 lg:col-span-5 p-8 lg:p-10">
									<StockPhotoPlaceholder
										id={`pod-${latest.n}`}
										label={`Episode ${latest.n} cover — portrait of ${latest.guest.split(" · ")[0]}.`}
										notes="Needed: square cover art (1:1) or 4:5 portrait of the guest. Warm tones, editorial framing, series typography lockup in a bottom corner. Will also be used in Apple/Spotify feeds."
										aspect="aspect-square"
										tone="bg-background-elev"
									/>
								</div>

								{/* details */}
								<div className="col-span-12 lg:col-span-7 p-8 lg:p-10 flex flex-col">
									<div className="inline-flex items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.22em] text-ink/60 mb-4">
										<Mic className="w-3 h-3" />
										{latest.guest}
									</div>
									<h3 className="font-display text-[28px] lg:text-[38px] leading-[1.1] tracking-[-0.015em]">
										{latest.title}
									</h3>
									<p className="mt-5 text-[15.5px] text-ink/80 leading-[1.6] max-w-xl">
										{latest.desc}
									</p>

									{/* fake player */}
									<div className="mt-8 p-5 rounded-2xl bg-background-elev border border-border">
										<div className="flex items-center gap-4">
											<button
												type="button"
												className="w-12 h-12 rounded-full bg-ink text-background grid place-items-center hover:bg-primary transition-colors"
												aria-label="Play episode"
											>
												<Play className="w-4 h-4 ml-0.5" />
											</button>
											<div className="flex-1">
												<div className="h-1 rounded-full bg-muted overflow-hidden">
													<div className="h-full bg-ink w-[12%]" />
												</div>
												<div className="mt-2 flex items-center justify-between text-[11px] font-mono text-ink/55">
													<span>05:12</span>
													<span>{latest.length}</span>
												</div>
											</div>
										</div>
									</div>

									<div className="mt-6 flex flex-wrap gap-3">
										<a
											href="#"
											className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors"
										>
											<Headphones className="w-3.5 h-3.5" />
											Listen on Apple
										</a>
										<a
											href="#"
											className="pencil-link inline-flex items-center gap-2 text-[13px] font-medium text-ink"
										>
											Read the transcript
											<ArrowUpRight className="w-3.5 h-3.5" />
										</a>
									</div>
								</div>
							</div>
						</article>
					</div>
				</section>
			</section>

			{/* ─── EPISODE LIST ───────────────────────────────────────────── */}
			<section className="py-20 lg:py-24 bg-background-elev wavy">
				<div className="max-w-[1180px] mx-auto px-6 lg:px-10 pb-8 lg:pb-12">
					<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 mb-12 items-end">
						<div className="col-span-12 lg:col-span-7">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Past episodes
							</p>
							<h2 className="font-display text-[36px] lg:text-[48px] leading-[1.02] tracking-[-0.02em]">
								Twelve conversations,
								<br />
								<span className="text-primary">each one quiet.</span>
							</h2>
						</div>
						<p className="col-span-12 lg:col-span-5 text-[15.5px] text-ink/70 leading-[1.55]">
							Everything we've recorded lives here. Transcripts on every
							episode. No paywall, no "members-only" tier.
						</p>
					</div>

					<div className="rounded-3xl bg-background border border-border overflow-hidden">
						{EPISODES.slice(1).map((e, i) => (
							<a
								key={e.n}
								href="#"
								className={`group grid grid-cols-12 gap-x-0 gap-y-4 lg:gap-4 px-6 lg:px-8 py-5 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors ${
									i % 2 === 1 ? "bg-muted/10" : ""
								}`}
							>
								<div className="col-span-1 flex items-center">
									<span className="font-display text-[22px] text-ink/50 leading-none">
										{e.n}
									</span>
								</div>
								<div className="col-span-12 md:col-span-8 min-w-0">
									<p className="font-display text-[18px] lg:text-[20px] leading-[1.2] tracking-[-0.005em] text-ink group-hover:text-primary transition-colors">
										{e.title}
									</p>
									<p className="mt-1 text-[12.5px] text-ink/60 font-mono uppercase tracking-[0.14em]">
										{e.guest}
									</p>
								</div>
								<div className="col-span-12 md:col-span-3 md:text-right flex md:justify-end items-center gap-4 text-[12px] text-ink/55 font-mono">
									<span className="inline-flex items-center gap-1">
										<Clock className="w-3 h-3" />
										{e.length}
									</span>
									<span>{e.date}</span>
								</div>
							</a>
						))}
					</div>
				</div>
			</section>

			{/* ─── HOSTS ──────────────────────────────────────────────────── */}
			<section className="bg-ink relative">
				<div
					aria-hidden
					className="absolute inset-0 opacity-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<section className="py-24 lg:py-32 pb-32 lg:pb-40 wavy bg-background-elev">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-16 items-start">
						<div className="col-span-12 lg:col-span-5">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Your hosts
							</p>
							<h2 className="font-display text-[36px] lg:text-[48px] leading-[1.02] tracking-[-0.02em]">
								Two humans
								<br />
								<span className="text-primary">who listen first.</span>
							</h2>
							<p className="mt-6 text-[15.5px] text-ink/75 leading-[1.6] max-w-md">
								Aarohi and Leilani co-host. Aarohi brings the product questions,
								Leilani brings the community ones. They alternate lead
								interviewer by episode.
							</p>
						</div>

						<div className="col-span-12 lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-6">
							{[
								{
									ini: "A",
									n: "Aarohi Mehta",
									role: "Co-founder, co-host",
									note: "Ex-Figma PM; product craft nerd.",
									tone: "bg-peach-200",
								},
								{
									ini: "L",
									n: "Leilani Okafor",
									role: "Community, co-host",
									note: "Reads every support email; remembers every guest's coffee order.",
									tone: "bg-primary-soft",
								},
							].map((h) => (
								<article key={h.n} className={`p-7 rounded-3xl ${h.tone}`}>
									<span className="w-14 h-14 rounded-full bg-background-elev flex items-center justify-center font-display text-[24px] text-ink border border-ink/10">
										{h.ini}
									</span>
									<h3 className="mt-5 font-display text-[22px] leading-[1.15] tracking-[-0.005em]">
										{h.n}
									</h3>
									<p className="mt-1 text-[12.5px] font-mono uppercase tracking-[0.14em] text-ink/60">
										{h.role}
									</p>
									<p className="mt-4 text-[13.5px] text-ink/75 leading-[1.55]">
										{h.note}
									</p>
								</article>
							))}
						</div>
					</div>
				</section>
			</section>

			{/* ─── PITCH A GUEST ──────────────────────────────────────────── */}
			<section className="py-20 lg:py-24 bg-ink relative wavy text-background-elev">
				<div
					aria-hidden
					className="absolute inset-0 opacity-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<div className="max-w-[1180px] mx-auto px-6 lg:px-10 pb-20 lg:pb-28">
					<div className="p-10 lg:p-14 rounded-3xl overflow-hidden relative">
						<div className="relative grid grid-cols-12 gap-x-0 gap-y-8 lg:gap-8 items-center">
							<div className="col-span-12 lg:col-span-8">
								<Mic className="w-7 h-7 text-peach-300 mb-5" />
								<h2 className="font-display text-[32px] lg:text-[44px] leading-[1.05] tracking-[-0.015em]">
									Know someone we should
									<br />
									<span className="text-peach-300">actually listen to?</span>
								</h2>
								<p className="mt-5 text-[15px] text-background-elev/75 leading-[1.6] max-w-xl">
									We book guests three months out. We read every pitch, and
									we're specifically looking for creators and operators with a
									concrete story — not launch-day talking points.
								</p>
							</div>
							<div className="col-span-12 lg:col-span-4 flex flex-col gap-3 lg:items-end">
								<a
									href="mailto:podcast@aloha.social"
									className="inline-flex items-center gap-2 h-12 px-6 rounded-full text-background font-medium text-[14px] bg-primary transition-colors"
								>
									Pitch us
									<ArrowRight className="w-4 h-4" />
								</a>
								<Link
									href={routes.connect.newsletter}
									className="pencil-link inline-flex items-center gap-2 text-[13.5px] font-medium"
								>
									Newsletter only? Here
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
