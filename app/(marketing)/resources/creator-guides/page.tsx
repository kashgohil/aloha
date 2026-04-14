import { routes } from "@/lib/routes";
import { makeMetadata } from "@/lib/seo";
import {
	ArrowRight,
	ArrowUpRight,
	CalendarDays,
	Inbox,
	Layers,
	Mic,
	Sparkle,
} from "lucide-react";
import Link from "next/link";

export const metadata = makeMetadata({
	title: "Creator guides — sequenced learning paths",
	description:
		"Aloha's creator guides. Curriculum-style learning paths — voice, calendar, automation, inbox. Lessons that build on each other.",
	path: routes.resources.creatorGuides,
});

const PATHS = [
	{
		slug: "voice-foundations",
		icon: Mic,
		title: "Voice foundations",
		lead: "Train and tune the voice model so the Composer drafts in your cadence — not a template.",
		lessons: 6,
		minutes: "45 min total",
		tone: "bg-primary-soft",
		href: "/resources/creator-guides/voice-foundations",
		featured: true,
	},
	{
		slug: "calendar-cadence",
		icon: CalendarDays,
		title: "Calendar &amp; cadence",
		lead: "Set up a posting rhythm you can keep — weekly, monthly, launch arcs — without burnout.",
		lessons: 5,
		minutes: "35 min total",
		tone: "bg-peach-100",
		href: "#",
	},
	{
		slug: "automation-no-spam",
		icon: Sparkle,
		title: "Automation, without becoming a spammer",
		lead: "Build matrices that handle the choreography while keeping a human approval at every send.",
		lessons: 7,
		minutes: "55 min total",
		tone: "bg-primary-soft",
		href: "#",
	},
	{
		slug: "inbox-triage",
		icon: Inbox,
		title: "Inbox triage for one-person teams",
		lead: "Cover comments + DMs across eight channels without keeping a tab open.",
		lessons: 4,
		minutes: "25 min total",
		tone: "bg-peach-300",
		href: "#",
	},
	{
		slug: "agency-multi-brand",
		icon: Layers,
		title: "Agency · multi-brand workflow",
		lead: "Workspaces, white-label reports, and Logic Matrix templates that scale across clients.",
		lessons: 6,
		minutes: "50 min total",
		tone: "bg-peach-100",
		href: "#",
	},
];

export default function CreatorGuidesIndexPage() {
	const featured = PATHS[0];

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

			<section className="bg-primary-soft">
				<section className="bg-peach-200 wavy">
					<div className="relative max-w-[1180px] w-full mx-auto px-6 lg:px-10 pt-20 lg:pt-28 pb-32 lg:pb-40">
						<div className="flex flex-wrap items-center gap-3 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
							<Link href={routes.resources.index} className="pencil-link">
								Resources
							</Link>
							<span className="text-ink/25">·</span>
							<span>Creator guides</span>
						</div>
						<h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[96px]">
							Sequenced
							<br />
							<span className="text-primary font-light">learning paths.</span>
						</h1>
						<p className="mt-8 max-w-2xl text-[17px] lg:text-[18px] leading-[1.6] text-ink/75">
							Five paths, each with a handful of short lessons that build on
							each other. Designed to go from "what's the voice model" to "I
							trust the voice model with my Wednesday post" in roughly an hour.
						</p>
					</div>
				</section>
			</section>

			{/* ─── FEATURED PATH ──────────────────────────────────────────── */}
			<section className="py-12 lg:py-16 bg-primary-soft wavy">
				<div className="max-w-[1180px] mx-auto px-6 lg:px-10 pb-8 lg:pb-12">
					<Link
						href={featured.href}
						className={`group block ${featured.tone} rounded-3xl p-10 lg:p-14 hover:-translate-y-1 transition-transform`}
					>
						<div className="flex items-center gap-3 text-[10.5px] font-mono uppercase tracking-[0.22em] text-ink/55 mb-6">
							<Sparkle className="w-3 h-3 text-primary" />
							Start here
						</div>

						<div className="grid grid-cols-12 gap-x-0 gap-y-8 lg:gap-8 items-end">
							<div className="col-span-12 lg:col-span-8">
								<featured.icon className="w-7 h-7 text-ink mb-4" />
								<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.05] tracking-[-0.02em] text-ink group-hover:text-primary transition-colors">
									{featured.title}
								</h2>
								<p className="mt-5 text-[16px] lg:text-[17px] leading-[1.6] text-ink/80 max-w-xl">
									{featured.lead}
								</p>
							</div>
							<div className="col-span-12 lg:col-span-4 lg:text-right">
								<div className="inline-flex flex-col gap-2 lg:items-end">
									<span className="font-mono text-[12px] uppercase tracking-[0.18em] text-ink/55">
										{featured.lessons} lessons · {featured.minutes}
									</span>
									<span className="inline-flex items-center gap-2 text-[14px] font-medium text-ink group-hover:text-primary transition-colors">
										Start the path
										<ArrowRight className="w-4 h-4" />
									</span>
								</div>
							</div>
						</div>
					</Link>
				</div>
			</section>

			{/* ─── ALL PATHS ──────────────────────────────────────────────── */}
			<section className="bg-background-elev">
				<section className="py-16 lg:py-20 bg-background wavy pb-32 lg:pb-40">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
						<div className="mb-10">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								All paths
							</p>
							<h2 className="font-display text-[32px] lg:text-[44px] leading-[1.02] tracking-[-0.02em]">
								Five shapes,
								<br />
								<span className="text-primary">in any order you want.</span>
							</h2>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
							{PATHS.slice(1).map((p) => (
								<Link
									key={p.slug}
									href={p.href}
									className={`group block ${p.tone} rounded-3xl p-7 lg:p-8 flex flex-col hover:-translate-y-1 transition-transform min-h-[200px]`}
								>
									<div className="flex items-start justify-between">
										<p.icon className="w-6 h-6 text-ink" />
										<span className="text-[10.5px] font-mono uppercase tracking-[0.18em] text-ink/55 text-right">
											{p.lessons} lessons · {p.minutes}
										</span>
									</div>
									<h3 className="mt-7 font-display text-[24px] leading-[1.15] tracking-[-0.005em]">
										{p.title}
									</h3>
									<p className="mt-3 text-[14px] text-ink/75 leading-[1.6]">
										{p.lead}
									</p>
									<span className="mt-auto pt-6 pencil-link text-[13px] font-medium text-ink inline-flex items-center gap-2">
										Start path
										<ArrowUpRight className="w-3.5 h-3.5" />
									</span>
								</Link>
							))}
						</div>
					</div>
				</section>
			</section>

			{/* ─── HOW THESE WORK ──────────────────────────────────────────── */}
			<section className="bg-ink relative">
				<div
					aria-hidden
					className="absolute inset-0 top-2! opacity-[0.08] bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<section className="py-20 lg:py-24 bg-background-elev pb-32 lg:pb-40 wavy">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-16 items-start">
						<div className="col-span-12 lg:col-span-5">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								The shape of a path
							</p>
							<h2 className="font-display text-[32px] lg:text-[44px] leading-[1.02] tracking-[-0.02em]">
								Short lessons,
								<br />
								<span className="text-primary">honest pace.</span>
							</h2>
						</div>
						<ol className="col-span-12 lg:col-span-7 relative space-y-5 pl-8 text-[15.5px] leading-[1.7] text-ink/85 before:absolute before:inset-y-0 before:left-[7px] before:w-px before:bg-border-strong/60">
							{[
								"Each lesson is 4–10 minutes. Most include a one-action prompt — train the model, draft a post, set up the matrix.",
								"Lessons sequence: by the end you've used the feature for real, not just understood it.",
								"Bookmark progress in your account; resume where you left off across devices.",
								"Recordings are transcribed (free, no member gate) — the same content as text on every page.",
							].map((l, i) => (
								<li key={i} className="relative">
									<span className="absolute -left-[24.5px] top-2 -translate-x-1/2 w-3 h-3 rounded-full bg-ink" />
									{l}
								</li>
							))}
						</ol>
					</div>
				</section>
			</section>

			{/* ─── CTA ───────────────────────────────────────────────────── */}
			<section className="py-20 lg:py-24 bg-ink relative wavy text-background-elev">
				<div
					aria-hidden
					className="absolute inset-0 top-2! opacity-10 -z-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<div className="max-w-[1180px] mx-auto px-6 lg:px-10 pb-8 lg:pb-12">
					<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 items-end">
						<div className="col-span-12 lg:col-span-8">
							<h2 className="font-display text-[36px] sm:text-[48px] lg:text-[64px] leading-none tracking-[-0.02em]">
								Pair the path
								<br />
								<span className="text-peach-300">with a free account.</span>
							</h2>
							<p className="mt-5 text-[15.5px] max-w-lg leading-[1.55]">
								The lessons reference the actual product surfaces. Open an
								account in 30 seconds; the free plan covers everything the paths
								ask of you.
							</p>
						</div>
						<div className="col-span-12 lg:col-span-4 flex flex-col gap-4 lg:items-end">
							<Link
								href={routes.signin}
								className="inline-flex items-center gap-2 h-14 px-7 rounded-full text-background font-medium text-[15px] bg-primary transition-colors"
							>
								Start free — no card
								<ArrowRight className="w-4 h-4" />
							</Link>
							<Link
								href={routes.resources.playbooks}
								className="pencil-link inline-flex items-center gap-2 text-[14.5px] font-medium"
							>
								Prefer playbooks?
								<ArrowUpRight className="w-4 h-4" />
							</Link>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
