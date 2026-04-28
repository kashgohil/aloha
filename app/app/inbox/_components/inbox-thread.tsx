import type { inboxMessages } from "@/db/schema";
import type { InferSelectModel } from "drizzle-orm";
import { cn } from "@/lib/utils";
import { AvatarWithChannel } from "./avatar-with-channel";
import { InboxReplyForm } from "./inbox-reply-form";

type Message = InferSelectModel<typeof inboxMessages>;

type Counterparty = {
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
};

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
                @{counterparty.handle}
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
            const sameAsPrev =
              prev && prev.direction === m.direction && isDm;
            const sameAsNext =
              next && next.direction === m.direction && isDm;
            return (
              <li
                key={m.id}
                className={cn(
                  "flex",
                  isOutbound ? "justify-end" : "justify-start",
                  sameAsPrev ? "mt-0" : "mt-2",
                )}
              >
                <div
                  className={cn(
                    "max-w-[78%] px-3.5 py-2 text-[14px] leading-[1.5] whitespace-pre-wrap",
                    isOutbound
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/60 text-ink",
                    // Bubble corner shaping for grouped sequences. Tail
                    // corner stays sharp; the rest pillow.
                    isOutbound
                      ? cn(
                          "rounded-2xl rounded-br-md",
                          sameAsPrev && "rounded-tr-md",
                          sameAsNext && "rounded-br-2xl",
                        )
                      : cn(
                          "rounded-2xl rounded-bl-md",
                          sameAsPrev && "rounded-tl-md",
                          sameAsNext && "rounded-bl-2xl",
                        ),
                  )}
                  title={formatDateTime(m.platformCreatedAt, tz)}
                >
                  {m.content}
                </div>
              </li>
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

function formatDateTime(date: Date, tz: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz,
  }).format(date);
}
