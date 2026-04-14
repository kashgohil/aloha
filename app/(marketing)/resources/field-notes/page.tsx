import { FIELD_NOTES } from "@/lib/field-notes";
import { routes } from "@/lib/routes";
import { makeMetadata } from "@/lib/seo";
import { ArrowRight, ArrowUpRight, Clock, Rss } from "lucide-react";
import Link from "next/link";

export const metadata = makeMetadata({
	title: "Field notes — essays from the Aloha team",
	description:
		"Essays from the Aloha team. Product craft, creator economy, the quiet shape of good tools. New piece roughly every week.",
	path: routes.resources.fieldNotes,
});

export default function FieldNotesIndexPage() {
	const [featured, ...rest] = FIELD_NOTES;

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
					<div className="relative max-w-[1180px] mx-auto px-6 lg:px-10 pt-20 lg:pt-28 pb-32 lg:pb-40">
						<div className="flex flex-wrap items-center gap-3 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
							<Link href={routes.resources.index} className="pencil-link">
								Resources
							</Link>
							<span className="text-ink/25">·</span>
							<span>Field notes</span>
							<a
								href="/rss.xml"
								className="ml-auto pencil-link inline-flex items-center gap-1.5 text-[11px] font-mono normal-case tracking-normal"
							>
								<Rss className="w-3 h-3" />
								RSS
							</a>
						</div>
						<h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[96px]">
							Field notes.
							<br />
							<span className="italic text-primary font-light">
								Written slowly.
							</span>
						</h1>
						<p className="mt-8 max-w-2xl text-[17px] lg:text-[18px] leading-[1.6] text-ink/75">
							Essays from the team. Product craft, creator economy, the quiet
							shape of good tools. Roughly one a week, sometimes two, sometimes
							none — never less than honest.
						</p>
					</div>
				</section>
			</section>

			{/* ─── FEATURED ───────────────────────────────────────────────── */}
			{featured && (
				<section className="py-12 lg:py-16 bg-primary-soft wavy">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10 pb-8 lg:pb-12">
						<Link
							href={`${routes.resources.fieldNotes}/${featured.slug}`}
							className={`group block ${featured.accent} rounded-3xl p-10 lg:p-14 hover:-translate-y-1 transition-transform`}
						>
							<div className="flex items-center gap-3 text-[10.5px] font-mono uppercase tracking-[0.22em] text-ink/55 mb-6">
								<span>Featured</span>
								<span className="text-ink/25">·</span>
								<span>{featured.dateLabel}</span>
								<span className="text-ink/25">·</span>
								<span className="inline-flex items-center gap-1.5">
									<Clock className="w-3 h-3" />
									{featured.readTime}
								</span>
							</div>
							<h2 className="font-display text-[36px] lg:text-[56px] leading-[1.05] tracking-[-0.02em] text-ink group-hover:text-primary transition-colors max-w-3xl">
								{featured.title}
							</h2>
							<p className="mt-6 text-[16px] lg:text-[17px] leading-[1.6] text-ink/75 max-w-2xl">
								{featured.lead}
							</p>
							<div className="mt-8 flex items-center gap-4">
								<span
									className={`w-10 h-10 rounded-full ${featured.author.tone ?? "bg-ink"} text-background-elev font-display text-[14px] flex items-center justify-center`}
								>
									{featured.author.ini}
								</span>
								<div>
									<p className="font-medium text-[14px] text-ink">
										{featured.author.name}
									</p>
									<p className="text-[11.5px] text-ink/60 font-mono uppercase tracking-[0.14em]">
										{featured.author.role}
									</p>
								</div>
								<ArrowRight className="ml-auto w-5 h-5 text-ink/50 group-hover:text-primary group-hover:translate-x-1 transition-all" />
							</div>
						</Link>
					</div>
				</section>
			)}

			{/* ─── ALL POSTS ──────────────────────────────────────────────── */}
			<section className="bg-ink relative">
				<div
					aria-hidden
					className="absolute inset-0 top-2! opacity-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<section className="py-16 lg:py-20 bg-background wavy pb-32 lg:pb-40">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
						<div className="mb-10">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								All essays
							</p>
							<h2 className="font-display text-[32px] lg:text-[44px] leading-[1.02] tracking-[-0.02em]">
								{FIELD_NOTES.length} posts so far.
							</h2>
						</div>

						<ul className="rounded-3xl border border-border overflow-hidden bg-background">
							{rest.length === 0 ? (
								<li className="px-6 py-12 text-center text-[14px] text-ink/55">
									The only field note so far is the featured one above.
								</li>
							) : (
								rest.map((n, i) => (
									<li
										key={n.slug}
										className={`${i % 2 === 1 ? "bg-muted/10" : ""} border-b border-border last:border-b-0`}
									>
										<Link
											href={`${routes.resources.fieldNotes}/${n.slug}`}
											className="group grid grid-cols-12 gap-x-0 gap-y-4 lg:gap-4 px-6 lg:px-8 py-7 items-start hover:bg-muted/25 transition-colors"
										>
											<div className="col-span-12 md:col-span-2">
												<p className="text-[11px] font-mono uppercase tracking-[0.18em] text-ink/55">
													{n.dateLabel}
												</p>
												<p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-mono text-ink/50">
													<Clock className="w-3 h-3" />
													{n.readTime}
												</p>
											</div>
											<div className="col-span-12 md:col-span-8 min-w-0">
												<p className="font-display text-[22px] lg:text-[24px] leading-[1.15] tracking-[-0.005em] text-ink group-hover:text-primary transition-colors">
													{n.title}
												</p>
												<p className="mt-3 text-[14px] text-ink/70 leading-[1.55] max-w-2xl">
													{n.lead}
												</p>
												{n.tags.length > 0 && (
													<ul className="mt-4 flex flex-wrap gap-2">
														{n.tags.map((t) => (
															<li
																key={t}
																className="inline-flex items-center px-2.5 py-1 rounded-full bg-muted text-[10.5px] font-mono text-ink/60 uppercase tracking-[0.14em]"
															>
																{t}
															</li>
														))}
													</ul>
												)}
											</div>
											<div className="col-span-12 md:col-span-2 md:text-right flex md:justify-end items-start">
												<span className="inline-flex items-center gap-2 text-[12.5px] font-medium text-ink/60 group-hover:text-primary transition-colors">
													Read
													<ArrowUpRight className="w-4 h-4" />
												</span>
											</div>
										</Link>
									</li>
								))
							)}
						</ul>
					</div>
				</section>
			</section>

			{/* ─── FINAL CTA ──────────────────────────────────────────────── */}
			<section className="relative overflow-hidden bg-ink text-background-elev wavy">
				<div
					aria-hidden
					className="absolute inset-0 opacity-10 -z-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<div className="max-w-[1180px] mx-auto px-6 lg:px-10 py-20 lg:py-28 pb-32 lg:pb-40">
					<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 items-end">
						<div className="col-span-12 lg:col-span-8">
							<h2 className="font-display text-[36px] sm:text-[48px] lg:text-[64px] leading-none tracking-[-0.02em]">
								Don't want to check the page?
								<br />
								<span className="text-peach-300">
									We'll email the new ones.
								</span>
							</h2>
						</div>
						<div className="col-span-12 lg:col-span-4 flex flex-col gap-4 lg:items-end">
							<Link
								href={routes.connect.newsletter}
								className="inline-flex items-center gap-2 h-14 px-7 rounded-full text-background font-medium text-[15px] bg-primary transition-colors"
							>
								Subscribe
								<ArrowRight className="w-4 h-4" />
							</Link>
							<a
								href="/rss.xml"
								className="pencil-link inline-flex items-center gap-2 text-[14.5px] font-medium"
							>
								<Rss className="w-4 h-4" />
								Or follow the RSS
							</a>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
