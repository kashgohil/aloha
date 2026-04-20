import { RELEASES, type ChangeTag } from "@/lib/releases";
import { routes } from "@/lib/routes";
import { makeMetadata } from "@/lib/seo";
import {
	ArrowRight,
	ArrowUpRight,
	Bug,
	Rss,
	Sparkle,
	Wrench,
} from "lucide-react";
import Link from "next/link";
import { ScreenshotPlaceholder } from "../_components/screenshot-placeholder";

export const metadata = makeMetadata({
	title: "What's new — every update, in order",
	description:
		"The Aloha changelog. Every shipped feature, improvement, and fix, dated honestly and written in plain English.",
	path: routes.product.whatsNew,
});


const TAG_STYLES: Record<ChangeTag, { bg: string; icon: typeof Sparkle }> = {
	new: { bg: "bg-primary-soft text-primary", icon: Sparkle },
	improved: { bg: "bg-peach-200 text-ink", icon: Wrench },
	fixed: { bg: "bg-muted text-ink/75", icon: Bug },
};

export default function WhatsNewPage() {
	const [featured, ...rest] = RELEASES;

	return (
		<>
			{/* ─── HERO ────────────────────────────────────────────────────── */}
			<header className="relative overflow-hidden bg-peach-200 pb-20 lg:pb-24">
				<span
					aria-hidden
					className="absolute top-[24%] left-[5%] font-display text-[28px] text-ink/25 rotate-[-8deg] select-none"
				>
					✳
				</span>
				<span
					aria-hidden
					className="absolute top-[70%] right-[8%] font-display text-[22px] text-primary/55 rotate-14 select-none"
				>
					+
				</span>
			</header>

			<section className="bg-peach-200 wavy">
				<div className="relative max-w-[1100px] mx-auto px-6 lg:px-10 pt-20 lg:pt-28 pb-32! lg:pb-40!">
					<div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
						<div>
							<div className="inline-flex items-center gap-2 mb-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
								Changelog
							</div>
							<h1 className="font-display font-normal text-ink leading-[0.98] tracking-[-0.03em] text-[56px] sm:text-[68px] lg:text-[88px]">
								What's new.
								<br />
								<span className="text-primary font-light">In order.</span>
							</h1>
							<p className="mt-8 max-w-xl text-[16px] lg:text-[17px] leading-[1.55] text-ink/70">
								Every shipped feature, improvement, and fix — dated honestly,
								written in English. Release notes without the marketing voice.
							</p>
						</div>
						<div className="flex items-center gap-4 shrink-0">
							<a
								href="/rss.xml"
								className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-background-elev border border-border-strong text-[13px] font-medium hover:bg-muted transition-colors"
							>
								<Rss className="w-4 h-4" />
								RSS
							</a>
							<Link
								href={routes.connect.newsletter}
								className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors"
							>
								Monthly wrap
								<ArrowRight className="w-3.5 h-3.5" />
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* ─── FEATURED RELEASE ────────────────────────────────────────── */}
			<section className="bg-ink relative">
				<div
					aria-hidden
					className="absolute inset-0 top-2! opacity-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<section className="py-10 lg:py-14 bg-background">
					<div className="max-w-[1100px] mx-auto px-6 lg:px-10">
						<article className="rounded-3xl bg-primary-soft border border-primary/15 overflow-hidden">
							<div className="p-8 lg:p-12 grid grid-cols-12 gap-x-0 gap-y-8 lg:gap-12">
								<div className="col-span-12 lg:col-span-5">
									<div className="inline-flex items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.22em] text-primary">
										<Sparkle className="w-3 h-3" />
										Latest · v{featured.version}
									</div>
									<time
										dateTime={featured.date}
										className="mt-3 block text-[12.5px] font-mono text-ink/60"
									>
										{featured.dateLabel}
									</time>
									<h2 className="mt-5 font-display text-[32px] lg:text-[40px] leading-[1.05] tracking-[-0.015em] text-ink">
										{featured.title}
									</h2>
									<p className="mt-5 text-[15px] leading-[1.6] text-ink/75 max-w-md">
										{featured.lead}
									</p>

									<ul className="mt-7 space-y-3">
										{featured.changes.map((c, i) => {
											const { bg, icon: Icon } = TAG_STYLES[c.tag];
											return (
												<li key={i} className="flex items-start gap-3">
													<span
														className={`inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.18em] ${bg} px-2 py-0.5 rounded-full shrink-0 mt-[3px]`}
													>
														<Icon className="w-2.5 h-2.5" />
														{c.tag}
													</span>
													<p className="text-[14px] text-ink/85 leading-normal">
														{c.t}
													</p>
												</li>
											);
										})}
									</ul>
								</div>

								<div className="col-span-12 lg:col-span-7">
									{featured.screenshotLabel && (
										<ScreenshotPlaceholder
											id={`release-${featured.version}`}
											label={featured.screenshotLabel}
											notes={featured.screenshotNotes ?? ""}
											aspect="aspect-[16/10]"
											tone="bg-background-elev"
											src={featured.screenshotSrc}
											alt={featured.screenshotAlt}
										/>
									)}
								</div>
							</div>
						</article>
					</div>
				</section>
				{/* ─── RELEASE FEED ────────────────────────────────────────────── */}
				<section className="py-12 lg:py-20 pb-32 lg:pb-40 bg-background wavy">
					<div className="max-w-[1100px] mx-auto px-6 lg:px-10">
						<div className="relative">
							{/* spine line */}
							<span
								aria-hidden
								className="absolute left-0 lg:left-[140px] top-4 bottom-4 w-px bg-border-strong/60"
							/>

							<ol className="space-y-14 lg:space-y-16">
								{rest.map((r) => (
									<li
										key={r.version}
										className="relative grid grid-cols-12 gap-x-0 gap-y-4 lg:gap-8"
									>
										{/* date spine (left) */}
										<div className="col-span-12 lg:col-span-2 relative pl-6 lg:pl-0">
											<span
												aria-hidden
												className="absolute left-[-3px] lg:left-[137px] top-2 w-2 h-2 rounded-full bg-ink"
											/>
											<time
												dateTime={r.date}
												className="block text-[11px] font-mono uppercase tracking-[0.2em] text-ink/55"
											>
												{r.dateLabel}
											</time>
											<span className="mt-1 inline-block text-[12.5px] font-display text-ink">
												v{r.version}
											</span>
										</div>

										{/* content */}
										<div className="col-span-12 lg:col-span-10 pl-6 lg:pl-10">
											<h3 className="font-display text-[24px] lg:text-[28px] leading-[1.15] tracking-[-0.01em] text-ink">
												{r.title}
											</h3>
											<p className="mt-3 text-[14.5px] leading-[1.6] text-ink/75 max-w-2xl">
												{r.lead}
											</p>

											<ul className="mt-5 space-y-2.5">
												{r.changes.map((c, i) => {
													const { bg, icon: Icon } = TAG_STYLES[c.tag];
													return (
														<li key={i} className="flex items-start gap-3">
															<span
																className={`inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.18em] ${bg} px-2 py-0.5 rounded-full shrink-0 mt-[3px]`}
															>
																<Icon className="w-2.5 h-2.5" />
																{c.tag}
															</span>
															<p className="text-[13.5px] text-ink/85 leading-[1.55]">
																{c.t}
															</p>
														</li>
													);
												})}
											</ul>
										</div>
									</li>
								))}
							</ol>

							<div className="mt-14 pl-6 lg:pl-[140px]">
								<button className="pencil-link text-[14px] font-medium text-ink inline-flex items-center gap-2">
									Load older releases
									<ArrowRight className="w-3.5 h-3.5" />
								</button>
							</div>
						</div>
					</div>
				</section>
			</section>

			{/* ─── FOOTER CTA ──────────────────────────────────────────────── */}
			<section className="relative py-24 lg:py-28 bg-ink wavy text-background-elev">
				<div
					aria-hidden
					className="absolute inset-0 top-2! opacity-10 -z-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<div className="max-w-[1100px] mx-auto px-6 lg:px-10">
					<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 items-center">
						<div className="col-span-12 lg:col-span-7">
							<h2 className="font-display text-[32px] lg:text-[44px] leading-[1.05] tracking-[-0.015em]">
								We ship every two weeks.
								<br />
								<span className="text-peach-300">
									You don't have to read every one.
								</span>
							</h2>
							<p className="mt-5 max-w-lg text-[15px] text-ink/70 leading-[1.6]">
								Prefer a monthly wrap in your inbox instead? We send a plain-
								English summary on the first of every month. No marketing fluff,
								no "exciting news."
							</p>
						</div>
						<div className="col-span-12 lg:col-span-5 flex flex-col gap-3 lg:items-end">
							<Link
								href={routes.connect.newsletter}
								className="inline-flex items-center gap-2 h-12 px-6 rounded-full text-background text-[14px] font-medium bg-primary transition-colors"
							>
								Get the monthly wrap
								<ArrowRight className="w-4 h-4" />
							</Link>
							<Link
								href={routes.resources.apiDocs}
								className="pencil-link text-[13.5px] font-medium inline-flex items-center gap-2"
							>
								API changes live in the docs
								<ArrowUpRight className="w-3.5 h-3.5" />
							</Link>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
