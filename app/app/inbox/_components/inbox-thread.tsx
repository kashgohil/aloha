import type { inboxMessages } from "@/db/schema";
import type { InferSelectModel } from "drizzle-orm";
import { InboxReplyForm } from "./inbox-reply-form";

type Message = InferSelectModel<typeof inboxMessages>;

const PLATFORM_LABELS: Record<string, string> = {
  bluesky: "Bluesky",
  twitter: "X",
  mastodon: "Mastodon",
  telegram: "Telegram",
  instagram: "Instagram",
  facebook: "Facebook",
  threads: "Threads",
};

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
          {counterparty.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={counterparty.avatarUrl}
              alt=""
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-muted grid place-items-center text-[13px] font-medium text-ink/60">
              {(counterparty.displayName ?? counterparty.handle)
                .charAt(0)
                .toUpperCase()}
            </div>
          )}
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
          {selected ? (
            <span className="inline-flex items-center h-5 px-2 rounded-full bg-peach-100 border border-border text-[10px] text-ink/70">
              {PLATFORM_LABELS[selected.platform] ?? selected.platform}
            </span>
          ) : null}
        </header>
      ) : null}
      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        {messages.map((m) => {
          const isOutbound = m.direction === "out";
          return (
            <div
              key={m.id}
              className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 ${
                  m.id === selectedId
                    ? "bg-peach-100/60 border border-border"
                    : isOutbound
                      ? "bg-ink text-background"
                      : "bg-muted/40"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {isOutbound ? (
                    <span
                      className={`text-[13px] font-medium ${
                        m.id === selectedId ? "text-ink" : "text-background/90"
                      }`}
                    >
                      You
                    </span>
                  ) : (
                    <>
                      {m.authorAvatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
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
                      {m.platform !== "linkedin" && (
                        <span className="text-[11px] text-ink/45">
                          @{m.authorHandle}
                        </span>
                      )}
                    </>
                  )}
                  <span
                    className={`ml-auto text-[11px] ${
                      isOutbound && m.id !== selectedId
                        ? "text-background/60"
                        : "text-ink/40"
                    }`}
                  >
                    {formatDateTime(m.platformCreatedAt, tz)}
                  </span>
                </div>
                <p
                  className={`text-[14px] leading-[1.55] whitespace-pre-wrap ${
                    isOutbound && m.id !== selectedId
                      ? "text-background"
                      : "text-ink/80"
                  }`}
                >
                  {m.content}
                </p>
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center h-5 px-2 rounded-full text-[10px] border ${
                      isOutbound && m.id !== selectedId
                        ? "bg-background/10 border-background/20 text-background/80"
                        : "bg-peach-100 border-border text-ink/70"
                    }`}
                  >
                    {PLATFORM_LABELS[m.platform] ?? m.platform}
                    {m.reason === "dm" && " · DM"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
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
