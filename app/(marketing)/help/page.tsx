import { routes } from "@/lib/routes";
import { makeMetadata } from "@/lib/seo";
import {
	ArrowUpRight,
	BookOpen,
	Clock,
	CreditCard,
	LifeBuoy,
	Link as LinkIcon,
	Mail,
	Search,
	Shield,
	Users,
	Zap,
} from "lucide-react";
import Link from "next/link";

export const metadata = makeMetadata({
	title: "Help center — search first, then email a human",
	description:
		"Aloha's help center. Category guides, the top ten articles everyone asks, and a direct email to a real person when the search didn't answer it.",
	path: routes.resources.helpCenter,
});

const CATEGORIES = [
	{
		icon: Zap,
		h: "Getting started",
		p: "Your first post, connecting a channel, understanding the calendar.",
		count: 14,
		tone: "bg-peach-200",
	},
	{
		icon: BookOpen,
		h: "Composer & voice",
		p: "Training the voice model, per-channel rewrites, approval flows.",
		count: 22,
		tone: "bg-primary-soft",
	},
	{
		icon: Users,
		h: "Teams & permissions",
		p: "Inviting teammates, roles, brand kits, approval rules.",
		count: 11,
		tone: "bg-peach-100",
	},
	{
		icon: LinkIcon,
		h: "Link-in-bio",
		p: "Claiming your page, custom domains, subscriber capture.",
		count: 9,
		tone: "bg-peach-300",
	},
	{
		icon: CreditCard,
		h: "Billing & plans",
		p: "Changing plans, invoices, refunds, nonprofit discount.",
		count: 16,
		tone: "bg-peach-100",
	},
	{
		icon: Shield,
		h: "Privacy & security",
		p: "Data export, account deletion, 2FA, compliance questions.",
		count: 12,
		tone: "bg-background-elev border border-border",
	},
];

const TOP_ARTICLES = [
	{
		h: "How do I connect an Instagram account?",
		c: "Getting started",
		read: "3 min",
	},
	{
		h: "Training the voice model — step by step",
		c: "Composer & voice",
		read: "5 min",
	},
	{
		h: "Setting up per-brand voice for a team",
		c: "Composer & voice",
		read: "4 min",
	},
	{
		h: "Cancelling or downgrading a plan",
		c: "Billing & plans",
		read: "2 min",
	},
	{
		h: "Exporting all my data (CSV / JSON)",
		c: "Privacy & security",
		read: "2 min",
	},
	{ h: "Why did my reel cover change?", c: "Getting started", read: "3 min" },
	{
		h: "Claiming a custom domain for link-in-bio",
		c: "Link-in-bio",
		read: "4 min",
	},
	{
		h: "Invite a teammate without giving them full access",
		c: "Teams & permissions",
		read: "3 min",
	},
	{
		h: "Troubleshooting: scheduled post didn't go live",
		c: "Getting started",
		read: "4 min",
	},
	{
		h: "Nonprofit discount — how to apply",
		c: "Billing & plans",
		read: "2 min",
	},
];

export default function HelpCenterPage() {
	return (
		<>
			{/* ─── HERO with SEARCH ───────────────────────────────────────── */}
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
				<div className="relative max-w-[1080px] mx-auto px-6 lg:px-10 pt-20 lg:pt-28 text-center pb-32 lg:pb-40">
					<div className="inline-flex items-center gap-3 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
						<span className="w-6 h-px bg-ink/40" />
						Help center
						<span className="w-6 h-px bg-ink/40" />
					</div>
					<h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[96px]">
						Search first.
						<br />
						<span className="text-primary font-light">Then email a human.</span>
					</h1>
					<p className="mt-8 max-w-xl mx-auto text-[17px] lg:text-[18px] leading-[1.6] text-ink/75">
						84 articles, roughly organised. If yours isn't one of them — or if
						you just want to talk to a person — the support inbox is read by the
						whole team.
					</p>

					{/* search */}
					<form action="#" className="mt-12 max-w-2xl mx-auto relative">
						<Search className="w-5 h-5 absolute left-6 top-1/2 -translate-y-1/2 text-ink/40" />
						<input
							type="search"
							placeholder="Search articles — e.g. 'connect Instagram', 'export my data'…"
							className="w-full h-16 pl-16 pr-28 rounded-full bg-background-elev border border-border-strong text-[15px] text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary shadow-[0_10px_30px_-12px_rgba(23,20,18,0.12)]"
						/>
						<button
							type="submit"
							className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors"
						>
							Search
						</button>
					</form>
					<p className="mt-3 text-[12.5px] text-ink/50 font-mono">
						Press / to focus. Search runs locally — no keystrokes sent anywhere.
					</p>
				</div>
			</section>

			{/* ─── CATEGORIES ─────────────────────────────────────────────── */}
			<section className="bg-background-elev">
				<section className="py-20 lg:py-24 pb-32 lg:pb-40 wavy bg-background">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
						<div className="mb-12">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Browse by category
							</p>
							<h2 className="font-display text-[32px] lg:text-[44px] leading-[1.02] tracking-[-0.02em]">
								Six places
								<span className="text-primary"> to look.</span>
							</h2>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
							{CATEGORIES.map((c) => (
								<Link
									key={c.h}
									href="#"
									className={`group ${c.tone} rounded-3xl p-7 lg:p-8 flex flex-col hover:-translate-y-1 transition-transform min-h-[200px]`}
								>
									<div className="flex items-start justify-between">
										<c.icon className="w-6 h-6 text-ink" />
										<span className="text-[10.5px] font-mono uppercase tracking-[0.18em] text-ink/55">
											{c.count} articles
										</span>
									</div>
									<h3 className="mt-7 font-display text-[22px] leading-[1.15] tracking-[-0.005em]">
										{c.h}
									</h3>
									<p className="mt-3 text-[14px] text-ink/75 leading-[1.6]">
										{c.p}
									</p>
									<span className="mt-auto pt-6 pencil-link text-[13px] font-medium text-ink inline-flex items-center gap-2">
										Browse {c.h.toLowerCase()}
										<ArrowUpRight className="w-3.5 h-3.5" />
									</span>
								</Link>
							))}
						</div>
					</div>
				</section>
			</section>

			{/* ─── TOP 10 ─────────────────────────────────────────────────── */}
			<section className="bg-primary-soft">
				<section className="py-20 lg:py-24 bg-background-elev wavy pb-32 lg:pb-40">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10 pb-8 lg:pb-12">
						<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 items-end mb-10">
							<div className="col-span-12 lg:col-span-7">
								<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
									Top ten articles
								</p>
								<h2 className="font-display text-[32px] lg:text-[44px] leading-[1.02] tracking-[-0.02em]">
									What most people
									<br />
									<span className="text-primary">land on first.</span>
								</h2>
							</div>
							<p className="col-span-12 lg:col-span-5 text-[15px] text-ink/70 leading-[1.55]">
								Re-sorted weekly. If a guide here needs an update, you'll see a
								freshness chip next to it.
							</p>
						</div>

						<ol className="rounded-3xl border border-border overflow-hidden bg-background">
							{TOP_ARTICLES.map((a, i) => (
								<li
									key={a.h}
									className={`border-b border-border last:border-b-0 ${i % 2 === 1 ? "bg-muted/10" : ""}`}
								>
									<Link
										href="#"
										className="group grid grid-cols-12 gap-x-0 gap-y-4 lg:gap-4 px-6 lg:px-8 py-5 items-center hover:bg-muted/25 transition-colors"
									>
										<div className="col-span-1 font-display text-[22px] text-ink/45 leading-none">
											{String(i + 1).padStart(2, "0")}
										</div>
										<div className="col-span-12 md:col-span-8 min-w-0">
											<p className="font-display text-[18px] lg:text-[20px] leading-[1.2] tracking-[-0.005em] text-ink group-hover:text-primary transition-colors">
												{a.h}
											</p>
											<p className="mt-1 text-[11.5px] font-mono uppercase tracking-[0.14em] text-ink/55">
												{a.c}
											</p>
										</div>
										<div className="col-span-12 md:col-span-3 md:text-right flex md:justify-end items-center gap-3 text-[12px] text-ink/55 font-mono">
											<span className="inline-flex items-center gap-1.5">
												<Clock className="w-3 h-3" />
												{a.read}
											</span>
											<ArrowUpRight className="w-4 h-4 text-ink/40 group-hover:text-primary transition-colors" />
										</div>
									</Link>
								</li>
							))}
						</ol>
					</div>
				</section>
			</section>

			{/* ─── CROSS LINKS ────────────────────────────────────────────── */}
			<section className="bg-ink relative">
				<div
					aria-hidden
					className="absolute inset-0 top-2! opacity-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<section className="py-16 lg:py-20 bg-primary-soft pb-32 lg:pb-40 wavy">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
							{[
								{
									h: "Read the changelog",
									p: "What shipped recently.",
									href: routes.product.whatsNew,
								},
								{
									h: "Live status",
									p: "Everything green right now?",
									href: routes.resources.status,
								},
								{
									h: "API + docs",
									p: "For the developers among you.",
									href: routes.resources.apiDocs,
								},
							].map((l) => (
								<Link
									key={l.href}
									href={l.href}
									className="group p-6 rounded-2xl bg-background border border-border hover:bg-muted/30 transition-colors"
								>
									<p className="font-display text-[19px] leading-[1.2] tracking-[-0.005em]">
										{l.h}
									</p>
									<p className="mt-2 text-[12.5px] text-ink/60">{l.p}</p>
									<ArrowUpRight className="mt-4 w-3.5 h-3.5 text-ink/40 group-hover:text-primary transition-colors" />
								</Link>
							))}
						</div>
					</div>
				</section>
			</section>

			{/* ─── STILL STUCK ────────────────────────────────────────────── */}
			<section className="py-20 lg:py-28 bg-ink relative wavy text-background-elev">
				<div
					aria-hidden
					className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<div className="max-w-[1180px] mx-auto px-6 lg:px-10 pb-8 lg:pb-12">
					<div className="p-10 lg:p-14 rounded-3xl overflow-hidden relative">
						<div className="relative grid grid-cols-12 gap-x-0 gap-y-8 lg:gap-8 items-center">
							<div className="col-span-12 lg:col-span-8">
								<LifeBuoy className="w-7 h-7 text-peach-300 mb-5" />
								<h2 className="font-display text-[32px] lg:text-[44px] leading-[1.05] tracking-[-0.015em]">
									Still stuck?
									<br />
									<span className="text-peach-300">
										Email beats form, every time.
									</span>
								</h2>
								<p className="mt-5 text-[15px] text-background-elev/75 leading-[1.6] max-w-xl">
									hello@usealoha.app goes to the whole team. One business day or
									less. Screenshots and Loom links welcome — it's always faster
									than typing it out.
								</p>
							</div>
							<div className="col-span-12 lg:col-span-4 flex flex-col gap-3 lg:items-end">
								<a
									href="mailto:hello@usealoha.app"
									className="inline-flex items-center gap-2 h-12 px-6 rounded-full text-[14px] font-medium bg-primary transition-colors"
								>
									<Mail className="w-4 h-4" />
									hello@usealoha.app
								</a>
								<Link
									href={routes.company.contact}
									className="pencil-link inline-flex items-center gap-2 text-[13.5px]"
								>
									Other inboxes (security, sales, press)
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
