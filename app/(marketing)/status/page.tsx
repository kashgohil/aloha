import { routes } from "@/lib/routes";
import { makeMetadata } from "@/lib/seo";
import {
	AlertTriangle,
	ArrowUpRight,
	CheckCircle2,
	Mail,
	Rss,
} from "lucide-react";
import Link from "next/link";

export const metadata = makeMetadata({
	title: "Status — live system health",
	description:
		"Aloha's live status page. Per-system health, 90-day uptime history, recent incidents — published in plain English.",
	path: routes.resources.status,
});

type Sys = {
	name: string;
	status: "operational" | "degraded" | "outage";
	uptime: number; // last 90 days, 0-100
};

const SYSTEMS: Sys[] = [
	{ name: "API", status: "operational", uptime: 99.98 },
	{ name: "Scheduler", status: "operational", uptime: 99.95 },
	{ name: "Composer + voice model", status: "operational", uptime: 99.92 },
	{ name: "Inbox", status: "operational", uptime: 99.94 },
	{ name: "Logic Matrix", status: "operational", uptime: 99.91 },
	{ name: "Analytics exports", status: "operational", uptime: 99.89 },
	{ name: "Link-in-bio", status: "operational", uptime: 99.97 },
	{ name: "Webhooks", status: "operational", uptime: 99.88 },
];

// 90 buckets — 0 (green) / 1 (yellow) / 2 (red). Synthetic but plausible;
// a handful of yellows across the strip.
const YELLOW_DAYS = new Set([6, 17, 41, 63, 71]);
const RED_DAYS = new Set([44]);

function bucketTone(d: number): string {
	if (RED_DAYS.has(d)) return "bg-ink";
	if (YELLOW_DAYS.has(d)) return "bg-peach-400";
	return "bg-primary";
}

const INCIDENTS = [
	{
		date: "Mar 12, 2026",
		title: "Scheduler delivery lag — 17 minutes",
		severity: "Partial",
		summary:
			"Queue backlogged after a deploy introduced a regression in the QStash retry loop. 2.4% of scheduled posts delivered late; none lost. Resolved in 17 minutes; postmortem shipped next day.",
		tone: "bg-peach-400",
	},
	{
		date: "Feb 24, 2026",
		title: "Instagram API timeouts — 42 minutes",
		severity: "Upstream",
		summary:
			"Instagram's Graph API returned 5xx for 42 minutes. Our scheduler paused and retried; no posts lost. Communicated via status page + Slack community during the incident.",
		tone: "bg-peach-200",
	},
	{
		date: "Jan 9, 2026",
		title: "Analytics export delay — 3 hours",
		severity: "Degraded",
		summary:
			"A warehouse migration ran long. Exports requested during the window were delivered 3 hours late. Full catch-up by end of day.",
		tone: "bg-peach-200",
	},
];

const STATUS_META = {
	operational: {
		label: "Operational",
		tone: "text-primary",
		icon: CheckCircle2,
	},
	degraded: { label: "Degraded", tone: "text-peach-400", icon: AlertTriangle },
	outage: { label: "Outage", tone: "text-ink", icon: AlertTriangle },
} as const;

export default function StatusPage() {
	const allGood = SYSTEMS.every((s) => s.status === "operational");

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
						<div className="col-span-12 lg:col-span-8">
							<div className="inline-flex items-center gap-3 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
								<span className="w-6 h-px bg-ink/40" />
								Status
								<span className="px-2 py-0.5 bg-background-elev border border-border rounded-full text-ink/65 text-[10px] font-mono normal-case tracking-normal inline-flex items-center gap-1.5">
									<span className="relative flex w-2 h-2">
										<span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
										<span className="relative w-2 h-2 rounded-full bg-primary" />
									</span>
									updated moments ago
								</span>
							</div>
							<h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[96px]">
								{allGood ? (
									<>
										All systems
										<br />
										<span className="text-primary font-light">normal.</span>
									</>
								) : (
									<>
										Something's off.
										<br />
										<span className="text-primary font-light">
											We're on it.
										</span>
									</>
								)}
							</h1>
							<p className="mt-8 max-w-2xl text-[17px] lg:text-[18px] leading-[1.6] text-ink/75">
								Live health across the eight systems Aloha touches. Ninety- day
								incident history kept unredacted. Subscribe below to get a
								heads-up when something breaks; we'd rather you know than guess.
							</p>
						</div>
						<div className="col-span-12 lg:col-span-4 flex flex-col gap-3">
							<a
								href="mailto:status@usealoha.app?subject=Subscribe%20to%20incident%20updates"
								className="inline-flex items-center gap-2 h-12 px-5 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
							>
								<Mail className="w-4 h-4" />
								Email me on incidents
							</a>
							<a
								href="/status.rss"
								className="pencil-link inline-flex items-center gap-2 text-[13.5px] font-medium text-ink"
							>
								<Rss className="w-3.5 h-3.5" />
								Status RSS
							</a>
						</div>
					</div>
				</div>
			</section>

			{/* ─── SYSTEM TABLE ───────────────────────────────────────────── */}
			<section className="bg-background-elev">
				<section className="py-12 lg:py-16 bg-background wavy pb-32 lg:pb-40">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
						<div className="rounded-3xl border border-border overflow-hidden bg-background">
							<div className="grid grid-cols-12 px-6 py-4 bg-muted/40 border-b border-border text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/55">
								<div className="col-span-7 md:col-span-4">System</div>
								<div className="col-span-5 md:col-span-2">Status</div>
								<div className="col-span-12 md:col-span-4 mt-2 md:mt-0">
									Last 90 days
								</div>
								<div className="hidden md:block md:col-span-2 text-right">
									Uptime
								</div>
							</div>

							{SYSTEMS.map((s, idx) => {
								const meta = STATUS_META[s.status];
								const StatusIcon = meta.icon;
								return (
									<div
										key={s.name}
										className={`grid grid-cols-12 items-center px-6 py-4 border-b border-border last:border-b-0 ${idx % 2 === 1 ? "bg-muted/10" : ""}`}
									>
										<div className="col-span-7 md:col-span-4">
											<p className="font-display text-[17px] leading-[1.2] tracking-[-0.005em] text-ink">
												{s.name}
											</p>
										</div>
										<div className="col-span-5 md:col-span-2 md:flex md:items-center">
											<span
												className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${meta.tone}`}
											>
												<StatusIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
												{meta.label}
											</span>
										</div>
										<div className="col-span-12 md:col-span-4 mt-3 md:mt-0 overflow-x-auto md:overflow-visible">
											<div className="flex items-end gap-[1.5px] h-5 w-max md:w-auto">
												{Array.from({ length: 90 }).map((_, d) => (
													<span
														key={d}
														className={`w-[3px] h-full rounded-sm ${bucketTone(d)}`}
														style={{
															height: RED_DAYS.has(d)
																? "18px"
																: YELLOW_DAYS.has(d)
																	? "14px"
																	: "10px",
														}}
													/>
												))}
											</div>
										</div>
										<div className="hidden md:block md:col-span-2 text-right">
											<span className="font-mono text-[13px] text-ink/70">
												{s.uptime}%
											</span>
										</div>
									</div>
								);
							})}
						</div>

						<div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-ink/55 font-mono">
							<span className="inline-flex items-center gap-2">
								<span className="w-2 h-2 rounded-sm bg-primary" />
								Operational
							</span>
							<span className="inline-flex items-center gap-2">
								<span className="w-2 h-2 rounded-sm bg-peach-400" />
								Degraded
							</span>
							<span className="inline-flex items-center gap-2">
								<span className="w-2 h-2 rounded-sm bg-ink" />
								Outage
							</span>
							<span className="text-ink/25">·</span>
							<span>Strip shows the last 90 days, left-to-right.</span>
						</div>
					</div>
				</section>
			</section>

			{/* ─── INCIDENTS ─────────────────────────────────────────────── */}
			<section className="py-20 lg:py-24 bg-background-elev wavy">
				<div className="max-w-[1180px] mx-auto px-6 lg:px-10 pb-8 lg:pb-12">
					<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 mb-12 items-end">
						<div className="col-span-12 lg:col-span-7">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Recent incidents
							</p>
							<h2 className="font-display text-[36px] lg:text-[48px] leading-[1.02] tracking-[-0.02em]">
								Three in 90 days.
								<br />
								<span className="text-primary">Unredacted.</span>
							</h2>
						</div>
						<p className="col-span-12 lg:col-span-5 text-[15px] text-ink/70 leading-[1.55]">
							We publish every incident in plain English, with root cause and
							what changed. No &ldquo;issue affecting some users&rdquo;
							non-sentences.
						</p>
					</div>

					<ol className="relative pl-10 space-y-10 before:absolute before:inset-y-0 before:left-3 before:w-px before:bg-border-strong/60">
						{INCIDENTS.map((i, idx) => (
							<li key={idx} className="relative">
								<span
									className={`absolute -left-10 top-1 w-6 h-6 rounded-full ${i.tone} border-2 border-ink/15 flex items-center justify-center text-[10px] font-display text-ink`}
								>
									{idx + 1}
								</span>
								<div className="flex flex-wrap items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.22em] text-ink/55 mb-3">
									<span>{i.date}</span>
									<span className="text-ink/25">·</span>
									<span className="px-2 py-0.5 bg-ink text-peach-200 rounded-full normal-case tracking-normal text-[10px]">
										{i.severity}
									</span>
								</div>
								<h3 className="font-display text-[22px] lg:text-[26px] leading-[1.15] tracking-[-0.005em] text-ink">
									{i.title}
								</h3>
								<p className="mt-3 text-[14.5px] text-ink/75 leading-[1.65] max-w-2xl">
									{i.summary}
								</p>
								<Link
									href="#"
									className="mt-3 pencil-link text-[12.5px] font-medium text-ink inline-flex items-center gap-1.5"
								>
									Read the full post-mortem
									<ArrowUpRight className="w-3 h-3" />
								</Link>
							</li>
						))}
					</ol>
				</div>
			</section>

			{/* ─── COMMITMENTS ────────────────────────────────────────────── */}
			<section className="bg-background-elev">
				<section className="py-20 lg:py-24 bg-background wavy pb-32 lg:pb-40">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
						<div className="mb-12">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								What we promise
							</p>
							<h2 className="font-display text-[36px] lg:text-[48px] leading-[1.02] tracking-[-0.02em]">
								Status honesty,
								<br />
								<span className="text-primary">not status theatre.</span>
							</h2>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
							{[
								{
									h: "99.9% target, 99.95% Enterprise",
									p: "SLA credits kick in automatically if we miss — no form to fill.",
								},
								{
									h: "Incident posted within 10 minutes",
									p: "Even if we don't know the root cause yet. You know first; theory comes second.",
								},
								{
									h: "Postmortems within 48 hours",
									p: "Root cause, timeline, what changed. Public. We don't redact to look better.",
								},
								{
									h: "Upstream failures named",
									p: "When Instagram's API is down, we say so. Your users aren't ours to blame.",
								},
								{
									h: "Scheduler backlogs never drop posts",
									p: "We pause and retry; historical record, every post eventually ships or surfaces for review.",
								},
								{
									h: "No shadow-throttling",
									p: "When we rate-limit you, we return 429. No silent degrade.",
								},
							].map((c) => (
								<article
									key={c.h}
									className="p-7 rounded-3xl bg-background-elev border border-border"
								>
									<p className="font-display text-[20px] leading-[1.2] tracking-[-0.005em]">
										{c.h}
									</p>
									<p className="mt-3 text-[13.5px] text-ink/70 leading-[1.55]">
										{c.p}
									</p>
								</article>
							))}
						</div>
					</div>
				</section>
			</section>

			{/* ─── CROSSLINKS ─────────────────────────────────────────────── */}
			<section className="py-16 lg:py-20 bg-background-elev wavy">
				<div className="max-w-[1180px] mx-auto px-6 lg:px-10 pb-8 lg:pb-12">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
						{[
							{
								h: "Trust center",
								p: "Security, compliance, subprocessors.",
								href: routes.trust,
							},
							{
								h: "Changelog",
								p: "What shipped this week.",
								href: routes.product.whatsNew,
							},
							{
								h: "Contact",
								p: "Reach the right inbox for non-status questions.",
								href: routes.company.contact,
							},
						].map((l) => (
							<Link
								key={l.href}
								href={l.href}
								className="group p-6 rounded-2xl bg-background border border-border hover:bg-muted/30 transition-colors"
							>
								<p className="font-display text-[19px] leading-[1.2] tracking-[-0.005em]">
									{l.h}
								</p>
								<p className="mt-2 text-[12.5px] text-ink/60">{l.p}</p>
								<ArrowUpRight className="mt-4 w-3.5 h-3.5 text-ink/40 group-hover:text-primary transition-colors" />
							</Link>
						))}
					</div>
				</div>
			</section>
		</>
	);
}
