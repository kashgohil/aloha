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
  RefreshCw,
  Sparkles,
  X as XIcon,
} from "lucide-react";
import type { DraftMeta } from "@/db/schema";
import { cn } from "@/lib/utils";

export function DraftMetaPanel({
  meta,
  onSwapHook,
  onApplyHashtags,
  onClose,
}: {
  meta: DraftMeta;
  // Replace the first line of the editor body with the picked hook. Caller
  // owns the editor state; this panel stays pure.
  onSwapHook: (hook: string) => void;
  // Append / merge hashtags into the editor. Caller decides dedupe.
  onApplyHashtags: (hashtags: string[]) => void;
  onClose: () => void;
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

        {meta.formatGuidance ? (
          <Section
            icon={<LayersIcon className="w-3 h-3" />}
            label="Shape"
            sub={meta.format ? meta.format : undefined}
          >
            <p className="text-[13px] text-ink/75 leading-[1.55]">
              {meta.formatGuidance}
            </p>
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
