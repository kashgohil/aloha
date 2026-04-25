"use client";

import { MediaPicker } from "@/components/media-picker";
import type { FormEditorProps } from "@/lib/channels/capabilities/types";
import {
  readTikTokPayload,
  type TikTokPayload,
  type TikTokPrivacyLevel,
} from "./tiktok-payload";

export {
  readTikTokPayload,
  type TikTokPayload,
  type TikTokPrivacyLevel,
} from "./tiktok-payload";

const TITLE_MAX = 2200;

const PRIVACY_OPTIONS: { value: TikTokPrivacyLevel; label: string }[] = [
  { value: "PUBLIC_TO_EVERYONE", label: "Public" },
  { value: "MUTUAL_FOLLOW_FRIENDS", label: "Friends" },
  { value: "FOLLOWER_OF_CREATOR", label: "Followers" },
  { value: "SELF_ONLY", label: "Only me" },
];

export function TikTokEditor({
  payload,
  onChange,
  disabled,
}: FormEditorProps) {
  const t = readTikTokPayload(payload);
  const update = (next: Partial<TikTokPayload>) =>
    onChange({ ...payload, ...t, ...next } satisfies TikTokPayload);
  const remaining = TITLE_MAX - t.title.length;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          Video
        </span>
        <MediaPicker
          media={t.video}
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
          Caption
        </span>
        <textarea
          value={t.title}
          onChange={(e) => update({ title: e.target.value })}
          disabled={disabled}
          rows={5}
          className="w-full rounded-2xl border border-border bg-background p-3 text-[14.5px] leading-[1.55] text-ink focus:outline-none focus:ring-2 focus:ring-ink/20 disabled:opacity-60"
          placeholder="Add a caption…"
        />
        <span
          className={
            remaining < 0
              ? "self-end text-[12px] text-red-600"
              : remaining < 50
                ? "self-end text-[12px] text-amber-600"
                : "self-end text-[12px] text-ink/55"
          }
        >
          {remaining}
        </span>
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          Who can view
        </span>
        <div className="flex flex-wrap gap-1">
          {PRIVACY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update({ privacyLevel: opt.value })}
              disabled={disabled}
              className={
                opt.value === t.privacyLevel
                  ? "rounded-full bg-ink text-background px-3 py-1.5 text-[12px] font-medium disabled:opacity-50"
                  : "rounded-full border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-ink/70 hover:bg-muted/60 transition-colors disabled:opacity-50"
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          Interactions
        </span>
        <Toggle
          checked={!t.disableComment}
          onChange={(v) => update({ disableComment: !v })}
          disabled={disabled}
          label="Allow comments"
        />
        <Toggle
          checked={!t.disableDuet}
          onChange={(v) => update({ disableDuet: !v })}
          disabled={disabled}
          label="Allow Duet"
        />
        <Toggle
          checked={!t.disableStitch}
          onChange={(v) => update({ disableStitch: !v })}
          disabled={disabled}
          label="Allow Stitch"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          Branded content
        </span>
        <p className="text-[11.5px] text-ink/55 leading-[1.45]">
          TikTok requires disclosure when the video promotes a brand. Toggle
          the right option only — leaving both off is correct for organic posts.
        </p>
        <Toggle
          checked={t.brandContentToggle}
          onChange={(v) => update({ brandContentToggle: v })}
          disabled={disabled}
          label="Paid partnership / branded content"
        />
        <Toggle
          checked={t.brandOrganicToggle}
          onChange={(v) => update({ brandOrganicToggle: v })}
          disabled={disabled}
          label="Promoting your own brand"
        />
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2">
      <span className="text-[13px] text-ink">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="rounded border-border disabled:opacity-60"
      />
    </label>
  );
}
