import { CHANNEL_ICONS, CHANNEL_LABELS } from "@/components/channel-chip";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { getConnectedChannels } from "@/lib/channels/connected";
import { getCurrentContext } from "@/lib/current-context";
import { cn } from "@/lib/utils";
import { hasRole, ROLES } from "@/lib/workspaces/roles";
import { and, desc, eq, sql } from "drizzle-orm";
import {
	AlertCircle,
	CheckCircle2,
	Clock,
	Columns3,
	FileText,
	Filter,
	List,
	PenSquare,
	Sparkles,
	Trash2,
	X,
} from "lucide-react";
import Link from "next/link";
import { PostsBoard } from "./_components/posts-board";
import { PostsList } from "./_components/posts-list";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const STATUSES = [
	"all",
	"draft",
	"in_review",
	"approved",
	"scheduled",
	"published",
	"failed",
	"deleted",
] as const;
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
	return sql`${column} && ARRAY[${sql.join(
		values.map((v) => sql`${v}`),
		sql`, `,
	)}]::text[]`;
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
	in_review: {
		label: "In review",
		icon: Clock,
		badgeClass: "bg-amber-100 text-amber-900",
	},
	approved: {
		label: "Approved",
		icon: CheckCircle2,
		badgeClass: "bg-emerald-100 text-emerald-900",
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
	const ctx = (await getCurrentContext())!;
	const { user, workspace } = ctx;
	const tz = workspace.timezone ?? user.timezone ?? "UTC";
	const canDelete = hasRole(ctx.role, ROLES.ADMIN);

	const params = await searchParams;
	const filter: StatusFilter = STATUSES.includes(
		first(params.status) as StatusFilter,
	)
		? (first(params.status) as StatusFilter)
		: "all";
	const view: "list" | "board" =
		first(params.view) === "board" ? "board" : "list";

	// Parse selected channels from URL
	const selectedChannels = parseChannels(params.channels);

	// Build query conditions: list view "All" omits deleted; board "All" loads
	// every status (including deleted). A specific status tab filters to that status in both views.
	const where = [eq(posts.workspaceId, workspace.id)];

	if (filter === "all") {
		if (view !== "board") {
			where.push(sql`${posts.status} != 'deleted'`);
		}
	} else {
		where.push(eq(posts.status, filter));
	}
	if (selectedChannels.length > 0) {
		const channelCondition = arrayOverlaps(posts.platforms, selectedChannels);
		if (channelCondition) {
			where.push(channelCondition);
		}
	}
	// Counts are filtered by channels (if selected) but cover all statuses,
	// so "deleted" reflects accurately.
	const countWhere = [eq(posts.workspaceId, workspace.id)];
	if (selectedChannels.length > 0) {
		const channelCondition = arrayOverlaps(posts.platforms, selectedChannels);
		if (channelCondition) {
			countWhere.push(channelCondition);
		}
	}

	const [connectedSnap, rows, statusAgg] = await Promise.all([
		getConnectedChannels(workspace.id),
		db
			.select({
				id: posts.id,
				content: posts.content,
				channelContent: posts.channelContent,
				platforms: posts.platforms,
				media: posts.media,
				status: posts.status,
				scheduledAt: posts.scheduledAt,
				publishedAt: posts.publishedAt,
				createdAt: posts.createdAt,
			})
			.from(posts)
			.where(and(...where))
			.orderBy(desc(posts.updatedAt))
			.limit(view === "board" ? 300 : 100),
		db
			.select({
				status: posts.status,
				count: sql<number>`count(*)::int`,
			})
			.from(posts)
			.where(and(...countWhere))
			.groupBy(posts.status),
	]);

	const connectedChannels = [...connectedSnap.providers];

	const countByStatus = Object.fromEntries(
		statusAgg.map((r) => [r.status, r.count]),
	);

	// "all" count excludes deleted posts (active posts only)
	const totalActiveCount = Object.entries(countByStatus)
		.filter(([status]) => status !== "deleted")
		.reduce((sum, [, count]) => sum + count, 0);

	const countBy = (s: StatusFilter) =>
		s === "all" ? totalActiveCount : (countByStatus[s] ?? 0);

	const withParams = (opts: {
		status?: StatusFilter;
		channels?: string[];
		view?: "list" | "board";
	}) => {
		const sp = new URLSearchParams();
		const s = opts.status ?? filter;
		const c = opts.channels ?? selectedChannels;
		const v = opts.view ?? view;
		if (s !== "all") sp.set("status", s);
		if (c.length > 0) sp.set("channels", c.join(","));
		if (v === "board") sp.set("view", "board");
		const qs = sp.toString();
		return qs ? `/app/posts?${qs}` : "/app/posts";
	};

	const buildStatusHref = (status: StatusFilter) => withParams({ status });

	const buildChannelToggleHref = (channel: string) => {
		const newChannels = selectedChannels.includes(channel)
			? selectedChannels.filter((c) => c !== channel)
			: [...selectedChannels, channel];
		return withParams({ channels: newChannels });
	};

	const clearChannelsHref = () => withParams({ channels: [] });

	const viewHref = (v: "list" | "board") => withParams({ view: v });

	return (
		<div
			className={cn(
				"flex flex-col gap-6",
				view === "board" && "h-[calc(100svh-80px)] lg:h-[calc(100svh-112px)]",
			)}
		>
			<header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
				<div>
					<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
						Content
					</p>
					<h1 className="mt-3 font-display text-[44px] lg:text-[56px] leading-[1.02] tracking-[-0.03em] text-ink font-normal">
						Posts<span className="text-primary font-light">.</span>
					</h1>
					<p className="mt-3 text-[14px] text-ink/65 max-w-xl leading-[1.55]">
						Everything you&apos;ve drafted, scheduled, and shipped — filtered by
						status or channel, ready to edit or repost.
					</p>
				</div>
				<Link
					href="?compose=new"
					className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
				>
					<PenSquare className="w-4 h-4" />
					Compose
				</Link>
			</header>

			<div className="flex items-center justify-between gap-4 flex-wrap">
				<div className="flex items-center gap-2 flex-wrap min-w-0">
					{connectedChannels.length > 0 ? (
						<>
							<Filter className="w-3.5 h-3.5 text-ink/45 shrink-0" />
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
							{selectedChannels.length > 0 && (
								<Link
									href={clearChannelsHref()}
									className="inline-flex items-center gap-1 text-[11px] text-ink/50 hover:text-ink transition-colors px-1"
								>
									<X className="w-3 h-3" />
									Clear
								</Link>
							)}
						</>
					) : null}
				</div>
				<div className="inline-flex rounded-full border border-border bg-background-elev p-0.5 shrink-0">
					<Link
						href={viewHref("list")}
						className={cn(
							"inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-medium transition-colors",
							view === "list"
								? "bg-ink text-background"
								: "text-ink/65 hover:text-ink",
						)}
					>
						<List className="w-3.5 h-3.5" />
						List
					</Link>
					<Link
						href={viewHref("board")}
						className={cn(
							"inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-medium transition-colors",
							view === "board"
								? "bg-ink text-background"
								: "text-ink/65 hover:text-ink",
						)}
					>
						<Columns3 className="w-3.5 h-3.5" />
						Board
					</Link>
				</div>
			</div>

			{view === "list" && (
				<FilterTabs
					activeKey={filter}
					items={STATUSES.map((s) => ({
						key: s,
						label: s === "all" ? "All" : STATUS_META[s].label,
						href: buildStatusHref(s),
						count: countBy(s),
					}))}
				/>
			)}

			{/* Deleted posts disclaimer */}
			{filter === "deleted" && view === "list" && (
				<div className="rounded-xl border border-border bg-amber-50/50 px-4 py-3">
					<div className="flex items-start gap-3">
						<Trash2 className="w-4 h-4 text-ink/50 mt-0.5 shrink-0" />
						<div className="space-y-1">
							<p className="text-[13px] font-medium text-ink">
								Deleted posts are kept for 30 days
							</p>
							<p className="text-[12px] text-ink/60 leading-relaxed">
								Posts marked as deleted will be automatically and permanently
								removed after 30 days. You can also permanently delete them
								immediately using the actions menu.
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
							href="?compose=new"
							className="mt-6 inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
						>
							<PenSquare className="w-4 h-4" />
							Open Composer
						</Link>
					)}
				</div>
			) : view === "board" ? (
				<div className="flex-1 min-h-0">
					<PostsBoard rows={rows} tz={tz} workspaceRole={ctx.role} />
				</div>
			) : (
				<PostsList rows={rows} tz={tz} filter={filter} canDelete={canDelete} />
			)}
		</div>
	);
}
