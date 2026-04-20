import { db } from "@/db";
import { inboxMessages } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { and, desc, eq, sql } from "drizzle-orm";
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

  // Messages + counts are independent — fire concurrently. Counts are
  // computed in SQL rather than scanning the whole inbox in Node.
  const [messages, countsRows] = await Promise.all([
    db
      .select()
      .from(inboxMessages)
      .where(and(...where))
      .orderBy(desc(inboxMessages.platformCreatedAt))
      .limit(200),
    db
      .select({
        all: sql<number>`count(*)`,
        unread: sql<number>`count(*) filter (where ${inboxMessages.isRead} = false)`,
        replies: sql<number>`count(*) filter (where ${inboxMessages.reason} = 'reply')`,
        mentions: sql<number>`count(*) filter (where ${inboxMessages.reason} = 'mention')`,
      })
      .from(inboxMessages)
      .where(eq(inboxMessages.userId, user.id)),
  ]);
  const countRow = countsRows[0];
  const counts: Record<Filter, number> = {
    all: Number(countRow?.all ?? 0),
    unread: Number(countRow?.unread ?? 0),
    replies: Number(countRow?.replies ?? 0),
    mentions: Number(countRow?.mentions ?? 0),
  };

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
            Inbox<span className="text-primary font-light">.</span>
          </h1>
          <p className="mt-3 text-[14px] text-ink/65 max-w-xl leading-[1.55]">
            Replies, mentions, and DMs from your connected channels — all in
            one place so nothing slips by.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MarkAllReadButton />
          <RefreshButton />
        </div>
      </header>

      <FilterTabs
        activeKey={filter}
        items={FILTERS.map((f) => ({
          key: f,
          label: f.charAt(0).toUpperCase() + f.slice(1),
          href: f === "all" ? "/app/inbox" : `/app/inbox?filter=${f}`,
          count: counts[f],
        }))}
      />

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
