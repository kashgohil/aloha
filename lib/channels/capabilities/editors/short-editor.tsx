"use client";

import { MediaPicker } from "@/components/media-picker";
import type { PostMedia, StudioPayload } from "@/db/schema";
import type { FormEditorProps } from "@/lib/channels/capabilities/types";

// Shared editor for vertical short-form video posts that have a real
// title field (YouTube Shorts, future TikTok). Reels reuse `ReelEditor`
// because Instagram Reels don't have a separate title — caption only.
export type ShortPayload = {
  title: string;
  description: string;
  video: PostMedia[];
};

const TITLE_MAX = 100;

export function readShortPayload(payload: StudioPayload): ShortPayload {
  const title = typeof payload.title === "string" ? payload.title : "";
  const description =
    typeof payload.description === "string" ? payload.description : "";
  const video = Array.isArray(payload.video)
    ? (payload.video as PostMedia[])
    : [];
  return { title, description, video };
}

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
