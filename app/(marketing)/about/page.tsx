import { routes } from "@/lib/routes";
import { makeMetadata } from "@/lib/seo";
import { ArrowRight, ArrowUpRight, MapPin } from "lucide-react";
import Link from "next/link";
import { StockPhotoPlaceholder } from "../_components/stock-photo-placeholder";

export const metadata = makeMetadata({
	title: "About — the team behind the quiet tool",
	description:
		"Aloha is a small team in Bengaluru building a calm social media OS. Here's who we are and how we got here.",
	path: routes.company.about,
});

const TIMELINE = [
	{
		year: "2023",
		label: "The idea",
		body: "Two of us kept complaining that every social tool was either a loud growth machine or a bloated enterprise suite. We wrote a brief for what we wanted instead. Nobody else was building it.",
		tone: "bg-peach-100",
	},
	{
		year: "2024",
		label: "First prototype",
		body: "We built the Composer on weekends. Forty friends tried it. Muse — the voice model, trained on your best posts, not your whole archive — was the piece that people kept asking us to turn into a product.",
		tone: "bg-peach-200",
	},
	{
		year: "2025",
		label: "Company",
		body: "Aloha incorporated in India in March. We raised a small seed round from investors who signed an explicit 'calm tool, not a growth machine' side letter. Hired a team of six.",
		tone: "bg-primary-soft",
	},
	{
		year: "2026",
		label: "Public launch",
		body: "Private beta through Q1; public launch in April. 140k creators in the first 90 days. We mean to stay small enough to answer every email.",
		tone: "bg-peach-300",
	},
];

const TEAM = [
	{
		initial: "A",
		name: "Aarohi Mehta",
		role: "Co-founder · Product",
		note: "Ex-Figma PM, writes the roadmap, drafts the Monday note",
		tone: "bg-peach-200",
	},
	{
		initial: "K",
		name: "Kashyap Gohil",
		role: "Co-founder · Engineering",
		note: "Types too fast, cares about calm defaults",
		tone: "bg-primary-soft",
	},
	{
		initial: "J",
		name: "Jonas Ribeiro",
		role: "Design",
		note: "Fraunces evangelist, 4:5 crop evangelist",
		tone: "bg-peach-100",
	},
	{
		initial: "L",
		name: "Leilani Okafor",
		role: "Growth & community",
		note: "Reads every support email. Yes, every one.",
		tone: "bg-peach-300",
	},
	{
		initial: "V",
		name: "Vikram Sethi",
		role: "Platform engineering",
		note: "Makes the Matrix faster than you expect",
		tone: "bg-peach-100",
	},
	{
		initial: "S",
		name: "Sofia Valente",
		role: "Operations",
		note: "Runs finance, runs hiring, runs marathons",
		tone: "bg-primary-soft",
	},
];

const OFFICES = [
	{
		city: "Bengaluru",
		region: "Karnataka, India",
		tz: "UTC+5:30",
		note: "HQ · the whole team",
	},
];

export default function AboutPage() {
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
				<span
					aria-hidden
					className="absolute top-[28%] right-[6%] font-display text-[38px] text-ink/15 rotate-18 select-none"
				>
					※
				</span>
			</header>

			<section className="bg-peach-200 wavy">
				<div className="relative max-w-[1180px] mx-auto px-6 lg:px-10 pt-20 lg:pt-28 pb-32 lg:pb-40">
					<div className="grid grid-cols-12 gap-x-0 gap-y-8 lg:gap-12 items-end">
						<div className="col-span-12 lg:col-span-7">
							<div className="inline-flex items-center gap-2 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
								About
							</div>
							<h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[92px]">
								A small team
								<br />
								<span className="text-primary font-light">
									building one calm thing.
								</span>
							</h1>
							<p className="mt-8 max-w-2xl text-[17px] lg:text-[18px] leading-[1.6] text-ink/75">
								Aloha is six people in one studio in Bengaluru. We left jobs
								at loud companies to build something quieter. Here's what it
								adds up to so far.
							</p>
						</div>
						<div className="col-span-12 lg:col-span-5">
							<StockPhotoPlaceholder
								id="about-hero"
								label="The team during launch week — Bengaluru studio."
								notes="Needed: group portrait of the founding team at a warm-toned workspace. Six people, informal arrangement, no forced corporate smile. 4:5 vertical. Taken with natural light near a window. A hint of the Bengaluru studio visible in the background."
								aspect="aspect-[4/5]"
								tone="bg-peach-200"
							/>
						</div>
					</div>
				</div>
			</section>

			{/* ─── TIMELINE ────────────────────────────────────────────────── */}
			<section className="bg-background-elev">
				<section className="py-24 lg:py-32 pb-32 lg:pb-40 bg-background wavy">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
						<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 mb-14">
							<div className="col-span-12 lg:col-span-7">
								<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
									How we got here
								</p>
								<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
									Three years,
									<br />
									<span className="text-primary">four milestones.</span>
								</h2>
							</div>
							<p className="col-span-12 lg:col-span-5 text-[15.5px] text-ink/70 leading-[1.55]">
								The short version of a longer story. The long one lives in the{" "}
								<Link
									href={routes.company.manifesto}
									className="pencil-link text-ink"
								>
									manifesto
								</Link>
								.
							</p>
						</div>

						<ol className="relative pl-10 lg:pl-14 space-y-12 lg:space-y-16 before:absolute before:inset-y-0 before:left-3 before:lg:left-4 before:w-px before:bg-border-strong/60">
							{TIMELINE.map((t, i) => (
								<li key={t.year} className="relative">
									<span
										className={`absolute -left-10 lg:-left-13 top-1 w-6 h-6 rounded-full ${t.tone} border-2 border-ink/15 flex items-center justify-center text-[10px] font-display text-ink`}
									>
										{i + 1}
									</span>
									<div className="grid grid-cols-12 gap-x-0 gap-y-6 lg:gap-6">
										<div className="col-span-12 md:col-span-3">
											<p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink/55">
												{t.year}
											</p>
											<p className="mt-2 font-display text-[22px] leading-[1.15] tracking-[-0.01em] text-ink">
												{t.label}
											</p>
										</div>
										<p className="col-span-12 md:col-span-9 text-[16px] leading-[1.7] text-ink/80 max-w-2xl">
											{t.body}
										</p>
									</div>
								</li>
							))}
						</ol>
					</div>
				</section>
			</section>

			{/* ─── TEAM ────────────────────────────────────────────────────── */}
			<section className="py-24 lg:py-32 bg-background-elev wavy pb-32 lg:pb-40">
				<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
					<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 mb-14 items-end">
						<div className="col-span-12 lg:col-span-7">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								The team
							</p>
							<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
								Six people.
								<br />
								<span className="text-primary">One roadmap.</span>
							</h2>
						</div>
						<p className="col-span-12 lg:col-span-5 text-[15.5px] text-ink/70 leading-[1.55]">
							We mean to stay small enough that you'll recognise every name on
							the commit history. Every person on this list also answers support
							tickets.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
						{TEAM.map((p) => (
							<article
								key={p.name}
								className="p-7 rounded-3xl bg-background border border-border flex flex-col"
							>
								<span
									className={`w-16 h-16 rounded-full ${p.tone} flex items-center justify-center font-display text-[28px] text-ink`}
								>
									{p.initial}
								</span>
								<h3 className="mt-5 font-display text-[22px] leading-[1.15] tracking-[-0.005em]">
									{p.name}
								</h3>
								<p className="mt-1 text-[13px] text-ink/65 font-mono uppercase tracking-[0.12em]">
									{p.role}
								</p>
								<p className="mt-4 text-[14px] text-ink/75 leading-[1.55]">
									{p.note}
								</p>
							</article>
						))}
					</div>

					<p className="mt-10 text-[13.5px] text-ink/60 max-w-xl">
						Hiring for one or two roles when the fit is right. The open list is
						at{" "}
						<Link
							href={routes.company.careers}
							className="pencil-link text-ink"
						>
							/careers
						</Link>
						; if none fit, we still read{" "}
						<a
							href="mailto:hello@usealoha.app"
							className="pencil-link text-ink"
						>
							hello@usealoha.app
						</a>
						.
					</p>
				</div>
			</section>

			{/* ─── OFFICES ─────────────────────────────────────────────────── */}
			<section className="bg-background-elev">
				<section className="py-24 lg:py-32 pb-32 lg:pb-40 bg-background wavy">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
						<div className="mb-12">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Where we work from
							</p>
							<h2 className="font-display text-[36px] lg:text-[48px] leading-[1.02] tracking-[-0.02em]">
								One studio,
								<span className="text-primary"> one calendar.</span>
							</h2>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
							{OFFICES.map((o, i) => (
								<article
									key={o.city}
									className={`p-8 rounded-3xl ${i === 1 ? "bg-primary-soft" : "bg-peach-100"} flex flex-col min-h-[200px]`}
								>
									<MapPin className="w-5 h-5 text-ink" />
									<h3 className="mt-5 font-display text-[28px] leading-[1.05] tracking-[-0.015em]">
										{o.city}
									</h3>
									<p className="mt-1 text-[13px] text-ink/65 font-mono">
										{o.region} · {o.tz}
									</p>
									<p className="mt-5 text-[13.5px] text-ink/70 leading-[1.55]">
										{o.note}
									</p>
								</article>
							))}
						</div>
					</div>
				</section>
			</section>

			{/* ─── SUPPORTERS ─────────────────────────────────────────────── */}
			<section className="bg-ink relative">
				<div
					aria-hidden
					className="absolute inset-0 top-2.5! opacity-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<section className="py-20 lg:py-24 pb-28 lg:pb-32 wavy bg-background-elev">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
						<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10">
							<div className="col-span-12 lg:col-span-5">
								<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
									Supported by
								</p>
								<h2 className="font-display text-[32px] lg:text-[40px] leading-[1.05] tracking-[-0.015em]">
									People who signed
									<br />
									<span className="text-primary">
										the calm-tool side letter.
									</span>
								</h2>
							</div>
							<div className="col-span-12 lg:col-span-7">
								<p className="text-[15.5px] text-ink/75 leading-[1.6] max-w-lg">
									Our seed investors agreed, in writing, that we're building a
									calm tool, not a growth engine. Revenue per creator over
									creators per quarter. We share the side letter with anyone who
									asks.
								</p>

								<ul className="mt-8 grid grid-cols-2 gap-4">
									{[
										"Calm & Co.",
										"Field Partners",
										"Tidelines",
										"The Editorial Fund",
										"4 angels",
										"Creators in our beta",
									].map((s) => (
										<li
											key={s}
											className="px-5 py-4 rounded-2xl bg-background border border-border font-display text-[17px] text-ink"
										>
											{s}
										</li>
									))}
								</ul>
							</div>
						</div>
					</div>
				</section>
			</section>

			{/* ─── FINAL CTA ──────────────────────────────────────────────── */}
			<section className="relative overflow-hidden bg-ink wavy text-background-elev">
				<div
					aria-hidden
					className="absolute inset-0 top-2.5! opacity-10 -z-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<div className="max-w-[1180px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
					<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 items-end">
						<div className="col-span-12 lg:col-span-8">
							<h2 className="font-display text-[40px] sm:text-[52px] lg:text-[72px] leading-[0.98] tracking-[-0.025em]">
								Small team.
								<br />
								<span className="text-peach-300">Answerable team.</span>
							</h2>
							<p className="mt-6 text-[15.5px] text-ink/70 max-w-lg leading-[1.55]">
								Write us at{" "}
								<a
									href="mailto:hello@usealoha.app"
									className="pencil-link text-ink"
								>
									hello@usealoha.app
								</a>{" "}
								— a real person replies, usually within a day.
							</p>
						</div>
						<div className="col-span-12 lg:col-span-4 flex flex-col gap-4 lg:items-end">
							<Link
								href={routes.company.manifesto}
								className="inline-flex items-center gap-2 h-14 px-7 rounded-full text-background font-medium text-[15px] bg-primary transition-colors"
							>
								Read the manifesto
								<ArrowRight className="w-4 h-4" />
							</Link>
							<Link
								href={routes.company.careers}
								className="pencil-link inline-flex items-center gap-2 text-[14.5px] font-medium"
							>
								See open roles
								<ArrowUpRight className="w-4 h-4" />
							</Link>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
