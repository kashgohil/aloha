import { PERSONAS } from "@/lib/personas";
import { PLAYBOOKS } from "@/lib/playbooks";
import { routes } from "@/lib/routes";
import { makeMetadata } from "@/lib/seo";
import { ArrowRight, ArrowUpRight, Clock, ListChecks } from "lucide-react";
import Link from "next/link";

export const metadata = makeMetadata({
	title: "Playbooks — tactical guides you can ship from",
	description:
		"Aloha's playbooks. Step-by-step, opinionated, ready to clone. Launch weeks, inbox triage, agency workflows, and more.",
	path: routes.resources.playbooks,
});

export default function PlaybooksIndexPage() {
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
					<div className="flex flex-wrap items-center gap-3 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
						<Link href={routes.resources.index} className="pencil-link">
							Resources
						</Link>
						<span className="text-ink/25">·</span>
						<span>Playbooks</span>
					</div>
					<h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[96px]">
						Playbooks
						<br />
						<span className="italic text-primary font-light">
							you can ship from.
						</span>
					</h1>
					<p className="mt-8 max-w-2xl text-[17px] lg:text-[18px] leading-[1.6] text-ink/75">
						Step-by-step, opinionated, calibrated by creators and teams who
						actually run the workflow. Each one is a real plan, not a 'here are
						some ideas' list.
					</p>
				</div>
			</section>

			{/* ─── CARDS ──────────────────────────────────────────────────── */}
			<section className="bg-ink relative">
				<div
					aria-hidden
					className="absolute inset-0 top-2.5! opacity-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<section className="py-16 lg:py-20 pb-32 lg:pb-40 wavy bg-background">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
							{PLAYBOOKS.map((p) => {
								const persona = PERSONAS[p.persona];
								return (
									<Link
										key={p.slug}
										href={`${routes.resources.playbooks}/${p.slug}`}
										className={`group block ${p.accent} rounded-3xl p-8 lg:p-10 hover:-translate-y-1 transition-transform`}
									>
										<div className="flex items-center gap-3 text-[10.5px] font-mono uppercase tracking-[0.22em] text-ink/55 mb-6">
											<ListChecks className="w-3.5 h-3.5" />
											<span>{p.steps} steps</span>
											<span className="text-ink/25">·</span>
											<span className="inline-flex items-center gap-1.5">
												<Clock className="w-3 h-3" />
												{p.readTime}
											</span>
										</div>

										<h2 className="font-display text-[30px] lg:text-[36px] leading-[1.1] tracking-[-0.015em] text-ink group-hover:text-primary transition-colors">
											{p.title}
										</h2>
										<p className="mt-5 text-[15px] lg:text-[16px] leading-[1.6] text-ink/75">
											{p.lead}
										</p>

										<div className="mt-7 flex flex-wrap items-center gap-2">
											{persona && (
												<span className="px-2.5 py-1 rounded-full bg-background-elev/70 border border-ink/8 text-[10.5px] font-mono uppercase tracking-[0.14em] text-ink/65">
													For {persona.name.toLowerCase()}
												</span>
											)}
											{p.tags.map((t) => (
												<span
													key={t}
													className="px-2.5 py-1 rounded-full bg-background-elev/70 border border-ink/8 text-[10.5px] font-mono uppercase tracking-[0.14em] text-ink/65"
												>
													{t}
												</span>
											))}
										</div>

										<div className="mt-8 pt-6 border-t border-ink/10 flex items-center justify-between text-[12.5px] text-ink/65 font-mono uppercase tracking-[0.14em]">
											<span>{p.dateLabel}</span>
											<span className="inline-flex items-center gap-2 text-ink group-hover:text-primary transition-colors">
												Read playbook
												<ArrowUpRight className="w-3.5 h-3.5" />
											</span>
										</div>
									</Link>
								);
							})}
						</div>
					</div>
				</section>
			</section>

			{/* ─── PITCH A PLAYBOOK ───────────────────────────────────────── */}
			<section className="py-20 lg:py-24 bg-ink relative text-background-elev wavy">
				<div
					aria-hidden
					className="absolute inset-0 top-2.5! -z-10 opacity-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<div className="max-w-[1180px] mx-auto px-6 lg:px-10 pb-8 lg:pb-12">
					<div className="p-10 lg:p-14 rounded-3xl overflow-hidden relative">
						<div className="relative grid grid-cols-12 gap-x-0 gap-y-8 lg:gap-8 items-center">
							<div className="col-span-12 lg:col-span-8">
								<p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-peach-200 mb-5">
									Run a workflow worth writing up?
								</p>
								<p className="font-display text-[28px] lg:text-[40px] leading-[1.15] tracking-[-0.015em]">
									Pitch us your playbook.
									<br />
									<span className="italic text-peach-300">
										We'll co-write it with you.
									</span>
								</p>
								<p className="mt-5 text-[14px] text-background-elev/75 leading-[1.6] max-w-xl">
									We're specifically looking for ops-focused workflows from
									agencies, in-house teams, and busy solo creators.
								</p>
							</div>
							<div className="col-span-12 lg:col-span-4 flex flex-col gap-3 lg:items-end">
								<a
									href="mailto:playbooks@usealoha.app"
									className="inline-flex items-center gap-2 h-12 px-6 rounded-full text-[14px] font-medium bg-primary transition-colors"
								>
									playbooks@usealoha.app
									<ArrowRight className="w-4 h-4" />
								</a>
								<Link
									href={routes.resources.fieldNotes}
									className="pencil-link inline-flex items-center gap-2 text-[13.5px]"
								>
									Or read the field notes
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
