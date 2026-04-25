"use client";

import { MediaPicker } from "@/components/media-picker";
import type { FormEditorProps } from "@/lib/channels/capabilities/types";
import { readPostPayload, type PostPayload } from "./post-payload";

export { readPostPayload, type PostPayload } from "./post-payload";

export function makePostEditor(options: {
  maxChars: number;
  label?: string;
  placeholder?: string;
  maxMedia?: number;
  acceptMedia?: string;
  // Enables a content-warning / spoiler text row above the body. When
  // enabled the field is always rendered; empty string = no warning.
  contentWarning?: { label: string; placeholder?: string };
}) {
  const {
    maxChars,
    label = "Post",
    placeholder = "What's happening?",
    maxMedia = 4,
    acceptMedia,
    contentWarning,
  } = options;
  return function PostEditor({
    payload,
    onChange,
    disabled,
  }: FormEditorProps) {
    const { text, media, spoilerText } = readPostPayload(payload);
    const remaining = maxChars - text.length;
    return (
      <div className="flex flex-col gap-3">
        {contentWarning ? (
          <label className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
              {contentWarning.label}
            </span>
            <input
              type="text"
              value={spoilerText ?? ""}
              onChange={(e) =>
                onChange({
                  ...payload,
                  text,
                  media,
                  spoilerText: e.target.value,
                } satisfies PostPayload)
              }
              disabled={disabled}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-ink/20 disabled:opacity-60"
              placeholder={contentWarning.placeholder ?? "Optional"}
            />
          </label>
        ) : null}
        <label className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            {label}
          </span>
          <textarea
            value={text}
            onChange={(e) =>
              onChange({
                ...payload,
                text: e.target.value,
                media,
              } satisfies PostPayload)
            }
            disabled={disabled}
            rows={maxChars > 1000 ? 14 : 6}
            className="w-full rounded-2xl border border-border bg-background p-3 text-[14.5px] leading-[1.55] text-ink focus:outline-none focus:ring-2 focus:ring-ink/20 disabled:opacity-60"
            placeholder={placeholder}
          />
        </label>
        {maxMedia > 0 ? (
          <MediaPicker
            media={media}
            onChange={(next) =>
              onChange({ ...payload, text, media: next } satisfies PostPayload)
            }
            max={maxMedia}
            accept={acceptMedia}
            disabled={disabled}
          />
        ) : null}
        <div className="flex items-center justify-end text-[12px] text-ink/55">
          <span
            className={
              remaining < 0
                ? "text-red-600"
                : remaining < 20
                  ? "text-amber-600"
                  : undefined
            }
          >
            {remaining}
          </span>
        </div>
      </div>
    );
  };
}
