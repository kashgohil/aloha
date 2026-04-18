"use client";

import { RefreshCw, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  refreshFeedAction,
  unsubscribeFeedAction,
} from "@/app/actions/feeds";
import { cn } from "@/lib/utils";
import { FeedAvatar } from "./feed-avatar";

export type SidebarFeed = {
  id: string;
  title: string;
  siteUrl: string | null;
  iconUrl: string | null;
  lastFetchedAt: Date | null;
  lastError: string | null;
};

export function FeedSidebar({
  feeds,
  activeFeedId,
  unreadByFeed,
}: {
  feeds: SidebarFeed[];
  activeFeedId: string | null;
  unreadByFeed: Record<string, number>;
}) {
  const [query, setQuery] = useState("");

  const visible = feeds.filter((f) => {
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      if (!f.title.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="rounded-3xl border border-border bg-background-elev overflow-hidden flex flex-col h-full min-h-0">
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink/40" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search feeds"
            className="w-full h-9 pl-9 pr-3 rounded-full border border-border bg-background text-[12.5px] text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink"
          />
        </div>
      </div>

      <ul className="divide-y divide-border flex-1 min-h-0 overflow-y-auto">
        {visible.length === 0 ? (
          <li className="px-4 py-8 text-center text-[12px] text-ink/50">
            No matches.
          </li>
        ) : (
          visible.map((f) => {
            const active = f.id === activeFeedId;
            const unread = unreadByFeed[f.id] ?? 0;
            return (
              <li
                key={f.id}
                className={cn(
                  "group relative flex items-center gap-3 pl-3 pr-2 py-3 transition-colors",
                  active ? "bg-peach-100/60" : "hover:bg-muted/40",
                )}
              >
                <Link
                  href={`/app/feeds?feed=${f.id}`}
                  className="flex-1 min-w-0 flex items-center gap-3"
                >
                  <FeedAvatar
                    title={f.title}
                    siteUrl={f.siteUrl}
                    iconUrl={f.iconUrl}
                    size={32}
                  />
                  <span className="flex-1 min-w-0">
                    <span
                      className={cn(
                        "block text-[13px] text-ink truncate",
                        unread > 0 ? "font-semibold" : "font-medium",
                      )}
                    >
                      {f.title}
                    </span>
                    {f.lastError ? (
                      <span className="block text-[11px] text-red-600 truncate">
                        {f.lastError}
                      </span>
                    ) : f.lastFetchedAt ? (
                      <span className="block text-[11px] text-ink/45">
                        synced{" "}
                        {new Intl.DateTimeFormat("en-US", {
                          month: "short",
                          day: "numeric",
                        }).format(f.lastFetchedAt)}
                      </span>
                    ) : null}
                  </span>
                </Link>

                <div className="shrink-0 flex items-center justify-end">
                  {unread > 0 ? (
                    <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-ink text-background text-[10.5px] font-semibold tabular-nums group-hover:hidden group-focus-within:hidden">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  ) : null}
                  <div
                    className={cn(
                      "items-center gap-0.5 hidden group-hover:flex group-focus-within:flex",
                    )}
                  >
                    <form action={refreshFeedAction}>
                      <input type="hidden" name="feedId" value={f.id} />
                      <button
                        type="submit"
                        aria-label="Refresh"
                        title="Refresh"
                        className="inline-flex items-center justify-center w-7 h-7 rounded-full text-ink/55 hover:text-ink hover:bg-muted/80 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </form>
                    <form action={unsubscribeFeedAction}>
                      <input type="hidden" name="feedId" value={f.id} />
                      <button
                        type="submit"
                        aria-label="Unsubscribe"
                        title="Unsubscribe"
                        className="inline-flex items-center justify-center w-7 h-7 rounded-full text-ink/40 hover:text-primary-deep hover:bg-peach-100/60 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
