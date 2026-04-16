import type { inboxMessages } from "@/db/schema";
import type { InferSelectModel } from "drizzle-orm";
import { InboxListItem } from "./inbox-list-item";

type Message = InferSelectModel<typeof inboxMessages>;

export function InboxList({
  messages,
  selectedId,
  tz,
}: {
  messages: Message[];
  selectedId: string | null;
  tz: string;
}) {
  return (
    <ul className="divide-y divide-border">
      {messages.map((m) => (
        <InboxListItem
          key={m.id}
          id={m.id}
          authorHandle={m.authorHandle}
          authorDisplayName={m.authorDisplayName}
          authorAvatarUrl={m.authorAvatarUrl}
          content={m.content}
          platform={m.platform}
          reason={m.reason}
          isRead={m.isRead}
          isSelected={m.id === selectedId}
          platformCreatedAt={m.platformCreatedAt}
          tz={tz}
        />
      ))}
    </ul>
  );
}
