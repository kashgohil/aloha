import { routes } from "@/lib/routes";
import { makeMetadata } from "@/lib/seo";
import {
	ArrowRight,
	ArrowUpRight,
	Clock,
	DollarSign,
	Handshake,
	Headphones,
	Mail,
	MapPin,
	Newspaper,
	ShieldCheck,
	Sparkle,
} from "lucide-react";
import Link from "next/link";

export const metadata = makeMetadata({
	title: "Contact — real people, real inboxes",
	description:
		"Questions, issues, partnerships, press. Every role at Aloha has a dedicated inbox and an SLA. Pick the one that fits.",
	path: routes.company.contact,
});

const ROUTES = [
	{
		icon: Headphones,
		title: "Support",
		email: "hello@usealoha.app",
		sla: "Within a business day",
		body: "Account issues, feature help, something broken. A real person reads every email — the support inbox isn't triaged by a bot.",
		tone: "bg-peach-100",
	},
	{
		icon: DollarSign,
		title: "Sales & procurement",
		email: "sales@usealoha.app",
		sla: "Within 4 business hours",
		body: "Pricing negotiations for teams of 10+, annual contracts, procurement questionnaires, invoicing terms.",
		tone: "bg-primary-soft",
	},
	{
		icon: Sparkle,
		title: "Migration",
		email: "migrate@usealoha.app",
		sla: "Within 4 business hours",
		body: "Moving from Buffer, Hootsuite, Later, Sprout, Typefully or Kit. We walk the first import with you, no meetings required.",
		tone: "bg-peach-200",
		link: {
			href: routes.compare.migrationGuide,
			label: "Read the guide first",
		},
	},
	{
		icon: ShieldCheck,
		title: "Security & compliance",
		email: "security@usealoha.app",
		sla: "Within 24 hours",
		body: "Vulnerability reports, SOC 2 questionnaires, penetration-testing requests. PGP key for sensitive reports is at /.well-known/security.pgp.",
		tone: "bg-background-elev border-2 border-border",
		link: { href: routes.trust, label: "Trust center" },
	},
	{
		icon: Newspaper,
		title: "Press",
		email: "press@usealoha.app",
		sla: "Within a business day",
		body: "Stories, interviews, quotes. Logos and brand assets are in the press kit.",
		tone: "bg-peach-300",
		link: { href: routes.company.press, label: "Press kit" },
	},
	{
		icon: Handshake,
		title: "Partnerships",
		email: "partners@usealoha.app",
		sla: "Within 2 business days",
		body: "Integrations, co-marketing, agency partner programme, affiliate enrolment.",
		tone: "bg-peach-100",
		link: { href: routes.connect.partners, label: "Partner programme" },
	},
];

const CITIES = [
	{
		city: "Lisbon",
		region: "Portugal",
		address: "Rua do Alecrim 12, 1200-012",
		tz: "UTC+1",
		mapLabel: "LIS",
	},
	{
		city: "Oakland",
		region: "California",
		address: "1150 Harrison St, Oakland CA 94607",
		tz: "UTC−8",
		mapLabel: "OAK",
	},
	{
		city: "Jakarta",
		region: "Indonesia",
		address: "Jl. Senopati No. 88, South Jakarta",
		tz: "UTC+7",
		mapLabel: "CGK",
	},
];

export default function ContactPage() {
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
								Contact
							</div>
							<h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[96px]">
								Real people.
								<br />
								<span className="text-primary font-light">Real inboxes.</span>
							</h1>
							<p className="mt-8 max-w-2xl text-[17px] lg:text-[18px] leading-[1.6] text-ink/75">
								We didn't build one form that routes into the void. Pick the
								inbox that matches — you'll get a real person, and the SLA
								printed on the card is the one we actually hold ourselves to.
							</p>
						</div>
						<div className="col-span-12 lg:col-span-4">
							<div className="p-6 rounded-3xl bg-background-elev border border-border">
								<div className="flex items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.22em] text-ink/55 mb-3">
									<Clock className="w-3 h-3" />
									Right now
								</div>
								<p className="font-display text-[26px] leading-[1.15] tracking-[-0.01em]">
									Humans online,
									<br />
									<span className="text-primary">most hours.</span>
								</p>
								<p className="mt-4 text-[12.5px] text-ink/65 leading-[1.55]">
									Three cities, three timezones. Pacific, Lisbon, Jakarta —
									collectively we cover almost every working hour.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ─── ROUTING CARDS ──────────────────────────────────────────── */}
			<section className="bg-background-elev">
				<section className="py-20 lg:py-24 pb-32 lg:pb-40 bg-background wavy">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
						<div className="mb-14">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Pick an inbox
							</p>
							<h2 className="font-display text-[36px] lg:text-[48px] leading-[1.02] tracking-[-0.02em]">
								Six doors.
								<span className="text-primary"> One behind each.</span>
							</h2>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
							{ROUTES.map((r) => (
								<article
									key={r.email}
									className={`p-7 lg:p-8 rounded-3xl ${r.tone} flex flex-col min-h-[280px]`}
								>
									<div className="flex items-start justify-between">
										<r.icon className="w-6 h-6 text-ink" />
										<span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.18em] text-ink/55 bg-background/50 px-2 py-1 rounded-full">
											<Clock className="w-2.5 h-2.5" />
											{r.sla}
										</span>
									</div>
									<h3 className="mt-6 font-display text-[24px] leading-[1.2] tracking-[-0.01em]">
										{r.title}
									</h3>
									<p className="mt-3 text-[13.5px] text-ink/75 leading-[1.55]">
										{r.body}
									</p>
									<div className="mt-auto pt-6 flex items-center justify-between">
										<a
											href={`mailto:${r.email}`}
											className="inline-flex items-center gap-2 text-[13px] font-mono text-ink pencil-link truncate"
										>
											<Mail className="w-3.5 h-3.5 shrink-0" />
											{r.email}
										</a>
										{r.link && (
											<Link
												href={r.link.href}
												className="pencil-link text-[12px] text-ink/65 inline-flex items-center gap-1 shrink-0 ml-3"
											>
												{r.link.label}
												<ArrowUpRight className="w-3 h-3" />
											</Link>
										)}
									</div>
								</article>
							))}
						</div>
					</div>
				</section>
			</section>

			{/* ─── NOT A FORM ─────────────────────────────────────────────── */}

			<section className="py-20 lg:py-24 bg-background-elev wavy">
				<div className="max-w-[1180px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-16 items-start pb-8 lg:pb-12">
					<div className="col-span-12 lg:col-span-5">
						<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
							Why not one form?
						</p>
						<h2 className="font-display text-[36px] lg:text-[48px] leading-[1.02] tracking-[-0.02em]">
							Because
							<br />
							<span className="text-primary">forms get lost.</span>
						</h2>
					</div>

					<div className="col-span-12 lg:col-span-7 space-y-6 text-[15.5px] leading-[1.65] text-ink/80">
						<p>
							The universal &ldquo;contact us&rdquo; form is the anti-pattern of
							the customer-support era. Everything gets triaged by the same
							person, who's never the right one, which means your question takes
							three times as long to reach a reply.
						</p>
						<p>
							We broke it into six routes, each landing in a domain-expert's
							inbox. Support gets the product owner on call that week. Sales
							gets the only person who can actually negotiate a contract.
							Security gets the engineer who wrote our incident response plan.
							No forwarding. No &ldquo;we've escalated your ticket.&rdquo;
						</p>
						<p>
							The tradeoff is that you have to read six cards to pick one.
							That's worth it. Reading three sentences saves both of us
							forty-eight hours.
						</p>
					</div>
				</div>
			</section>

			{/* ─── OFFICES ─────────────────────────────────────────────────── */}
			<section className="bg-ink relative">
				<div
					aria-hidden
					className="absolute inset-0 opacity-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<section className="py-20 lg:py-24 pb-32 lg:pb-40 bg-background wavy">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
						<div className="mb-12">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Physical addresses
							</p>
							<h2 className="font-display text-[36px] lg:text-[48px] leading-[1.02] tracking-[-0.02em]">
								If you need
								<span className="text-primary"> postal mail.</span>
							</h2>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
							{CITIES.map((c, i) => (
								<article
									key={c.city}
									className={`p-7 rounded-3xl ${
										i === 0
											? "bg-peach-200"
											: i === 1
												? "bg-primary-soft"
												: "bg-peach-100"
									} flex flex-col min-h-[220px]`}
								>
									<div className="flex items-center justify-between">
										<MapPin className="w-5 h-5 text-ink" />
										<span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink/60 bg-background-elev/60 px-2 py-0.5 rounded-full">
											{c.mapLabel}
										</span>
									</div>
									<h3 className="mt-5 font-display text-[28px] leading-[1.05] tracking-[-0.015em]">
										{c.city}
									</h3>
									<p className="mt-1 text-[12.5px] text-ink/60 font-mono uppercase tracking-[0.14em]">
										{c.region} · {c.tz}
									</p>
									<p className="mt-5 text-[13px] text-ink/75 leading-[1.55]">
										{c.address}
									</p>
								</article>
							))}
						</div>

						<p className="mt-8 text-[13px] text-ink/55 max-w-xl">
							For legal notices: Aloha, Inc., c/o the Lisbon address above.
							Registered company 514 829 117, Portugal.
						</p>
					</div>
				</section>
			</section>

			{/* ─── NOT URGENT ─────────────────────────────────────────────── */}
			<section className="py-20 lg:py-24 bg-ink wavy text-background-elev relative">
				<div
					aria-hidden
					className="absolute inset-0 opacity-10 -z-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<div className="max-w-[1180px] mx-auto px-6 lg:px-10 pb-8 lg:pb-12">
					<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 items-center">
						<div className="col-span-12 lg:col-span-7">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] mb-4">
								Not urgent?
							</p>
							<h2 className="font-display text-[32px] lg:text-[44px] leading-[1.05] tracking-[-0.015em]">
								A weekly note from the team,
								<br />
								<span className="text-peach-300">one email, no upsell.</span>
							</h2>
							<p className="mt-6 text-[15.5px] leading-[1.6] max-w-lg">
								One email on Fridays. What we shipped, what we didn't, what
								we're reading. Zero push notifications to accompany it.
							</p>
						</div>
						<div className="col-span-12 lg:col-span-5 flex flex-col gap-3 lg:items-end">
							<Link
								href={routes.connect.newsletter}
								className="inline-flex items-center gap-2 h-12 px-6 rounded-full text-[14px] font-medium bg-primary transition-colors"
							>
								Join the newsletter
								<ArrowRight className="w-4 h-4" />
							</Link>
							<Link
								href={routes.company.about}
								className="pencil-link inline-flex items-center gap-2 text-[14.5px] font-medium"
							>
								About the team
								<ArrowUpRight className="w-4 h-4" />
							</Link>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
