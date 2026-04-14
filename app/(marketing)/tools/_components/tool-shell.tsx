import { routes } from "@/lib/routes";
import { ArrowRight, ArrowUpRight, Sparkle } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { JsonLd } from "@/lib/json-ld";
import { breadcrumbJsonLd, softwareApplicationJsonLd } from "@/lib/seo";

type Props = {
	eyebrow: string;
	headline: ReactNode; // usually two lines with an second line
	lead: string;
	tool: ReactNode; // client component
	// Canonical path of this tool page — drives SoftwareApplication + Breadcrumb schema.
	path: string;
	// "How this works" bullet list.
	howItWorks: string[];
	// Which Aloha feature page to cross-link in the footer.
	productFeature: { name: string; href: string; pitch: string };
	// Siblings to link at the bottom.
	otherTools: { name: string; href: string }[];
};

export function ToolShell({
	eyebrow,
	headline,
	lead,
	tool,
	path,
	howItWorks,
	productFeature,
	otherTools,
}: Props) {
	return (
		<>
			<JsonLd
				data={[
					softwareApplicationJsonLd({
						name: `Aloha ${eyebrow}`,
						path,
						description: lead,
						applicationCategory: "WebApplication",
						operatingSystem: "Web",
						offers: { price: "0", priceCurrency: "USD" },
					}),
					breadcrumbJsonLd([
						{ name: "Home", path: routes.home },
						{ name: "Free tools", path: "/tools" },
						{ name: eyebrow, path },
					]),
				]}
			/>
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
					<div className="max-w-3xl">
						<div className="inline-flex items-center gap-3 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
							<Link href="/tools" className="pencil-link">
								Free tools
							</Link>
							<span className="text-ink/25">·</span>
							<span>{eyebrow}</span>
							<span className="px-2 py-0.5 bg-background-elev border border-border rounded-full text-ink/65 text-[10px] font-mono normal-case tracking-normal inline-flex items-center gap-1.5">
								<Sparkle className="w-3 h-3 text-primary" />
								Free · no sign-up
							</span>
						</div>
						<h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[44px] sm:text-[56px] lg:text-[72px]">
							{headline}
						</h1>
						<p className="mt-6 max-w-2xl text-[16px] lg:text-[17px] leading-[1.6] text-ink/75">
							{lead}
						</p>
					</div>
				</div>
			</section>

			{/* ─── TOOL ──────────────────────────────────────────────────── */}
			<section className="bg-primary-soft">
				<section className="py-10 lg:py-16 pb-20 lg:pb-28 wavy bg-background">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">{tool}</div>
				</section>
			</section>

			{/* ─── HOW IT WORKS ──────────────────────────────────────────── */}
			<section className="bg-ink relative">
				<div
					aria-hidden
					className="absolute inset-0 opacity-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<section className="py-16 lg:py-20 pb-32 lg:pb-40 wavy bg-primary-soft">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-16 items-start">
						<div className="col-span-12 lg:col-span-5">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								How this works
							</p>
							<h2 className="font-display text-[30px] lg:text-[40px] leading-[1.05] tracking-[-0.015em]">
								Opinions,
								<br />
								<span className="text-primary">not magic.</span>
							</h2>
							<p className="mt-5 text-[14.5px] text-ink/70 leading-[1.6] max-w-md">
								This tool runs entirely in your browser. Nothing goes to a
								server; nothing is logged. We keep it simple so you can see
								exactly what it's doing.
							</p>
						</div>

						<ol className="col-span-12 lg:col-span-7 relative space-y-4 pl-8 text-[15px] leading-[1.7] text-ink/85 before:absolute before:inset-y-0 before:left-[7px] before:w-px before:bg-border-strong/60">
							{howItWorks.map((h, i) => (
								<li key={i} className="relative">
									<span className="absolute -left-[24.5px] top-2 -translate-x-1/2 w-3 h-3 rounded-full bg-ink" />
									{h}
								</li>
							))}
						</ol>
					</div>
				</section>
			</section>

			{/* ─── PRODUCT CROSS-SELL ────────────────────────────────────── */}
			<section className="py-16 lg:py-20 bg-ink relative wavy text-background-elev">
				<div
					aria-hidden
					className="absolute inset-0 opacity-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<div className="max-w-[1180px] mx-auto px-6 lg:px-10 pb-8 lg:pb-12">
					<div className="p-8 lg:p-10 rounded-3xl bg-ink text-background-elev flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 overflow-hidden relative">
						<div
							aria-hidden
							className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
						/>
						<div className="relative max-w-2xl">
							<Sparkle className="w-5 h-5 text-peach-300 mb-4" />
							<p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-peach-200 mb-3">
								Want this automated?
							</p>
							<p className="font-display text-[24px] lg:text-[32px] leading-[1.15] tracking-[-0.01em]">
								{productFeature.pitch}
							</p>
						</div>
						<div className="relative flex flex-col gap-3 lg:items-end shrink-0">
							<Link
								href={productFeature.href}
								className="inline-flex items-center gap-2 h-12 px-6 rounded-full text-background font-medium bg-primary transition-colors"
							>
								See {productFeature.name}
								<ArrowRight className="w-4 h-4" />
							</Link>
							<Link
								href={routes.signin}
								className="pencil-link inline-flex items-center gap-2 text-[13.5px]"
							>
								Start free — no card
								<ArrowUpRight className="w-3.5 h-3.5" />
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* ─── OTHER TOOLS ───────────────────────────────────────────── */}
			<section className="py-16 lg:py-20">
				<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
					<div className="mb-8 flex items-end justify-between gap-6 flex-wrap">
						<h2 className="font-display text-[28px] lg:text-[36px] leading-[1.05] tracking-[-0.015em]">
							Other free tools
						</h2>
						<Link
							href="/tools"
							className="pencil-link text-[13.5px] font-medium text-ink inline-flex items-center gap-2"
						>
							See all tools
							<ArrowUpRight className="w-3.5 h-3.5" />
						</Link>
					</div>

					<ul className="grid grid-cols-2 md:grid-cols-4 gap-3">
						{otherTools.map((t) => (
							<li key={t.href}>
								<Link
									href={t.href}
									className="group block p-5 rounded-2xl bg-background-elev border border-border hover:bg-muted/40 transition-colors h-full"
								>
									<p className="font-display text-[17px] leading-[1.2] tracking-[-0.005em] text-ink group-hover:text-primary transition-colors">
										{t.name}
									</p>
									<ArrowUpRight className="mt-3 w-3.5 h-3.5 text-ink/40 group-hover:text-primary transition-colors" />
								</Link>
							</li>
						))}
					</ul>
				</div>
			</section>
		</>
	);
}
