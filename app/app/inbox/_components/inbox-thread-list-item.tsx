import { cn } from "@/lib/utils";
import Link from "next/link";
import { AvatarWithChannel } from "./avatar-with-channel";

type Props = {
  selectedMessageId: string;
  counterpartyHandle: string;
  counterpartyDisplayName: string | null;
  counterpartyAvatarUrl: string | null;
  lastContent: string;
  lastDirection: "in" | "out" | null;
  platform: string;
  unreadCount: number;
  isSelected: boolean;
  lastActivityAt: Date;
  tz: string;
};

export function InboxThreadListItem({
  selectedMessageId,
  counterpartyHandle,
  counterpartyDisplayName,
  counterpartyAvatarUrl,
  lastContent,
  lastDirection,
  platform,
  unreadCount,
  isSelected,
  lastActivityAt,
  tz,
}: Props) {
  const hasUnread = unreadCount > 0;
  const isOutboundPreview = lastDirection === "out";
  const displayName = counterpartyDisplayName ?? counterpartyHandle;
  return (
    <li>
      <Link
        href={`/app/inbox?filter=dms&selected=${selectedMessageId}`}
        prefetch={false}
        className={cn(
          "group flex items-start gap-3.5 px-4 py-3.5 transition-colors",
          isSelected ? "bg-peach-100/50" : "hover:bg-muted/40",
        )}
      >
        <AvatarWithChannel
          avatarUrl={counterpartyAvatarUrl}
          fallbackChar={displayName.charAt(0)}
          platform={platform}
          size="md"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-[13.5px] truncate",
                hasUnread ? "font-semibold text-ink" : "font-medium text-ink",
              )}
            >
              {displayName}
            </span>
            <span
              className={cn(
                "text-[12px] shrink-0 ml-auto",
                hasUnread ? "text-primary-deep font-medium" : "text-ink/45",
              )}
            >
              {formatTime(lastActivityAt, tz)}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p
              className={cn(
                "flex-1 text-[13px] leading-[1.45] line-clamp-1",
                hasUnread ? "text-ink/85" : "text-ink/60",
              )}
            >
              {isOutboundPreview && <span className="text-ink/40">You: </span>}
              {lastContent}
            </p>
            {hasUnread ? (
              <span className="shrink-0 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-primary text-primary-foreground text-[10.5px] font-semibold">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
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

  if (hours < 24 * 7) {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      timeZone: tz,
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: tz,
  }).format(date);
}
