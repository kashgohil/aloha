import { routes } from "@/lib/routes";
import { makeMetadata } from "@/lib/seo";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { EarningsCalculator } from "./earnings-calculator";

export const metadata = makeMetadata({
	title: "Affiliate — 30% of the first year, paid quarterly",
	description:
		"Aloha's affiliate programme. 30% of every paying referral's first year, paid quarterly in USD. No cap, no tier gymnastics, one-pager terms.",
	path: routes.connect.affiliate,
});

const STEPS = [
	{
		h: "Apply",
		p: "One form, 60 seconds. We review within a business day; almost every creator-sized application is approved.",
	},
	{
		h: "Share your link",
		p: "A unique short URL per referral source — newsletter, podcast, YouTube description, a specific post. Use as many as you like.",
	},
	{
		h: "Get paid",
		p: "Commission accrues from day one. Paid quarterly in USD via Stripe or PayPal — your choice.",
	},
];

const FAQ = [
	{
		q: "What's the commission?",
		a: "30% of every paying referral's first 12 months, paid quarterly. No tiers, no bonus structure, no 'silver / gold / platinum' gamification.",
	},
	{
		q: "How do you pay?",
		a: "Stripe Connect or PayPal, your choice at enrollment. Minimum payout $50; anything under rolls to the next quarter.",
	},
	{
		q: "What happens if someone cancels?",
		a: "Commission clawback for the first 60 days only. After that, if they leave we still honour what accrued — we don't back-charge you for churn that isn't your fault.",
	},
	{
		q: "Do you allow paid ads / SEO farming?",
		a: "No paid ads on our own branded keywords. No cloaked affiliate funnels. No AI-written coupon sites. Good-faith content — newsletters, reviews, podcasts, genuine comparisons — is what we want.",
	},
	{
		q: "What about Free-plan referrals?",
		a: "They don't pay commission (we don't monetise them), but they count toward your lifetime referral count and unlock things like an Agency-plan trial extension.",
	},
	{
		q: "How long does the cookie last?",
		a: "90 days, first-click. Reset on re-click with attribution going to whoever's link was last — we think that's the most honest default.",
	},
];

export default function AffiliatePage() {
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
								Affiliate programme
							</div>
							<h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[92px]">
								30% of the
								<br />
								<span className="text-primary font-light">first year.</span>
							</h1>
							<p className="mt-8 max-w-2xl text-[17px] lg:text-[18px] leading-[1.6] text-ink/75">
								Paid quarterly, in USD. No tiers, no bonus structure, no
								gold-silver-platinum gamification. The commission rate on the
								front page is the commission rate.
							</p>

							<div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
								<a
									href="#apply"
									className="inline-flex items-center gap-2 h-14 px-7 rounded-full bg-primary text-primary-foreground font-medium text-[15px] shadow-[0_8px_0_-2px_rgba(46,42,133,0.35)] hover:shadow-[0_10px_0_-2px_rgba(46,42,133,0.4)] hover:-translate-y-0.5 transition-all"
								>
									Apply
									<ArrowRight className="w-4 h-4" />
								</a>
								<a
									href="#calculator"
									className="pencil-link inline-flex items-center gap-2 text-[15px] font-medium text-ink"
								>
									Do the math first
									<ArrowUpRight className="w-4 h-4" />
								</a>
							</div>
						</div>

						<div className="col-span-12 lg:col-span-5">
							<div className="grid grid-cols-2 gap-4">
								{[
									{ v: "30%", l: "of first year" },
									{ v: "90d", l: "cookie · first-click" },
									{ v: "$50", l: "minimum payout" },
									{ v: "60d", l: "clawback window" },
								].map((s) => (
									<div
										key={s.l}
										className="p-5 rounded-2xl bg-background-elev border border-border"
									>
										<p className="font-display text-[32px] leading-none tracking-[-0.02em]">
											{s.v}
										</p>
										<p className="mt-2 text-[11px] font-mono uppercase tracking-[0.18em] text-ink/55">
											{s.l}
										</p>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ─── CALCULATOR ──────────────────────────────────────────────── */}
			<section className="bg-background-elev">
				<section
					id="calculator"
					className="py-24 lg:py-32 pb-32 lg:pb-40 wavy bg-background"
				>
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-16 items-start">
						<div className="col-span-12 lg:col-span-5">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Earnings calculator
							</p>
							<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
								The math,
								<br />
								<span className="text-primary">on a slider.</span>
							</h2>
							<p className="mt-6 text-[16px] text-ink/75 leading-[1.6] max-w-md">
								How much you'd earn is a function of how many paid referrals a
								month and which plan they land on. Drag the sliders. Numbers
								update live.
							</p>

							<p className="mt-8 text-[13.5px] text-ink/60 leading-[1.55] max-w-md">
								Example references: a 24K-sub newsletter typically lands 4–10
								paid referrals a month at our conversion. A mid-sized podcast
								lands 6–15. Agencies who resell lean on the Agency plan.
							</p>
						</div>

						<div className="col-span-12 lg:col-span-7">
							<EarningsCalculator />
						</div>
					</div>
				</section>
			</section>

			{/* ─── HOW IT WORKS ─────────────────────────────────────────── */}
			<section className="py-24 lg:py-32 bg-background-elev wavy">
				<div className="max-w-[1180px] mx-auto px-6 lg:px-10 pb-8 lg:pb-12">
					<div className="mb-14">
						<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
							How it works
						</p>
						<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
							Three steps.
							<br />
							<span className="text-primary">No onboarding call.</span>
						</h2>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
						{STEPS.map((s, i) => (
							<article
								key={s.h}
								className={`p-8 rounded-3xl ${i === 0 ? "bg-peach-100" : i === 1 ? "bg-peach-200" : "bg-primary-soft"} flex flex-col min-h-[220px]`}
							>
								<p className="font-display text-[40px] text-ink/30 leading-none">
									0{i + 1}
								</p>
								<h3 className="mt-6 font-display text-[24px] leading-[1.2] tracking-[-0.005em]">
									{s.h}
								</h3>
								<p className="mt-3 text-[14px] text-ink/75 leading-[1.6]">
									{s.p}
								</p>
							</article>
						))}
					</div>
				</div>
			</section>

			{/* ─── FAQ ────────────────────────────────────────────────────── */}
			<section className="bg-background-elev">
				<section className="py-24 lg:py-32 pb-32 lg:pb-40 wavy bg-background">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
						<div className="mb-14">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								FAQ
							</p>
							<h2 className="font-display text-[36px] lg:text-[48px] leading-[1.02] tracking-[-0.02em]">
								The questions
								<span className="text-primary"> we actually get.</span>
							</h2>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
							{FAQ.map((f) => (
								<article
									key={f.q}
									className="p-7 lg:p-8 rounded-3xl bg-background border border-border"
								>
									<h3 className="font-display text-[20px] leading-[1.2] tracking-[-0.005em] text-ink">
										{f.q}
									</h3>
									<p className="mt-3 text-[14px] text-ink/75 leading-[1.65]">
										{f.a}
									</p>
								</article>
							))}
						</div>

						<p className="mt-10 text-[13.5px] text-ink/60 max-w-2xl">
							Full affiliate agreement:{" "}
							<Link href="/legal/affiliate" className="pencil-link text-ink">
								legal/affiliate
							</Link>
							. One page. Questions:{" "}
							<a
								href="mailto:affiliate@usealoha.app"
								className="pencil-link text-ink"
							>
								affiliate@usealoha.app
							</a>
							.
						</p>
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
								One form.
								<span className="text-primary"> One page.</span>
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
										Your name
									</label>
									<input
										type="text"
										required
										className="w-full h-12 px-4 rounded-xl bg-background-elev border border-border-strong text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
									/>
								</div>
								<div>
									<label className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-2">
										Email
									</label>
									<input
										type="email"
										required
										className="w-full h-12 px-4 rounded-xl bg-background-elev border border-border-strong text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
									/>
								</div>
								<div>
									<label className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-2">
										Primary channel
									</label>
									<input
										type="url"
										placeholder="https://..."
										required
										className="w-full h-12 px-4 rounded-xl bg-background-elev border border-border-strong text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
									/>
								</div>
								<div>
									<label className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-2">
										Audience size
									</label>
									<input
										type="text"
										placeholder="e.g. 12K newsletter subs"
										className="w-full h-12 px-4 rounded-xl bg-background-elev border border-border-strong text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
									/>
								</div>
							</div>

							<div>
								<label className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-2">
									What you'd write / say / make about Aloha
								</label>
								<textarea
									required
									rows={4}
									placeholder="A short paragraph. We read every one — we care more about angle than volume."
									className="w-full px-4 py-3 rounded-xl bg-background-elev border border-border-strong text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none"
								/>
							</div>

							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
								<p className="text-[12px] text-ink/60">
									Reviewed in one business day. By applying, you agree to the{" "}
									<Link
										href="/legal/affiliate"
										className="pencil-link text-ink/70"
									>
										affiliate terms
									</Link>
									.
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

			{/* ─── NOT FOR YOU CTA ─────────────────────────────────────────── */}
			<section className="relative overflow-hidden bg-ink wavy text-background-elev">
				<div
					aria-hidden
					className="absolute inset-0 top-2.5! opacity-10 -z-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<div className="max-w-[1180px] mx-auto px-6 lg:px-10 py-20 lg:py-28 pb-32 lg:pb-40">
					<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 items-end">
						<div className="col-span-12 lg:col-span-8">
							<h2 className="font-display text-[36px] sm:text-[48px] lg:text-[64px] leading-none tracking-[-0.02em]">
								Not the right fit?
								<br />
								<span className="text-peach-300">
									The partner programme might be.
								</span>
							</h2>
						</div>
						<div className="col-span-12 lg:col-span-4 flex flex-col gap-4 lg:items-end">
							<Link
								href={routes.connect.partners}
								className="inline-flex items-center gap-2 h-14 px-7 rounded-full text-background font-medium text-[15px] bg-primary transition-colors"
							>
								See partner tiers
								<ArrowRight className="w-4 h-4" />
							</Link>
							<a
								href="mailto:affiliate@usealoha.app"
								className="pencil-link inline-flex items-center gap-2 text-[14.5px] font-medium"
							>
								Or ask a question
								<ArrowUpRight className="w-4 h-4" />
							</a>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
