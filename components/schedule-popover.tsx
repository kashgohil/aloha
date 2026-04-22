"use client";

// Shared schedule popover. Used by the composer's publish/schedule bar and
// the reschedule button on the post detail page so both flows look and feel
// identical — calendar + time picker, same trigger pill, same hint styling.

import { AlertCircle, CalendarClock, Clock, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TimePicker } from "@/components/ui/time-picker";
import { cn } from "@/lib/utils";
import {
  buildTzLocalInput,
  formatTzLocalInputForDisplay,
} from "@/lib/tz";

export function SchedulePopover({
  scheduledAt,
  setScheduledAt,
  open,
  setOpen,
  onConfirm,
  disabled = false,
  busy = false,
  timezone,
  hint,
  confirmLabel = "Schedule",
  idleLabel = "Schedule",
  allowClear = true,
}: {
  // `scheduledAt` is a "YYYY-MM-DDTHH:mm" wall-clock string in `timezone`.
  scheduledAt: string;
  setScheduledAt: (v: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  onConfirm: () => void;
  disabled?: boolean;
  busy?: boolean;
  timezone: string;
  hint?: string | null;
  // Label on the confirm button inside the popover.
  confirmLabel?: string;
  // Label on the trigger button when no time is selected.
  idleLabel?: string;
  // Whether the "Clear" button is shown (hidden on reschedule — you can't
  // un-schedule a scheduled post from here).
  allowClear?: boolean;
}) {
  const selectedDate = scheduledAt
    ? (() => {
        const [y, m, d] = scheduledAt.slice(0, 10).split("-").map(Number);
        return new Date(y, m - 1, d);
      })()
    : undefined;
  const [selectedTime, setSelectedTime] = useState<string>(
    scheduledAt ? scheduledAt.slice(11, 16) : "12:00",
  );

  useEffect(() => {
    if (scheduledAt) {
      setSelectedTime(scheduledAt.slice(11, 16));
    }
  }, [scheduledAt]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setScheduledAt(
      buildTzLocalInput(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
        selectedTime,
      ),
    );
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    if (selectedDate) {
      setScheduledAt(
        buildTzLocalInput(
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1,
          selectedDate.getDate(),
          time,
        ),
      );
    }
  };

  const preview = scheduledAt
    ? formatTzLocalInputForDisplay(scheduledAt, timezone)
    : idleLabel;

  const minDate = (() => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
    return new Date(get("year"), get("month") - 1, get("day"));
  })();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1.5 h-10 px-4 rounded-full border text-[13px] font-medium transition-colors",
              scheduledAt
                ? "bg-peach-100 border-ink/20 text-ink"
                : "bg-background-elev border-border-strong text-ink hover:border-ink",
            )}
          >
            <CalendarClock className="w-4 h-4" />
            {preview}
          </button>
        }
      />
      <PopoverContent align="center" sideOffset={8} className="w-[360px] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          Schedule
        </p>
        <p className="mt-1 text-[12.5px] text-ink/60 leading-normal">
          Your timezone: <span className="text-ink">{timezone}</span>
        </p>

        {hint ? (
          <p className="mt-3 flex items-start gap-1.5 rounded-xl border border-border bg-peach-100/60 px-3 py-2 text-[12px] text-ink/75 leading-[1.45]">
            <AlertCircle className="w-3.5 h-3.5 mt-[2px] text-primary shrink-0" />
            <span>{hint}</span>
          </p>
        ) : null}

        <div className="mt-4 rounded-xl border border-border-strong bg-background p-3">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            defaultMonth={selectedDate}
            captionLayout="dropdown"
            startMonth={new Date(minDate.getFullYear(), 0)}
            endMonth={new Date(minDate.getFullYear() + 5, 11)}
            disabled={{ before: minDate }}
            autoFocus
            className="w-full p-0 [--cell-size:--spacing(8)]"
            classNames={{
              root: "w-full",
              month: "relative flex w-full flex-col gap-4",
              month_caption:
                "flex h-(--cell-size) w-full items-center justify-center",
              button_previous:
                "absolute top-0 left-0 z-10 size-8 p-0 inline-flex items-center justify-center rounded-full text-ink hover:bg-muted/50 transition-colors",
              button_next:
                "absolute top-0 right-0 z-10 size-8 p-0 inline-flex items-center justify-center rounded-full text-ink hover:bg-muted/50 transition-colors",
            }}
          />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-ink/50 shrink-0" />
          <span className="text-[12.5px] text-ink/60 mr-auto">Time</span>
          <TimePicker value={selectedTime} onChange={handleTimeChange} />
        </div>

        <div className="mt-5 flex items-center gap-2">
          {allowClear ? (
            <button
              type="button"
              onClick={() => {
                setScheduledAt("");
                setOpen(false);
              }}
              className="flex-1 h-10 rounded-full text-[13px] text-ink/70 hover:text-ink transition-colors"
            >
              Clear
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 h-10 rounded-full text-[13px] text-ink/70 hover:text-ink transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={disabled || busy || !scheduledAt}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary disabled:opacity-40 disabled:hover:bg-ink transition-colors"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {confirmLabel}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
