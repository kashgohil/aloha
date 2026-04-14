import { routes } from "@/lib/routes";
import { makeMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";
import {
	ArrowRight,
	ArrowUpRight,
	CalendarDays,
	FileText,
	GitBranch,
	Layers,
	Mic,
	Sparkle,
} from "lucide-react";
import Link from "next/link";

export const metadata = makeMetadata({
	title: "Templates — clone-and-ship shapes for the Composer",
	description:
		"Aloha's template library. Campaign templates, matrix templates, voice presets — clone into the Composer in two clicks.",
	path: routes.resources.templates,
});

type TemplateCategory = "campaign" | "matrix" | "voice" | "post";

type Template = {
	slug: string;
	name: string;
	category: TemplateCategory;
	desc: string;
	posts: string;
	channels: string[];
	tone: string;
	featured?: boolean;
};

const TEMPLATES: Template[] = [
	{
		slug: "launch-week-7-beats",
		name: "Launch week · 7 beats",
		category: "campaign",
		desc: "Six-week-out → launch-day → seven-days-after schedule. Pre-wired across LinkedIn, X, Instagram, and Threads.",
		posts: "7 posts · 6 weeks",
		channels: ["LinkedIn", "X", "Instagram", "Threads"],
		tone: "bg-primary-soft",
		featured: true,
	},
	{
		slug: "weekly-trio-creator",
		name: "Weekly trio · creator",
		category: "campaign",
		desc: "One long-form, one carousel, one short. Keeps the cadence varied without thinking about it.",
		posts: "3 posts / week",
		channels: ["LinkedIn", "Instagram", "TikTok"],
		tone: "bg-primary-soft",
	},
	{
		slug: "monthly-digest",
		name: "Monthly digest",
		category: "campaign",
		desc: "Newsletter → LinkedIn carousel → Threads excerpt → evergreen pin. Same idea, four shapes.",
		posts: "4 posts / month",
		channels: ["LinkedIn", "Threads", "Pinterest"],
		tone: "bg-primary-soft",
	},
	{
		slug: "first-reply-welcome",
		name: "First-reply welcome DM",
		category: "matrix",
		desc: "When a new follower engages within 24h, draft a warm first DM. Approve before it sends. Never auto-spams.",
		posts: "3 nodes",
		channels: ["Instagram"],
		tone: "bg-primary-soft",
	},
	{
		slug: "ig-threads-mirror",
		name: "IG → Threads mirror",
		category: "matrix",
		desc: "Mirror every IG post to Threads 15 minutes later, with native Threads formatting.",
		posts: "2 nodes",
		channels: ["Instagram", "Threads"],
		tone: "bg-primary-soft",
	},
	{
		slug: "reply-triage",
		name: "Reply triage",
		category: "matrix",
		desc: "Route comments mentioning 'price' or 'demo' to the inbox owner. Auto-like the rest.",
		posts: "5 nodes",
		channels: ["Instagram", "X", "LinkedIn"],
		tone: "bg-primary-soft",
	},
	{
		slug: "best-of-recycler",
		name: "Best-of recycler",
		category: "matrix",
		desc: "Every 90 days, resurface posts in the top 5% of engagement, with a soft Composer rewrite.",
		posts: "4 nodes",
		channels: ["LinkedIn", "X"],
		tone: "bg-primary-soft",
	},
	{
		slug: "voice-preset-essay",
		name: "Voice preset · essay-writer",
		category: "voice",
		desc: "Long sentences, occasional em-dash, no exclamations. Trained from a 12-post seed of long-form posts.",
		posts: "Voice profile",
		channels: ["LinkedIn", "Newsletter"],
		tone: "bg-peach-100",
	},
	{
		slug: "voice-preset-tightener",
		name: "Voice preset · tightener",
		category: "voice",
		desc: "Short sentences, no filler, no rhetorical questions. For X-first creators who write like they tweet.",
		posts: "Voice profile",
		channels: ["X", "Threads"],
		tone: "bg-primary-soft",
	},
	{
		slug: "carousel-7-frames",
		name: "Carousel · 7-frame template",
		category: "post",
		desc: "Hook frame · 5 idea frames · close frame. Plays well as Instagram carousel or LinkedIn document.",
		posts: "1 carousel",
		channels: ["Instagram", "LinkedIn"],
		tone: "bg-peach-200",
	},
	{
		slug: "thread-5-tweet",
		name: "Thread · 5-tweet shape",
		category: "post",
		desc: "Hook → setup → turn → payoff → CTA. Composer auto-paces the drops, numbers optional.",
		posts: "1 thread",
		channels: ["X"],
		tone: "bg-peach-300",
	},
	{
		slug: "case-study-arc",
		name: "Case study arc",
		category: "post",
		desc: "Story → numbers → lesson, paired with a Company Page cross-post. For B2B teams.",
		posts: "2 posts",
		channels: ["LinkedIn"],
		tone: "bg-primary-soft",
	},
];

const CATEGORY_META: Record<
	TemplateCategory,
	{ name: string; icon: typeof Sparkle; eyebrow: string; tone: string }
> = {
	campaign: {
		name: "Campaigns",
		icon: CalendarDays,
		eyebrow: "Multi-post arcs",
		tone: "text-primary",
	},
	matrix: {
		name: "Matrices",
		icon: GitBranch,
		eyebrow: "Automation flows",
		tone: "text-primary",
	},
	voice: {
		name: "Voice presets",
		icon: Mic,
		eyebrow: "Composer training shapes",
		tone: "text-primary",
	},
	post: {
		name: "Single posts",
		icon: FileText,
		eyebrow: "Standalone shapes",
		tone: "text-primary",
	},
};

const CATEGORIES: TemplateCategory[] = ["campaign", "matrix", "voice", "post"];

export default function TemplatesPage() {
	const featured = TEMPLATES.find((t) => t.featured);

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

			<section className={featured?.tone}>
				<section className="bg-peach-200 wavy">
					<div className="relative max-w-[1180px] mx-auto px-6 lg:px-10 pt-20 lg:pt-28 pb-32 lg:pb-40">
						<div className="grid grid-cols-12 gap-x-0 gap-y-8 lg:gap-12 items-end">
							<div className="col-span-12 lg:col-span-8">
								<div className="flex flex-wrap items-center gap-3 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
									<Link href={routes.resources.index} className="pencil-link">
										Resources
									</Link>
									<span className="text-ink/25">·</span>
									<span>Templates</span>
									<span className="px-2 py-0.5 bg-background-elev border border-border rounded-full text-ink/65 text-[10px] font-mono normal-case tracking-normal">
										{TEMPLATES.length} templates
									</span>
								</div>
								<h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[96px]">
									Clone-and-ship
									<br />
									<span className="text-primary font-light">
										shapes that work.
									</span>
								</h1>
								<p className="mt-8 max-w-2xl text-[17px] lg:text-[18px] leading-[1.6] text-ink/75">
									Campaigns, matrices, voice presets, post shapes. Each template
									opens directly in the Composer with the right channels,
									cadence, and rewrites pre-wired. Edit everything; that's the
									point.
								</p>
							</div>
							<div className="col-span-12 lg:col-span-4">
								<div className="p-5 rounded-3xl bg-background-elev border border-border space-y-3">
									<p className="text-[10.5px] font-mono uppercase tracking-[0.22em] text-ink/55">
										Jump to
									</p>
									{CATEGORIES.map((c) => {
										const meta = CATEGORY_META[c];
										return (
											<a
												key={c}
												href={`#${c}`}
												className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/50 transition-colors"
											>
												<span className="inline-flex items-center gap-2 text-[13px] font-medium text-ink">
													<meta.icon className="w-3.5 h-3.5 text-primary" />
													{meta.name}
												</span>
												<ArrowUpRight className="w-3.5 h-3.5 text-ink/35 group-hover:text-primary transition-colors" />
											</a>
										);
									})}
								</div>
							</div>
						</div>
					</div>
				</section>
			</section>

			{/* ─── FEATURED ───────────────────────────────────────────────── */}
			{featured && (
				<section className={cn("py-12 lg:py-16", featured.tone, "wavy")}>
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10 pb-8 lg:pb-12">
						<article
							className={`${featured.tone} rounded-3xl p-10 lg:p-14 grid grid-cols-12 gap-x-0 gap-y-8 lg:gap-8 items-end`}
						>
							<div className="col-span-12 lg:col-span-8">
								<div className="flex items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.22em] text-ink/55 mb-5">
									<Sparkle className="w-3 h-3 text-primary" />
									Featured · campaign template
								</div>
								<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.05] tracking-[-0.015em]">
									{featured.name}
								</h2>
								<p className="mt-5 text-[16px] lg:text-[17px] leading-[1.6] text-ink/80 max-w-xl">
									{featured.desc}
								</p>
								<div className="mt-6 flex flex-wrap items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.14em] text-ink/65">
									<span className="px-2.5 py-1 bg-background-elev/70 border border-ink/8 rounded-full">
										{featured.posts}
									</span>
									{featured.channels.map((c) => (
										<span
											key={c}
											className="px-2.5 py-1 bg-background-elev/70 border border-ink/8 rounded-full"
										>
											{c}
										</span>
									))}
								</div>
							</div>
							<div className="col-span-12 lg:col-span-4 flex flex-col gap-3 lg:items-end">
								<Link
									href={routes.signin}
									className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
								>
									Open in Composer
									<ArrowRight className="w-4 h-4" />
								</Link>
								<Link
									href={`${routes.resources.playbooks}/${featured.slug}`}
									className="pencil-link text-[13px] font-medium text-ink inline-flex items-center gap-2"
								>
									Read the playbook first
									<ArrowUpRight className="w-3.5 h-3.5" />
								</Link>
							</div>
						</article>
					</div>
				</section>
			)}

			{/* ─── BY CATEGORY ────────────────────────────────────────────── */}
			{CATEGORIES.map((cat) => {
				const meta = CATEGORY_META[cat];
				const list = TEMPLATES.filter((t) => t.category === cat);
				const content = (
					<section
						key={cat}
						id={cat}
						className={`py-16 lg:py-20 ${cat === "matrix" || cat === "post" ? "bg-background-elev wavy" : "bg-background wavy"}`}
					>
						<div className="max-w-[1180px] mx-auto px-6 lg:px-10 pb-8 lg:pb-12">
							<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 mb-10 items-end">
								<div className="col-span-12 lg:col-span-7">
									<div className="inline-flex items-center gap-2 mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
										<meta.icon className={`w-3.5 h-3.5 ${meta.tone}`} />
										{meta.eyebrow}
									</div>
									<h2 className="font-display text-[32px] lg:text-[44px] leading-[1.02] tracking-[-0.02em]">
										{meta.name}
									</h2>
								</div>
								<p className="col-span-12 lg:col-span-5 text-[14px] text-ink/65 font-mono uppercase tracking-[0.12em]">
									{list.length} {list.length === 1 ? "template" : "templates"}{" "}
									in this set
								</p>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
								{list.map((t) => (
									<article
										key={t.slug}
										className={`group ${t.tone} rounded-3xl p-6 lg:p-7 flex flex-col min-h-[240px]`}
									>
										<div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.18em] text-ink/55">
											<span>{t.posts}</span>
											<span>
												{t.channels.length}{" "}
												{t.channels.length === 1 ? "channel" : "channels"}
											</span>
										</div>
										<h3 className="mt-7 font-display text-[22px] leading-[1.15] tracking-[-0.005em]">
											{t.name}
										</h3>
										<p className="mt-3 text-[13.5px] text-ink/75 leading-[1.55] flex-1">
											{t.desc}
										</p>

										<ul className="mt-5 flex flex-wrap gap-1.5">
											{t.channels.map((c) => (
												<li
													key={c}
													className="px-2 py-0.5 rounded-full bg-background-elev/70 border border-ink/8 text-[10.5px] font-mono text-ink/65 uppercase tracking-widest"
												>
													{c}
												</li>
											))}
										</ul>

										<Link
											href={routes.signin}
											className="mt-5 pencil-link text-[12.5px] font-medium text-ink inline-flex items-center gap-1.5 self-start"
										>
											Open in Composer
											<ArrowUpRight className="w-3.5 h-3.5" />
										</Link>
									</article>
								))}
							</div>
						</div>
					</section>
				);

				if (cat === "campaign" || cat === "voice") {
					return <section className="bg-background-elev">{content}</section>;
				}

				if (cat === "post") {
					return (
						<section className="bg-ink relative">
							<div
								aria-hidden
								className="absolute inset-0 top-2! opacity-[0.08] bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
							/>
							{content}
						</section>
					);
				}

				return content;
			})}

			{/* ─── PITCH ──────────────────────────────────────────────────── */}
			<section className="py-20 lg:py-24 bg-ink relative wavy text-background-elev">
				<div
					aria-hidden
					className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<div className="max-w-[1180px] mx-auto px-6 lg:px-10 pb-8 lg:pb-12">
					<div className="p-10 lg:p-14 rounded-3xl overflow-hidden relative">
						<div className="relative grid grid-cols-12 gap-x-0 gap-y-8 lg:gap-8 items-center">
							<div className="col-span-12 lg:col-span-8">
								<Layers className="w-7 h-7 text-peach-300 mb-5" />
								<h2 className="font-display text-[28px] lg:text-[40px] leading-[1.15] tracking-[-0.015em] max-w-2xl">
									Built a shape worth sharing?
									<br />
									<span className="text-peach-300">Submit a template.</span>
								</h2>
								<p className="mt-5 text-[14px] text-background-elev/75 leading-[1.6] max-w-xl">
									Our best templates come from creators using the product.
									Submit yours, we'll review it, and it joins the gallery with a
									credit.
								</p>
							</div>
							<div className="col-span-12 lg:col-span-4 flex flex-col gap-3 lg:items-end">
								<a
									href="mailto:templates@aloha.social"
									className="inline-flex items-center gap-2 h-12 px-6 rounded-full text-[14px] font-medium bg-primary transition-colors"
								>
									Submit a template
									<ArrowRight className="w-4 h-4" />
								</a>
								<Link
									href={routes.resources.playbooks}
									className="pencil-link inline-flex items-center gap-2 text-[13.5px]"
								>
									Or read the playbooks
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
