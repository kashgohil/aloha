"use client";

import { useTransition } from "react";
import { refreshInbox, markAllAsRead } from "@/app/actions/inbox";
import { CheckCheck, RefreshCw } from "lucide-react";

export function RefreshButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(async () => { await refreshInbox(); })}
      disabled={pending}
      className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-border-strong bg-background-elev text-[13px] font-medium text-ink hover:bg-muted/60 transition-colors disabled:opacity-50"
    >
      <RefreshCw
        className={`w-3.5 h-3.5 ${pending ? "animate-spin" : ""}`}
      />
      {pending ? "Syncing..." : "Refresh"}
    </button>
  );
}

export function MarkAllReadButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => markAllAsRead())}
      disabled={pending}
      className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-border-strong bg-background-elev text-[13px] font-medium text-ink/70 hover:text-ink hover:bg-muted/60 transition-colors disabled:opacity-50"
    >
      <CheckCheck className="w-3.5 h-3.5" />
      Mark all read
    </button>
  );
}
