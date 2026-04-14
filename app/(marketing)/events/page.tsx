import { routes } from "@/lib/routes";
import { makeMetadata } from "@/lib/seo";
import {
	ArrowRight,
	ArrowUpRight,
	CalendarDays,
	Clock,
	MapPin,
	Mic,
	Sparkle,
	Users,
	Video,
} from "lucide-react";
import Link from "next/link";

export const metadata = makeMetadata({
	title: "Events — AMAs, field-note readings, quarterly meet-ups",
	description:
		"Upcoming and past Aloha events — virtual every month, in-person quarterly. First invites go to Slack members and newsletter subscribers.",
	path: routes.customers.events,
});

type EventItem = {
	slug: string;
	date: string; // ISO
	dateLabel: string;
	timeLabel: string;
	title: string;
	lead: string;
	kind: "AMA" | "Reading" | "Meet-up" | "Workshop";
	format: "Virtual" | "Lisbon" | "Oakland" | "Jakarta" | "New York" | "London";
	host: string;
	rsvp?: boolean; // upcoming vs past
	recordingUrl?: string;
	tone: string;
};

const UPCOMING: EventItem[] = [
	{
		slug: "ama-voice-models",
		date: "2026-04-24",
		dateLabel: "Fri, Apr 24",
		timeLabel: "5pm Lisbon · 12pm EDT",
		title: "AMA · how the voice model actually works",
		lead: "Aarohi + the Composer team answer unfiltered questions about the voice model — training data, privacy boundaries, how we built the 'teach me' loop. Submit questions in advance.",
		kind: "AMA",
		format: "Virtual",
		host: "Aarohi M. + Vikram S.",
		rsvp: true,
		tone: "bg-peach-200",
	},
	{
		slug: "field-note-reading-lisbon-02",
		date: "2026-05-08",
		dateLabel: "Thu, May 8",
		timeLabel: "7pm",
		title: "Field-note reading · Lisbon",
		lead: "Four Aloha members read five-minute pieces from their best posts of the quarter. Wine, sparkling water, short Q&A after. Room holds 40; first-come on the list.",
		kind: "Reading",
		format: "Lisbon",
		host: "Leilani O.",
		rsvp: true,
		tone: "bg-primary-soft",
	},
	{
		slug: "agency-workshop",
		date: "2026-05-22",
		dateLabel: "Thu, May 22",
		timeLabel: "4pm Lisbon · 11am EDT",
		title: "Workshop · running multi-client workspaces",
		lead: "A hands-on workshop with Leah S. (North Handle) and our platform team. Audit your agency setup; 2 hours; tight format, 30 seats.",
		kind: "Workshop",
		format: "Virtual",
		host: "Leah S. + Aloha platform team",
		rsvp: true,
		tone: "bg-peach-100",
	},
];

const PAST: EventItem[] = [
	{
		slug: "ama-logic-matrix-graduation",
		date: "2026-04-10",
		dateLabel: "Apr 10, 2026",
		timeLabel: "Recorded",
		title: "AMA · Logic Matrix leaves beta",
		lead: "45-minute AMA marking the Matrix moving to GA. Covers the 6 starter templates, the human-approve default, and what comes next.",
		kind: "AMA",
		format: "Virtual",
		host: "Aarohi M.",
		recordingUrl: "#",
		tone: "bg-peach-100",
	},
	{
		slug: "oakland-meetup-q1",
		date: "2026-03-14",
		dateLabel: "Mar 14, 2026",
		timeLabel: "Recap",
		title: "Oakland meet-up · Q1",
		lead: "Quarterly in-person meet-up for Bay Area members. 80 people, informal format, three creator lightning talks.",
		kind: "Meet-up",
		format: "Oakland",
		host: "Kashyap G.",
		recordingUrl: "#",
		tone: "bg-peach-200",
	},
	{
		slug: "field-note-reading-lisbon-01",
		date: "2026-02-20",
		dateLabel: "Feb 20, 2026",
		timeLabel: "Recap + transcript",
		title: "Field-note reading · Lisbon (first one)",
		lead: "First-ever field-note reading. Four members, five minutes each, a room of 30. Recording and transcripts linked.",
		kind: "Reading",
		format: "Lisbon",
		host: "Leilani O.",
		recordingUrl: "#",
		tone: "bg-primary-soft",
	},
	{
		slug: "voice-lab-workshop-jan",
		date: "2026-01-30",
		dateLabel: "Jan 30, 2026",
		timeLabel: "Recording",
		title: "Voice-lab workshop",
		lead: "Three-hour hands-on session: how to train a voice model from your best posts. 25 members attended; recording + slides available.",
		kind: "Workshop",
		format: "Virtual",
		host: "Jonas R. + Aarohi M.",
		recordingUrl: "#",
		tone: "bg-peach-300",
	},
];

const FORMAT_ICON: Record<EventItem["format"], typeof Video> = {
	Virtual: Video,
	Lisbon: MapPin,
	Oakland: MapPin,
	Jakarta: MapPin,
	"New York": MapPin,
	London: MapPin,
};

export default function EventsPage() {
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
								Events
								<span className="px-2 py-0.5 bg-background-elev border border-border rounded-full text-ink/65 text-[10px] font-mono normal-case tracking-normal inline-flex items-center gap-1.5">
									<span className="relative flex w-2 h-2">
										<span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
										<span className="relative w-2 h-2 rounded-full bg-primary" />
									</span>
									{UPCOMING.length} upcoming
								</span>
							</div>
							<h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[96px]">
								AMAs.
								<br />
								Readings.
								<br />
								<span className="text-primary font-light">Quiet meet-ups.</span>
							</h1>
							<p className="mt-8 max-w-2xl text-[17px] lg:text-[18px] leading-[1.6] text-ink/75">
								Virtual sessions every month, in-person meet-ups every quarter.
								Members of the{" "}
								<Link
									href={routes.connect.slack}
									className="pencil-link text-ink"
								>
									Slack community
								</Link>{" "}
								and{" "}
								<Link
									href={routes.connect.newsletter}
									className="pencil-link text-ink"
								>
									newsletter
								</Link>{" "}
								get first invites; everyone's welcome on the waitlist.
							</p>
						</div>
						<div className="col-span-12 lg:col-span-4">
							<div className="p-6 rounded-3xl bg-background-elev border border-border">
								<div className="text-[10.5px] font-mono uppercase tracking-[0.22em] text-ink/55 mb-3">
									Get on the list
								</div>
								<p className="font-display text-[20px] leading-[1.2] tracking-[-0.005em]">
									Event invites go out{" "}
									<span className="text-primary">in the newsletter.</span>
								</p>
								<Link
									href={routes.connect.newsletter}
									className="mt-5 inline-flex items-center gap-2 h-11 px-5 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors"
								>
									Subscribe
									<ArrowRight className="w-3.5 h-3.5" />
								</Link>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ─── UPCOMING ───────────────────────────────────────────────── */}
			<section className="bg-background-elev">
				<section className="py-20 lg:py-24 wavy bg-background pb-32 lg:pb-40">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
						<div className="mb-12">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Upcoming
							</p>
							<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
								Three things
								<span className="text-primary"> to put on the calendar.</span>
							</h2>
						</div>

						<div className="space-y-5 lg:space-y-6">
							{UPCOMING.map((e) => {
								const Icon = FORMAT_ICON[e.format];
								return (
									<article
										key={e.slug}
										className={`grid grid-cols-12 gap-x-0 gap-y-0 lg:gap-0 rounded-3xl ${e.tone} overflow-hidden`}
									>
										{/* date */}
										<div className="col-span-12 md:col-span-3 p-6 lg:p-8 md:border-r border-ink/10 flex md:flex-col md:justify-center gap-3 md:gap-0">
											<CalendarDays className="w-5 h-5 text-ink shrink-0" />
											<div className="md:mt-4">
												<p className="font-display text-[24px] lg:text-[28px] leading-none tracking-[-0.01em]">
													{e.dateLabel}
												</p>
												<p className="mt-1 text-[12px] font-mono text-ink/60 uppercase tracking-[0.14em]">
													{e.timeLabel}
												</p>
											</div>
										</div>

										{/* body */}
										<div className="col-span-12 md:col-span-9 p-6 lg:p-8 flex flex-col gap-4">
											<div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-ink/55">
												<span className="px-2 py-0.5 bg-background-elev/80 rounded-full">
													{e.kind}
												</span>
												<span className="inline-flex items-center gap-1 px-2 py-0.5 bg-background-elev/80 rounded-full">
													<Icon className="w-3 h-3" />
													{e.format}
												</span>
												<span className="text-ink/45">· Host: {e.host}</span>
											</div>

											<h3 className="font-display text-[24px] lg:text-[28px] leading-[1.15] tracking-[-0.005em]">
												{e.title}
											</h3>
											<p className="text-[14.5px] text-ink/80 leading-[1.6] max-w-3xl">
												{e.lead}
											</p>

											<div className="flex flex-wrap gap-3 pt-2">
												<a
													href="#"
													className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors"
												>
													RSVP
													<ArrowRight className="w-3.5 h-3.5" />
												</a>
												<a
													href="#"
													className="pencil-link text-[12.5px] text-ink font-medium inline-flex items-center gap-1.5"
												>
													Add to calendar
													<ArrowUpRight className="w-3 h-3" />
												</a>
											</div>
										</div>
									</article>
								);
							})}
						</div>
					</div>
				</section>
			</section>

			{/* ─── FORMATS ─────────────────────────────────────────────────── */}
			<section className="py-20 lg:py-24 bg-background-elev wavy">
				<div className="max-w-[1180px] mx-auto px-6 lg:px-10 pb-8 lg:pb-12">
					<div className="mb-12">
						<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
							What to expect
						</p>
						<h2 className="font-display text-[36px] lg:text-[48px] leading-[1.02] tracking-[-0.02em]">
							Four shapes.
							<br />
							<span className="text-primary">One vibe.</span>
						</h2>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
						{[
							{
								icon: Mic,
								h: "AMAs",
								p: "45 minutes, founder or team lead, questions collected in advance. Recordings posted the next day.",
								tone: "bg-peach-200",
							},
							{
								icon: Sparkle,
								h: "Readings",
								p: "Four members, five minutes each, a small room. Drinks, honest crit, no slide decks allowed.",
								tone: "bg-primary-soft",
							},
							{
								icon: Users,
								h: "Meet-ups",
								p: "Quarterly in a host city. 50–80 members, three lightning talks, mostly hallway-track.",
								tone: "bg-peach-100",
							},
							{
								icon: Clock,
								h: "Workshops",
								p: "Two hours, hands-on, 30 seats. Concrete outputs: an audited workflow, a trained voice model, a shipped matrix.",
								tone: "bg-peach-300",
							},
						].map((f) => (
							<article
								key={f.h}
								className={`p-6 rounded-3xl ${f.tone} flex flex-col min-h-[200px]`}
							>
								<f.icon className="w-5 h-5 text-ink" />
								<h3 className="mt-6 font-display text-[22px] leading-[1.15] tracking-[-0.005em]">
									{f.h}
								</h3>
								<p className="mt-3 text-[13.5px] text-ink/75 leading-[1.55]">
									{f.p}
								</p>
							</article>
						))}
					</div>
				</div>
			</section>

			{/* ─── PAST ───────────────────────────────────────────────────── */}
			<section className="bg-ink relative">
				<div
					aria-hidden
					className="absolute inset-0 opacity-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<section className="py-24 lg:py-32 pb-32 lg:pb-40 bg-background wavy">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
						<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 mb-12 items-end">
							<div className="col-span-12 lg:col-span-7">
								<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
									Past events
								</p>
								<h2 className="font-display text-[36px] lg:text-[48px] leading-[1.02] tracking-[-0.02em]">
									Recordings
									<span className="text-primary"> and notes.</span>
								</h2>
							</div>
							<p className="col-span-12 lg:col-span-5 text-[15.5px] text-ink/70 leading-[1.55]">
								Every virtual event is recorded and transcribed. In-person
								meet-ups get a written recap. No members-only gate.
							</p>
						</div>

						<div className="rounded-3xl border border-border overflow-hidden bg-background">
							{PAST.map((e, i) => {
								const Icon = FORMAT_ICON[e.format];
								return (
									<a
										key={e.slug}
										href={e.recordingUrl ?? "#"}
										className={`group grid grid-cols-12 gap-x-0 gap-y-4 lg:gap-4 px-6 lg:px-8 py-5 items-center border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors ${
											i % 2 === 1 ? "bg-muted/10" : ""
										}`}
									>
										<div className="col-span-12 md:col-span-2">
											<p className="text-[11px] font-mono uppercase tracking-[0.18em] text-ink/55">
												{e.dateLabel}
											</p>
											<p className="mt-1 text-[10px] font-mono text-ink/45">
												{e.timeLabel}
											</p>
										</div>
										<div className="col-span-12 md:col-span-7 min-w-0">
											<div className="flex items-center gap-2 mb-1 text-[10px] font-mono uppercase tracking-[0.16em] text-ink/55">
												<span>{e.kind}</span>
												<span className="text-ink/25">·</span>
												<span className="inline-flex items-center gap-1">
													<Icon className="w-3 h-3" />
													{e.format}
												</span>
											</div>
											<p className="font-display text-[18px] lg:text-[19px] leading-[1.2] tracking-[-0.005em] text-ink group-hover:text-primary transition-colors">
												{e.title}
											</p>
										</div>
										<div className="col-span-12 md:col-span-3 md:text-right flex md:justify-end items-center gap-2 text-[12px] text-ink/60">
											<span className="font-mono">{e.host}</span>
											<ArrowUpRight className="w-4 h-4 text-ink/40 group-hover:text-primary transition-colors" />
										</div>
									</a>
								);
							})}
						</div>
					</div>
				</section>
			</section>

			{/* ─── HOST WITH US ───────────────────────────────────────────── */}
			<section className="py-8 lg:py-12 bg-ink relative wavy text-background-elev">
				<div
					aria-hidden
					className="absolute inset-0 opacity-10 -z-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<div className="max-w-[1180px] mx-auto px-6 lg:px-10 pb-12 lg:pb-16">
					<div className="p-10 lg:p-14 rounded-3xl bg-ink text-background-elev overflow-hidden relative">
						<div
							aria-hidden
							className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
						/>
						<div className="relative grid grid-cols-12 gap-x-0 gap-y-8 lg:gap-8 items-center">
							<div className="col-span-12 lg:col-span-8">
								<Users className="w-7 h-7 text-peach-300 mb-5" />
								<h2 className="font-display text-[32px] lg:text-[44px] leading-[1.05] tracking-[-0.015em]">
									Host one with us.
								</h2>
								<p className="mt-5 text-[15px] text-background-elev/75 leading-[1.6] max-w-xl">
									Got a city without a meet-up? Want to run a workshop for your
									agency's clients? We cover the logistics — you bring the room
									and the regulars.
								</p>
							</div>
							<div className="col-span-12 lg:col-span-4 flex flex-col gap-3 lg:items-end">
								<a
									href="mailto:events@usealoha.app"
									className="inline-flex items-center gap-2 h-12 px-6 rounded-full text-[14px] font-medium bg-primary transition-colors"
								>
									events@usealoha.app
									<ArrowRight className="w-4 h-4" />
								</a>
								<Link
									href={routes.customers.community}
									className="pencil-link inline-flex items-center gap-2 text-[13.5px]"
								>
									See the community hub
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
