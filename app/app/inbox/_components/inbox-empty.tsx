import { Inbox } from "lucide-react";
import Link from "next/link";

export function InboxEmpty() {
  return (
    <div className="rounded-2xl border border-dashed border-border-strong bg-background-elev px-8 py-12 text-center">
      <span className="inline-grid place-items-center w-12 h-12 rounded-full bg-peach-100 border border-border">
        <Inbox className="w-5 h-5 text-ink" />
      </span>
      <p className="mt-5 font-display text-[24px] leading-[1.15] tracking-[-0.01em] text-ink">
        No messages yet.
      </p>
      <p className="mt-2 text-[13.5px] text-ink/60 max-w-md mx-auto leading-[1.55]">
        Connect a channel and hit refresh to pull in your latest mentions and
        replies.
      </p>
      <Link
        href="/app/settings/channels"
        className="mt-6 inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
      >
        Connect a channel
      </Link>
    </div>
  );
}
