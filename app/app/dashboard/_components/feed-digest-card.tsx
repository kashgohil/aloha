import { Rss } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface FeedSource {
	id: string;
	title: string;
	iconUrl: string | null;
	siteUrl: string | null;
}

interface FeedDigestCardProps {
	unread: number;
	total: number;
	items: Array<{
		id: string;
		title: string;
		url: string | null;
		publishedAt: Date | null;
		feedTitle: string;
		isRead: boolean;
	}>;
	sources: FeedSource[];
}

function timeAgo(d: Date): string {
	const secs = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000));
	if (secs < 60) return `${secs}s`;
	const mins = Math.floor(secs / 60);
	if (mins < 60) return `${mins}m`;
	const hrs = Math.floor(mins / 60);
	if (hrs < 24) return `${hrs}h`;
	const days = Math.floor(hrs / 24);
	if (days < 7) return `${days}d`;
	const weeks = Math.floor(days / 7);
	if (weeks < 5) return `${weeks}w`;
	return `${Math.floor(days / 30)}mo`;
}

function initial(title: string): string {
	return title.trim().charAt(0).toUpperCase() || "·";
}

export function FeedDigestCard({
	unread,
	total,
	items,
	sources,
}: FeedDigestCardProps) {
	const visibleSources = sources.slice(0, 6);
	const extraSources = Math.max(0, sources.length - visibleSources.length);
	const headline =
		unread > 0
			? `${unread} unread`
			: total > 0
				? "All caught up"
				: "No items yet";
	const subline =
		sources.length > 0
			? `from ${sources.length} source${sources.length === 1 ? "" : "s"}`
			: "across your reader";

	return (
		<article className="rounded-2xl border border-border bg-background-elev p-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
						Feeds
					</p>
					<p className="mt-1.5 font-display text-[20px] leading-[1.15] text-ink">
						{headline}
					</p>
					<p className="mt-0.5 text-[12px] text-ink/55">{subline}</p>
				</div>
				<Link
					href="/app/feeds"
					className="pencil-link text-[12.5px] text-ink/70 hover:text-ink"
				>
					Reader
				</Link>
			</div>

			{visibleSources.length > 0 ? (
				<ul className="mt-4 flex items-center -space-x-1.5">
					{visibleSources.map((s) => (
						<li key={s.id} title={s.title}>
							<span
								className={cn(
									"flex items-center justify-center w-7 h-7 rounded-full",
									"border border-border bg-peach-100 ring-2 ring-background-elev",
									"text-[10px] font-semibold text-ink/70 overflow-hidden",
								)}
							>
								{s.iconUrl ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img
										src={s.iconUrl}
										alt=""
										className="w-full h-full object-cover"
									/>
								) : (
									initial(s.title)
								)}
							</span>
						</li>
					))}
					{extraSources > 0 ? (
						<li>
							<span className="flex items-center justify-center w-7 h-7 rounded-full border border-border bg-background text-[10px] text-ink/60 ring-2 ring-background-elev">
								+{extraSources}
							</span>
						</li>
					) : null}
					<li className="pl-3">
						<Rss className="w-3.5 h-3.5 text-ink/35" />
					</li>
				</ul>
			) : null}

			<ul className="mt-4 space-y-3">
				{items.map((item) => (
					<li key={item.id}>
						<a
							href={item.url ?? "#"}
							target="_blank"
							rel="noopener noreferrer"
							className="group block"
						>
							<div className="flex items-center gap-2 mb-0.5">
								{!item.isRead ? (
									<span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
								) : null}
								<span className="text-[11px] uppercase tracking-[0.16em] text-ink/50 truncate">
									{item.feedTitle}
								</span>
								{item.publishedAt ? (
									<span className="ml-auto text-[11px] tabular-nums text-ink/40 shrink-0">
										{timeAgo(item.publishedAt)}
									</span>
								) : null}
							</div>
							<span
								className={cn(
									"block text-[13px] leading-[1.45] line-clamp-2 transition-colors group-hover:text-ink",
									item.isRead ? "text-ink/55" : "text-ink/85",
								)}
							>
								{item.title}
							</span>
						</a>
					</li>
				))}
			</ul>
		</article>
	);
}
