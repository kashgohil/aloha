import { CHANNELS, CHANNEL_SLUGS } from "@/lib/channels";
import { routes } from "@/lib/routes";
import { makeMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";
import {
	ArrowRight,
	ArrowUpRight,
	Check,
	Clock,
	MessageSquareQuote,
	Sparkle,
	X as XIcon,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SOCIAL_ICONS } from "../../_components/social-icons";

type Params = { channel: string };

export function generateStaticParams(): Params[] {
	return CHANNEL_SLUGS.map((channel) => ({ channel }));
}

export async function generateMetadata({
	params,
}: {
	params: Promise<Params>;
}) {
	const { channel: slug } = await params;
	const c = CHANNELS[slug];
	if (!c) return {};
	return makeMetadata({
		title: `Aloha for ${c.name} — ${c.tagline}`,
		description: c.lead,
		path: `/channels/${c.slug}`,
	});
}

// Normalise label comparisons — the data map uses "X" which collides with
// the lucide X icon; we match by case-insensitive name.
function getIcon(name: string) {
	return SOCIAL_ICONS.find((i) => i.n.toLowerCase() === name.toLowerCase());
}

const HOUR_LABELS = ["12a", "3a", "6a", "9a", "12p", "3p", "6p", "9p"];

export default async function ChannelPage({
	params,
}: {
	params: Promise<Params>;
}) {
	const { channel: slug } = await params;
	const c = CHANNELS[slug];
	if (!c) notFound();

	const icon = getIcon(c.name);
	const peakHour = c.bestTimes.reduce(
		(best, v, i) => (v > c.bestTimes[best] ? i : best),
		0,
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
				<div className="relative max-w-[1320px] w-full mx-auto px-6 lg:px-10 pt-20 lg:pt-28 pb-32 lg:pb-40 grid grid-cols-12 gap-x-0 gap-y-8 lg:gap-12 items-center">
					<div className="col-span-12 lg:col-span-7">
						<div className="inline-flex items-center gap-2 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
							{c.eyebrow}
						</div>

						<h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[92px]">
							{c.headline.line1}
							<br />
							<span className="text-primary font-light">
								{c.headline.line2}
							</span>
						</h1>

						<p className="mt-8 max-w-[560px] text-[17px] lg:text-[18px] leading-[1.55] text-ink/70">
							{c.lead}
						</p>

						<div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
							<Link
								href={routes.signin}
								className="inline-flex items-center gap-2 h-14 px-7 rounded-full bg-primary text-primary-foreground font-medium text-[15px] shadow-[0_8px_0_-2px_rgba(46,42,133,0.35)] hover:shadow-[0_10px_0_-2px_rgba(46,42,133,0.4)] hover:-translate-y-0.5 transition-all"
							>
								Connect {c.name}
								<ArrowRight className="w-4 h-4" />
							</Link>
							<a
								href="#post-types"
								className="pencil-link inline-flex items-center gap-2 text-[15px] font-medium text-ink"
							>
								What you can post
								<ArrowUpRight className="w-4 h-4" />
							</a>
						</div>

						<div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-[12.5px] text-ink/60">
							<span className="inline-flex items-center gap-2">
								<Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
								Native scheduling
							</span>
							<span className="inline-flex items-center gap-2">
								<Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
								Voice model tuned per-channel
							</span>
							<span className="inline-flex items-center gap-2">
								<Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
								One-click cross-post where it helps
							</span>
						</div>
					</div>

					{/* Hero visual — channel card */}
					<div className="col-span-12 lg:col-span-5 relative">
						<div className="relative animate-[float-soft_9s_ease-in-out_infinite]">
							<div
								className={`rounded-3xl ${c.accent} border border-border-strong shadow-[0_30px_60px_-20px_rgba(23,20,18,0.25)] overflow-hidden`}
							>
								<div className="px-5 py-3 flex items-center justify-between border-b border-ink/10 bg-background-elev/50">
									<div className="flex items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.18em] text-ink/60">
										{icon && (
											<svg
												viewBox="0 0 24 24"
												className="w-3.5 h-3.5"
												fill={icon.custom ? undefined : "currentColor"}
											>
												{icon.custom ?? <path d={icon.path} />}
											</svg>
										)}
										{c.name} · scheduled
									</div>
									<span className="text-[10.5px] text-ink/50 font-mono">
										4 this week
									</span>
								</div>

								{/* 3-item preview grid */}
								<div className="p-5 space-y-2.5">
									{c.postTypes.slice(0, 3).map((p, i) => (
										<div
											key={p.label}
											className="rounded-2xl bg-background-elev border border-border px-4 py-3 flex items-center gap-3"
										>
											<div
												className={`w-10 h-10 rounded-lg ${p.tone} flex items-center justify-center text-[11px] font-display text-ink shrink-0`}
											>
												{p.label[0]}
											</div>
											<div className="min-w-0 flex-1">
												<p className="text-[12.5px] font-semibold text-ink">
													{p.label}
												</p>
												<p className="text-[11px] text-ink/65 truncate">
													{p.desc}
												</p>
											</div>
											<span className="text-[10px] font-mono text-ink/45 shrink-0">
												{i === 0
													? "tue 09:30"
													: i === 1
														? "thu 12:00"
														: "fri 19:00"}
											</span>
										</div>
									))}
								</div>

								<div className="px-5 py-3 border-t border-ink/10 bg-background-elev/50 flex items-center justify-between">
									<span className="text-[11px] text-ink/60">
										all on voice · 93%
									</span>
									<button className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-ink text-background text-[11.5px] font-medium">
										Schedule
										<ArrowRight className="w-3 h-3" />
									</button>
								</div>
							</div>

							{icon && (
								<div className="hidden sm:flex absolute -bottom-5 -left-6 lg:-left-10 items-center gap-2.5 bg-background-elev text-ink border border-border-strong rounded-full pl-3 pr-4 py-2 shadow-[0_14px_30px_-16px_rgba(23,20,18,0.35)] -rotate-3">
									<span className="w-6 h-6 grid place-items-center rounded-full bg-ink text-background-elev">
										<svg
											viewBox="0 0 24 24"
											className="w-3 h-3"
											fill={icon.custom ? undefined : "currentColor"}
										>
											{icon.custom ?? <path d={icon.path} />}
										</svg>
									</span>
									<span className="text-[11.5px] font-medium">{c.name}</span>
									<span className="text-[11px] text-ink/50 font-mono">
										· connected
									</span>
								</div>
							)}
						</div>
					</div>
				</div>
			</section>

			{/* ─── POST TYPES ──────────────────────────────────────────────── */}
			<section className="bg-background-elev">
				<section
					id="post-types"
					className="py-24 lg:py-32 pb-32 lg:pb-40 bg-background wavy"
				>
					<div className="max-w-[1320px] mx-auto px-6 lg:px-10">
						<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 mb-14 items-end">
							<div className="col-span-12 lg:col-span-7">
								<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
									What you can post
								</p>
								<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
									Every format
									<br />
									<span className="text-primary">{c.name} ships,</span>
									<br />
									without the hacks.
								</h2>
							</div>
							<p className="col-span-12 lg:col-span-4 text-[15.5px] text-ink/70 leading-[1.55]">
								{c.voiceNote}
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
							{c.postTypes.map((p) => (
								<article
									key={p.label}
									className={`p-6 lg:p-7 rounded-3xl ${p.tone} flex flex-col min-h-[220px]`}
								>
									<span className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink/55">
										Post type
									</span>
									<h3 className="mt-6 font-display text-[24px] leading-[1.2] tracking-[-0.01em]">
										{p.label}
									</h3>
									<p className="mt-3 text-[13.5px] text-ink/75 leading-normal">
										{p.desc}
									</p>
								</article>
							))}
						</div>
					</div>
				</section>
			</section>

			{/* ─── NATIVE SUPPORT ─────────────────────────────────────────── */}
			<section className="py-24 lg:py-32 bg-background-elev wavy">
				<div className="max-w-[1320px] mx-auto px-6 lg:px-10 pb-8 lg:pb-12">
					<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 mb-14">
						<div className="col-span-12 lg:col-span-6">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Native support
							</p>
							<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
								No 'phone-reminder'
								<br />
								<span className="text-primary">hacks.</span>
							</h2>
						</div>
						<p className="col-span-12 lg:col-span-5 lg:col-start-8 text-[16px] text-ink/70 leading-[1.6] self-end">
							Where {c.name}'s API lets us, we ship natively. Where it doesn't,
							we say so — no 'send a reminder to post this on your phone'
							workarounds dressed up as scheduling.
						</p>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
						{/* supports */}
						<div className="rounded-3xl bg-background border border-border p-8 lg:p-10">
							<div className="flex items-center gap-2 mb-6">
								<span className="w-2 h-2 rounded-full bg-primary" />
								<span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
									We support
								</span>
							</div>
							<ul className="space-y-3.5 text-[14.5px] text-ink/85">
								{c.supports.map((s) => (
									<li key={s} className="flex items-start gap-3">
										<Check
											className="w-4 h-4 mt-[3px] text-primary shrink-0"
											strokeWidth={2.5}
										/>
										{s}
									</li>
								))}
							</ul>
						</div>

						{/* not yet */}
						<div
							className={`rounded-3xl bg-ink text-background-elev p-8 lg:p-10 ${c.missing.length === 0 ? "opacity-60" : ""}`}
						>
							<div className="flex items-center gap-2 mb-6">
								<span className="w-2 h-2 rounded-full bg-peach-300" />
								<span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-peach-200">
									Honest about
								</span>
							</div>
							{c.missing.length > 0 ? (
								<ul className="space-y-3.5 text-[14.5px]">
									{c.missing.map((m) => (
										<li key={m} className="flex items-start gap-3">
											<XIcon
												className="w-4 h-4 mt-[3px] text-peach-300 shrink-0"
												strokeWidth={2.5}
											/>
											<span className="text-background-elev/85">{m}</span>
										</li>
									))}
								</ul>
							) : (
								<p className="text-[14.5px] text-background-elev/75">
									At parity with the {c.name} API. We'll update this list the
									moment it drifts.
								</p>
							)}
							<p className="mt-6 text-[12.5px] text-background-elev/55 leading-normal">
								When {c.name} ships a new API, we usually catch up within a
								release or two — see the{" "}
								<Link
									href={routes.product.whatsNew}
									className="text-peach-300 pencil-link"
								>
									changelog
								</Link>
								.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* ─── BEST TIME ───────────────────────────────────────────────── */}
			<section className="bg-background-elev">
				<section className="py-24 lg:py-32 pb-32 lg:pb-40 bg-background wavy">
					<div className="max-w-[1320px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-16 items-center">
						<div className="col-span-12 lg:col-span-5 order-2 lg:order-1">
							<div className={`rounded-3xl ${c.accent} p-8 lg:p-10`}>
								<div className="flex items-center justify-between mb-6">
									<div className="flex items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.22em] text-ink/60">
										<Clock className="w-3 h-3" />
										{c.name} · engagement by hour
									</div>
									<span className="text-[10.5px] text-ink/55 font-mono">
										peak · {peakHour}:00
									</span>
								</div>

								{/* bar chart */}
								<div className="flex items-end gap-[3px] h-[140px]">
									{c.bestTimes.map((v, i) => (
										<div
											key={i}
											className={`flex-1 rounded-t-sm ${
												i === peakHour ? "bg-primary" : "bg-ink/70"
											}`}
											style={{ height: `${Math.max(6, v)}%` }}
										/>
									))}
								</div>
								<div className="mt-3 flex justify-between text-[10px] font-mono text-ink/45">
									{HOUR_LABELS.map((h) => (
										<span key={h}>{h}</span>
									))}
								</div>

								<div className="mt-6 p-4 rounded-2xl bg-background-elev/70 flex items-start gap-3">
									<Sparkle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
									<p className="text-[12.5px] leading-normal text-ink/85">
										{c.peakInsight}
									</p>
								</div>
							</div>
						</div>

						<div className="col-span-12 lg:col-span-6 lg:col-start-7 order-1 lg:order-2">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Best-time windows
							</p>
							<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
								Post when
								<br />
								<span className="text-primary">your audience is here.</span>
							</h2>
							<p className="mt-6 text-[16px] lg:text-[17px] text-ink/75 leading-[1.6] max-w-lg">
								Every channel runs on its own clock. Aloha learns yours from
								your last 90 days and surfaces the windows worth defending.
								Drag-to-schedule snaps to these by default; you can always
								override.
							</p>

							<ul className="mt-8 space-y-3 text-[14.5px] text-ink/85">
								{[
									`Peak window discovered from your own ${c.name} data, not an industry average.`,
									"Re-learned weekly — habits change, and the queue notices.",
									"Quiet-hour enforcement so nothing lands at 3am by accident.",
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

							<Link
								href={routes.tools.bestTimeFinder}
								className="pencil-link mt-8 inline-flex items-center gap-2 text-[14.5px] font-medium text-ink"
							>
								Try the free best-time finder
								<ArrowUpRight className="w-4 h-4" />
							</Link>
						</div>
					</div>
				</section>
			</section>

			{/* ─── TEMPLATES ───────────────────────────────────────────────── */}
			<section className={cn(c.testimonial.tone)}>
				<section className="py-24 lg:py-28 bg-background-elev wavy">
					<div className="max-w-[1320px] mx-auto px-6 lg:px-10 pb-8 lg:pb-12">
						<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 items-end mb-10">
							<div className="col-span-12 lg:col-span-7">
								<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
									Templates for {c.name}
								</p>
								<h2 className="font-display text-[32px] lg:text-[44px] leading-[1.02] tracking-[-0.02em]">
									Three shapes that
									<span className="text-primary"> work.</span>
								</h2>
							</div>
							<p className="col-span-12 lg:col-span-4 text-[15.5px] text-ink/70 leading-[1.55]">
								Battle-tested by creators who live on this channel. Clone,
								rename, customise, ship.
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
							{c.templates.map((t, i) => (
								<article
									key={t.name}
									className={`relative rounded-3xl p-6 lg:p-7 flex flex-col min-h-[220px] ${
										i === 0
											? "bg-peach-100"
											: i === 1
												? "bg-peach-200"
												: "bg-primary-soft"
									}`}
								>
									<div className="flex items-center justify-between">
										<span className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink/55">
											Template
										</span>
										<span className="text-[10.5px] font-medium text-ink/60">
											{t.count}
										</span>
									</div>
									<h3 className="mt-10 font-display text-[22px] leading-[1.2] tracking-[-0.01em]">
										{t.name}
									</h3>
									<p className="mt-3 text-[13.5px] text-ink/75 leading-normal">
										{t.desc}
									</p>
									<Link
										href={routes.resources.templates}
										className="mt-auto pt-5 self-start pencil-link text-[13px] font-medium text-ink inline-flex items-center gap-1.5"
									>
										Open in Composer
										<ArrowUpRight className="w-3.5 h-3.5" />
									</Link>
								</article>
							))}
						</div>

						<div className="mt-10 text-[13.5px] text-ink/60">
							<Link
								href={routes.resources.templates}
								className="pencil-link inline-flex items-center gap-2"
							>
								Browse the whole library
								<ArrowUpRight className="w-3.5 h-3.5" />
							</Link>
						</div>
					</div>
				</section>
			</section>

			{/* ─── TESTIMONIAL ────────────────────────────────────────────── */}
			<section className="bg-background-elev">
				<section className={cn("py-24 lg:py-28 wavy", c.testimonial.tone)}>
					<div className="max-w-[1100px] mx-auto px-6 lg:px-10 pb-8 lg:pb-12">
						<figure
							className={`relative ${c.testimonial.tone} rounded-3xl p-10 lg:p-14`}
						>
							<MessageSquareQuote className="w-8 h-8 text-ink/40 mb-6" />
							<blockquote className="font-display text-[26px] lg:text-[34px] leading-[1.2] tracking-[-0.015em] max-w-3xl">
								"{c.testimonial.q}"
							</blockquote>
							<figcaption className="mt-8 flex items-center gap-4">
								<span className="w-11 h-11 rounded-full bg-ink text-background-elev font-display flex items-center justify-center">
									{c.testimonial.ini}
								</span>
								<div>
									<p className="font-medium">{c.testimonial.n}</p>
									<p className="text-[13px] text-ink/60">{c.testimonial.r}</p>
								</div>
							</figcaption>
						</figure>
					</div>
				</section>
			</section>

			{/* ─── OTHER CHANNELS ──────────────────────────────────────────── */}
			<section className="bg-ink relative">
				<div
					aria-hidden
					className="absolute inset-0 top-0.5! opacity-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<section className="py-24 lg:py-28 pb-32 lg:pb-40 bg-background-elev wavy">
					<div className="max-w-[1320px] mx-auto px-6 lg:px-10">
						<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 mb-10 items-end">
							<div className="col-span-12 lg:col-span-7">
								<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
									Seven other channels
								</p>
								<h2 className="font-display text-[32px] lg:text-[44px] leading-[1.02] tracking-[-0.02em]">
									All on
									<span className="text-primary"> one draft.</span>
								</h2>
							</div>
							<p className="col-span-12 lg:col-span-4 text-[15.5px] text-ink/70 leading-[1.55]">
								Aloha writes native variants for every channel from one source.
								Connect as many as make sense for you.
							</p>
						</div>

						<ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 border-t border-l border-border">
							{Object.values(CHANNELS)
								.filter((other) => other.slug !== c.slug)
								.map((other) => {
									const oIcon = getIcon(other.name);
									return (
										<li key={other.slug}>
											<Link
												href={`/channels/${other.slug}`}
												className="p-6 lg:p-7 flex items-start justify-between group hover:bg-muted/40 transition-colors border-r border-b border-border"
											>
												<div className="flex items-start gap-4">
													{oIcon && (
														<span className="w-10 h-10 grid place-items-center rounded-full border border-border-strong text-ink group-hover:bg-ink group-hover:text-background-elev group-hover:border-ink transition-colors shrink-0">
															<svg
																viewBox="0 0 24 24"
																className="w-[15px] h-[15px]"
																fill={oIcon.custom ? undefined : "currentColor"}
															>
																{oIcon.custom ?? <path d={oIcon.path} />}
															</svg>
														</span>
													)}
													<div>
														<p className="font-display text-[22px] leading-none tracking-[-0.015em]">
															{other.name}
														</p>
														<p className="mt-2 text-[12px] text-ink/55 max-w-[15ch]">
															{other.tagline}
														</p>
													</div>
												</div>
												<ArrowUpRight className="w-4 h-4 text-ink/30 group-hover:text-primary transition-colors mt-1 shrink-0" />
											</Link>
										</li>
									);
								})}
						</ul>
					</div>
				</section>
			</section>

			{/* ─── FINAL CTA ───────────────────────────────────────────────── */}
			<section className="relative overflow-hidden bg-ink text-background-elev wavy">
				<div
					aria-hidden
					className="absolute inset-0 top-2! opacity-10 -z-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-24 lg:py-32 pb-32 lg:pb-40">
					<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 items-end">
						<div className="col-span-12 lg:col-span-8">
							<h2 className="font-display text-[44px] sm:text-[56px] lg:text-[80px] leading-[0.98] tracking-[-0.025em]">
								{c.cta.line1}
								<br />
								<span className="text-peach-300">{c.cta.line2}</span>
							</h2>
						</div>
						<div className="col-span-12 lg:col-span-4 flex flex-col gap-4 lg:items-end">
							<Link
								href={routes.signin}
								className="inline-flex items-center gap-2 h-14 px-7 rounded-full text-background font-medium text-[15px] bg-primary transition-colors"
							>
								Connect {c.name}
								<ArrowRight className="w-4 h-4" />
							</Link>
							<Link
								href={routes.product.composer}
								className="pencil-link inline-flex items-center gap-2 text-[14.5px] font-medium"
							>
								Pair it with the Composer
								<ArrowUpRight className="w-4 h-4" />
							</Link>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
