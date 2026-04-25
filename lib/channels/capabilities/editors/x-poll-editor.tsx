"use client";

import { Plus, Trash2 } from "lucide-react";
import type { FormEditorProps } from "@/lib/channels/capabilities/types";
import { readXPollPayload, type XPollPayload } from "./x-poll-payload";

export { readXPollPayload, type XPollPayload } from "./x-poll-payload";

const MAX_TEXT = 280;
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 4;
const MAX_OPTION_CHARS = 25;

// Duration choices mirror the X composer: 5 min to 7 days. Values in
// minutes match what the API expects directly.
const DURATION_CHOICES: { label: string; minutes: number }[] = [
  { label: "5 min", minutes: 5 },
  { label: "1 hour", minutes: 60 },
  { label: "6 hours", minutes: 360 },
  { label: "1 day", minutes: 1440 },
  { label: "3 days", minutes: 4320 },
  { label: "7 days", minutes: 10080 },
];

export function XPollEditor({ payload, onChange, disabled }: FormEditorProps) {
  const { text, options, durationMinutes } = readXPollPayload(payload);
  const remaining = MAX_TEXT - text.length;

  const update = (next: Partial<XPollPayload>) =>
    onChange({ ...payload, text, options, durationMinutes, ...next });

  const setOption = (i: number, value: string) =>
    update({ options: options.map((o, idx) => (idx === i ? value : o)) });
  const addOption = () =>
    options.length < MAX_OPTIONS
      ? update({ options: [...options, ""] })
      : undefined;
  const removeOption = (i: number) =>
    options.length > MIN_OPTIONS
      ? update({ options: options.filter((_, idx) => idx !== i) })
      : undefined;

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          Question
        </span>
        <textarea
          value={text}
          onChange={(e) => update({ text: e.target.value })}
          disabled={disabled}
          rows={3}
          className="w-full rounded-2xl border border-border bg-background p-3 text-[14.5px] leading-[1.55] text-ink focus:outline-none focus:ring-2 focus:ring-ink/20 disabled:opacity-60"
          placeholder="Ask something…"
        />
        <span
          className={
            remaining < 0
              ? "self-end text-[12px] text-red-600"
              : remaining < 20
                ? "self-end text-[12px] text-amber-600"
                : "self-end text-[12px] text-ink/55"
          }
        >
          {remaining}
        </span>
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          Options
        </span>
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={opt}
              onChange={(e) => setOption(i, e.target.value)}
              disabled={disabled}
              maxLength={MAX_OPTION_CHARS}
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-ink/20 disabled:opacity-60"
              placeholder={`Option ${i + 1}`}
            />
            {options.length > MIN_OPTIONS ? (
              <button
                type="button"
                onClick={() => removeOption(i)}
                disabled={disabled}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-ink/50 hover:bg-muted/60 hover:text-ink transition-colors disabled:opacity-50"
                aria-label="Remove option"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>
        ))}
        {options.length < MAX_OPTIONS ? (
          <button
            type="button"
            onClick={addOption}
            disabled={disabled}
            className="self-start inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-ink hover:bg-muted/60 transition-colors disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            Add option
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          Duration
        </span>
        <div className="flex flex-wrap gap-1">
          {DURATION_CHOICES.map((choice) => (
            <button
              key={choice.minutes}
              type="button"
              onClick={() => update({ durationMinutes: choice.minutes })}
              disabled={disabled}
              className={
                choice.minutes === durationMinutes
                  ? "rounded-full bg-ink text-background px-3 py-1.5 text-[12px] font-medium disabled:opacity-50"
                  : "rounded-full border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-ink/70 hover:bg-muted/60 transition-colors disabled:opacity-50"
              }
            >
              {choice.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
