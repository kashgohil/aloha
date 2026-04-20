import { db } from "@/db";
import { accounts, posts } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { cn } from "@/lib/utils";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { and, desc, eq, sql } from "drizzle-orm";
import {
	AlertCircle,
	CheckCircle2,
	Clock,
	FileText,
	Filter,
	PenSquare,
	Sparkles,
	Trash2,
	X,
} from "lucide-react";
import Link from "next/link";
import { CHANNEL_ICONS, CHANNEL_LABELS } from "@/components/channel-chip";
import { PostsList } from "./_components/posts-list";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const STATUSES = ["all", "draft", "scheduled", "published", "failed", "deleted"] as const;
type StatusFilter = (typeof STATUSES)[number];

// Parse channels from URL param - can be single or multiple
function parseChannels(value: string | string[] | undefined): string[] {
	if (!value) return [];
	if (Array.isArray(value)) {
		return value.flatMap((v) => v.split(",")).filter(Boolean);
	}
	return value.split(",").filter(Boolean);
}

// Array overlap check for PostgreSQL - platforms && ARRAY['a','b']
function arrayOverlaps(column: typeof posts.platforms, values: string[]) {
	if (values.length === 0) return undefined;
	if (values.length === 1) {
		// Single channel: use array_contains equivalent
		return sql`${column} @> ARRAY[${values[0]}]::text[]`;
	}
	// Multiple channels: overlap operator
	return sql`${column} && ARRAY[${sql.join(values.map((v) => sql`${v}`), sql`, `)}]::text[]`;
}

const STATUS_META: Record<
	string,
	{
		label: string;
		icon: React.ComponentType<{ className?: string }>;
		badgeClass: string;
	}
> = {
	draft: {
		label: "Draft",
		icon: FileText,
		badgeClass: "bg-muted text-ink/70",
	},
	scheduled: {
		label: "Scheduled",
		icon: Clock,
		badgeClass: "bg-primary-soft text-primary",
	},
	published: {
		label: "Published",
		icon: CheckCircle2,
		badgeClass: "bg-peach-100 text-ink/80",
	},
	failed: {
		label: "Failed",
		icon: AlertCircle,
		badgeClass: "bg-destructive/10 text-destructive",
	},
	deleted: {
		label: "Deleted",
		icon: Trash2,
		badgeClass: "bg-ink/10 text-ink/60",
	},
};

const first = (v: string | string[] | undefined) =>
	Array.isArray(v) ? v[0] : v;

export default async function PostsPage({
	searchParams,
}: {
	searchParams: SearchParams;
}) {
	const user = (await getCurrentUser())!;
	const tz = user.timezone ?? "UTC";

	const params = await searchParams;
	const filter: StatusFilter = STATUSES.includes(
		first(params.status) as StatusFilter,
	)
		? (first(params.status) as StatusFilter)
		: "all";

	// Parse selected channels from URL
	const selectedChannels = parseChannels(params.channels);

	// Build query conditions
	const AUTH_PROVIDERS = ["google", "github"] as const;
	const where = [eq(posts.userId, user.id)];
	if (filter !== "all") {
		where.push(eq(posts.status, filter));
	} else {
		// "all" is an active-posts view — hide tombstones of remotely-deleted
		// posts so the list doesn't get cluttered with history.
		where.push(sql`${posts.status} != 'deleted'`);
	}
	if (selectedChannels.length > 0) {
		const channelCondition = arrayOverlaps(posts.platforms, selectedChannels);
		if (channelCondition) {
			where.push(channelCondition);
		}
	}

	// Counts are filtered by channels (if selected) but cover all statuses,
	// so "deleted" reflects accurately.
	const countWhere = [eq(posts.userId, user.id)];
	if (selectedChannels.length > 0) {
		const channelCondition = arrayOverlaps(posts.platforms, selectedChannels);
		if (channelCondition) {
			countWhere.push(channelCondition);
		}
	}

	// Fire posts list + status aggregation + account providers concurrently.
	const [userAccounts, rows, statusAgg] = await Promise.all([
		db
			.select({ provider: accounts.provider })
			.from(accounts)
			.where(eq(accounts.userId, user.id)),
		db
			.select({
				id: posts.id,
				content: posts.content,
				platforms: posts.platforms,
				status: posts.status,
				scheduledAt: posts.scheduledAt,
				publishedAt: posts.publishedAt,
				createdAt: posts.createdAt,
			})
			.from(posts)
			.where(and(...where))
			.orderBy(desc(posts.updatedAt))
			.limit(100),
		db
			.select({
				status: posts.status,
				count: sql<number>`count(*)::int`,
			})
			.from(posts)
			.where(and(...countWhere))
			.groupBy(posts.status),
	]);

	const connectedChannels = userAccounts
		.map((a) => a.provider)
		.filter(
			(p): p is string =>
				!AUTH_PROVIDERS.includes(p as (typeof AUTH_PROVIDERS)[number]),
		);

	const countByStatus = Object.fromEntries(
		statusAgg.map((r) => [r.status, r.count]),
	);

	// "all" count excludes deleted posts (active posts only)
	const totalActiveCount = Object.entries(countByStatus)
		.filter(([status]) => status !== "deleted")
		.reduce((sum, [, count]) => sum + count, 0);

	const countBy = (s: StatusFilter) =>
		s === "all" ? totalActiveCount : (countByStatus[s] ?? 0);

	// Build URLs that preserve channel selection when switching status tabs
	const buildStatusHref = (status: StatusFilter) => {
		const sp = new URLSearchParams();
		if (status !== "all") sp.set("status", status);
		if (selectedChannels.length > 0) sp.set("channels", selectedChannels.join(","));
		const qs = sp.toString();
		return qs ? `/app/posts?${qs}` : "/app/posts";
	};

	// Toggle channel selection
	const buildChannelToggleHref = (channel: string) => {
		const sp = new URLSearchParams();
		if (filter !== "all") sp.set("status", filter);

		const newChannels = selectedChannels.includes(channel)
			? selectedChannels.filter((c) => c !== channel)
			: [...selectedChannels, channel];

		if (newChannels.length > 0) sp.set("channels", newChannels.join(","));

		const qs = sp.toString();
		return qs ? `/app/posts?${qs}` : "/app/posts";
	};

	// Clear all channel filters
	const clearChannelsHref = () => {
		const sp = new URLSearchParams();
		if (filter !== "all") sp.set("status", filter);
		const qs = sp.toString();
		return qs ? `/app/posts?${qs}` : "/app/posts";
	};

	return (
		<div className="space-y-10">
			<header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
				<div>
					<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
						Content
					</p>
					<h1 className="mt-3 font-display text-[44px] lg:text-[56px] leading-[1.02] tracking-[-0.03em] text-ink font-normal">
						Posts<span className="text-primary font-light">.</span>
					</h1>
					<p className="mt-3 text-[14px] text-ink/65 max-w-xl leading-[1.55]">
						Everything you&apos;ve drafted, scheduled, and shipped — filtered
						by status or channel, ready to edit or repost.
					</p>
				</div>
				<Link
					href="/app/composer"
					className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
				>
					<PenSquare className="w-4 h-4" />
					Compose
				</Link>
			</header>

			{/* Channel Filter */}
			{connectedChannels.length > 0 && (
				<div className="space-y-3">
					<div className="flex items-center gap-2">
						<Filter className="w-4 h-4 text-ink/50" />
						<span className="text-[12px] font-medium text-ink/70">
							Filter by channel
							{selectedChannels.length > 0 && (
								<span className="ml-1 text-ink/50">
									({selectedChannels.length} selected)
								</span>
								)}
						</span>
						{selectedChannels.length > 0 && (
							<Link
								href={clearChannelsHref()}
								className="ml-auto inline-flex items-center gap-1 text-[11px] text-ink/50 hover:text-ink transition-colors"
							>
								<X className="w-3 h-3" />
								Clear
							</Link>
						)}
					</div>
					<div className="flex flex-wrap gap-2">
						{connectedChannels.map((channel) => {
							const Icon = CHANNEL_ICONS[channel];
							const isSelected = selectedChannels.includes(channel);
							return (
								<Link
									key={channel}
									href={buildChannelToggleHref(channel)}
									className={cn(
										"inline-flex items-center gap-1.5 h-8 px-3 rounded-full border text-[12px] font-medium transition-colors",
										isSelected
											? "bg-ink text-background border-ink"
											: "bg-background text-ink/70 border-border hover:border-ink/30 hover:text-ink",
									)}
								>
									{Icon ? <Icon className="w-3.5 h-3.5" /> : null}
									{CHANNEL_LABELS[channel] ?? channel}
								</Link>
							);
						})}
					</div>
				</div>
			)}

			<FilterTabs
				activeKey={filter}
				items={STATUSES.map((s) => ({
					key: s,
					label: s === "all" ? "All" : STATUS_META[s].label,
					href: buildStatusHref(s),
					count: countBy(s),
				}))}
			/>

			{/* Deleted posts disclaimer */}
			{filter === "deleted" && (
				<div className="rounded-xl border border-border bg-amber-50/50 px-4 py-3">
					<div className="flex items-start gap-3">
						<Trash2 className="w-4 h-4 text-ink/50 mt-0.5 shrink-0" />
						<div className="space-y-1">
							<p className="text-[13px] font-medium text-ink">
								Deleted posts are kept for 30 days
							</p>
							<p className="text-[12px] text-ink/60 leading-relaxed">
								Posts marked as deleted will be automatically and permanently removed after 30 days.
								You can also permanently delete them immediately using the actions menu.
							</p>
						</div>
					</div>
				</div>
			)}

			{/* Post list */}
			{rows.length === 0 ? (
				<div className="rounded-2xl border border-dashed border-border-strong bg-background-elev px-8 py-12 text-center">
					<span className="inline-grid place-items-center w-12 h-12 rounded-full bg-peach-100 border border-border">
						{filter === "deleted" ? (
							<Trash2 className="w-5 h-5 text-ink/50" />
						) : (
							<Sparkles className="w-5 h-5 text-ink" />
							)}
					</span>
					<p className="mt-5 font-display text-[24px] leading-[1.15] tracking-[-0.01em] text-ink">
						{filter === "all"
							? "No posts yet."
							: filter === "deleted"
								? "No deleted posts."
								: `No ${STATUS_META[filter]?.label.toLowerCase()} posts.`}
					</p>
					<p className="mt-2 text-[13.5px] text-ink/60 max-w-md mx-auto leading-[1.55]">
						{filter === "all"
							? "Create your first post to get started."
							: filter === "deleted"
								? "Posts you delete will appear here for 30 days before being permanently removed."
								: "Posts with this status will show up here."}
					</p>
					{filter !== "deleted" && (
						<Link
							href="/app/composer"
							className="mt-6 inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
						>
							<PenSquare className="w-4 h-4" />
							Open Composer
						</Link>
					)}
				</div>
			) : (
				<PostsList rows={rows} tz={tz} filter={filter} />
			)}
		</div>
	);
}
