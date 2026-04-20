import { routes } from "@/lib/routes";
import { makeMetadata } from "@/lib/seo";
import {
	ArrowRight,
	ArrowUpRight,
	BarChart3,
	Ghost,
	Inbox,
	Languages,
	Mail,
	Megaphone,
	PenLine,
	Plug,
	type LucideIcon,
} from "lucide-react";
import Link from "next/link";

export const metadata = makeMetadata({
	title: "Roadmap — what's coming next",
	description:
		"A plain-English look at what we're planning to ship in Aloha. Dates are intentions, not promises.",
	path: routes.product.roadmap,
});

type RoadmapItem = {
	title: string;
	lead: string;
	icon: LucideIcon;
	tag: string;
};

const ITEMS: RoadmapItem[] = [
	{
		title: "Meta channel connections",
		lead: "Native publishing and scheduling for Facebook Pages, Instagram, and Threads — the same composer, more places to land.",
		icon: Plug,
		tag: "Channels",
	},
	{
		title: "Inbox enhancements",
		lead: "Better filters, bulk actions, assignment rules, and a faster triage flow for teams living in replies and DMs.",
		icon: Inbox,
		tag: "Inbox",
	},
	{
		title: "Analytics enhancements",
		lead: "Deeper cuts on post performance, comparisons across channels, and exports that don't force a spreadsheet detour.",
		icon: BarChart3,
		tag: "Analytics",
	},
	{
		title: "Channel-specific campaigns",
		lead: "Campaigns that adapt the copy, media, and cadence per channel instead of broadcasting the same post everywhere.",
		icon: Megaphone,
		tag: "Composer",
	},
	{
		title: "Multi-language support",
		lead: "Author, schedule, and reply in the language your audience speaks — with the UI following suit.",
		icon: Languages,
		tag: "Platform",
	},
	{
		title: "Medium connect",
		lead: "Draft long-form in the composer and publish straight to Medium, without the copy-paste round trip.",
		icon: PenLine,
		tag: "Channels",
	},
	{
		title: "Snapchat support",
		lead: "Bring Snapchat into the mix so Stories and Spotlight can share the same queue as the rest of your channels.",
		icon: Ghost,
		tag: "Channels",
	},
];

export default function RoadmapPage() {
	return (
		<>
			{/* ─── HERO ────────────────────────────────────────────────────── */}
			<header className="relative overflow-hidden bg-peach-200 pb-16 lg:pb-20">
				<span
					aria-hidden
					className="absolute top-[18%] left-[5%] font-display text-[28px] text-ink/25 rotate-[-8deg] select-none"
				>
					✳
				</span>
				<span
					aria-hidden
					className="absolute top-[68%] right-[10%] font-display text-[22px] text-primary/55 rotate-14 select-none"
				>
					+
				</span>
				<span
					aria-hidden
					className="absolute top-[34%] right-[6%] font-display text-[36px] text-ink/15 rotate-18 select-none"
				>
					※
				</span>
			</header>

			<section className="bg-peach-200 wavy">
				<div className="relative max-w-[1100px] mx-auto px-6 lg:px-10 pt-20 lg:pt-28 pb-32 lg:pb-40">
					<div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
						<div>
							<div className="inline-flex items-center gap-3 mb-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
								Roadmap
							</div>
							<h1 className="font-display font-normal text-ink leading-[0.98] tracking-[-0.03em] text-[56px] sm:text-[68px] lg:text-[88px]">
								What's coming
								<br />
								<span className="text-primary font-light">next.</span>
							</h1>
							<p className="mt-8 max-w-xl text-[16px] lg:text-[17px] leading-[1.55] text-ink/70">
								Our working list of planned features. Dates are intentions, not
								promises — priorities shift when real usage tells us something
								new. Ship date:{" "}
								<span className="text-ink/85">when it's good</span>.
							</p>
						</div>
						<div className="flex items-center gap-4 shrink-0">
							<Link
								href={routes.product.whatsNew}
								className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-background-elev border border-border-strong text-[13px] font-medium hover:bg-muted transition-colors"
							>
								Shipped updates
								<ArrowUpRight className="w-3.5 h-3.5" />
							</Link>
							<a
								href="mailto:hello@usealoha.app?subject=Roadmap%20feedback"
								className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors"
							>
								<Mail className="w-4 h-4" />
								Request a feature
							</a>
						</div>
					</div>
				</div>
			</section>

			{/* ─── PLANNED LIST ────────────────────────────────────────────── */}
			<section className="bg-ink relative">
				<div
					aria-hidden
					className="absolute inset-0 top-2.5! opacity-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<section className="bg-background wavy">
					<div className="relative max-w-[1100px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
						<div className="flex items-baseline justify-between mb-10 lg:mb-14">
							<h2 className="font-display text-[28px] lg:text-[36px] leading-[1.05] tracking-[-0.015em] text-ink">
								Planned
							</h2>
							<span className="text-[11px] font-mono uppercase tracking-[0.22em] text-ink/55">
								{ITEMS.length} items
							</span>
						</div>

						<ul className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-7">
							{ITEMS.map((item) => {
								const Icon = item.icon;
								return (
									<li
										key={item.title}
										className="group relative rounded-3xl bg-background-elev border border-border-strong/60 p-7 lg:p-8"
									>
										<div className="flex items-start justify-between gap-4">
											<span className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-primary-soft text-primary">
												<Icon className="w-5 h-5" />
											</span>
											<span className="inline-flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.2em] text-ink/60 bg-peach-200 px-2.5 py-1 rounded-full">
												<span className="w-1.5 h-1.5 rounded-full bg-primary" />
												Planned
											</span>
										</div>
										<h3 className="mt-6 font-display text-[22px] lg:text-[24px] leading-[1.15] tracking-[-0.01em] text-ink">
											{item.title}
										</h3>
										<p className="mt-3 text-[14px] leading-[1.6] text-ink/75">
											{item.lead}
										</p>
										<div className="mt-6 text-[10.5px] font-mono uppercase tracking-[0.22em] text-ink/50">
											{item.tag}
										</div>
									</li>
								);
							})}
						</ul>
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
								Missing from this list?
								<br />
								<span className="text-peach-300">Tell us what's next.</span>
							</h2>
							<p className="mt-5 max-w-lg text-[15px] text-ink/70 leading-[1.6]">
								The roadmap is shaped by the people using Aloha every day. If a
								feature would change how you work, we'd rather hear about it
								than guess.
							</p>
						</div>
						<div className="col-span-12 lg:col-span-5 flex flex-col gap-3 lg:items-end">
							<Link
								href={routes.company.contact}
								className="inline-flex items-center gap-2 h-12 px-6 rounded-full text-background text-[14px] font-medium bg-primary transition-colors"
							>
								Share a request
								<ArrowRight className="w-4 h-4" />
							</Link>
							<Link
								href={routes.product.whatsNew}
								className="pencil-link text-[13.5px] font-medium inline-flex items-center gap-2"
							>
								See what we've shipped
								<ArrowUpRight className="w-3.5 h-3.5" />
							</Link>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
