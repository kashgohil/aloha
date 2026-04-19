"use client";

import { Bell, CheckCircle2, AlertCircle, AlertTriangle, Inbox } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "./notifications-actions";

type Item = {
  id: string;
  kind: "post_published" | "post_partial" | "post_failed" | "inbox_sync_failed";
  title: string;
  body: string | null;
  url: string | null;
  isRead: boolean;
  createdAt: string | Date;
};

const KIND_ICON = {
  post_published: CheckCircle2,
  post_partial: AlertTriangle,
  post_failed: AlertCircle,
  inbox_sync_failed: Inbox,
} as const;

const KIND_TINT = {
  post_published: "text-emerald-600",
  post_partial: "text-amber-600",
  post_failed: "text-rose-600",
  inbox_sync_failed: "text-amber-600",
} as const;

function timeAgo(d: Date): string {
  const secs = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000));
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString();
}

export function NotificationsBell({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [, startTransition] = useTransition();

  const load = useCallback(async () => {
    try {
      const data = await fetchNotifications();
      setItems(
        data.items.map((i) => ({
          ...i,
          createdAt: new Date(i.createdAt as unknown as string),
        })) as Item[],
      );
      setUnread(data.unread);
      setLoaded(true);
    } catch {
      // ignore — a bell that can't fetch just shows no unread count
    }
  }, []);

  // Prime the unread dot on mount; refresh when the popover opens.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchNotifications();
        if (cancelled) return;
        setItems(
          data.items.map((i) => ({
            ...i,
            createdAt: new Date(i.createdAt as unknown as string),
          })) as Item[],
        );
        setUnread(data.unread);
        setLoaded(true);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleMarkAll = () => {
    if (unread === 0) return;
    setUnread(0);
    setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
    startTransition(() => {
      markAllNotificationsRead().catch(() => load());
    });
  };

  const handleItemClick = (item: Item) => {
    if (!item.isRead) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isRead: true } : i)),
      );
      setUnread((u) => Math.max(0, u - 1));
      startTransition(() => {
        markNotificationRead(item.id).catch(() => load());
      });
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        aria-label="Notifications"
        title="Notifications"
        className={cn(
          "relative h-9 w-9 shrink-0 grid place-items-center rounded-full text-ink/70 hover:text-ink hover:bg-muted/60 transition-colors",
          className,
        )}
      >
        <Bell className="w-[17px] h-[17px]" />
        {unread > 0 ? (
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary" />
        ) : null}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[340px] p-0 overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="text-[13.5px] font-medium text-ink">
            Notifications
          </div>
          <button
            type="button"
            onClick={handleMarkAll}
            disabled={unread === 0}
            className="text-[12px] text-ink/60 hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Mark all read
          </button>
        </div>
        <div className="max-h-[360px] overflow-y-auto">
          {!loaded ? (
            <div className="px-4 py-8 text-center text-[13px] text-ink/50">
              Loading…
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-8 text-center text-[13px] text-ink/50">
              You&apos;re all caught up.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => {
                const Icon = KIND_ICON[item.kind];
                const tint = KIND_TINT[item.kind];
                const createdAt =
                  item.createdAt instanceof Date
                    ? item.createdAt
                    : new Date(item.createdAt);
                const inner = (
                  <div
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors w-full",
                      !item.isRead && "bg-muted/30",
                    )}
                  >
                    <Icon className={cn("w-4 h-4 mt-[2px] shrink-0", tint)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="text-[13px] text-ink font-medium truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-ink/40 shrink-0">
                          {timeAgo(createdAt)}
                        </div>
                      </div>
                      {item.body ? (
                        <div className="mt-0.5 text-[12.5px] text-ink/60 line-clamp-2">
                          {item.body}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
                return (
                  <li key={item.id}>
                    {item.url ? (
                      <Link
                        href={item.url}
                        onClick={() => handleItemClick(item)}
                        className="block"
                      >
                        {inner}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleItemClick(item)}
                        className="block w-full"
                      >
                        {inner}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
