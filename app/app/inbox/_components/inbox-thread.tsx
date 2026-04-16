import type { inboxMessages } from "@/db/schema";
import type { InferSelectModel } from "drizzle-orm";
import { InboxReplyForm } from "./inbox-reply-form";

type Message = InferSelectModel<typeof inboxMessages>;

const PLATFORM_LABELS: Record<string, string> = {
  bluesky: "Bluesky",
  twitter: "X",
};

export function InboxThread({
  messages,
  selectedId,
  tz,
}: {
  messages: Message[];
  selectedId: string;
  tz: string;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-1 p-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-xl px-4 py-3 ${
              m.id === selectedId
                ? "bg-peach-100/40 border border-border"
                : "bg-muted/30"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              {m.authorAvatarUrl ? (
                <img
                  src={m.authorAvatarUrl}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-muted grid place-items-center text-[11px] font-medium text-ink/60">
                  {(m.authorDisplayName ?? m.authorHandle)
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
              <span className="text-[13px] font-medium text-ink">
                {m.authorDisplayName ?? m.authorHandle}
              </span>
              <span className="text-[11px] text-ink/45">
                @{m.authorHandle}
              </span>
              <span className="ml-auto text-[11px] text-ink/40">
                {formatDateTime(m.platformCreatedAt, tz)}
              </span>
            </div>
            <p className="text-[14px] text-ink/80 leading-[1.55] whitespace-pre-wrap">
              {m.content}
            </p>
            <div className="mt-2">
              <span className="inline-flex items-center h-5 px-2 rounded-full bg-peach-100 border border-border text-[10px] text-ink/70">
                {PLATFORM_LABELS[m.platform] ?? m.platform}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border p-4">
        <InboxReplyForm messageId={selectedId} />
      </div>
    </div>
  );
}

function formatDateTime(date: Date, tz: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz,
  }).format(date);
}
