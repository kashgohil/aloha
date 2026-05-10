"use client";

import { changeBeatFormatAction } from "@/app/actions/campaigns";
import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { useTransition } from "react";

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
  const items = Object.fromEntries(options.map((o) => [o.slug, o.label]));

  return (
    <Select.Root
      value={current}
      items={items}
      onValueChange={(next) => {
        if (!next || next === current) return;
        const formData = new FormData();
        formData.set("campaignId", campaignId);
        formData.set("beatId", beatId);
        formData.set("format", next);
        startTransition(() => {
          changeBeatFormatAction(formData);
        });
      }}
    >
      <Select.Trigger
        disabled={pending}
        className="inline-flex items-center justify-between gap-2 h-9 min-w-[7.5rem] pl-3 pr-2.5 rounded-full border border-border bg-background text-[12.5px] text-ink hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60 transition-colors cursor-pointer"
      >
        <Select.Value />
        <Select.Icon className="inline-flex">
          <ChevronDown className="w-3.5 h-3.5 text-ink/60" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Positioner
          sideOffset={6}
          alignItemWithTrigger={false}
          className="z-50 outline-none"
        >
          <Select.Popup className="min-w-[max(7.5rem,var(--anchor-width))] rounded-2xl border border-border-strong bg-background-elev shadow-lg p-1 outline-none">
            {options.map((o) => (
              <Select.Item
                key={o.slug}
                value={o.slug}
                className="relative flex items-center justify-between gap-3 pl-3 pr-8 h-9 rounded-xl text-[13px] text-ink cursor-pointer select-none outline-none data-[highlighted]:bg-muted/60 data-[selected]:font-medium"
              >
                <Select.ItemText>{o.label}</Select.ItemText>
                <Select.ItemIndicator className="absolute right-2.5 inline-flex items-center">
                  <Check className="w-3.5 h-3.5 text-primary" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
