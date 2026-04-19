import Link from "next/link";
import { cn } from "@/lib/utils";

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
}

export function FeedDigestCard({
	unread,
	total,
	items,
}: FeedDigestCardProps) {
	return (
		<article className="rounded-2xl border border-border bg-background-elev p-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
						Feeds
					</p>
					<p className="mt-1.5 font-display text-[20px] leading-[1.15] text-ink">
						{unread > 0 ? `${unread} unread` : `${total} items`}
					</p>
				</div>
				<Link
					href="/app/feeds"
					className="pencil-link text-[12.5px] text-ink/70 hover:text-ink"
				>
					Reader
				</Link>
			</div>
			<ul className="mt-4 space-y-3">
				{items.map((item) => (
					<li key={item.id}>
						<a
							href={item.url ?? "#"}
							target="_blank"
							rel="noopener noreferrer"
							className={cn(
								"block text-[13px] leading-[1.45] hover:text-ink transition-colors",
								item.isRead ? "text-ink/60" : "text-ink/85",
							)}
						>
							<span className="block text-[11px] uppercase tracking-[0.16em] text-ink/45 mb-0.5">
								{item.feedTitle}
							</span>
							<span className="line-clamp-2">{item.title}</span>
						</a>
					</li>
				))}
			</ul>
		</article>
	);
}
