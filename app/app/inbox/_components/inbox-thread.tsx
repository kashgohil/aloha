import type { inboxMessages } from "@/db/schema";
import type { InferSelectModel } from "drizzle-orm";
import { Fragment } from "react";
import { cn } from "@/lib/utils";
import { AvatarWithChannel } from "./avatar-with-channel";
import { InboxReplyForm } from "./inbox-reply-form";
import { MessageAttachments } from "./message-attachments";
import { MessageContent } from "./message-content";

type Message = InferSelectModel<typeof inboxMessages>;

type Counterparty = {
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
};

const CLUSTER_GAP_MS = 5 * 60 * 1000;

export function InboxThread({
  messages,
  selectedId,
  tz,
  counterparty,
}: {
  messages: Message[];
  selectedId: string;
  tz: string;
  counterparty?: Counterparty | null;
}) {
  const selected = messages.find((m) => m.id === selectedId);
  const isDm = selected?.reason === "dm";
  return (
    <div className="flex flex-col h-full">
      {isDm && counterparty ? (
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background-elev">
          <AvatarWithChannel
            avatarUrl={counterparty.avatarUrl}
            fallbackChar={(counterparty.displayName ?? counterparty.handle).charAt(0)}
            platform={selected?.platform ?? ""}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-medium text-ink truncate">
              {counterparty.displayName ?? counterparty.handle}
            </p>
            {counterparty.displayName ? (
              <p className="text-[12px] text-ink/55 truncate">
                <HandleLink
                  platform={selected?.platform ?? ""}
                  handle={counterparty.handle}
                />
              </p>
            ) : null}
          </div>
        </header>
      ) : null}
      <div className="flex-1 overflow-y-auto p-4">
        <ol className="flex flex-col gap-1.5">
          {messages.map((m, idx) => {
            const isOutbound = m.direction === "out";
            const prev = messages[idx - 1];
            const next = messages[idx + 1];
            const showDateSeparator =
              !prev ||
              !sameLocalDay(prev.platformCreatedAt, m.platformCreatedAt, tz);
            // Cluster = same direction AND within CLUSTER_GAP_MS of the
            // adjacent message AND no day boundary between them.
            const sameAsPrev =
              !!prev &&
              prev.direction === m.direction &&
              isDm &&
              !showDateSeparator &&
              m.platformCreatedAt.getTime() -
                prev.platformCreatedAt.getTime() <
                CLUSTER_GAP_MS;
            const sameAsNext =
              !!next &&
              next.direction === m.direction &&
              isDm &&
              sameLocalDay(m.platformCreatedAt, next.platformCreatedAt, tz) &&
              next.platformCreatedAt.getTime() -
                m.platformCreatedAt.getTime() <
                CLUSTER_GAP_MS;
            const showTimestamp = !sameAsNext;
            const attachments = (m.attachments ?? []) as Array<{
              type: string;
              url: string;
              previewUrl?: string;
              width?: number;
              height?: number;
              altText?: string;
            }>;
            const hasText = m.content.trim().length > 0;
            return (
              <Fragment key={m.id}>
                {showDateSeparator ? (
                  <li className="flex justify-center my-3">
                    <span className="inline-flex items-center h-6 px-3 rounded-full bg-muted/60 text-[11px] font-medium text-ink/55">
                      {formatDateLabel(m.platformCreatedAt, tz)}
                    </span>
                  </li>
                ) : null}
                <li
                  className={cn(
                    "flex flex-col",
                    isOutbound ? "items-end" : "items-start",
                    sameAsPrev ? "mt-0" : "mt-2",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[78%] flex flex-col gap-1.5",
                    )}
                  >
                    {attachments.length > 0 ? (
                      <MessageAttachments
                        attachments={attachments}
                        isOutbound={isOutbound}
                        sameAsPrev={sameAsPrev}
                        sameAsNext={sameAsNext || hasText}
                      />
                    ) : null}
                    {hasText ? (
                      <div
                        className={cn(
                          "px-3.5 py-2 text-[14px] leading-[1.5]",
                          isOutbound
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/60 text-ink",
                          isOutbound
                            ? cn(
                                "rounded-2xl rounded-br-md",
                                sameAsPrev && attachments.length === 0 && "rounded-tr-md",
                                sameAsNext && "rounded-br-2xl",
                              )
                            : cn(
                                "rounded-2xl rounded-bl-md",
                                sameAsPrev && attachments.length === 0 && "rounded-tl-md",
                                sameAsNext && "rounded-bl-2xl",
                              ),
                        )}
                      >
                        <MessageContent
                          text={m.content}
                          platform={m.platform}
                          linkClassName={cn(
                            "decoration-2",
                            isOutbound
                              ? "text-primary-foreground/95 decoration-primary-foreground/40"
                              : "text-ink decoration-ink/40",
                          )}
                        />
                      </div>
                    ) : null}
                  </div>
                  {showTimestamp ? (
                    <span
                      className={cn(
                        "mt-1 text-[10.5px] text-ink/40",
                        isOutbound ? "mr-1.5" : "ml-1.5",
                      )}
                    >
                      {formatTime(m.platformCreatedAt, tz)}
                    </span>
                  ) : null}
                </li>
              </Fragment>
            );
          })}
        </ol>
      </div>

      <div className="border-t border-border p-4">
        <InboxReplyForm
          messageId={selectedId}
          platform={selected?.platform ?? ""}
          reason={(selected?.reason as "mention" | "dm") ?? "mention"}
        />
      </div>
    </div>
  );
}

function HandleLink({ platform, handle }: { platform: string; handle: string }) {
  const url = profileUrlForHandle(platform, handle);
  if (!url) return <>@{handle}</>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-ink/55 hover:text-ink hover:underline underline-offset-2"
    >
      @{handle}
    </a>
  );
}

function profileUrlForHandle(platform: string, handle: string): string | null {
  const h = handle.replace(/^@+/, "");
  switch (platform) {
    case "x":
    case "twitter":
      return `https://x.com/${h}`;
    case "instagram":
      return `https://instagram.com/${h}`;
    case "threads":
      return `https://threads.net/@${h}`;
    case "bluesky":
      return `https://bsky.app/profile/${h}`;
    case "tiktok":
      return `https://tiktok.com/@${h}`;
    case "reddit":
      return `https://reddit.com/user/${h}`;
    case "pinterest":
      return `https://pinterest.com/${h}`;
    case "medium":
      return `https://medium.com/@${h}`;
    case "telegram":
      return `https://t.me/${h}`;
    case "linkedin":
      return `https://linkedin.com/in/${h}`;
    case "facebook":
      return `https://facebook.com/${h}`;
    case "youtube":
      return `https://youtube.com/@${h}`;
    default:
      return null;
  }
}

function sameLocalDay(a: Date, b: Date, tz: string): boolean {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: tz,
  });
  return fmt.format(a) === fmt.format(b);
}

function formatDateLabel(date: Date, tz: string): string {
  const now = new Date();
  if (sameLocalDay(date, now, tz)) return "Today";
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (sameLocalDay(date, yesterday, tz)) return "Yesterday";
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays < 7) {
    return new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: tz }).format(date);
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: now.getFullYear() === date.getFullYear() ? undefined : "numeric",
    timeZone: tz,
  }).format(date);
}

function formatTime(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz,
  }).format(date);
}
