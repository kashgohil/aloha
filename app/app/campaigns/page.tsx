import { listCampaigns } from "@/lib/ai/campaign";
import { hasMuseInviteEntitlement } from "@/lib/billing/muse";
import { getCurrentUser } from "@/lib/current-user";
import { getCurrentContext } from "@/lib/current-context";
import { hasRole, ROLES } from "@/lib/workspaces/roles";
import { cn } from "@/lib/utils";
import { CalendarRange, Lock, Megaphone, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const KIND_LABELS: Record<string, string> = {
	launch: "Launch",
	webinar: "Webinar",
	sale: "Sale",
	drip: "Drip",
	evergreen: "Evergreen",
	custom: "Custom",
};

const STATUS_STYLES: Record<string, string> = {
	draft: "bg-background border-border text-ink/55",
	ready: "bg-peach-100 border-peach-300 text-ink",
	scheduled: "bg-peach-100 border-peach-300 text-ink",
	running: "bg-primary-soft border-primary/40 text-primary-deep",
	paused: "bg-background border-dashed border-primary/50 text-primary-deep",
	complete: "bg-ink border-ink text-background",
	archived: "bg-background border-dashed border-border-strong text-ink/45",
};

export default async function CampaignsPage() {
	const user = (await getCurrentUser())!;
	const ctx = (await getCurrentContext())!;
	if (!hasRole(ctx.role, ROLES.ADMIN)) {
		redirect("/app/dashboard");
	}
	const museAccess = await hasMuseInviteEntitlement(user.id);
	const campaigns = museAccess ? await listCampaigns(user.id) : [];

	return (
		<div className="space-y-10">
			<header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
				<div>
					<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
						Campaigns
					</p>
					<h1 className="mt-3 font-display text-[44px] lg:text-[52px] leading-[1.02] tracking-[-0.03em] text-ink font-normal">
						Campaigns<span className="text-primary font-light">.</span>
					</h1>
					<p className="mt-3 text-[14px] text-ink/65 max-w-xl leading-[1.55]">
						Launches, webinars, sales, drips. Tell Muse the arc; get a sequenced
						beat sheet you can review, tune, and ship.
					</p>
				</div>
				{museAccess ? (
					<Link
						href="/app/campaigns/new"
						className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[13.5px] font-medium hover:bg-primary transition-colors"
					>
						<Plus className="w-4 h-4" />
						New campaign
					</Link>
				) : null}
			</header>

			{!museAccess ? (
				<div className="rounded-3xl border border-dashed border-border-strong bg-background-elev px-8 py-16 text-center">
					<span className="inline-grid place-items-center w-12 h-12 rounded-full bg-peach-100 border border-border">
						<Lock className="w-5 h-5 text-ink" />
					</span>
					<p className="mt-5 font-display text-[24px] leading-[1.15] tracking-[-0.01em] text-ink">
						Campaigns need Muse.
					</p>
					<p className="mt-2 text-[13.5px] text-ink/60 max-w-md mx-auto leading-[1.55]">
						Muse plans the arc — beats, dates, hooks — so you can review and ship.
						Request access to unlock campaigns.
					</p>
					<Link
						href="/app/settings/muse"
						className="mt-6 inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
					>
						<Sparkles className="w-4 h-4" />
						Request Muse access
					</Link>
				</div>
			) : null}

			{museAccess && campaigns.length === 0 ? (
				<div className="rounded-3xl border border-dashed border-border-strong bg-background-elev px-8 py-16 text-center">
					<span className="inline-grid place-items-center w-12 h-12 rounded-full bg-peach-100 border border-border">
						<Megaphone className="w-5 h-5 text-ink" />
					</span>
					<p className="mt-5 font-display text-[24px] leading-[1.15] tracking-[-0.01em] text-ink">
						No campaigns yet.
					</p>
					<p className="mt-2 text-[13.5px] text-ink/60 max-w-md mx-auto leading-[1.55]">
						A campaign is a sequenced arc of posts around one goal — perfect for
						product launches, webinars, seasonal sales, or evergreen drips.
					</p>
					<Link
						href="/app/campaigns/new"
						className="mt-6 inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
					>
						<Sparkles className="w-4 h-4" />
						Start one
					</Link>
				</div>
			) : museAccess ? (
				<ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
					{campaigns.map((c) => {
						const total = (c.beats as Array<{ accepted?: boolean }>).length;
						const accepted = (c.beats as Array<{ accepted?: boolean }>).filter(
							(b) => b.accepted,
						).length;
						return (
							<li key={c.id}>
								<Link
									href={`/app/campaigns/${c.id}`}
									prefetch={false}
									className="block rounded-2xl border border-border-strong bg-background-elev p-5 hover:bg-muted/30 transition-colors"
								>
									<div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.16em] text-ink/55">
										<span>{KIND_LABELS[c.kind] ?? c.kind}</span>
										<span
											className={cn(
												"inline-flex items-center h-5 px-2 rounded-full border tracking-wide",
												STATUS_STYLES[c.status] ?? STATUS_STYLES.draft,
											)}
										>
											{c.status}
										</span>
									</div>
									<p className="mt-3 text-[15px] text-ink font-medium leading-[1.3] line-clamp-2">
										{c.name}
									</p>
									<p className="mt-1.5 text-[12.5px] text-ink/60 line-clamp-2 leading-[1.5]">
										{c.goal}
									</p>
									<div className="mt-4 flex items-center gap-3 text-[11.5px] text-ink/55">
										<span className="inline-flex items-center gap-1">
											<CalendarRange className="w-3 h-3" />
											{new Intl.DateTimeFormat("en-US", {
												month: "short",
												day: "numeric",
											}).format(c.rangeStart)}
											{" → "}
											{new Intl.DateTimeFormat("en-US", {
												month: "short",
												day: "numeric",
											}).format(c.rangeEnd)}
										</span>
										<span aria-hidden>·</span>
										<span>
											{accepted}/{total} drafted
										</span>
									</div>
								</Link>
							</li>
						);
					})}
				</ul>
			) : null}
		</div>
	);
}
