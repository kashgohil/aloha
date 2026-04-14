import { routes } from "@/lib/routes";
import { makeMetadata } from "@/lib/seo";
import {
	ArrowRight,
	ArrowUpRight,
	Building,
	Check,
	Handshake,
	Puzzle,
	Sparkle,
	Users,
} from "lucide-react";
import Link from "next/link";

export const metadata = makeMetadata({
	title: "Partners — agencies, integrations, and solution builders",
	description:
		"Aloha's partner programme. Three tiers for agencies, app integrations and solution partners. Co-marketing, revenue share, and a named point of contact.",
	path: routes.connect.partners,
});

const TIERS = [
	{
		title: "Agency partner",
		icon: Building,
		for: "Agencies managing 5+ clients",
		perks: [
			"Dedicated Agency plan pricing",
			"Named account manager",
			"White-label client reports, branded per-client",
			"Quarterly co-marketing moment (blog, podcast, or newsletter slot)",
			"Early access to multi-workspace features",
		],
		cta: "Apply as an agency",
		tone: "bg-peach-200",
	},
	{
		title: "Integration partner",
		icon: Puzzle,
		for: "Tools that complement Aloha",
		perks: [
			"Listing on our integrations directory, cross-listed on your side",
			"Technical sandbox with a platform engineer on call",
			"Joint launch announcement when the integration ships",
			"Priority bug fixes on both sides",
			"Revenue share on paid workflows through the integration",
		],
		cta: "Apply to integrate",
		tone: "bg-primary-soft",
	},
	{
		title: "Solution partner",
		icon: Users,
		for: "Consultants who implement Aloha for clients",
		perks: [
			"Verified solution-partner badge on your profile",
			"Training path: 4-hour workshop + certification",
			"Early invites to every release, 30 days before general availability",
			"Referral fee for brought-in customers",
			"Quarterly community meet-ups (virtual + once-a-year in person)",
		],
		cta: "Apply as a solution partner",
		tone: "bg-peach-100",
	},
];

const DIRECTORY = [
	{
		n: "Field & Kin",
		kind: "Agency · 12 brands",
		bio: "Brooklyn studio for DTC brands and creator startups.",
		tone: "bg-peach-100",
	},
	{
		n: "Harbor Supply",
		kind: "Agency · 8 brands",
		bio: "Lisbon collective specialising in nonprofits and mission-led brands.",
		tone: "bg-peach-200",
	},
	{
		n: "Notion",
		kind: "Integration",
		bio: "Pipe weekly digests, analytics exports, and approvals into your Notion workspace.",
		tone: "bg-primary-soft",
	},
	{
		n: "Linear",
		kind: "Integration",
		bio: "Inbox-to-issue routing for product feedback threads.",
		tone: "bg-background-elev border-2 border-border",
	},
	{
		n: "Figma",
		kind: "Integration",
		bio: "Pull approved visuals straight into a Composer draft from your design system.",
		tone: "bg-peach-100",
	},
	{
		n: "Beehiiv",
		kind: "Integration",
		bio: "Sync subscribers between your newsletter and Aloha capture forms.",
		tone: "bg-peach-300",
	},
	{
		n: "Clara & Co.",
		kind: "Solution · consultants",
		bio: "Two-person consultancy specialising in Logic Matrix migrations.",
		tone: "bg-primary-soft",
	},
	{
		n: "North Handle",
		kind: "Solution · consultants",
		bio: "Sydney-based, team-plan implementation for B2B content orgs.",
		tone: "bg-peach-200",
	},
];

export default function PartnersPage() {
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
							<div className="inline-flex items-center gap-2 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
								Partner programme
							</div>
							<h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[92px]">
								Three ways
								<br />
								<span className="text-primary font-light">
									to build with us.
								</span>
							</h1>
							<p className="mt-8 max-w-2xl text-[17px] lg:text-[18px] leading-[1.6] text-ink/75">
								Agencies running Aloha for multiple clients. Tools that fit into
								the Aloha surface. Consultants who implement for customers.
								Three tiers, each with named-point-of-contact support — not a
								web form into the void.
							</p>
						</div>
						<div className="col-span-12 flex flex-col items-end lg:col-span-4">
							<a
								href="#apply"
								className="inline-flex items-center gap-2 h-14 px-7 rounded-full bg-ink text-background text-[15px] font-medium hover:bg-primary transition-colors self-end"
							>
								<Handshake className="w-4 h-4" />
								Apply
							</a>
							<a
								href="mailto:partners@aloha.social"
								className="mt-4 inline-flex items-center gap-2 text-[14px] font-medium text-ink pencil-link"
							>
								partners@aloha.social
								<ArrowUpRight className="w-4 h-4" />
							</a>
						</div>
					</div>
				</div>
			</section>

			{/* ─── THREE TIERS ─────────────────────────────────────────────── */}
			<section className="bg-background-elev">
				<section className="py-24 lg:py-32 pb-32 lg:pb-40 wavy bg-background">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
						<div className="mb-14">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								The three tiers
							</p>
							<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
								Pick the shape
								<br />
								<span className="text-primary">of your work.</span>
							</h2>
						</div>

						<div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
							{TIERS.map((t) => (
								<article
									key={t.title}
									className={`p-8 lg:p-9 rounded-3xl ${t.tone} flex flex-col`}
								>
									<t.icon className="w-6 h-6 text-ink" />
									<p className="mt-6 text-[10.5px] font-mono uppercase tracking-[0.22em] text-ink/55">
										{t.for}
									</p>
									<h3 className="mt-2 font-display text-[28px] leading-[1.15] tracking-[-0.01em]">
										{t.title}
									</h3>

									<ul className="mt-6 space-y-2.5 text-[13.5px] text-ink/85 flex-1">
										{t.perks.map((p) => (
											<li key={p} className="flex items-start gap-2.5">
												<Check
													className="w-3.5 h-3.5 mt-[3px] text-primary shrink-0"
													strokeWidth={2.5}
												/>
												{p}
											</li>
										))}
									</ul>

									<a
										href="#apply"
										className="mt-7 pencil-link text-[13.5px] font-medium text-ink inline-flex items-center gap-2 self-start"
									>
										{t.cta}
										<ArrowUpRight className="w-3.5 h-3.5" />
									</a>
								</article>
							))}
						</div>
					</div>
				</section>
			</section>

			{/* ─── DIRECTORY ──────────────────────────────────────────────── */}
			<section className="py-20 lg:py-24 bg-background-elev wavy">
				<div className="max-w-[1180px] mx-auto px-6 lg:px-10 pb-8 lg:pb-12">
					<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 mb-12 items-end">
						<div className="col-span-12 lg:col-span-7">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Partner directory
							</p>
							<h2 className="font-display text-[36px] lg:text-[48px] leading-[1.02] tracking-[-0.02em]">
								People and tools
								<br />
								<span className="text-primary">already in the ring.</span>
							</h2>
						</div>
						<p className="col-span-12 lg:col-span-5 text-[15.5px] text-ink/70 leading-[1.55]">
							The current directory — agencies, integrations, and solution
							consultants we've vetted. Filter coming soon; for now it's a short
							scroll.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
						{DIRECTORY.map((d) => (
							<article
								key={d.n}
								className={`p-6 rounded-3xl ${d.tone} flex flex-col min-h-[180px]`}
							>
								<p className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink/55 mb-4">
									{d.kind}
								</p>
								<h3 className="font-display text-[22px] leading-[1.15] tracking-[-0.005em]">
									{d.n}
								</h3>
								<p className="mt-3 text-[13px] text-ink/70 leading-[1.55]">
									{d.bio}
								</p>
								<a
									href="#"
									className="mt-auto pt-4 self-start pencil-link text-[12.5px] font-medium text-ink inline-flex items-center gap-1.5"
								>
									View profile
									<ArrowUpRight className="w-3 h-3" />
								</a>
							</article>
						))}
					</div>
				</div>
			</section>

			{/* ─── WHAT WE LOOK FOR ────────────────────────────────────────── */}
			<section className="bg-background-elev">
				<section className="py-24 lg:py-32 pb-32 lg:pb-40 wavy bg-background">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-16 items-start">
						<div className="col-span-12 lg:col-span-5">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								What we look for
							</p>
							<h2 className="font-display text-[36px] lg:text-[48px] leading-[1.02] tracking-[-0.02em]">
								Taste, reliability,
								<br />
								<span className="text-primary">
									and the patience to ship well.
								</span>
							</h2>
						</div>

						<ul className="col-span-12 lg:col-span-7 space-y-6 text-[15.5px] leading-[1.7] text-ink/85">
							{[
								{
									h: "A track record with customers similar to ours",
									p: "Creators and small teams. If you've only served Fortune 500s, we're probably not your fit — and vice versa.",
								},
								{
									h: "Good defaults, honest copy",
									p: "We look at your own product and your own marketing. Loud growth tactics are a signal we're not aligned.",
								},
								{
									h: "Named contact on both sides",
									p: "Partnerships are human. We want a person, not a ticket queue. You'll get the same from us.",
								},
								{
									h: "Willingness to deprecate together",
									p: "Integrations change. We commit to telling you 60 days before any breaking change; we expect the same.",
								},
							].map((x) => (
								<li
									key={x.h}
									className="pl-6 border-l-2 border-border-strong/60"
								>
									<p className="font-display text-[20px] leading-[1.2] tracking-[-0.005em] text-ink">
										{x.h}
									</p>
									<p className="mt-2 text-[14.5px] text-ink/70 leading-[1.6]">
										{x.p}
									</p>
								</li>
							))}
						</ul>
					</div>
				</section>
			</section>

			{/* ─── APPLY ──────────────────────────────────────────────────── */}
			<section className="bg-ink relative">
				<div
					aria-hidden
					className="absolute inset-0 opacity-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<section
					id="apply"
					className="py-24 lg:py-32 pb-32 lg:pb-40 wavy bg-background-elev"
				>
					<div className="max-w-[1000px] mx-auto px-6 lg:px-10">
						<div className="mb-10 text-center">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Apply
							</p>
							<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
								Tell us who you are.
								<br />
								<span className="text-primary">A real human replies.</span>
							</h2>
						</div>

						<form
							action="#"
							method="post"
							className="p-8 lg:p-10 rounded-3xl bg-background border border-border space-y-6"
						>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
								<div>
									<label className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-2">
										Your company
									</label>
									<input
										type="text"
										required
										className="w-full h-12 px-4 rounded-xl bg-background-elev border border-border-strong text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
									/>
								</div>
								<div>
									<label className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-2">
										Contact email
									</label>
									<input
										type="email"
										required
										className="w-full h-12 px-4 rounded-xl bg-background-elev border border-border-strong text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
									/>
								</div>
								<div>
									<label className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-2">
										Partner type
									</label>
									<select
										required
										className="w-full h-12 px-4 rounded-xl bg-background-elev border border-border-strong text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
									>
										<option>Agency</option>
										<option>Integration</option>
										<option>Solution partner</option>
									</select>
								</div>
								<div>
									<label className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-2">
										Website
									</label>
									<input
										type="url"
										required
										placeholder="https://..."
										className="w-full h-12 px-4 rounded-xl bg-background-elev border border-border-strong text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
									/>
								</div>
							</div>

							<div>
								<label className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-2">
									What you'd build, run, or ship together
								</label>
								<textarea
									required
									rows={4}
									placeholder="A paragraph. Specifics beat pitch decks."
									className="w-full px-4 py-3 rounded-xl bg-background-elev border border-border-strong text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none"
								/>
							</div>

							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
								<p className="text-[12px] text-ink/60">
									Reviewed within three business days. We read every
									application.
								</p>
								<button
									type="submit"
									className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-ink text-background font-medium text-[14px] hover:bg-primary transition-colors"
								>
									Send application
									<ArrowRight className="w-4 h-4" />
								</button>
							</div>
						</form>
					</div>
				</section>
			</section>

			{/* ─── FINAL CTA ───────────────────────────────────────────────── */}
			<section className="relative overflow-hidden bg-ink wavy text-background-elev">
				<div
					aria-hidden
					className="absolute inset-0 opacity-10 -z-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<div className="max-w-[1180px] mx-auto px-6 lg:px-10 py-20 lg:py-28 pb-32 lg:pb-40">
					<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 items-end">
						<div className="col-span-12 lg:col-span-8">
							<h2 className="font-display text-[36px] sm:text-[48px] lg:text-[64px] leading-none tracking-[-0.02em]">
								Solo creator?
								<br />
								<span className="text-peach-300">
									Check the affiliate programme instead.
								</span>
							</h2>
						</div>
						<div className="col-span-12 lg:col-span-4 flex flex-col gap-4 lg:items-end">
							<Link
								href={routes.connect.affiliate}
								className="inline-flex items-center gap-2 h-14 px-7 rounded-full text-background font-medium text-[15px] bg-primary transition-colors"
							>
								<Sparkle className="w-4 h-4" />
								See affiliate
							</Link>
							<a
								href="mailto:partners@aloha.social"
								className="pencil-link inline-flex items-center gap-2 text-[14.5px] font-medium"
							>
								Or write us
								<ArrowUpRight className="w-4 h-4" />
							</a>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
