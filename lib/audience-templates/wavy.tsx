// Sunset — wavy. Aloha's signature wave motif: SVG wave dividers separate
// every section, warm peach gradients flow between them, rounded soft
// everything. Beach/ocean rhythm. The template that wears the brand on its
// sleeve.

import { ArrowUpRight } from "lucide-react";
import { Avatar } from "./avatar";
import { resolveIcon } from "./link-icons";
import { getAccent, getBackgroundPreset, getFontPair } from "./tokens";
import type { TemplateDefinition, TemplateProps } from "./types";

function WavyTemplate({
  page,
  links,
  theme,
  avatarUrl,
  backgroundUrl,
  subscribeSlot,
  footerSlot,
}: TemplateProps) {
  const font = getFontPair(theme.fontPairId);
  const accent = getAccent(theme.accentId);
  const bg = getBackgroundPreset(theme.backgroundPresetId);
  const bgStyle = backgroundUrl
    ? { background: `center/cover no-repeat url(${backgroundUrl})` }
    : { background: bg.css };

  const displayName = page.title ?? page.slug;

  // Soft accent tint for the "swim through" links section. color-mix blends
  // the accent toward the cream background so the band still feels calm
  // even when the accent is a deep color like ink or plum.
  const swimBand = `color-mix(in oklab, ${accent.color} 22%, var(--background))`;

  return (
    <div
      className="relative min-h-screen text-ink"
      style={{ ...bgStyle, fontFamily: font.body }}
    >
      <main className="mx-auto max-w-[480px]">
        {/* HERO — peach gradient with wave bottom */}
        <section
          className="relative pt-16 pb-24 px-6 text-center overflow-hidden"
          style={{
            background: `linear-gradient(180deg, ${accent.color} 0%, ${accent.color}b0 60%, ${accent.color}70 100%)`,
          }}
        >
          <Avatar
            url={avatarUrl}
            name={displayName}
            size={110}
            shape="circle"
            className="mx-auto border-4 border-background shadow-[0_18px_38px_-14px_rgba(26,22,18,0.35)]"
          />
          <h1
            className="mt-6 text-[36px] leading-[1.02] tracking-[-0.02em] text-background"
            style={{ fontFamily: font.display }}
          >
            {displayName}
          </h1>
          <p className="mt-1.5 text-[12px] uppercase tracking-[0.3em] text-background/85">
            @{page.slug}
          </p>

          {/* Wave divider — bottom of hero */}
          <Wave
            className="absolute bottom-[-1px] left-0 right-0 w-full h-16 text-background"
            direction="down"
          />
        </section>

        {/* BIO — cream section */}
        {page.bio ? (
          <section className="relative bg-background pt-6 pb-10 px-8 text-center">
            <p className="text-[17px] text-ink/85 leading-[1.7] max-w-[36ch] mx-auto">
              {page.bio}
            </p>
            <Wave
              className="absolute bottom-[-1px] left-0 right-0 w-full h-12"
              direction="down"
              style={{ color: swimBand }}
            />
          </section>
        ) : null}

        {/* LINKS — accent-tinted band */}
        {links.length > 0 ? (
          <section
            className="relative pt-10 pb-14 px-6"
            style={{ background: swimBand }}
          >
            <p
              className="text-[11px] uppercase tracking-[0.3em] text-ink/55 text-center"
              style={{ fontFamily: font.body }}
            >
              — swim through —
            </p>
            <ul className="mt-6 space-y-3">
              {links.map((l) => {
                const icon = resolveIcon(l.iconPresetId, l.url, l.title);
                const Icon = icon?.Icon;
                return (
                  <li key={l.id}>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 h-13 px-5 py-3 rounded-full bg-background border border-background text-[14.5px] font-medium text-ink shadow-[0_6px_18px_-10px_rgba(26,22,18,0.2)] hover:-translate-y-0.5 transition-transform"
                    >
                      {Icon ? (
                        <span
                          className="w-8 h-8 rounded-full grid place-items-center shrink-0"
                          style={{
                            background: accent.color,
                            color: "#fffdf6",
                          }}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                      ) : null}
                      <span className="flex-1 truncate">{l.title}</span>
                      <ArrowUpRight className="w-4 h-4 text-ink/35 group-hover:text-ink shrink-0 transition-colors" />
                    </a>
                  </li>
                );
              })}
            </ul>
            <Wave
              className="absolute bottom-[-1px] left-0 right-0 w-full h-12 text-background"
              direction="down"
            />
          </section>
        ) : null}

        {/* SUBSCRIBE — cream section */}
        <section className="bg-background pt-10 pb-12 px-8 text-center">
          <p
            className="text-[28px] leading-[1.1] tracking-[-0.015em] text-ink"
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
            }}
          >
            Catch the next wave.
          </p>
          <p className="mt-2 text-[13px] text-ink/65 max-w-[34ch] mx-auto leading-[1.55]">
            A quiet letter whenever something worth reading rolls in.
          </p>
          <div className="mt-6 text-left">{subscribeSlot}</div>
        </section>

        {/* FOOTER — flows on from the subscribe section without a wave */}
        <footer className="bg-background pb-10 px-8 text-center text-[11px] uppercase tracking-[0.28em] text-ink/55">
          {footerSlot}
        </footer>
      </main>
    </div>
  );
}

function Wave({
  className,
  direction,
  style,
}: {
  className?: string;
  direction: "up" | "down";
  style?: React.CSSProperties;
}) {
  // Reusable SVG wave divider. `currentColor` draws the wave, which should
  // match the NEXT section's background. When direction is "down", the wave
  // points into the section below. When "up", the wave crests upward.
  const path =
    direction === "down"
      ? "M0 40 C 150 80, 350 0, 500 40 L 500 80 L 0 80 Z"
      : "M0 40 C 150 0, 350 80, 500 40 L 500 0 L 0 0 Z";

  return (
    <svg
      aria-hidden
      className={className}
      viewBox="0 0 500 80"
      preserveAspectRatio="none"
      style={style}
    >
      <path d={path} fill="currentColor" />
    </svg>
  );
}

export const wavyTemplate: TemplateDefinition = {
  id: "sunset",
  name: "Wavy",
  tagline: "Wavy — flowing curves, peach gradients, Aloha brand",
  palette: ["#ed9f57", "#fbe6cf", "#1a1612"],
  isFree: false,
  defaults: {
    fontPairId: "house",
    accentId: "peach",
    backgroundPresetId: "warm-gradient",
  },
  Component: WavyTemplate,
};
