import { CASE_STUDIES } from "@/lib/case-studies";
import { PERSONAS } from "@/lib/personas";
import { routes } from "@/lib/routes";
import { makeMetadata } from "@/lib/seo";
import { ArrowRight, ArrowUpRight, Clock } from "lucide-react";
import Link from "next/link";

export const metadata = makeMetadata({
	title: "Customers — the stories behind the product",
	description:
		"Case studies from Aloha customers. Solopreneurs, in-house teams, and agencies — each one a concrete before-and-after, not a quote on a billboard.",
	path: routes.customers.caseStudies,
});

export default function CustomersIndexPage() {
	const studies = Object.values(CASE_STUDIES);
	const [featured, ...rest] = studies;

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

			<section className="bg-primary-soft">
				<section className="bg-peach-200 wavy">
					<div className="relative max-w-[1180px] mx-auto px-6 lg:px-10 pt-20 lg:pt-28 pb-32 lg:pb-40">
						<div className="inline-flex items-center gap-2 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
							Customer stories
						</div>
						<h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[96px]">
							The stories
							<br />
							<span className="text-primary font-light">
								behind the product.
							</span>
						</h1>
						<p className="mt-8 max-w-2xl text-[17px] lg:text-[18px] leading-[1.6] text-ink/75">
							Not quotes on a billboard — concrete before-and-afters.
							Solopreneurs, in-house teams, and agencies, with the numbers and
							the workflow shifts that make those numbers possible.
						</p>
					</div>
				</section>
			</section>

			{/* ─── FEATURED STUDY ──────────────────────────────────────────── */}

			<section className="py-16 lg:py-20 bg-primary-soft wavy">
				<div className="max-w-[1180px] mx-auto px-6 lg:px-10 pb-8 lg:pb-12">
					<article
						className={`relative ${featured.accent} rounded-3xl p-10 lg:p-14 overflow-hidden`}
					>
						<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 items-end">
							<div className="col-span-12 lg:col-span-8">
								<div className="flex items-center gap-3 text-[10.5px] font-mono uppercase tracking-[0.22em] text-ink/55 mb-6">
									<span>Featured · {featured.customer.business}</span>
									<span className="text-ink/25">·</span>
									<span>{featured.publishedLabel}</span>
								</div>
								<p className="font-display text-[32px] lg:text-[44px] leading-[1.15] tracking-[-0.01em] text-ink max-w-2xl">
									{featured.pull}
								</p>
								<p className="mt-6 text-[16px] lg:text-[17px] leading-[1.6] text-ink/75 max-w-xl">
									{featured.summary}
								</p>
								<Link
									href={`/customers/${featured.slug}`}
									className="mt-8 inline-flex items-center gap-2 h-12 px-6 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
								>
									Read the story
									<ArrowRight className="w-4 h-4" />
								</Link>
							</div>

							<div className="col-span-12 lg:col-span-4 grid grid-cols-3 lg:grid-cols-1 gap-4">
								{featured.metrics.map((m) => (
									<div
										key={m.label}
										className="p-5 rounded-2xl bg-background-elev/70 border border-ink/10"
									>
										<p className="font-display text-[26px] lg:text-[32px] leading-none tracking-[-0.02em]">
											{m.value}
										</p>
										<p className="mt-2 text-[11px] font-mono uppercase tracking-[0.14em] text-ink/60">
											{m.label}
										</p>
									</div>
								))}
							</div>
						</div>
					</article>
				</div>
			</section>

			{/* ─── LIST ───────────────────────────────────────────────────── */}
			<section className="bg-background-elev">
				<section className="py-20 lg:py-24 wavy bg-background pb-32 lg:pb-40">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
						<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 mb-12 items-end">
							<div className="col-span-12 lg:col-span-7">
								<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
									More stories
								</p>
								<h2 className="font-display text-[36px] lg:text-[48px] leading-[1.02] tracking-[-0.02em]">
									Read by persona,
									<br />
									<span className="text-primary">or by number.</span>
								</h2>
							</div>
							<p className="col-span-12 lg:col-span-5 text-[15.5px] text-ink/70 leading-[1.55]">
								New studies every few weeks. Pitch your own story to{" "}
								<a
									href="mailto:stories@aloha.social"
									className="pencil-link text-ink"
								>
									stories@aloha.social
								</a>{" "}
								— we're specifically looking for teams and agencies.
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
							{rest.map((s) => {
								const persona = PERSONAS[s.personaSlug];
								return (
									<Link
										key={s.slug}
										href={`/customers/${s.slug}`}
										className={`group relative ${s.accent} rounded-3xl p-8 lg:p-10 flex flex-col hover:-translate-y-1 transition-transform min-h-[340px]`}
									>
										<div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.2em] text-ink/55">
											<span>{s.customer.business}</span>
											<span className="flex items-center gap-1.5">
												<Clock className="w-3 h-3" />
												{s.readTime}
											</span>
										</div>

										<p className="mt-8 font-display text-[24px] lg:text-[28px] leading-[1.2] tracking-[-0.01em] text-ink">
											{s.pull}
										</p>
										<p className="mt-4 text-[14px] text-ink/70 leading-[1.55]">
											{s.summary}
										</p>

										<div className="mt-auto pt-6 flex items-center justify-between">
											<span className="inline-flex items-center gap-2 text-[12px] text-ink/60">
												{persona && (
													<span className="font-medium text-ink/70">
														For {persona.name.toLowerCase()}
													</span>
												)}
											</span>
											<ArrowUpRight className="w-5 h-5 text-ink/40 group-hover:text-primary transition-colors" />
										</div>
									</Link>
								);
							})}
						</div>
					</div>
				</section>
			</section>

			{/* ─── SECONDARY NAV ──────────────────────────────────────────── */}
			<section className="bg-ink relative">
				<div
					aria-hidden
					className="absolute inset-0 opacity-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<section className="py-20 lg:py-24 wavy bg-background-elev pb-32 lg:pb-40">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
						<div className="mb-10">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Other kinds of stories
							</p>
							<h2 className="font-display text-[32px] lg:text-[44px] leading-[1.02] tracking-[-0.02em]">
								Case studies aren't
								<span className="text-primary"> the only format.</span>
							</h2>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
							{[
								{
									h: "Creator spotlights",
									p: "Lighter Q&A with creators whose voice moves us. Three-question format, their best three posts, no sales pitch.",
									href: routes.customers.creatorSpotlight,
									tone: "bg-peach-200",
									cta: "Read spotlights",
								},
								{
									h: "Community stories",
									p: "What members are sharing in Slack and at events. Less edited, more candid.",
									href: routes.customers.community,
									tone: "bg-primary-soft",
									cta: "Visit /community",
								},
								{
									h: "Events archive",
									p: "Recordings and notes from AMAs, guest sessions, and the quarterly field-note readings.",
									href: routes.customers.events,
									tone: "bg-peach-100",
									cta: "Browse events",
								},
							].map((c) => (
								<Link
									key={c.h}
									href={c.href}
									className={`group p-8 rounded-3xl ${c.tone} flex flex-col hover:-translate-y-1 transition-transform min-h-[240px]`}
								>
									<h3 className="font-display text-[24px] leading-[1.15] tracking-[-0.01em]">
										{c.h}
									</h3>
									<p className="mt-3 text-[14px] text-ink/75 leading-[1.6]">
										{c.p}
									</p>
									<span className="mt-auto pt-6 pencil-link text-[13px] text-ink font-medium inline-flex items-center gap-2">
										{c.cta}
										<ArrowUpRight className="w-3.5 h-3.5" />
									</span>
								</Link>
							))}
						</div>
					</div>
				</section>
			</section>

			{/* ─── FINAL CTA ──────────────────────────────────────────────── */}
			<section className="relative overflow-hidden bg-ink wavy text-background-elev">
				<div
					aria-hidden
					className="absolute inset-0 opacity-10 -z-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<div className="max-w-[1180px] mx-auto px-6 lg:px-10 py-20 lg:py-28 pb-32 lg:pb-40">
					<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 items-end">
						<div className="col-span-12 lg:col-span-8">
							<h2 className="font-display text-[40px] sm:text-[52px] lg:text-[72px] leading-[0.98] tracking-[-0.025em]">
								Your story,
								<br />
								<span className="text-peach-300">next.</span>
							</h2>
							<p className="mt-6 text-[15.5px] max-w-lg leading-[1.55]">
								If you're using Aloha in an interesting way, we'd love to write
								about it. Low-pressure — we do all the drafting; you veto
								anything you don't want in print.
							</p>
						</div>
						<div className="col-span-12 lg:col-span-4 flex flex-col gap-4 lg:items-end">
							<a
								href="mailto:stories@aloha.social"
								className="inline-flex items-center gap-2 h-14 px-7 rounded-full text-background font-medium text-[15px] bg-primary transition-colors"
							>
								Pitch a story
								<ArrowRight className="w-4 h-4" />
							</a>
							<Link
								href={routes.signin}
								className="pencil-link inline-flex items-center gap-2 text-[14.5px] font-medium"
							>
								Not a customer yet? Start free
								<ArrowUpRight className="w-4 h-4" />
							</Link>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
