import { routes } from "@/lib/routes";
import { makeMetadata } from "@/lib/seo";
import {
	ArrowRight,
	ArrowUpRight,
	Clock,
	FileText,
	Mail,
	Rss,
} from "lucide-react";
import Link from "next/link";

export const metadata = makeMetadata({
	title: "Newsletter — one email on Fridays, no upsell",
	description:
		"A weekly note from the Aloha team. What we shipped, what we didn't, what we're reading. No push, no drip sequence, one unsubscribe link.",
	path: routes.connect.newsletter,
});

const ISSUES = [
	{
		n: "42",
		date: "Apr 10, 2026",
		title: "On closing the tab",
		lead: "Why the default in a good tool is 'you're done' — and the five places we broke that rule by accident.",
		read: "7 min",
		tone: "bg-peach-100",
	},
	{
		n: "41",
		date: "Apr 3, 2026",
		title: "The seventh telling",
		lead: "Launches are 20% building, 80% caring enough to tell people the seventh time.",
		read: "6 min",
		tone: "bg-peach-200",
	},
	{
		n: "40",
		date: "Mar 27, 2026",
		title: "Voice models and the ghostwriter problem",
		lead: "Training on your 12 best posts vs your last 1,200 — what changes, and why the small set wins.",
		read: "9 min",
		tone: "bg-primary-soft",
	},
	{
		n: "39",
		date: "Mar 20, 2026",
		title: "Defaults are political",
		lead: "The choice of what happens if a user does nothing is where a tool tells the truth about what it cares about.",
		read: "5 min",
		tone: "bg-peach-100",
	},
	{
		n: "38",
		date: "Mar 13, 2026",
		title: "The export button is the feature",
		lead: "Offramp and onramp should be the same size. Why we build for the day you leave.",
		read: "8 min",
		tone: "bg-peach-300",
	},
	{
		n: "37",
		date: "Mar 6, 2026",
		title: "Calendar ghost-slots",
		lead: "On the quiet choreography of letting a tool name the gaps for you, instead of filling them.",
		read: "6 min",
		tone: "bg-primary-soft",
	},
];

export default function NewsletterPage() {
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
				<span
					aria-hidden
					className="absolute top-[28%] right-[6%] font-display text-[38px] text-ink/15 rotate-18 select-none"
				>
					※
				</span>
			</header>

			<section className="bg-peach-200 wavy">
				<div className="relative max-w-[1180px] mx-auto px-6 lg:px-10 pt-20 lg:pt-28 pb-32 lg:pb-40">
					<div className="inline-flex items-center gap-2 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
						Newsletter
					</div>
					<h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[96px]">
						One email
						<br />
						<span className="text-primary font-light">on Fridays.</span>
					</h1>
					<p className="mt-8 max-w-2xl text-[17px] lg:text-[18px] leading-[1.6] text-ink/75">
						What we shipped, what we didn't, what we're reading. Written by the
						team, not a marketer. Zero push notifications come bundled. One
						unsubscribe link in every issue.
					</p>

					{/* subscribe form */}
					<form
						action="#"
						method="post"
						className="mt-12 flex flex-col sm:flex-row gap-3 max-w-xl"
					>
						<div className="relative flex-1">
							<Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-ink/45" />
							<input
								type="email"
								name="email"
								required
								placeholder="you@wherever.works"
								className="w-full h-14 pl-11 pr-5 rounded-full bg-background-elev border border-border-strong text-[15px] text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
							/>
						</div>
						<button
							type="submit"
							className="inline-flex items-center justify-center gap-2 h-14 px-7 rounded-full bg-ink text-background font-medium text-[15px] hover:bg-primary transition-colors"
						>
							Subscribe
							<ArrowRight className="w-4 h-4" />
						</button>
					</form>
					<p className="mt-4 text-[12.5px] text-ink/55 max-w-xl">
						Free forever. One click to unsubscribe. By joining you accept the{" "}
						<Link
							href={routes.legal.privacy}
							className="pencil-link text-ink/70"
						>
							privacy policy
						</Link>
						.
					</p>

					<div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px] text-ink/60">
						<span className="inline-flex items-center gap-2">
							<Clock className="w-3.5 h-3.5 text-primary" />
							Every Friday, 9am Lisbon
						</span>
						<span className="text-ink/25">·</span>
						<span>28,402 readers, most of them quiet</span>
						<span className="text-ink/25">·</span>
						<a
							href="/rss.xml"
							className="pencil-link inline-flex items-center gap-1.5"
						>
							<Rss className="w-3 h-3" />
							RSS
						</a>
					</div>
				</div>
			</section>

			{/* ─── WHAT YOU'LL GET ─────────────────────────────────────────── */}
			<section className="bg-background-elev">
				<section className="py-24 lg:py-32 pb-32 lg:pb-40 wavy bg-background">
					<div className="max-w-[1100px] mx-auto px-6 lg:px-10">
						<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 mb-14 items-end">
							<div className="col-span-12 lg:col-span-7">
								<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
									What you'll get
								</p>
								<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
									Three things,
									<br />
									<span className="text-primary">every Friday.</span>
								</h2>
							</div>
							<p className="col-span-12 lg:col-span-5 text-[15.5px] text-ink/70 leading-[1.55]">
								No drip sequence. No welcome-email-series-of-five. One issue a
								week, consistently, for as long as you let us.
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
							{[
								{
									h: "A short essay",
									p: "600–1200 words on something we've been thinking about — product craft, creator economy, the quiet shape of good tools.",
									tone: "bg-peach-100",
								},
								{
									h: "What shipped",
									p: "Two or three sentences on what went live that week. If nothing did, we'll say so plainly.",
									tone: "bg-peach-200",
								},
								{
									h: "A link trail",
									p: "Five things we read that earned the link. No newsletter-swap, no affiliate, just the good stuff.",
									tone: "bg-primary-soft",
								},
							].map((f) => (
								<article
									key={f.h}
									className={`p-8 rounded-3xl ${f.tone} flex flex-col min-h-[220px]`}
								>
									<FileText className="w-6 h-6 text-ink" />
									<h3 className="mt-6 font-display text-[22px] leading-[1.2] tracking-[-0.005em]">
										{f.h}
									</h3>
									<p className="mt-3 text-[14px] text-ink/75 leading-[1.6]">
										{f.p}
									</p>
								</article>
							))}
						</div>
					</div>
				</section>
			</section>

			{/* ─── ARCHIVE ────────────────────────────────────────────────── */}
			<section className="py-24 lg:py-32 bg-background-elev wavy">
				<div className="max-w-[1100px] mx-auto px-6 lg:px-10 pb-8 lg:pb-12">
					<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 mb-12 items-end">
						<div className="col-span-12 lg:col-span-7">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Recent issues
							</p>
							<h2 className="font-display text-[36px] lg:text-[48px] leading-[1.02] tracking-[-0.02em]">
								The archive,
								<span className="text-primary"> open.</span>
							</h2>
						</div>
						<p className="col-span-12 lg:col-span-5 text-[15.5px] text-ink/70 leading-[1.55]">
							Everything we've ever sent lives here. Read a few before you
							subscribe.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
						{ISSUES.map((i) => (
							<Link
								key={i.n}
								href={`${routes.connect.newsletter}/issue-${i.n}`}
								className={`group block p-7 lg:p-8 rounded-3xl ${i.tone} hover:-translate-y-1 transition-transform`}
							>
								<div className="flex items-center justify-between text-[11px] font-mono text-ink/60 uppercase tracking-[0.2em]">
									<span>Issue {i.n}</span>
									<span>{i.date}</span>
								</div>
								<h3 className="mt-6 font-display text-[24px] lg:text-[28px] leading-[1.15] tracking-[-0.01em] text-ink">
									{i.title}
								</h3>
								<p className="mt-3 text-[14px] text-ink/75 leading-[1.6]">
									{i.lead}
								</p>
								<div className="mt-6 flex items-center justify-between text-[12.5px]">
									<span className="inline-flex items-center gap-1.5 text-ink/60 font-mono">
										<Clock className="w-3 h-3" />
										{i.read} read
									</span>
									<ArrowUpRight className="w-4 h-4 text-ink/40 group-hover:text-primary transition-colors" />
								</div>
							</Link>
						))}
					</div>

					<div className="mt-10 text-[13.5px] text-ink/60">
						<Link
							href="#"
							className="pencil-link inline-flex items-center gap-2"
						>
							Load older issues
							<ArrowRight className="w-3.5 h-3.5" />
						</Link>
					</div>
				</div>
			</section>

			{/* ─── FROM THE TEAM ───────────────────────────────────────────── */}
			<section className="bg-ink relative">
				<div
					aria-hidden
					className="absolute inset-0 opacity-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<section className="py-24 lg:py-32 pb-32 lg:pb-40 wavy bg-background">
					<div className="max-w-[1100px] mx-auto px-6 lg:px-10">
						<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-16 items-center">
							<div className="col-span-12 lg:col-span-5">
								<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
									Who writes it
								</p>
								<h2 className="font-display text-[36px] lg:text-[48px] leading-[1.02] tracking-[-0.02em]">
									The team,
									<br />
									<span className="text-primary">in turn.</span>
								</h2>
								<p className="mt-6 text-[15.5px] text-ink/75 leading-[1.6] max-w-md">
									Six of us, rotating weekly. Aarohi on product craft. Kashyap
									on engineering. Jonas on design. Leilani on community. Vikram
									on platform. Sofia on operations.
								</p>

								<Link
									href={routes.company.about}
									className="mt-8 pencil-link inline-flex items-center gap-2 text-[14.5px] font-medium text-ink"
								>
									About the team
									<ArrowUpRight className="w-4 h-4" />
								</Link>
							</div>

							<div className="col-span-12 lg:col-span-7">
								<ul className="grid grid-cols-2 gap-4">
									{[
										{
											ini: "A",
											n: "Aarohi",
											role: "Product",
											tone: "bg-peach-200",
										},
										{
											ini: "K",
											n: "Kashyap",
											role: "Engineering",
											tone: "bg-primary-soft",
										},
										{
											ini: "J",
											n: "Jonas",
											role: "Design",
											tone: "bg-peach-100",
										},
										{
											ini: "L",
											n: "Leilani",
											role: "Community",
											tone: "bg-peach-300",
										},
										{
											ini: "V",
											n: "Vikram",
											role: "Platform",
											tone: "bg-peach-100",
										},
										{
											ini: "S",
											n: "Sofia",
											role: "Ops",
											tone: "bg-primary-soft",
										},
									].map((a) => (
										<li
											key={a.n}
											className="p-4 rounded-2xl bg-background border border-border flex items-center gap-3"
										>
											<span
												className={`w-10 h-10 rounded-full ${a.tone} flex items-center justify-center font-display text-[16px] text-ink shrink-0`}
											>
												{a.ini}
											</span>
											<div>
												<p className="font-medium text-[14px] text-ink">
													{a.n}
												</p>
												<p className="text-[12px] text-ink/55 font-mono uppercase tracking-[0.14em]">
													{a.role}
												</p>
											</div>
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
					className="absolute inset-0 opacity-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-20 lg:py-28 pb-32 lg:pb-40">
					<div className="p-10 lg:p-14 rounded-3xl bg-ink text-background-elev">
						<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-peach-200 mb-5">
							In 10 seconds
						</p>
						<p className="font-display text-[32px] lg:text-[44px] leading-[1.1] tracking-[-0.015em] max-w-3xl">
							One email a week. No push. No drip. One unsubscribe link. Start
							reading;{" "}
							<span className="text-peach-300">stay as long as it earns.</span>
						</p>
						<form
							action="#"
							method="post"
							className="mt-10 flex flex-col sm:flex-row gap-3 max-w-xl"
						>
							<input
								type="email"
								required
								placeholder="you@wherever.works"
								className="w-full h-12 px-5 rounded-full bg-background-elev/10 border border-peach-200/20 text-[14px] text-background-elev placeholder:text-background-elev/40 focus:outline-none focus:border-peach-300"
							/>
							<button
								type="submit"
								className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-peach-300 text-ink font-medium text-[14px] hover:bg-peach-400 transition-colors shrink-0"
							>
								Subscribe
								<ArrowRight className="w-4 h-4" />
							</button>
						</form>
					</div>
				</div>
			</section>
		</>
	);
}
