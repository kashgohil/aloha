import { InboxThreadListItem } from "./inbox-thread-list-item";

export type DmThreadSummary = {
  threadId: string;
  platform: string;
  selectedMessageId: string;
  counterpartyHandle: string;
  counterpartyDisplayName: string | null;
  counterpartyAvatarUrl: string | null;
  lastContent: string;
  lastDirection: "in" | "out" | null;
  lastHasAttachment: boolean;
  unreadCount: number;
  lastActivityAt: Date;
};

export function InboxThreadList({
  threads,
  selectedThreadId,
  tz,
}: {
  threads: DmThreadSummary[];
  selectedThreadId: string | null;
  tz: string;
}) {
  return (
    <ul className="divide-y divide-border">
      {threads.map((t) => (
        <InboxThreadListItem
          key={`${t.platform}:${t.threadId}`}
          selectedMessageId={t.selectedMessageId}
          counterpartyHandle={t.counterpartyHandle}
          counterpartyDisplayName={t.counterpartyDisplayName}
          counterpartyAvatarUrl={t.counterpartyAvatarUrl}
          lastContent={t.lastContent}
          lastDirection={t.lastDirection}
          lastHasAttachment={t.lastHasAttachment}
          platform={t.platform}
          unreadCount={t.unreadCount}
          isSelected={t.threadId === selectedThreadId}
          lastActivityAt={t.lastActivityAt}
          tz={tz}
        />
      ))}
    </ul>
  );
}
