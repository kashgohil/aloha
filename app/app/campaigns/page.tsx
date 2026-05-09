import { listCampaigns } from "@/lib/ai/campaign";
import { hasMuseInviteEntitlement } from "@/lib/billing/muse";
import { getCurrentContext } from "@/lib/current-context";
import { formatTzDateOrdinal } from "@/lib/tz";
import { hasRole, ROLES } from "@/lib/workspaces/roles";
import { ChannelIcons } from "@/components/channel-chip";
import { cn } from "@/lib/utils";
import {
	CalendarRange,
	ChevronDown,
	Lock,
	Megaphone,
	Plus,
	Sparkles,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const KIND_LABELS: Record<string, string> = {
	launch: "Launch",
	webinar: "Webinar",
	sale: "Sale",
	drip: "Drip",
	evergreen: "Evergreen",
	reach: "Reach",
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

type CampaignRow = Awaited<ReturnType<typeof listCampaigns>>[number];

const MS_PER_DAY = 86_400_000;
const startOfDay = (d: Date) => {
	const x = new Date(d);
	x.setHours(0, 0, 0, 0);
	return x;
};

export default async function CampaignsPage() {
	const ctx = (await getCurrentContext())!;
	const tz = ctx.workspace.timezone ?? "UTC";
	if (!hasRole(ctx.role, ROLES.ADMIN)) {
		redirect("/app/dashboard");
	}
	const userId = ctx.user.id;
	const [museAccess, campaigns] = await Promise.all([
		hasMuseInviteEntitlement(userId),
		listCampaigns(userId),
	]);

	const today = startOfDay(new Date());
	const active: CampaignRow[] = [];
	const upcoming: CampaignRow[] = [];
	const wrapped: CampaignRow[] = [];
	for (const c of campaigns) {
		const start = startOfDay(c.rangeStart);
		const end = startOfDay(c.rangeEnd);
		if (c.status === "archived" || end < today) wrapped.push(c);
		else if (start > today) upcoming.push(c);
		else active.push(c);
	}
	upcoming.sort(
		(a, b) => a.rangeStart.getTime() - b.rangeStart.getTime(),
	);
	wrapped.sort((a, b) => b.rangeEnd.getTime() - a.rangeEnd.getTime());

	return (
		<div className="space-y-12">
			<header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
				<div>
					<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
						Campaigns
					</p>
					<h1 className="mt-3 font-display text-[44px] lg:text-[52px] leading-[1.02] tracking-[-0.03em] text-ink font-normal">
						Campaigns<span className="text-primary font-light">.</span>
					</h1>
					<p className="mt-3 text-[14px] text-ink/65 max-w-xl leading-[1.55]">
						Launches, webinars, sales, drips, reach pushes. Tell Muse the arc; get a
						sequenced beat sheet you can review, tune, and ship.
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
			) : null}

			{museAccess && campaigns.length > 0 ? (
				<>
					{active.length > 0 ? (
						<Section
							eyebrow="Active now"
							subtitle={`${active.length} ${active.length === 1 ? "campaign" : "campaigns"} running.`}
						>
							<ul className="grid grid-cols-1 lg:grid-cols-2 gap-4">
								{active.map((c) => (
									<li key={c.id}>
										<ActiveCard campaign={c} today={today} />
									</li>
								))}
							</ul>
						</Section>
					) : null}

					{upcoming.length > 0 ? (
						<Section
							eyebrow="Upcoming"
							subtitle={`${upcoming.length} scheduled to start.`}
						>
							<ul className="space-y-2">
								{upcoming.map((c) => (
									<li key={c.id}>
										<UpcomingRow campaign={c} today={today} />
									</li>
								))}
							</ul>
						</Section>
					) : null}

					{wrapped.length > 0 ? (
						<Section
							eyebrow="Wrapped"
							subtitle={`${wrapped.length} ${wrapped.length === 1 ? "campaign" : "campaigns"} done.`}
						>
							{wrapped.length <= 5 ? (
								<ul className="space-y-1.5">
									{wrapped.map((c) => (
										<li key={c.id}>
											<WrappedRow campaign={c} tz={tz} />
										</li>
									))}
								</ul>
							) : (
								<details className="group">
									<summary className="list-none cursor-pointer inline-flex items-center gap-1.5 text-[12.5px] text-ink/55 hover:text-ink transition-colors">
										<ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
										Show wrapped ({wrapped.length})
									</summary>
									<ul className="mt-3 space-y-1.5">
										{wrapped.map((c) => (
											<li key={c.id}>
												<WrappedRow campaign={c} tz={tz} />
											</li>
										))}
									</ul>
								</details>
							)}
						</Section>
					) : null}
				</>
			) : null}
		</div>
	);
}

function Section({
	eyebrow,
	subtitle,
	children,
}: {
	eyebrow: string;
	subtitle?: string;
	children: React.ReactNode;
}) {
	return (
		<section className="space-y-4">
			<header>
				<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
					{eyebrow}
				</p>
				{subtitle ? (
					<p className="mt-1 text-[12.5px] text-ink/55">{subtitle}</p>
				) : null}
			</header>
			{children}
		</section>
	);
}

function ActiveCard({
	campaign,
	today,
}: {
	campaign: CampaignRow;
	today: Date;
}) {
	const beats = campaign.beats as Array<{
		accepted?: boolean;
		date?: string;
	}>;
	const total = beats.length;
	const accepted = beats.filter((b) => b.accepted).length;
	const pct = total === 0 ? 0 : Math.round((accepted / total) * 100);
	const end = startOfDay(campaign.rangeEnd);
	const daysLeft = Math.max(
		0,
		Math.ceil((end.getTime() - today.getTime()) / MS_PER_DAY),
	);

	return (
		<Link
			href={`/app/campaigns/${campaign.id}`}
			prefetch={false}
			className="group block rounded-3xl border border-border-strong bg-background-elev p-6 hover:bg-muted/20 transition-colors"
		>
			<div className="flex items-start justify-between gap-4">
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2 flex-wrap text-[10.5px] uppercase tracking-[0.18em] text-ink/55">
						<span>{KIND_LABELS[campaign.kind] ?? campaign.kind}</span>
						<span aria-hidden>·</span>
						<span
							className={cn(
								"inline-flex items-center h-5 px-2 rounded-full border tracking-wide",
								STATUS_STYLES[campaign.status] ?? STATUS_STYLES.draft,
							)}
						>
							{campaign.status}
						</span>
					</div>
					<p className="mt-2.5 font-display text-[22px] leading-[1.15] tracking-[-0.01em] text-ink line-clamp-2">
						{campaign.name}
					</p>
					<p className="mt-1.5 text-[12.5px] text-ink/60 line-clamp-2 leading-[1.5]">
						{campaign.goal}
					</p>
				</div>
				<ProgressRing pct={pct} />
			</div>

			<div className="mt-5 flex items-center gap-3 flex-wrap text-[11.5px] text-ink/55">
				<ChannelIcons channels={campaign.channels} size="sm" visible={5} />
				<span aria-hidden>·</span>
				<span className="inline-flex items-center gap-1">
					<CalendarRange className="w-3 h-3" />
					{daysLeft === 0
						? "Wraps today"
						: `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
				</span>
				<span aria-hidden>·</span>
				<span className="tabular-nums">
					{accepted}/{total} drafted
				</span>
			</div>

			<MiniTimeline beats={beats} today={today} />
		</Link>
	);
}

function ProgressRing({ pct }: { pct: number }) {
	const r = 22;
	const c = 2 * Math.PI * r;
	const dash = (pct / 100) * c;
	return (
		<div className="relative shrink-0 w-14 h-14" aria-hidden>
			<svg width="56" height="56" viewBox="0 0 56 56">
				<circle
					cx="28"
					cy="28"
					r={r}
					fill="none"
					stroke="currentColor"
					strokeWidth="3"
					className="text-border"
				/>
				<circle
					cx="28"
					cy="28"
					r={r}
					fill="none"
					stroke="currentColor"
					strokeWidth="3"
					strokeLinecap="round"
					strokeDasharray={`${dash} ${c}`}
					transform="rotate(-90 28 28)"
					className="text-primary transition-[stroke-dasharray]"
				/>
			</svg>
			<span className="absolute inset-0 grid place-items-center text-[11px] font-medium text-ink tabular-nums">
				{pct}%
			</span>
		</div>
	);
}

function MiniTimeline({
	beats,
	today,
}: {
	beats: Array<{ accepted?: boolean; date?: string }>;
	today: Date;
}) {
	const horizon = 30;
	const cells: Array<{ accepted: boolean; pending: boolean; isToday: boolean }> =
		[];
	for (let i = 0; i < horizon; i += 1) {
		const d = new Date(today);
		d.setDate(d.getDate() + i);
		const iso = d.toISOString().slice(0, 10);
		const onDay = beats.filter((b) => b.date === iso);
		cells.push({
			accepted: onDay.some((b) => b.accepted),
			pending: onDay.some((b) => !b.accepted),
			isToday: i === 0,
		});
	}
	return (
		<div className="mt-5">
			<div
				className="flex items-end gap-[3px] h-7"
				aria-label="Next 30 days of beats"
			>
				{cells.map((c, i) => {
					const cls = c.accepted
						? "bg-primary"
						: c.pending
							? "bg-ink/35"
							: "bg-border";
					const h = c.accepted || c.pending ? "h-7" : "h-2";
					return (
						<span
							key={i}
							className={cn(
								"flex-1 rounded-sm transition-colors",
								cls,
								h,
								c.isToday ? "ring-2 ring-primary/40 ring-offset-1" : "",
							)}
						/>
					);
				})}
			</div>
			<p className="mt-1.5 flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-ink/40">
				<span>Today</span>
				<span>+30d</span>
			</p>
		</div>
	);
}

function UpcomingRow({
	campaign,
	today,
}: {
	campaign: CampaignRow;
	today: Date;
}) {
	const total = (campaign.beats as Array<unknown>).length;
	const start = startOfDay(campaign.rangeStart);
	const daysOut = Math.max(
		0,
		Math.ceil((start.getTime() - today.getTime()) / MS_PER_DAY),
	);
	return (
		<Link
			href={`/app/campaigns/${campaign.id}`}
			prefetch={false}
			className="group flex items-center gap-4 rounded-2xl border border-border bg-background-elev px-4 py-3 hover:border-ink transition-colors"
		>
			<span className="inline-flex items-center h-5 px-2 rounded-full border border-border text-[10.5px] uppercase tracking-[0.16em] text-ink/55 shrink-0">
				{KIND_LABELS[campaign.kind] ?? campaign.kind}
			</span>
			<span className="text-[14px] text-ink font-medium leading-[1.3] truncate min-w-0 flex-1">
				{campaign.name}
			</span>
			<ChannelIcons channels={campaign.channels} size="sm" visible={4} />
			<span className="text-[12px] text-ink/55 tabular-nums shrink-0">
				starts in {daysOut}d
			</span>
			<span className="text-[12px] text-ink/45 tabular-nums shrink-0">
				{total} beat{total === 1 ? "" : "s"}
			</span>
		</Link>
	);
}

function WrappedRow({
	campaign,
	tz,
}: {
	campaign: CampaignRow;
	tz: string;
}) {
	const beats = campaign.beats as Array<{ accepted?: boolean }>;
	const total = beats.length;
	const accepted = beats.filter((b) => b.accepted).length;
	const pct = total === 0 ? 0 : Math.round((accepted / total) * 100);
	return (
		<Link
			href={`/app/campaigns/${campaign.id}`}
			prefetch={false}
			className="group flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-muted/30 transition-colors text-ink/65"
		>
			<span className="text-[10.5px] uppercase tracking-[0.16em] text-ink/40 shrink-0 w-20">
				{KIND_LABELS[campaign.kind] ?? campaign.kind}
			</span>
			<span className="text-[13px] truncate min-w-0 flex-1">
				{campaign.name}
			</span>
			<span className="text-[11.5px] text-ink/40 tabular-nums shrink-0">
				{formatTzDateOrdinal(campaign.rangeEnd, tz, { year: false })}
			</span>
			<span className="text-[11.5px] text-ink/40 tabular-nums shrink-0 w-12 text-right">
				{pct}%
			</span>
		</Link>
	);
}
