"use client";

import * as React from "react";
import { Select } from "@base-ui/react/select";
import { ChevronDown } from "lucide-react";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function generateHours(): string[] {
  return Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
}

function generateMinutes(): string[] {
  return ["00", "15", "30", "45"];
}

export function TimePicker({ value, onChange, disabled }: TimePickerProps) {
  const [hours, minutes] = value.split(":");
  const hourItems = generateHours();
  const minuteItems = generateMinutes();

  const handleHourChange = (newHour: string | null) => {
    if (!newHour) return;
    onChange(`${newHour}:${minutes || "00"}`);
  };

  const handleMinuteChange = (newMinute: string | null) => {
    if (!newMinute) return;
    onChange(`${hours || "12"}:${newMinute}`);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Hours Select */}
      <Select.Root
        value={hours || "12"}
        onValueChange={handleHourChange}
        disabled={disabled}
      >
        <Select.Trigger className="inline-flex items-center justify-between gap-2 h-10 min-w-[4.5rem] pl-3 pr-2 rounded-xl border border-border-strong bg-background text-[14px] text-ink hover:border-ink/50 focus-visible:outline-none focus-visible:border-ink transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
          <Select.Value />
          <Select.Icon className="inline-flex">
            <ChevronDown className="w-3.5 h-3.5 text-ink/50" />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Positioner sideOffset={4} className="z-50 outline-none">
            <Select.Popup className="min-w-[var(--anchor-width)] max-h-[200px] overflow-auto rounded-xl border border-border-strong bg-background-elev shadow-lg p-1 outline-none">
              {hourItems.map((h) => (
                <Select.Item
                  key={h}
                  value={h}
                  className="relative flex items-center justify-center h-8 rounded-lg text-[13px] text-ink cursor-pointer select-none outline-none data-[highlighted]:bg-muted data-[selected]:bg-ink data-[selected]:text-background"
                >
                  <Select.ItemText>{h}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>

      <span className="text-ink/40 font-medium">:</span>

      {/* Minutes Select */}
      <Select.Root
        value={minutes || "00"}
        onValueChange={handleMinuteChange}
        disabled={disabled}
      >
        <Select.Trigger className="inline-flex items-center justify-between gap-2 h-10 min-w-[4.5rem] pl-3 pr-2 rounded-xl border border-border-strong bg-background text-[14px] text-ink hover:border-ink/50 focus-visible:outline-none focus-visible:border-ink transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
          <Select.Value />
          <Select.Icon className="inline-flex">
            <ChevronDown className="w-3.5 h-3.5 text-ink/50" />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Positioner sideOffset={4} className="z-50 outline-none">
            <Select.Popup className="min-w-[var(--anchor-width)] rounded-xl border border-border-strong bg-background-elev shadow-lg p-1 outline-none">
              {minuteItems.map((m) => (
                <Select.Item
                  key={m}
                  value={m}
                  className="relative flex items-center justify-center h-8 rounded-lg text-[13px] text-ink cursor-pointer select-none outline-none data-[highlighted]:bg-muted data-[selected]:bg-ink data-[selected]:text-background"
                >
                  <Select.ItemText>{m}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
