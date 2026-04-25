"use client";

import { Link as LinkIcon } from "lucide-react";
import { MediaPicker } from "@/components/media-picker";
import type { PostMedia, StudioPayload } from "@/db/schema";
import type { FormEditorProps } from "@/lib/channels/capabilities/types";
import {
  readRedditMeta,
  RedditFields,
  type RedditPostingMeta,
} from "./reddit-fields";

const TITLE_MAX = 300;

export type RedditTextPayload = RedditPostingMeta & {
  title: string;
  body: string;
};

export type RedditLinkPayload = RedditPostingMeta & {
  title: string;
  link: string;
};

export type RedditMediaPayload = RedditPostingMeta & {
  title: string;
  media: PostMedia[];
};

export function readRedditTextPayload(p: StudioPayload): RedditTextPayload {
  return {
    ...readRedditMeta(p),
    title: typeof p.title === "string" ? p.title : "",
    body: typeof p.body === "string" ? p.body : "",
  };
}

export function readRedditLinkPayload(p: StudioPayload): RedditLinkPayload {
  return {
    ...readRedditMeta(p),
    title: typeof p.title === "string" ? p.title : "",
    link: typeof p.link === "string" ? p.link : "",
  };
}

export function readRedditMediaPayload(p: StudioPayload): RedditMediaPayload {
  return {
    ...readRedditMeta(p),
    title: typeof p.title === "string" ? p.title : "",
    media: Array.isArray(p.media) ? (p.media as PostMedia[]) : [],
  };
}

function TitleField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const remaining = TITLE_MAX - value.length;
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
        Title
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={TITLE_MAX}
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-[14.5px] text-ink focus:outline-none focus:ring-2 focus:ring-ink/20 disabled:opacity-60"
        placeholder="A clear, specific title"
      />
      <span
        className={
          remaining < 20
            ? "self-end text-[11px] text-amber-600"
            : "self-end text-[11px] text-ink/55"
        }
      >
        {remaining}
      </span>
    </label>
  );
}

export function RedditTextEditor({
  payload,
  onChange,
  disabled,
}: FormEditorProps) {
  const p = readRedditTextPayload(payload);
  const update = (next: Partial<RedditTextPayload>) =>
    onChange({ ...payload, ...p, ...next } satisfies RedditTextPayload);
  return (
    <div className="flex flex-col gap-4">
      <RedditFields
        meta={p}
        onChange={(next) => update(next)}
        disabled={disabled}
      />
      <TitleField
        value={p.title}
        onChange={(v) => update({ title: v })}
        disabled={disabled}
      />
      <label className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          Body (Markdown)
        </span>
        <textarea
          value={p.body}
          onChange={(e) => update({ body: e.target.value })}
          disabled={disabled}
          rows={12}
          className="w-full rounded-2xl border border-border bg-background p-3 text-[14.5px] leading-[1.55] text-ink font-mono focus:outline-none focus:ring-2 focus:ring-ink/20 disabled:opacity-60"
          placeholder="Write your post. Markdown is supported."
        />
      </label>
    </div>
  );
}

export function RedditLinkEditor({
  payload,
  onChange,
  disabled,
}: FormEditorProps) {
  const p = readRedditLinkPayload(payload);
  const update = (next: Partial<RedditLinkPayload>) =>
    onChange({ ...payload, ...p, ...next } satisfies RedditLinkPayload);
  return (
    <div className="flex flex-col gap-4">
      <RedditFields
        meta={p}
        onChange={(next) => update(next)}
        disabled={disabled}
      />
      <TitleField
        value={p.title}
        onChange={(v) => update({ title: v })}
        disabled={disabled}
      />
      <label className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          Link
        </span>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3">
          <LinkIcon className="w-4 h-4 text-ink/50" />
          <input
            type="url"
            value={p.link}
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

export function makeRedditMediaEditor(options: {
  accept: string;
  label: string;
  pickerLabel: string;
}) {
  const { accept, label, pickerLabel } = options;
  return function RedditMediaEditor({
    payload,
    onChange,
    disabled,
  }: FormEditorProps) {
    const p = readRedditMediaPayload(payload);
    const update = (next: Partial<RedditMediaPayload>) =>
      onChange({ ...payload, ...p, ...next } satisfies RedditMediaPayload);
    return (
      <div className="flex flex-col gap-4">
        <RedditFields
          meta={p}
          onChange={(next) => update(next)}
          disabled={disabled}
        />
        <TitleField
          value={p.title}
          onChange={(v) => update({ title: v })}
          disabled={disabled}
        />
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            {label}
          </span>
          <MediaPicker
            media={p.media}
            onChange={(next) => update({ media: next.slice(0, 1) })}
            max={1}
            accept={accept}
            disabled={disabled}
            label={pickerLabel}
          />
        </div>
      </div>
    );
  };
}

export const RedditImageEditor = makeRedditMediaEditor({
  accept: "image/*",
  label: "Image",
  pickerLabel: "Upload image",
});

export const RedditVideoEditor = makeRedditMediaEditor({
  accept: "video/*",
  label: "Video",
  pickerLabel: "Upload video",
});
