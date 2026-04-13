import {
	COMPETITORS,
	COMPETITOR_SLUGS,
	type FeatureStatus,
} from "@/lib/competitors";
import { routes } from "@/lib/routes";
import { makeMetadata } from "@/lib/seo";
import {
	ArrowRight,
	ArrowUpRight,
	Check,
	MessageSquareQuote,
	Minus,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Params = { competitor: string };

export function generateStaticParams(): Params[] {
	return COMPETITOR_SLUGS.map((competitor) => ({ competitor }));
}

export async function generateMetadata({
	params,
}: {
	params: Promise<Params>;
}) {
	const { competitor: slug } = await params;
	const c = COMPETITORS[slug];
	if (!c) return {};
	return makeMetadata({
		title: `Aloha vs ${c.name} — an honest comparison`,
		description: `Where Aloha and ${c.name} overlap, where we diverge, and who should pick which. Verified ${c.verifiedLabel}.`,
		path: `/compare/${c.slug}`,
	});
}

// ── Status badges for the matrix ─────────────────────────────────────
function StatusBadge({
	status,
	note,
}: {
	status: FeatureStatus;
	note?: string;
}) {
	const BADGES: Record<
		FeatureStatus,
		{ label: string; icon: React.ReactNode; className: string }
	> = {
		yes: {
			label: "Yes",
			icon: <Check className="w-3.5 h-3.5" strokeWidth={2.5} />,
			className: "bg-primary-soft text-primary border-primary/20",
		},
		partial: {
			label: "Partial",
			icon: <span className="w-2 h-2 rounded-full bg-peach-400" />,
			className: "bg-peach-100 text-ink border-peach-300/40",
		},
		addon: {
			label: "Add-on",
			icon: <span className="text-[11px] font-bold">+</span>,
			className: "bg-muted text-ink/70 border-border",
		},
		planned: {
			label: "Planned",
			icon: <span className="w-2 h-2 rounded-full bg-ink/30" />,
			className: "bg-background-elev text-ink/60 border-border",
		},
		no: {
			label: "No",
			icon: <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />,
			className: "bg-muted/40 text-ink/45 border-border/60",
		},
	};
	const b = BADGES[status];
	return (
		<div className="flex flex-col items-start gap-1.5">
			<span
				className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10.5px] font-semibold uppercase tracking-[0.14em] ${b.className}`}
			>
				{b.icon}
				{b.label}
			</span>
			{note && (
				<span className="text-[11.5px] font-mono text-ink/55 leading-[1.4]">
					{note}
				</span>
			)}
		</div>
	);
}

export default async function ComparePage({
	params,
}: {
	params: Promise<Params>;
}) {
	const { competitor: slug } = await params;
	const c = COMPETITORS[slug];
	if (!c) notFound();

	const otherCompetitors = Object.values(COMPETITORS).filter(
		(o) => o.slug !== c.slug,
	);

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
				<div className="relative max-w-[1180px] mx-auto px-6 lg:px-10 pt-20 lg:pt-28 pb-32 lg:pb-40">
					<div className="inline-flex items-center gap-3 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
						Aloha vs {c.name}
						<span className="px-2 py-0.5 bg-background-elev border border-border rounded-full text-ink/65 text-[10px] font-mono normal-case tracking-normal">
							verified {c.verifiedLabel}
						</span>
					</div>

					<h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[52px] sm:text-[68px] lg:text-[84px] max-w-4xl">
						An honest look at
						<br />
						<span className="text-primary font-light">Aloha</span> next to{" "}
						<span className="text-primary font-light">{c.name}</span>.
					</h1>

					<p className="mt-8 max-w-3xl text-[17px] lg:text-[18px] leading-[1.6] text-ink/75">
						{c.lead}
					</p>

					<div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
						<Link
							href={routes.signin}
							className="inline-flex items-center gap-2 h-14 px-7 rounded-full bg-primary text-primary-foreground font-medium text-[15px] shadow-[0_8px_0_-2px_rgba(46,42,133,0.35)] hover:shadow-[0_10px_0_-2px_rgba(46,42,133,0.4)] hover:-translate-y-0.5 transition-all"
						>
							Try Aloha free
							<ArrowRight className="w-4 h-4" />
						</Link>
						<Link
							href={routes.compare.migrationGuide}
							className="pencil-link inline-flex items-center gap-2 text-[15px] font-medium text-ink"
						>
							How migration works
							<ArrowUpRight className="w-4 h-4" />
						</Link>
					</div>
				</div>
			</section>

			{/* ─── WHERE THEY'RE STRONGER ──────────────────────────────────── */}
			<section className="bg-background-elev">
				<section className="py-20 lg:py-24 bg-background pb-32 lg:pb-40 wavy">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
						<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 mb-12 items-end">
							<div className="col-span-12 lg:col-span-7">
								<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
									Where {c.name} is stronger
								</p>
								<h2 className="font-display text-[32px] lg:text-[44px] leading-[1.05] tracking-[-0.015em]">
									We'll say the quiet
									<span className="text-primary"> parts loud.</span>
								</h2>
							</div>
							<p className="col-span-12 lg:col-span-4 text-[15.5px] text-ink/70 leading-[1.55]">
								Every competitor has things we don't match. These are {c.name}
								's. If any of them is load-bearing for you, stay where you are.
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
							{c.theyWin.map((w, i) => (
								<article
									key={i}
									className="p-7 rounded-3xl bg-ink text-background-elev"
								>
									<span className="font-display text-[30px] text-peach-300 leading-none">
										{i + 1}
									</span>
									<h3 className="mt-5 font-display text-[22px] leading-[1.2] tracking-[-0.01em]">
										{w.h}
									</h3>
									<p className="mt-3 text-[13.5px] text-background-elev/75 leading-[1.55]">
										{w.p}
									</p>
								</article>
							))}
						</div>
					</div>
				</section>
			</section>

			{/* ─── WHERE WE'RE STRONGER ────────────────────────────────────── */}
			<section className="py-20 lg:py-24 bg-background-elev wavy pb-32 lg:pb-40">
				<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
					<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 mb-12 items-end">
						<div className="col-span-12 lg:col-span-7">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Where Aloha is stronger
							</p>
							<h2 className="font-display text-[32px] lg:text-[44px] leading-[1.05] tracking-[-0.015em]">
								And here's why someone
								<span className="text-primary"> does move.</span>
							</h2>
						</div>
						<p className="col-span-12 lg:col-span-4 text-[15.5px] text-ink/70 leading-[1.55]">
							Three concrete pieces you'd be trading up for, stated flatly.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
						{c.weWin.map((w, i) => (
							<article
								key={i}
								className={`p-7 rounded-3xl ${
									i === 0
										? c.accent
										: i === 1
											? "bg-peach-100"
											: "bg-primary-soft"
								}`}
							>
								<span className="font-display text-[30px] text-ink/50 leading-none">
									{i + 1}
								</span>
								<h3 className="mt-5 font-display text-[22px] leading-[1.2] tracking-[-0.01em]">
									{w.h}
								</h3>
								<p className="mt-3 text-[13.5px] text-ink/75 leading-[1.55]">
									{w.p}
								</p>
							</article>
						))}
					</div>
				</div>
			</section>

			{/* ─── FEATURE MATRIX ──────────────────────────────────────────── */}
			<section className="bg-background-elev">
				<section className="py-20 lg:py-28 bg-background pb-32 lg:pb-40 wavy">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
						<div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
							<div>
								<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
									Feature matrix
								</p>
								<h2 className="font-display text-[32px] lg:text-[44px] leading-[1.05] tracking-[-0.015em]">
									Same rows,
									<span className="text-primary"> every comparison.</span>
								</h2>
							</div>
							<p className="text-[13px] text-ink/60 font-mono">
								Verified {c.verifiedLabel} · sources linked in{" "}
								<Link
									href={routes.product.whatsNew}
									className="text-ink pencil-link"
								>
									changelog
								</Link>
							</p>
						</div>

						<div className="rounded-3xl border border-border overflow-hidden bg-background">
							{/* header row */}
							<div className="grid grid-cols-12 border-b border-border bg-muted/40">
								<div className="col-span-12 md:col-span-5 px-6 py-4 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/55">
									Feature
								</div>
								<div
									className={`col-span-6 md:col-span-3 px-6 py-4 ${c.accent} md:border-l border-border`}
								>
									<p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/55">
										Aloha
									</p>
									<p className="text-[12.5px] font-display text-ink mt-1">
										the calm OS
									</p>
								</div>
								<div className="col-span-6 md:col-span-4 px-6 py-4 md:border-l border-border">
									<p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/55">
										{c.name}
									</p>
									<p className="text-[12.5px] font-display text-ink mt-1">
										{c.positioning}
									</p>
								</div>
							</div>

							{/* rows */}
							{c.matrix.map((row, i) => (
								<div
									key={row.label}
									className={`grid grid-cols-12 border-b border-border last:border-b-0 ${
										i % 2 === 1 ? "bg-muted/15" : ""
									}`}
								>
									<div className="col-span-12 md:col-span-5 px-6 py-4 text-[14px] text-ink font-medium">
										{row.label}
									</div>
									<div
										className={`col-span-6 md:col-span-3 px-6 py-4 ${c.accent}/40 md:border-l border-border flex items-start`}
									>
										<StatusBadge status={row.aloha} note={row.alohaNote} />
									</div>
									<div className="col-span-6 md:col-span-4 px-6 py-4 md:border-l border-border flex items-start">
										<StatusBadge status={row.them} note={row.themNote} />
									</div>
								</div>
							))}
						</div>

						{/* verdict */}
						<div className="mt-10 p-8 lg:p-10 rounded-3xl bg-peach-100 border border-peach-300/40">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-3">
								The honest verdict
							</p>
							<p className="font-display text-[22px] lg:text-[26px] leading-[1.3] tracking-[-0.005em] max-w-3xl">
								{c.verdict}
							</p>
						</div>
					</div>
				</section>
			</section>

			{/* ─── MIGRATION ───────────────────────────────────────────────── */}
			<section className="bg-primary-soft">
				<section className="py-20 lg:py-28 bg-background-elev wavy pb-32 lg:pb-40">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
						<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 items-start">
							<div className="col-span-12 lg:col-span-5">
								<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
									Switching from {c.name}
								</p>
								<h2 className="font-display text-[32px] lg:text-[44px] leading-[1.05] tracking-[-0.015em]">
									Switching is
									<br />
									<span className="text-primary">one afternoon.</span>
								</h2>
								<p className="mt-6 text-[16px] text-ink/75 leading-[1.6] max-w-md">
									We've built importers for every competitor on this page. You
									don't lose scheduled posts, you don't lose history, you don't
									re-upload your media library.
								</p>

								<Link
									href={routes.compare.migrationGuide}
									className="mt-8 inline-flex items-center gap-2 h-12 px-6 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
								>
									Read the migration guide
									<ArrowRight className="w-4 h-4" />
								</Link>
							</div>

							<div className="col-span-12 lg:col-span-7">
								<ol className="relative border-l-2 border-border-strong/60 space-y-8 pl-8">
									{c.migration.steps.map((step, i) => (
										<li key={i} className="relative">
											<span className="absolute -left-[45px] top-1 w-7 h-7 rounded-full bg-ink text-background-elev font-display text-[12px] flex items-center justify-center">
												{i + 1}
											</span>
											<p className="text-[15px] text-ink leading-[1.55]">
												{step}
											</p>
										</li>
									))}
								</ol>

								{c.migration.caveat && (
									<div className="mt-8 p-5 rounded-2xl bg-peach-100 border border-peach-300/40">
										<p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-2">
											Worth knowing
										</p>
										<p className="text-[14px] text-ink/80 leading-[1.55]">
											{c.migration.caveat}
										</p>
									</div>
								)}
							</div>
						</div>
					</div>
				</section>
			</section>

			{/* ─── TESTIMONIAL ─────────────────────────────────────────────── */}
			<section className="bg-background-elev">
				<section className="py-20 lg:py-24 bg-primary-soft pb-32 lg:pb-40 wavy">
					<div className="max-w-[1100px] mx-auto px-6 lg:px-10">
						<figure className="relative rounded-3xl p-10 lg:p-14 overflow-hidden">
							<MessageSquareQuote className="relative w-8 h-8 mb-6" />
							<blockquote className="relative font-display text-[26px] lg:text-[34px] leading-[1.2] tracking-[-0.015em] max-w-3xl">
								"{c.testimonial.q}"
							</blockquote>
							<figcaption className="relative mt-8 flex items-center gap-4">
								<span className="w-11 h-11 rounded-full bg-primary text-primary-foreground font-display flex items-center justify-center">
									{c.testimonial.ini}
								</span>
								<div>
									<p className="font-medium">{c.testimonial.n}</p>
									<p className="text-[13px]">{c.testimonial.r}</p>
								</div>
							</figcaption>
						</figure>
					</div>
				</section>
			</section>

			{/* ─── OTHER COMPARISONS ────────────────────────────────────────── */}
			<section className="bg-ink relative">
				<div
					aria-hidden
					className="absolute inset-0 top-2.5 opacity-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<section className="py-20 lg:py-24 bg-background-elev wavy pb-32 lg:pb-40">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
						<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 mb-10 items-end">
							<div className="col-span-12 lg:col-span-7">
								<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
									Other comparisons
								</p>
								<h2 className="font-display text-[32px] lg:text-[44px] leading-[1.02] tracking-[-0.015em]">
									We write these about
									<span className="text-primary">
										{" "}
										everyone we overlap with.
									</span>
								</h2>
							</div>
							<p className="col-span-12 lg:col-span-4 text-[15.5px] text-ink/70 leading-[1.55]">
								Same structure, same honesty. If you're shopping, read all of
								them.
							</p>
						</div>

						<ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border-t border-l border-border">
							{otherCompetitors.map((o) => (
								<li key={o.slug}>
									<Link
										href={`/compare/${o.slug}`}
										className="p-6 block group hover:bg-muted/40 transition-colors border-r border-b border-border h-full"
									>
										<p className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink/50 mb-3">
											vs
										</p>
										<p className="font-display text-[22px] leading-none tracking-[-0.015em] group-hover:text-primary transition-colors">
											{o.name}
										</p>
										<p className="mt-3 text-[12px] text-ink/55 max-w-[20ch] leading-normal">
											{o.positioning}
										</p>
									</Link>
								</li>
							))}
						</ul>
					</div>
				</section>
			</section>

			{/* ─── FINAL CTA ───────────────────────────────────────────────── */}
			<section className="relative overflow-hidden bg-ink text-background-elev wavy">
				<div
					aria-hidden
					className="absolute inset-0 top-2.5 opacity-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<div className="max-w-[1180px] mx-auto px-6 lg:px-10 py-24 lg:py-32 pb-32 lg:pb-40">
					<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 items-end">
						<div className="col-span-12 lg:col-span-8">
							<h2 className="font-display text-[40px] sm:text-[52px] lg:text-[72px] leading-[0.98] tracking-[-0.025em]">
								Good tools don't
								<br />
								<span className="text-peach-300">
									compete for your attention.
								</span>
								<br />
								They earn it.
							</h2>
						</div>
						<div className="col-span-12 lg:col-span-4 flex flex-col gap-4 lg:items-end">
							<Link
								href={routes.signin}
								className="inline-flex items-center gap-2 h-14 px-7 rounded-full bg-primary text-primary-foreground font-medium text-[15px] hover:bg-primary transition-colors"
							>
								Try Aloha free
								<ArrowRight className="w-4 h-4" />
							</Link>
							<Link
								href={routes.compare.whyDifferent}
								className="pencil-link inline-flex items-center gap-2 text-[14.5px] font-medium"
							>
								Why we're different (at the core)
								<ArrowUpRight className="w-4 h-4" />
							</Link>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
