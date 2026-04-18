"use client";

import { markItemReadAction, saveItemAsIdeaAction } from "@/app/actions/feeds";
import { FilterTabs } from "@/components/ui/filter-tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
	BookmarkCheck,
	BookmarkPlus,
	ExternalLink,
	Eye,
	Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { FeedAvatar } from "./feed-avatar";

export type StreamFeed = {
	id: string;
	title: string;
	siteUrl: string | null;
	iconUrl: string | null;
};

export type StreamItem = {
	id: string;
	feedId: string;
	title: string;
	summary: string | null;
	url: string | null;
	author: string | null;
	imageUrl: string | null;
	publishedAt: Date | null;
	isRead: boolean;
	savedAsIdeaId: string | null;
};

type View = "all" | "unread" | "saved";

export function FeedStream({
	feed,
	items,
}: {
	feed: StreamFeed;
	items: StreamItem[];
}) {
	const [view, setView] = useState<View>("unread");
	const [query, setQuery] = useState("");

	const counts = useMemo(() => {
		const unread = items.filter((i) => !i.isRead).length;
		const saved = items.filter((i) => i.savedAsIdeaId !== null).length;
		return { all: items.length, unread, saved };
	}, [items]);

	// Default to All when there's nothing unread — avoids landing on empty view.
	const effectiveView: View =
		view === "unread" && counts.unread === 0 ? "all" : view;

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		return items.filter((i) => {
			if (effectiveView === "unread" && i.isRead) return false;
			if (effectiveView === "saved" && i.savedAsIdeaId === null) return false;
			if (q) {
				const hay =
					`${i.title} ${i.summary ?? ""} ${i.author ?? ""}`.toLowerCase();
				if (!hay.includes(q)) return false;
			}
			return true;
		});
	}, [items, effectiveView, query]);

	return (
		<div className="flex flex-col min-h-0">
			<header className="sticky top-0 z-10 -mx-1 px-1 py-4 bg-background/85 backdrop-blur-sm">
				<div className="flex items-start gap-4 flex-wrap">
					<FeedAvatar
						title={feed.title}
						siteUrl={feed.siteUrl}
						iconUrl={feed.iconUrl}
						size={40}
					/>
					<div className="flex-1 min-w-0">
						<h2 className="font-display text-[22px] leading-[1.3] text-ink">
							{feed.title}
						</h2>
						{feed.siteUrl ? (
							<a
								href={feed.siteUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="mt-0.5 inline-flex items-center gap-1 text-[12px] text-ink/55 hover:text-ink transition-colors"
							>
								{hostnameOf(feed.siteUrl)}
								<ExternalLink className="w-3 h-3" />
							</a>
						) : null}
					</div>
					<div className="relative w-full sm:w-64">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink/40" />
						<input
							type="search"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search this feed"
							className="w-full h-9 pl-9 pr-3 rounded-full border border-border bg-background-elev text-[12.5px] text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink"
						/>
					</div>
				</div>

				<div className="mt-3">
					<FilterTabs
						activeKey={effectiveView}
						onSelect={(k) => setView(k as View)}
						items={[
							{ key: "unread", label: "Unread", count: counts.unread },
							{ key: "all", label: "All", count: counts.all },
							{ key: "saved", label: "Saved", count: counts.saved },
						]}
					/>
				</div>
			</header>

			{filtered.length === 0 ? (
				<p className="mt-6 rounded-2xl border border-dashed border-border-strong bg-background-elev px-5 py-8 text-[13px] text-ink/55 text-center">
					{query.trim()
						? "Nothing matches your search."
						: effectiveView === "unread"
							? "All caught up."
							: effectiveView === "saved"
								? "Nothing saved yet from this feed."
								: "No items yet. The nightly sync will pull the latest — or hit refresh on the source."}
				</p>
			) : (
				<TooltipProvider delay={200}>
					<ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-background-elev overflow-hidden">
						{filtered.map((item) => (
							<ItemRow key={item.id} item={item} />
						))}
					</ul>
				</TooltipProvider>
			)}
		</div>
	);
}

function ItemRow({ item }: { item: StreamItem }) {
	const saved = item.savedAsIdeaId !== null;
	return (
		<li
			className={cn(
				"group relative flex gap-4 px-5 py-4 transition-colors hover:bg-muted/40",
				item.isRead && "opacity-75",
			)}
		>
			{item.imageUrl ? (
				// eslint-disable-next-line @next/next/no-img-element
				<img
					src={item.imageUrl}
					alt=""
					className="w-20 h-20 rounded-xl object-cover border border-border shrink-0 hidden sm:block"
				/>
			) : null}
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 text-[11px] text-ink/50 uppercase tracking-[0.16em]">
					{!item.isRead ? (
						<span
							className="inline-block w-1.5 h-1.5 rounded-full bg-primary"
							aria-label="Unread"
						/>
					) : null}
					{item.author ? <span>{item.author}</span> : null}
					{item.publishedAt ? (
						<span>
							{new Intl.DateTimeFormat("en-US", {
								month: "short",
								day: "numeric",
							}).format(item.publishedAt)}
						</span>
					) : null}
				</div>
				<h3
					className={cn(
						"mt-1.5 text-[15px] leading-[1.35]",
						item.isRead ? "text-ink/75 font-normal" : "text-ink font-medium",
					)}
				>
					{item.url ? (
						<a
							href={item.url}
							target="_blank"
							rel="noopener noreferrer"
							className="hover:underline"
						>
							{item.title}
						</a>
					) : (
						item.title
					)}
				</h3>
				{item.summary ? (
					<p className="mt-2 text-[13px] text-ink/70 leading-[1.55] line-clamp-2">
						{item.summary}
					</p>
				) : null}
			</div>

			<div className="flex flex-col items-end justify-between gap-2 shrink-0">
				<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
					<form action={saveItemAsIdeaAction}>
						<input type="hidden" name="itemId" value={item.id} />
						<Tooltip>
							<TooltipTrigger
								render={
									<button
										type="submit"
										disabled={saved}
										aria-label={saved ? "Saved" : "Save to ideas"}
										className={cn(
											"inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors",
											saved
												? "bg-ink text-background"
												: "text-ink/60 hover:text-ink hover:bg-muted/80",
										)}
									>
										{saved ? (
											<BookmarkCheck className="w-3.5 h-3.5" />
										) : (
											<BookmarkPlus className="w-3.5 h-3.5" />
										)}
									</button>
								}
							/>
							<TooltipContent>{saved ? "Saved" : "Save to ideas"}</TooltipContent>
						</Tooltip>
					</form>
					{!item.isRead ? (
						<form action={markItemReadAction}>
							<input type="hidden" name="itemId" value={item.id} />
							<input type="hidden" name="read" value="true" />
							<Tooltip>
								<TooltipTrigger
									render={
										<button
											type="submit"
											aria-label="Mark read"
											className="inline-flex items-center justify-center w-8 h-8 rounded-full text-ink/60 hover:text-ink hover:bg-muted/80 transition-colors"
										>
											<Eye className="w-3.5 h-3.5" />
										</button>
									}
								/>
								<TooltipContent>Mark read</TooltipContent>
							</Tooltip>
						</form>
					) : null}
					{item.url ? (
						<Tooltip>
							<TooltipTrigger
								render={
									<a
										href={item.url}
										target="_blank"
										rel="noopener noreferrer"
										aria-label="Open"
										className="inline-flex items-center justify-center w-8 h-8 rounded-full text-ink/60 hover:text-ink hover:bg-muted/80 transition-colors"
									>
										<ExternalLink className="w-3.5 h-3.5" />
									</a>
								}
							/>
							<TooltipContent>Open</TooltipContent>
						</Tooltip>
					) : null}
				</div>
			</div>
		</li>
	);
}

function hostnameOf(url: string): string {
	try {
		return new URL(url).hostname.replace(/^www\./, "");
	} catch {
		return url;
	}
}
