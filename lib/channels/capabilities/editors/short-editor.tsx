"use client";

import { MediaPicker } from "@/components/media-picker";
import type { FormEditorProps } from "@/lib/channels/capabilities/types";
import { readShortPayload, type ShortPayload } from "./short-payload";

export { readShortPayload, type ShortPayload } from "./short-payload";

const TITLE_MAX = 100;

export function makeShortEditor(options: { descriptionMax: number }) {
  const { descriptionMax } = options;
  return function ShortEditor({
    payload,
    onChange,
    disabled,
  }: FormEditorProps) {
    const { title, description, video } = readShortPayload(payload);
    const update = (next: Partial<ShortPayload>) =>
      onChange({
        ...payload,
        title: next.title ?? title,
        description: next.description ?? description,
        video: next.video ?? video,
      } satisfies ShortPayload);
    const titleRemaining = TITLE_MAX - title.length;
    const descRemaining = descriptionMax - description.length;
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            Video
          </span>
          <MediaPicker
            media={video}
            onChange={(next) =>
              update({
                video: next.filter((m) => m.mimeType.startsWith("video/")),
              })
            }
            max={1}
            accept="video/*"
            disabled={disabled}
            label="Upload video"
          />
        </div>
        <label className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            Title
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => update({ title: e.target.value })}
            disabled={disabled}
            maxLength={TITLE_MAX}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-[14.5px] text-ink focus:outline-none focus:ring-2 focus:ring-ink/20 disabled:opacity-60"
            placeholder="A title that hooks people"
          />
          <span
            className={
              titleRemaining < 10
                ? "self-end text-[11px] text-amber-600"
                : "self-end text-[11px] text-ink/55"
            }
          >
            {titleRemaining}
          </span>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            Description
          </span>
          <textarea
            value={description}
            onChange={(e) => update({ description: e.target.value })}
            disabled={disabled}
            rows={6}
            className="w-full rounded-2xl border border-border bg-background p-3 text-[14.5px] leading-[1.55] text-ink focus:outline-none focus:ring-2 focus:ring-ink/20 disabled:opacity-60"
            placeholder="What's this video about?"
          />
          <span
            className={
              descRemaining < 100
                ? "self-end text-[11px] text-amber-600"
                : "self-end text-[11px] text-ink/55"
            }
          >
            {descRemaining}
          </span>
        </label>
      </div>
    );
  };
}
