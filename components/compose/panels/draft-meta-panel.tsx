"use client";

// Draft-meta panel. Renders the structured scaffolding Muse produced alongside
// the post body — rationale, alt hooks (click to swap the opener), key points,
// CTA, hashtags, media suggestion, format guidance. Optional; hidden when the
// post has no draftMeta (manual drafts). Panel opens BELOW the editor, per the
// inline-panels-below convention.

import {
  Compass,
  ImageIcon,
  Layers as LayersIcon,
  Lightbulb,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useTransition } from "react";
import { setPostFormat } from "@/app/actions/posts";
import type { DraftMeta } from "@/db/schema";
import { formatsFor } from "@/lib/campaigns/channel-formats";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function DraftMetaPanel({
  meta,
  postId,
  channel,
  onSwapHook,
  onApplyHashtags,
  onFormatChanged,
}: {
  meta: DraftMeta;
  // The post being edited. When provided alongside a single channel, the
  // Shape section becomes a format picker; otherwise it's read-only.
  postId?: string | null;
  channel?: string | null;
  // Replace the first line of the editor body with the picked hook. Caller
  // owns the editor state; this panel stays pure.
  onSwapHook: (hook: string) => void;
  // Append / merge hashtags into the editor. Caller decides dedupe.
  onApplyHashtags: (hashtags: string[]) => void;
  // Optional: notify the parent that draftMeta changed server-side so it
  // can re-fetch / refresh state. The composer revalidates via redirect-
  // free server action results.
  onFormatChanged?: (next: { format: string; guidance: string }) => void;
}) {
  const hasAnything =
    meta.rationale ||
    (meta.altHooks && meta.altHooks.length > 0) ||
    (meta.keyPoints && meta.keyPoints.length > 0) ||
    meta.cta ||
    (meta.hashtags && meta.hashtags.length > 0) ||
    meta.mediaSuggestion ||
    meta.formatGuidance;

  if (!hasAnything) return null;

  return (
    <>
      <div className="flex items-center gap-2 px-5 pt-4 pb-3 text-[12px] text-ink/65">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <span>Muse scaffolding — tap any chip or hook to swap it in.</span>
      </div>

      <div className="px-5 py-4 space-y-4">
        {meta.rationale ? (
          <Section icon={<Compass className="w-3 h-3" />} label="Why this works">
            <p className="text-[13px] text-ink/75 leading-[1.55]">
              {meta.rationale}
            </p>
          </Section>
        ) : null}

        {meta.formatGuidance || (postId && channel) ? (
          <Section
            icon={<LayersIcon className="w-3 h-3" />}
            label="Shape"
            sub={meta.format ? meta.format : undefined}
          >
            {postId && channel ? (
              <FormatPicker
                postId={postId}
                channel={channel}
                current={meta.format ?? null}
                onChanged={onFormatChanged}
              />
            ) : null}
            {meta.formatGuidance ? (
              <p className="mt-2 text-[13px] text-ink/75 leading-[1.55]">
                {meta.formatGuidance}
              </p>
            ) : null}
          </Section>
        ) : null}

        {meta.altHooks && meta.altHooks.length > 0 ? (
          <Section
            icon={<RefreshCw className="w-3 h-3" />}
            label="Alternate hooks"
          >
            <ul className="space-y-1.5">
              {meta.altHooks.map((h, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => onSwapHook(h)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-2xl border border-border bg-background text-[13px] text-ink/85",
                      "hover:border-ink transition-colors",
                    )}
                  >
                    {h}
                  </button>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {meta.keyPoints && meta.keyPoints.length > 0 ? (
          <Section icon={<Lightbulb className="w-3 h-3" />} label="Beats">
            <ol className="space-y-1">
              {meta.keyPoints.map((k, i) => (
                <li
                  key={i}
                  className="text-[13px] text-ink/75 leading-[1.55] pl-5 -indent-5"
                >
                  <span className="text-ink/45 mr-1.5">{i + 1}.</span>
                  {k}
                </li>
              ))}
            </ol>
          </Section>
        ) : null}

        {meta.cta ? (
          <Section label="CTA">
            <p className="text-[13px] text-ink/80 italic leading-[1.55]">
              “{meta.cta}”
            </p>
          </Section>
        ) : null}

        {meta.hashtags && meta.hashtags.length > 0 ? (
          <Section label="Hashtags">
            <div className="flex items-center flex-wrap gap-1.5">
              {meta.hashtags.map((h) => (
                <span
                  key={h}
                  className="inline-flex items-center h-6 px-2.5 rounded-full bg-background border border-border text-[12px] text-ink/75"
                >
                  {h}
                </span>
              ))}
              <button
                type="button"
                onClick={() => onApplyHashtags(meta.hashtags ?? [])}
                className="inline-flex items-center h-6 px-2.5 rounded-full border border-ink text-[11.5px] font-medium text-ink hover:bg-ink hover:text-background transition-colors"
              >
                Add to draft
              </button>
            </div>
          </Section>
        ) : null}

        {meta.mediaSuggestion ? (
          <Section
            icon={<ImageIcon className="w-3 h-3" />}
            label="Media suggestion"
          >
            <p className="text-[13px] text-ink/75 leading-[1.55]">
              {meta.mediaSuggestion}
            </p>
          </Section>
        ) : null}
      </div>
    </>
  );
}

function FormatPicker({
  postId,
  channel,
  current,
  onChanged,
}: {
  postId: string;
  channel: string;
  current: string | null;
  onChanged?: (next: { format: string; guidance: string }) => void;
}) {
  const [pending, start] = useTransition();
  const options = formatsFor(channel);
  if (options.length <= 1) return null;
  return (
    <div className="flex items-center gap-2">
      <select
        defaultValue={current ?? options[0].slug}
        disabled={pending}
        onChange={(e) => {
          const next = e.currentTarget.value;
          if (next === current) return;
          start(async () => {
            try {
              await setPostFormat(postId, next);
              onChanged?.({
                format: next,
                guidance:
                  options.find((o) => o.slug === next)?.guidance ?? "",
              });
              toast.success("Format updated.");
            } catch (err) {
              toast.error(
                err instanceof Error ? err.message : "Couldn't change format.",
              );
            }
          });
        }}
        className="h-9 px-3 pr-8 rounded-full border border-border bg-background text-[12.5px] text-ink focus:outline-none focus:border-ink disabled:opacity-60"
      >
        {options.map((o) => (
          <option key={o.slug} value={o.slug}>
            {o.label}
          </option>
        ))}
      </select>
      {pending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-ink/55" />
      ) : null}
    </div>
  );
}

function Section({
  icon,
  label,
  sub,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-ink/55 font-medium">
        {icon}
        <span>{label}</span>
        {sub ? <span className="text-ink/40 normal-case tracking-normal">· {sub}</span> : null}
      </div>
      {children}
    </section>
  );
}
