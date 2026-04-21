import { cn } from "@/lib/utils";
import Link from "next/link";

type Props = {
  id: string;
  authorHandle: string;
  authorDisplayName: string | null;
  authorAvatarUrl: string | null;
  content: string;
  platform: string;
  reason: string;
  isRead: boolean;
  isSelected: boolean;
  platformCreatedAt: Date;
  tz: string;
};

const PLATFORM_LABELS: Record<string, string> = {
  bluesky: "Bluesky",
  twitter: "X",
  mastodon: "Mastodon",
};

export function InboxListItem({
  id,
  authorHandle,
  authorDisplayName,
  authorAvatarUrl,
  content,
  platform,
  reason,
  isRead,
  isSelected,
  platformCreatedAt,
  tz,
}: Props) {
  return (
    <li>
      <Link
        href={`/app/inbox?selected=${id}`}
        prefetch={false}
        className={cn(
          "group flex items-start gap-3.5 px-4 py-3.5 transition-colors",
          isSelected
            ? "bg-peach-100/50"
            : "hover:bg-muted/40",
        )}
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          {authorAvatarUrl ? (
            <img
              src={authorAvatarUrl}
              alt=""
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-muted grid place-items-center text-[13px] font-medium text-ink/60">
              {(authorDisplayName ?? authorHandle).charAt(0).toUpperCase()}
            </div>
          )}
          {!isRead && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background-elev" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13.5px] font-medium text-ink truncate">
              {authorDisplayName ?? authorHandle}
            </span>
            <span className="text-[12px] text-ink/45 shrink-0">
              {formatTime(platformCreatedAt, tz)}
            </span>
          </div>
          <p className="text-[13px] text-ink/65 leading-[1.45] line-clamp-2 mt-0.5">
            {content}
          </p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="inline-flex items-center h-5 px-2 rounded-full bg-peach-100 border border-border text-[10px] text-ink/70">
              {PLATFORM_LABELS[platform] ?? platform}
            </span>
            <span className="inline-flex items-center h-5 px-2 rounded-full bg-muted text-[10px] text-ink/55">
              {reason}
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}

function formatTime(date: Date, tz: string) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = diff / (1000 * 60 * 60);

  if (hours < 24) {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: tz,
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: tz,
  }).format(date);
}
