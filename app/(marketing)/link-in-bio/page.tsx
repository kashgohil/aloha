import { routes } from "@/lib/routes";
import { makeMetadata } from "@/lib/seo";
import { ArrowRight, ArrowUpRight, Check, Palette, Users } from "lucide-react";
import Link from "next/link";
import { FeatureDetails } from "../_components/feature-details";
import { ScreenshotPlaceholder } from "../_components/screenshot-placeholder";

export const metadata = makeMetadata({
	title: "Link-in-bio — a page that feels like the rest of your work",
	description:
		"Aloha's link-in-bio gives you a custom page for every platform, with links, lead capture, and the same warm voice — not a stock template.",
	path: routes.product.linkInBio,
});

export default function LinkInBioPage() {
	return (
		<>
			{/* ─── HERO ────────────────────────────────────────────────────── */}
			<header className="relative overflow-hidden bg-peach-200">
				<span
					aria-hidden
					className="absolute top-[14%] left-[5%] font-display text-[28px] text-ink/25 rotate-[-8deg] select-none"
				>
					✳
				</span>
				<span
					aria-hidden
					className="absolute top-[68%] left-[11%] font-display text-[22px] text-primary/55 rotate-12 select-none"
				>
					+
				</span>
				<span
					aria-hidden
					className="absolute top-[22%] right-[8%] font-display text-[38px] text-ink/15 rotate-18 select-none"
				>
					※
				</span>
			</header>

			<section className="bg-peach-200 wavy">
				<div className="relative max-w-[1320px] w-full mx-auto px-6 lg:px-10 pt-20 lg:pt-28 pb-32 lg:pb-40 grid grid-cols-12 gap-x-0 gap-y-8 lg:gap-12 items-center">
					<div className="col-span-12 lg:col-span-7">
						<div className="inline-flex items-center gap-2 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
							Link-in-bio
						</div>

						<h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[92px]">
							A page that
							<br />
							<span className="text-primary font-light">feels like</span>
							<br />
							the rest of your work.
						</h1>

						<p className="mt-8 max-w-[520px] text-[17px] lg:text-[18px] leading-[1.55] text-ink/70">
							Most link-in-bio tools force you into a template that looks like
							everyone else's. Aloha hands you a warm, editable page that
							matches your voice — fonts, spacing, photography, the feel of it —
							and collects real leads while it's at it.
						</p>

						<div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
							<Link
								href={routes.signin}
								className="inline-flex items-center gap-2 h-14 px-7 rounded-full bg-primary text-primary-foreground font-medium text-[15px] shadow-[0_8px_0_-2px_rgba(46,42,133,0.35)] hover:shadow-[0_10px_0_-2px_rgba(46,42,133,0.4)] hover:-translate-y-0.5 transition-all"
							>
								Claim your page
								<ArrowRight className="w-4 h-4" />
							</Link>
							<a
								href="#design"
								className="pencil-link inline-flex items-center gap-2 text-[15px] font-medium text-ink"
							>
								See what it looks like
								<ArrowUpRight className="w-4 h-4" />
							</a>
						</div>

						<div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-[12.5px] text-ink/60">
							<span className="inline-flex items-center gap-2">
								<Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
								Custom domain, free forever
							</span>
							<span className="inline-flex items-center gap-2">
								<Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
								Subscriber capture built in
							</span>
							<span className="inline-flex items-center gap-2">
								<Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
								Per-link analytics
							</span>
						</div>
					</div>

					{/* Hero visual — phone mock */}
					<div className="col-span-12 lg:col-span-5 relative flex justify-center">
						<div className="relative animate-[float-soft_9s_ease-in-out_infinite]">
							{/* phone frame */}
							<div className="relative w-[280px] h-[560px] rounded-[44px] bg-ink p-2 shadow-[0_40px_80px_-30px_rgba(23,20,18,0.4)]">
								<div className="absolute top-6 left-1/2 -translate-x-1/2 w-24 h-6 rounded-full bg-ink z-10" />
								<div className="w-full h-full rounded-[36px] bg-peach-100 overflow-hidden relative">
									{/* grain */}
									<svg
										aria-hidden
										viewBox="0 0 200 400"
										className="absolute inset-0 w-full h-full opacity-[0.12] mix-blend-multiply"
									>
										<filter id="phone-grain">
											<feTurbulence
												type="fractalNoise"
												baseFrequency="0.9"
												numOctaves="2"
											/>
										</filter>
										<rect
											width="100%"
											height="100%"
											filter="url(#phone-grain)"
										/>
									</svg>
									{/* content */}
									<div className="absolute inset-0 pt-14 px-6 overflow-hidden">
										{/* avatar */}
										<div className="flex flex-col items-center">
											<div className="w-20 h-20 rounded-full bg-peach-300 border-2 border-ink/20 flex items-center justify-center">
												<span className="font-display text-[28px] text-ink">
													A
												</span>
											</div>
											<p className="mt-4 font-display text-[22px] leading-none tracking-[-0.01em] text-ink">
												Ainslee Dunn
											</p>
											<p className="mt-1 text-[11px] text-ink/60 font-mono">
												studio · brooklyn
											</p>
											<p className="mt-4 text-center text-[12px] text-ink/75 leading-normal max-w-[220px]">
												Slow design for people building small careful things.
											</p>
										</div>

										{/* links */}
										<div className="mt-6 space-y-2.5">
											{[
												"Read the field notes",
												"Book a studio hour",
												"Shop the print series",
												"Join the monthly letter",
											].map((l, i) => (
												<div
													key={l}
													className={`px-4 py-3 rounded-2xl text-[12.5px] font-medium text-ink border ${
														i === 0
															? "bg-ink text-peach-200 border-ink"
															: "bg-background-elev border-border-strong"
													} flex items-center justify-between`}
												>
													<span>{l}</span>
													<ArrowRight className="w-3 h-3" />
												</div>
											))}
										</div>
									</div>

									{/* soft bottom fade */}
									<div className="absolute bottom-0 left-0 right-0 h-16 bg-linear-to-t from-peach-100 to-transparent" />
								</div>
							</div>

							{/* floating chip */}
							<div className="hidden sm:flex absolute -bottom-4 -right-8 lg:-right-14 items-center gap-2.5 bg-background-elev text-ink border border-border-strong rounded-full pl-3 pr-4 py-2 shadow-[0_14px_30px_-16px_rgba(23,20,18,0.35)] rotate-[4deg]">
								<Users className="w-3.5 h-3.5 text-primary" />
								<span className="text-[11.5px] font-medium">+38 new subs</span>
								<span className="text-[11px] text-ink/50 font-mono">
									· this week
								</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ─── FEATURE 1 · DESIGN ──────────────────────────────────────── */}
			<section className="bg-background-elev">
				<section
					id="design"
					className="py-24 lg:py-32 pb-32 lg:pb-40 bg-background wavy"
				>
					<div className="max-w-[1320px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-16 items-center">
						<div className="col-span-12 lg:col-span-6">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Your aesthetic, intact
							</p>
							<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
								Not a template.
								<br />
								<span className="text-primary">A room.</span>
							</h2>
							<p className="mt-6 text-[16px] lg:text-[17px] text-ink/75 leading-[1.6] max-w-lg">
								Start from one of five shapes — editorial, portfolio, shop,
								newsletter, directory — then edit everything. Fonts, colours,
								link-cap shapes, headline weight, spacing. It's yours; we don't
								brand-stamp the footer.
							</p>

							<ul className="mt-8 space-y-3 text-[14.5px] text-ink/85">
								{[
									"Five starting shapes, all fully editable.",
									"Custom domain (yours.com/links) at no extra cost.",
									"No Aloha watermark, ever. Even on Free.",
								].map((f) => (
									<li key={f} className="flex items-start gap-3">
										<Check
											className="w-4 h-4 mt-[3px] text-primary shrink-0"
											strokeWidth={2.5}
										/>
										{f}
									</li>
								))}
							</ul>
						</div>

						<div className="col-span-12 lg:col-span-6">
							<ScreenshotPlaceholder
								id="design"
								label="Design panel — type scale, colour, and link-cap shape controls."
								notes="Coming soon. In-app design editor isn't shipped yet; placeholder stays illustrative until the custom-theming UI lands."
								aspect="aspect-[16/10]"
								tone="bg-peach-100"
								comingSoon
							/>
						</div>
					</div>
				</section>
			</section>

			{/* ─── FEATURE 2 · CAPTURE ─────────────────────────────────────── */}
			<section className="py-24 lg:py-32 bg-background-elev wavy pb-32 lg:pb-40">
				<div className="max-w-[1320px] mx-auto px-6 lg:px-10">
					<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 mb-14">
						<div className="col-span-12 lg:col-span-6">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Subscriber capture
							</p>
							<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
								Turn the visit
								<br />
								<span className="text-primary">into a relationship.</span>
							</h2>
						</div>
						<p className="col-span-12 lg:col-span-5 lg:col-start-8 text-[16px] text-ink/70 leading-[1.6] self-end">
							Every Aloha page can collect emails natively — no Mailchimp embed,
							no janky redirect. Tags apply automatically from the link that
							sourced them, so you know who came in from your newsletter vs.
							your portfolio.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						{[
							{
								h: "Inline forms",
								p: "Drop a subscribe form between links. Set a tag, set a welcome email, done.",
								tone: "bg-peach-200",
							},
							{
								h: "Source tags",
								p: "Every new subscriber is tagged with the link that sourced them — portfolio, newsletter, podcast.",
								tone: "bg-primary-soft",
							},
							{
								h: "CRM you'll actually use",
								p: "Subscribers land in the Audience view with tags, notes and a one-click unsubscribe — built-in.",
								tone: "bg-peach-300",
							},
						].map((c) => (
							<div key={c.h} className={`p-8 rounded-3xl ${c.tone}`}>
								<p className="font-display text-[22px] leading-[1.2] tracking-[-0.01em]">
									{c.h}
								</p>
								<p className="mt-3 text-[14px] text-ink/75 leading-[1.55]">
									{c.p}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ─── FEATURE 3 · ANALYTICS ──────────────────────────────────── */}
			<section className="bg-peach-300">
				<section className="py-24 lg:py-32 pb-32 lg:pb-40 bg-background wavy">
					<div className="max-w-[1320px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-16 items-center">
						<div className="col-span-12 lg:col-span-6 order-2 lg:order-1">
							<ScreenshotPlaceholder
								id="link-analytics"
								label="Per-link analytics — clicks, sources, and the three links that earn their real estate."
								notes="Coming soon. Per-link click tracking + source breakdown isn't shipped yet; placeholder stays illustrative until it lands."
								aspect="aspect-[4/3]"
								tone="bg-primary-soft"
								comingSoon
							/>
						</div>

						<div className="col-span-12 lg:col-span-6 order-1 lg:order-2">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Per-link analytics
							</p>
							<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
								Which link
								<br />
								<span className="text-primary">earns its spot?</span>
							</h2>
							<p className="mt-6 text-[16px] lg:text-[17px] text-ink/75 leading-[1.6] max-w-lg">
								Each link shows you its clicks, its sources, and its conversion
								to subscribe. Reorder based on the data, retire links that
								stopped pulling weight, and stop relying on "where did that
								traffic come from" guesses.
							</p>

							<ul className="mt-8 space-y-3 text-[14.5px] text-ink/85">
								{[
									"Click-source breakdown (channel, geography, device).",
									"A/B test link copy or placement, without extra tooling.",
									"Export to CSV or pipe to your own warehouse via webhook.",
								].map((f) => (
									<li key={f} className="flex items-start gap-3">
										<Check
											className="w-4 h-4 mt-[3px] text-primary shrink-0"
											strokeWidth={2.5}
										/>
										{f}
									</li>
								))}
							</ul>
						</div>
					</div>
				</section>
			</section>

			{/* ─── FEATURE DETAILS ──────────────────────────────────────────── */}
			<section className="bg-ink relative">
				<div
					aria-hidden
					className="absolute inset-0 top-2! opacity-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<section className="py-24 lg:py-28 pb-32 lg:pb-40 bg-peach-300 wavy">
					<div className="max-w-[1320px] mx-auto px-6 lg:px-10">
						<FeatureDetails
							eyebrow="On your public page"
							heading={
								<>
									A page that reads
									<br />
									<span className="text-primary">
										like the rest of your work.
									</span>
								</>
							}
							intro="Live at aloha.sh/u/your-handle the day you sign up. Lightweight, fast, and nothing you have to design from scratch."
							details={[
								{
									title: "Live on day one",
									body: "Your profile at /u/your-handle exists the moment you verify your email. No theme picker, no empty state — it just works.",
								},
								{
									title: "Bio + channel links",
									body: "List every place you post in one tap-sized page. Order them the way you actually want strangers to find you.",
								},
								{
									title: "Pinned posts",
									body: "Surface the three pieces of work you'd want a visitor to read first. Swap them as the work changes.",
								},
								{
									title: "Newsletter capture",
									body: "Collect an email without sending readers to a second tool. Broadcasts ship from the same workspace.",
								},
								{
									title: "Honest unsubscribe",
									body: "Every send carries a one-click unsubscribe link. Trust travels; you'd rather lose a reader than a reputation.",
								},
								{
									title: "Fast by default",
									body: "No third-party widgets, no bloat, no cookie banners. The page looks like the rest of Aloha and loads like it too.",
								},
							]}
						/>
					</div>
				</section>
			</section>

			{/* ─── FINAL CTA ────────────────────────────────────────────────── */}
			<section className="relative overflow-hidden bg-ink wavy text-background-elev">
				<div
					aria-hidden
					className="absolute inset-0 top-2! opacity-10 -z-10  bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-24 lg:py-32 pb-32 lg:pb-40">
					<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 items-end">
						<div className="col-span-12 lg:col-span-8">
							<h2 className="font-display text-[44px] sm:text-[56px] lg:text-[80px] leading-[0.98] tracking-[-0.025em]">
								One link.
								<br />
								<span className="text-peach-300">All of you.</span>
							</h2>
						</div>
						<div className="col-span-12 lg:col-span-4 flex flex-col gap-4 lg:items-end">
							<Link
								href={routes.signin}
								className="inline-flex items-center gap-2 h-14 px-7 rounded-full text-background font-medium text-[15px] bg-primary transition-colors"
							>
								Claim your page
								<ArrowRight className="w-4 h-4" />
							</Link>
							<Link
								href={routes.tools.bioGenerator}
								className="pencil-link inline-flex items-center gap-2 text-[14.5px] font-medium"
							>
								<Palette className="w-4 h-4" />
								Try the free bio generator
							</Link>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
