import { db } from "@/db";
import { posts } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { cn } from "@/lib/utils";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { and, desc, eq } from "drizzle-orm";
import {
	AlertCircle,
	CheckCircle2,
	Clock,
	FileText,
	PenSquare,
	Sparkles,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const STATUSES = ["all", "draft", "scheduled", "published", "failed"] as const;
type StatusFilter = (typeof STATUSES)[number];

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

	const where = [eq(posts.userId, user.id)];
	if (filter !== "all") {
		where.push(eq(posts.status, filter));
	}

	const rows = await db
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
		.limit(100);

	const statusCounts = await db
		.select({ status: posts.status })
		.from(posts)
		.where(eq(posts.userId, user.id));
	const countBy = (s: StatusFilter) =>
		s === "all"
			? statusCounts.length
			: statusCounts.filter((r) => r.status === s).length;

	return (
		<div className="space-y-10">
			<header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
				<div>
					<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
						Content
					</p>
					<h1 className="mt-3 font-display text-[44px] lg:text-[56px] leading-[1.02] tracking-[-0.03em] text-ink font-normal">
						Posts
					</h1>
				</div>
				<Link
					href="/app/composer"
					className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
				>
					<PenSquare className="w-4 h-4" />
					Compose
				</Link>
			</header>

			<FilterTabs
				activeKey={filter}
				items={STATUSES.map((s) => ({
					key: s,
					label: s === "all" ? "All" : STATUS_META[s].label,
					href: s === "all" ? "/app/posts" : `/app/posts?status=${s}`,
					count: countBy(s),
				}))}
			/>

			{/* Post list */}
			{rows.length === 0 ? (
				<div className="rounded-2xl border border-dashed border-border-strong bg-background-elev px-8 py-12 text-center">
					<span className="inline-grid place-items-center w-12 h-12 rounded-full bg-peach-100 border border-border">
						<Sparkles className="w-5 h-5 text-ink" />
					</span>
					<p className="mt-5 font-display text-[24px] leading-[1.15] tracking-[-0.01em] text-ink">
						{filter === "all"
							? "No posts yet."
							: `No ${STATUS_META[filter]?.label.toLowerCase()} posts.`}
					</p>
					<p className="mt-2 text-[13.5px] text-ink/60 max-w-md mx-auto leading-[1.55]">
						{filter === "all"
							? "Create your first post to get started."
							: "Posts with this status will show up here."}
					</p>
					<Link
						href="/app/composer"
						className="mt-6 inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
					>
						<PenSquare className="w-4 h-4" />
						Open Composer
					</Link>
				</div>
			) : (
				<ul className="rounded-2xl border border-border bg-background-elev divide-y divide-border overflow-hidden">
					{rows.map((p) => {
						const meta = STATUS_META[p.status];
						const Icon = meta?.icon ?? FileText;
						const ts = p.publishedAt ?? p.scheduledAt ?? p.createdAt;

						return (
							<li key={p.id}>
								<Link
									href={`/app/composer?post=${p.id}`}
									className="group flex items-start gap-5 px-5 py-4 hover:bg-muted/40 transition-colors"
								>
									<div className="w-[100px] shrink-0 space-y-1.5">
										<span
											className={cn(
												"inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-[11px] font-medium",
												meta?.badgeClass ?? "bg-muted text-ink/70",
											)}
										>
											<Icon className="w-3 h-3" />
											{meta?.label ?? p.status}
										</span>
										<p className="text-[12px] text-ink/55 leading-[1.4]">
											{formatDate(ts, tz)}
										</p>
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-[14.5px] text-ink leading-[1.5] line-clamp-2">
											{p.content}
										</p>
										<div className="mt-2 flex flex-wrap items-center gap-1.5">
											{p.platforms.map((pl) => (
												<span
													key={pl}
													className="inline-flex items-center h-6 px-2 rounded-full bg-peach-100 border border-border text-[11px] text-ink/75"
												>
													{PLATFORM_LABELS[pl] ?? pl}
												</span>
											))}
										</div>
									</div>
								</Link>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}

const PLATFORM_LABELS: Record<string, string> = {
	twitter: "X",
	linkedin: "LinkedIn",
	facebook: "Facebook",
	instagram: "Instagram",
	tiktok: "TikTok",
	bluesky: "Bluesky",
	medium: "Medium",
};

function formatDate(date: Date, tz: string) {
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
		timeZone: tz,
	}).format(date);
}
