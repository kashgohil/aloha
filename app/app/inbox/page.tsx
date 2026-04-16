import { db } from "@/db";
import { inboxMessages } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { cn } from "@/lib/utils";
import { and, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { InboxList } from "./_components/inbox-list";
import { InboxThread } from "./_components/inbox-thread";
import { InboxEmpty } from "./_components/inbox-empty";
import { RefreshButton, MarkAllReadButton } from "./_components/inbox-actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const FILTERS = ["all", "unread", "replies", "mentions"] as const;
type Filter = (typeof FILTERS)[number];

const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

export default async function InboxPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = (await getCurrentUser())!;
  const tz = user.timezone ?? "UTC";

  const params = await searchParams;
  const filter: Filter = FILTERS.includes(first(params.filter) as Filter)
    ? (first(params.filter) as Filter)
    : "all";
  const selectedId = first(params.selected) ?? null;

  const where = [eq(inboxMessages.userId, user.id)];
  if (filter === "unread") where.push(eq(inboxMessages.isRead, false));
  if (filter === "replies") where.push(eq(inboxMessages.reason, "reply"));
  if (filter === "mentions") where.push(eq(inboxMessages.reason, "mention"));

  const messages = await db
    .select()
    .from(inboxMessages)
    .where(and(...where))
    .orderBy(desc(inboxMessages.platformCreatedAt))
    .limit(200);

  let threadMessages: typeof messages = [];
  if (selectedId) {
    const selected = messages.find((m) => m.id === selectedId);
    if (selected?.threadId) {
      threadMessages = await db
        .select()
        .from(inboxMessages)
        .where(
          and(
            eq(inboxMessages.userId, user.id),
            eq(inboxMessages.threadId, selected.threadId),
          ),
        )
        .orderBy(inboxMessages.platformCreatedAt)
        .limit(100);
    } else if (selected) {
      threadMessages = [selected];
    }
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            Messages
          </p>
          <h1 className="mt-3 font-display text-[44px] lg:text-[56px] leading-[1.02] tracking-[-0.03em] text-ink font-normal">
            Inbox
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <MarkAllReadButton />
          <RefreshButton />
        </div>
      </header>

      {/* Filter tabs */}
      <nav className="flex items-center gap-1 border-b border-border pb-px">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "all" ? "/app/inbox" : `/app/inbox?filter=${f}`}
            className={cn(
              "relative inline-flex items-center h-10 px-4 text-[13.5px] font-medium transition-colors whitespace-nowrap",
              filter === f ? "text-ink" : "text-ink/55 hover:text-ink",
            )}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {filter === f && (
              <span className="absolute bottom-0 inset-x-4 h-[2px] bg-ink rounded-full" />
            )}
          </Link>
        ))}
      </nav>

      {messages.length === 0 ? (
        <InboxEmpty />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-0 rounded-2xl border border-border bg-background-elev overflow-hidden min-h-[500px]">
          {/* Message list */}
          <div className="overflow-y-auto border-r border-border max-h-[700px]">
            <InboxList
              messages={messages}
              selectedId={selectedId}
              tz={tz}
            />
          </div>

          {/* Thread panel */}
          <div className="hidden lg:flex flex-col">
            {selectedId && threadMessages.length > 0 ? (
              <InboxThread
                messages={threadMessages}
                selectedId={selectedId}
                tz={tz}
              />
            ) : (
              <div className="flex-1 grid place-items-center text-[14px] text-ink/40">
                Select a message to view the conversation
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
