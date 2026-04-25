"use client";

import { Link as LinkIcon } from "lucide-react";
import { MediaPicker } from "@/components/media-picker";
import type { PostMedia, StudioPayload } from "@/db/schema";
import type { FormEditorProps } from "@/lib/channels/capabilities/types";

export type PinPayload = {
  title: string;
  description: string;
  link: string;
  media: PostMedia[];
};

const TITLE_MAX = 100;
const DESC_MAX = 500;

export function readPinPayload(payload: StudioPayload): PinPayload {
  const title = typeof payload.title === "string" ? payload.title : "";
  const description =
    typeof payload.description === "string" ? payload.description : "";
  const link = typeof payload.link === "string" ? payload.link : "";
  const media = Array.isArray(payload.media)
    ? (payload.media as PostMedia[])
    : [];
  return { title, description, link, media };
}

export function PinEditor({ payload, onChange, disabled }: FormEditorProps) {
  const { title, description, link, media } = readPinPayload(payload);
  const update = (next: Partial<PinPayload>) =>
    onChange({
      ...payload,
      title: next.title ?? title,
      description: next.description ?? description,
      link: next.link ?? link,
      media: next.media ?? media,
    } satisfies PinPayload);
  const titleRemaining = TITLE_MAX - title.length;
  const descRemaining = DESC_MAX - description.length;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          Cover image
        </span>
        <MediaPicker
          media={media}
          onChange={(next) => update({ media: next })}
          max={1}
          accept="image/*"
          disabled={disabled}
          label="Upload image"
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
          placeholder="Pin title"
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
          maxLength={DESC_MAX}
          rows={4}
          className="w-full rounded-2xl border border-border bg-background p-3 text-[14.5px] leading-[1.55] text-ink focus:outline-none focus:ring-2 focus:ring-ink/20 disabled:opacity-60"
          placeholder="Tell people what this pin is about"
        />
        <span
          className={
            descRemaining < 30
              ? "self-end text-[11px] text-amber-600"
              : "self-end text-[11px] text-ink/55"
          }
        >
          {descRemaining}
        </span>
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          Destination URL
        </span>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3">
          <LinkIcon className="w-4 h-4 text-ink/50" />
          <input
            type="url"
            value={link}
            onChange={(e) => update({ link: e.target.value })}
            disabled={disabled}
            className="flex-1 bg-transparent py-2 text-[14px] text-ink focus:outline-none disabled:opacity-60"
            placeholder="https://…"
          />
        </div>
      </label>
    </div>
  );
}
