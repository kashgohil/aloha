"use client";

import { changeBeatFormatAction } from "@/app/actions/campaigns";
import { useTransition } from "react";

// Auto-submit dropdown that POSTs to changeBeatFormatAction on change. Wraps
// a hidden form so the action gets the campaignId + beatId + format fields
// the action expects.
export function FormatSelect({
  campaignId,
  beatId,
  current,
  options,
}: {
  campaignId: string;
  beatId: string;
  current: string;
  options: Array<{ slug: string; label: string }>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={changeBeatFormatAction}
      className="inline-flex items-center"
      onSubmit={() => {
        // No-op; useTransition handles pending state below.
      }}
    >
      <input type="hidden" name="campaignId" value={campaignId} />
      <input type="hidden" name="beatId" value={beatId} />
      <select
        name="format"
        defaultValue={current}
        disabled={pending}
        onChange={(e) => {
          const form = e.currentTarget.form;
          if (!form) return;
          startTransition(() => form.requestSubmit());
        }}
        className="h-9 px-3 pr-8 rounded-full border border-border bg-background text-[12.5px] text-ink focus:outline-none focus:border-ink disabled:opacity-60"
      >
        {options.map((o) => (
          <option key={o.slug} value={o.slug}>
            {o.label}
          </option>
        ))}
      </select>
    </form>
  );
}
