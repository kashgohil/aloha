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
  const [unreadOnly, setUnreadOnly] = useState(false);

  const totalUnread = Object.values(unreadByFeed).reduce((a, b) => a + b, 0);

  const visible = feeds.filter((f) => {
    if (unreadOnly && (unreadByFeed[f.id] ?? 0) === 0) return false;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      if (!f.title.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="rounded-3xl border border-border bg-background-elev overflow-hidden flex flex-col h-full min-h-0">
      <div className="p-3 space-y-2 border-b border-border">
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
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => setUnreadOnly((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11.5px] font-medium transition-colors",
              unreadOnly
                ? "bg-ink text-background"
                : "text-ink/65 hover:text-ink hover:bg-muted/60",
            )}
          >
            Unread only
            {totalUnread > 0 ? (
              <span
                className={cn(
                  "text-[10.5px] tabular-nums",
                  unreadOnly ? "text-background/70" : "text-ink/45",
                )}
              >
                {totalUnread}
              </span>
            ) : null}
          </button>
          <span className="text-[11px] text-ink/45 tabular-nums">
            {visible.length} / {feeds.length}
          </span>
        </div>
      </div>

      <ul className="divide-y divide-border flex-1 min-h-0 overflow-y-auto">
        {visible.length === 0 ? (
          <li className="px-4 py-8 text-center text-[12px] text-ink/50">
            {unreadOnly ? "Nothing unread." : "No matches."}
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
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "block text-[13px] text-ink truncate",
                          unread > 0 ? "font-semibold" : "font-medium",
                        )}
                      >
                        {f.title}
                      </span>
                      {unread > 0 ? (
                        <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-ink text-background text-[10px] font-semibold tabular-nums shrink-0">
                          {unread > 99 ? "99+" : unread}
                        </span>
                      ) : null}
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

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
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
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
