"use client";

import { Check, Loader2, Lock } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { getTemplate, listTemplates } from "@/lib/audience-templates";
import {
  ACCENTS,
  BACKGROUND_PRESETS,
  FONT_PAIRS,
} from "@/lib/audience-templates/tokens";
import type { PageTheme } from "@/db/schema";
import { setBackgroundAsset, setPageDesign } from "@/app/actions/audience";
import { cn } from "@/lib/utils";
import { AssetPicker, type AssetRef } from "../../_components/asset-picker";
import { DevicePreview } from "./template-preview";
import { getFontPair } from "@/lib/audience-templates/tokens";
import { UpgradeThemeModal } from "./upgrade-theme-modal";

type DesignState = {
  templateId: string;
  theme: PageTheme;
  backgroundAsset: AssetRef;
};

export function DesignEditor({
  initial,
  previewPage,
  previewLinks,
  previewAvatarUrl,
  customThemeEnabled,
}: {
  initial: DesignState;
  previewPage: {
    id: string;
    userId: string;
    slug: string;
    title: string | null;
    bio: string | null;
    avatarUrl: string | null;
  };
  previewLinks: {
    id: string;
    title: string;
    url: string;
    order: number;
    iconPresetId: string | null;
  }[];
  previewAvatarUrl: string | null;
  customThemeEnabled: boolean;
}) {
  const [state, setState] = useState<DesignState>(initial);
  const [savedState, setSavedState] = useState<DesignState>(initial);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  const templates = listTemplates();
  const locked = !customThemeEnabled;

  // A change is dirty when any of the three slices differs from what's on
  // the server. Shallow compare is enough since theme + backgroundAsset are
  // replaced, not mutated.
  const dirty =
    state.templateId !== savedState.templateId ||
    !shallowEqualTheme(state.theme, savedState.theme) ||
    (state.backgroundAsset?.id ?? null) !==
      (savedState.backgroundAsset?.id ?? null);

  // Warn on navigation when there are unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function pickTemplate(templateId: string) {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    if (locked && !template.isFree) {
      setShowUpgrade(true);
      return;
    }
    setState((s) => ({ ...s, templateId }));
  }

  function updateTheme(patch: Partial<PageTheme>) {
    if (locked) {
      setShowUpgrade(true);
      return;
    }
    setState((s) => ({ ...s, theme: { ...s.theme, ...patch } }));
  }

  function handleBackgroundAsset(ref: AssetRef) {
    if (locked && ref) {
      setShowUpgrade(true);
      return;
    }
    setState((s) => ({ ...s, backgroundAsset: ref }));
  }

  async function save() {
    if (!dirty || saving) return;
    setSaving(true);
    setSaveErr(null);
    try {
      // Run both server actions together. We await via Promise.all so the
      // success banner only flips after both persist paths return.
      await Promise.all([
        setPageDesign({
          templateId: state.templateId,
          theme: isEmptyTheme(state.theme) ? null : state.theme,
        }),
        (state.backgroundAsset?.id ?? null) !==
        (savedState.backgroundAsset?.id ?? null)
          ? setBackgroundAsset(state.backgroundAsset?.id ?? null)
          : Promise.resolve(),
      ]);
      // Mark the new state as the baseline.
      setSavedState(state);
    } catch (err) {
      setSaveErr(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  }

  function discard() {
    if (!dirty || saving) return;
    setState(savedState);
    setSaveErr(null);
  }

  // Keep transition import satisfied (async save doesn't need it, but
  // future optimistic paths may).
  void startTransition;

  // Derive preview background: uploaded asset wins over preset.
  const previewBackgroundUrl = state.backgroundAsset?.url ?? null;

  const currentTemplate = getTemplate(state.templateId);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_minmax(410px,440px)] gap-8 items-start">
      {/* Unified editor card — all controls grouped with hairline dividers */}
      <div className="rounded-3xl border border-border bg-background-elev overflow-hidden">
        {/* Row 1 — Template picker */}
        <Row
          label="Template"
          caption={`${currentTemplate.name} — change the whole look`}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {templates.map((t) => {
              const isActive = state.templateId === t.id;
              const isLocked = locked && !t.isFree;
              const fontPair = getFontPair(t.defaults.fontPairId);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => pickTemplate(t.id)}
                  className={cn(
                    "group relative rounded-xl border text-left transition-colors bg-background p-4 flex flex-col gap-4",
                    isActive
                      ? "border-ink shadow-[0_0_0_1px_var(--ink)]"
                      : "border-border hover:border-border-strong",
                  )}
                >
                  {/* Top row: name + status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p
                        className="text-[20px] leading-[1.1] tracking-[-0.02em] text-ink"
                        style={{ fontFamily: fontPair.display }}
                      >
                        {t.name}
                      </p>
                      <p className="mt-1 text-[11.5px] text-ink/60 leading-[1.35]">
                        {t.tagline}
                      </p>
                    </div>
                    {isLocked ? (
                      <span
                        className="shrink-0 inline-flex items-center gap-1 h-5 px-1.5 rounded-full bg-ink text-background text-[9.5px] uppercase tracking-[0.18em]"
                        title="Basic plan"
                      >
                        <Lock className="w-2.5 h-2.5" />
                        Basic
                      </span>
                    ) : t.isFree ? (
                      <span className="shrink-0 text-[9.5px] uppercase tracking-[0.22em] text-ink/45">
                        Free
                      </span>
                    ) : null}
                  </div>

                  {/* Palette swatches */}
                  <div className="flex items-center gap-1">
                    {t.palette.map((hex, i) => (
                      <span
                        key={i}
                        className="h-6 flex-1 rounded border border-ink/10"
                        style={{ background: hex }}
                        aria-hidden
                      />
                    ))}
                  </div>

                  {/* Type + selected state */}
                  <div className="flex items-end justify-between gap-2 mt-auto">
                    <div className="min-w-0">
                      <p className="text-[9.5px] uppercase tracking-[0.24em] text-ink/45 mb-1">
                        {fontPair.name}
                      </p>
                      <p
                        className="text-[22px] leading-none text-ink"
                        style={{ fontFamily: fontPair.display }}
                      >
                        Aa
                      </p>
                    </div>
                    {isActive ? (
                      <span className="shrink-0 w-6 h-6 rounded-full bg-ink text-background grid place-items-center">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </Row>

        {locked ? (
          <div className="border-t border-border bg-peach-100/30 px-6 py-5 flex items-start gap-4">
            <div className="shrink-0 w-9 h-9 rounded-full bg-background border border-border grid place-items-center">
              <Lock className="w-4 h-4 text-ink/60" />
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-medium text-ink">
                Customize type, color, and background on Basic.
              </p>
              <p className="mt-1 text-[12.5px] text-ink/60 leading-normal">
                Free pages stay on the Peach template with default styling.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowUpgrade(true)}
              className="shrink-0 inline-flex items-center gap-1 h-9 px-4 rounded-full bg-ink text-background text-[12.5px] font-medium hover:bg-primary transition-colors"
            >
              See Basic
            </button>
          </div>
        ) : (
          <>
            <Row label="Typography" caption="Display & body pairing">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {FONT_PAIRS.map((fp) => {
                  const active =
                    (state.theme.fontPairId ??
                      defaultFor(state.templateId, "fontPairId")) === fp.id;
                  return (
                    <button
                      key={fp.id}
                      type="button"
                      onClick={() => updateTheme({ fontPairId: fp.id })}
                      className={cn(
                        "rounded-lg border px-3 py-2.5 text-left transition-colors",
                        active
                          ? "border-ink bg-peach-100/50"
                          : "border-border bg-background",
                      )}
                    >
                      <span
                        className="block text-[18px] leading-none text-ink"
                        style={{ fontFamily: fp.display }}
                      >
                        Aa
                      </span>
                      <span className="block mt-1 text-[10.5px] uppercase tracking-[0.2em] text-ink/55">
                        {fp.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Row>

            <Row label="Accent" caption="Links & highlights">
              <div className="flex flex-wrap gap-2">
                {ACCENTS.map((a) => {
                  const active =
                    (state.theme.accentId ??
                      defaultFor(state.templateId, "accentId")) === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => updateTheme({ accentId: a.id })}
                      className={cn(
                        "h-10 px-2 rounded-full border inline-flex items-center gap-2 transition-colors bg-background",
                        active
                          ? "border-ink"
                          : "border-border",
                      )}
                      aria-label={a.name}
                      title={a.name}
                    >
                      <span
                        className="w-6 h-6 rounded-full"
                        style={{ background: a.color }}
                      />
                      <span className="text-[12px] text-ink/75 pr-1.5">
                        {a.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Row>

            <Row label="Background" caption="Preset or uploaded image">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {BACKGROUND_PRESETS.map((b) => {
                  const active =
                    !state.backgroundAsset &&
                    (state.theme.backgroundPresetId ??
                      defaultFor(state.templateId, "backgroundPresetId")) ===
                      b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        if (state.backgroundAsset) {
                          handleBackgroundAsset(null);
                        }
                        updateTheme({ backgroundPresetId: b.id });
                      }}
                      className={cn(
                        "rounded-lg border overflow-hidden text-left transition-colors",
                        active ? "border-ink" : "border-border",
                      )}
                    >
                      <div
                        className="h-14"
                        style={{ background: b.css }}
                        aria-hidden
                      />
                      <div className="px-2.5 py-1.5 text-[11.5px] text-ink/75 flex items-center justify-between bg-background">
                        <span className="truncate">{b.name}</span>
                        {active ? (
                          <Check className="w-3 h-3 text-ink shrink-0" />
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3">
                <AssetPicker
                  current={state.backgroundAsset}
                  onChange={handleBackgroundAsset}
                  shape="rect"
                  label="Upload"
                  emptyHint="1600×1000 or larger. JPG, PNG, WebP. Overrides the preset above."
                />
              </div>
            </Row>
          </>
        )}

        {saveErr ? (
          <div className="border-t border-border px-6 py-3 text-[12.5px] text-primary-deep bg-peach-100/40">
            {saveErr}
          </div>
        ) : null}

        {/* Save bar — only does anything when there are unsaved changes */}
        <div className="border-t border-border bg-muted/30 px-6 py-4 flex items-center justify-between gap-3">
          <p className="text-[12.5px] text-ink/60">
            {saving
              ? "Saving…"
              : dirty
                ? "Unsaved changes."
                : "All changes saved."}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={discard}
              disabled={!dirty || saving}
              className="inline-flex items-center h-10 px-4 rounded-full border border-border-strong text-[13px] font-medium text-ink hover:border-ink disabled:opacity-40 disabled:hover:border-border-strong transition-colors"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!dirty || saving}
              className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary disabled:opacity-40 disabled:hover:bg-ink transition-colors"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : null}
              Save design
            </button>
          </div>
        </div>
      </div>

      {/* Preview rail */}
      <aside className="xl:sticky xl:top-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.28em] text-ink/50">
            Live preview
          </p>
          <span className="text-[11px] text-ink/50">
            {currentTemplate.name}
          </span>
        </div>
        <DevicePreview
          templateId={state.templateId}
          theme={state.theme}
          page={previewPage}
          links={previewLinks}
          avatarUrl={previewAvatarUrl}
          backgroundUrl={previewBackgroundUrl}
        />
      </aside>

      <UpgradeThemeModal open={showUpgrade} onOpenChange={setShowUpgrade} />
    </div>
  );
}

// Uniform row layout inside the unified editor card.
function Row({
  label,
  caption,
  children,
}: {
  label: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4 md:gap-8 px-6 py-6 border-t border-border first:border-t-0">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ink/55">
          {label}
        </p>
        {caption ? (
          <p className="mt-1 text-[12px] text-ink/55 leading-normal">
            {caption}
          </p>
        ) : null}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function defaultFor(
  templateId: string,
  key: keyof PageTheme,
): string | undefined {
  return getTemplate(templateId).defaults[key];
}

function isEmptyTheme(theme: PageTheme): boolean {
  return !theme.fontPairId && !theme.accentId && !theme.backgroundPresetId;
}

function shallowEqualTheme(a: PageTheme, b: PageTheme): boolean {
  return (
    (a.fontPairId ?? null) === (b.fontPairId ?? null) &&
    (a.accentId ?? null) === (b.accentId ?? null) &&
    (a.backgroundPresetId ?? null) === (b.backgroundPresetId ?? null)
  );
}
