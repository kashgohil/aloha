// Garden — rounded, cozy. Soft peach gradients, oversized rounded corners
// everywhere, chubby pill buttons, gentle shadows, generous whitespace.
// Every edge is soft. Feels like a warm hug at the beach.

import { ArrowUpRight } from "lucide-react";
import { Avatar } from "./avatar";
import { resolveIcon } from "./link-icons";
import { getAccent, getBackgroundPreset, getFontPair } from "./tokens";
import type { TemplateDefinition, TemplateProps } from "./types";

function CozyTemplate({
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

  return (
    <div
      className="relative min-h-screen text-ink"
      style={{ ...bgStyle, fontFamily: font.body }}
    >
      {/* Warm glow behind everything */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(60% 60% at 50% 10%, ${accent.color}2a 0%, transparent 70%)`,
        }}
      />

      <main className="relative mx-auto max-w-[480px] px-5 py-12 lg:py-16">
        <article className="relative rounded-[44px] bg-background-elev/80 backdrop-blur-sm border border-background-elev shadow-[0_30px_60px_-30px_rgba(26,22,18,0.25)] overflow-hidden">
          {/* Soft peach dome at top */}
          <div
            aria-hidden
            className="absolute top-0 inset-x-0 h-56 pointer-events-none"
            style={{
              background: `radial-gradient(120% 100% at 50% 0%, ${accent.color}40 0%, transparent 70%)`,
            }}
          />

          <header className="relative px-8 pt-12 pb-8 text-center">
            <Avatar
              url={avatarUrl}
              name={displayName}
              size={108}
              shape="circle"
              className="mx-auto shadow-[0_16px_32px_-12px_rgba(26,22,18,0.25)] ring-4 ring-background-elev"
            />
            <h1
              className="mt-6 text-[32px] leading-[1.1] tracking-[-0.02em] text-ink"
              style={{ fontFamily: font.display }}
            >
              {displayName}
            </h1>
            <p className="mt-1.5 text-[13px] text-ink/60">@{page.slug}</p>
            {page.bio ? (
              <p className="mt-5 text-[15px] text-ink/75 leading-[1.65] max-w-[340px] mx-auto">
                {page.bio}
              </p>
            ) : null}
          </header>

          {links.length > 0 ? (
            <section className="px-6 pb-4 space-y-3">
              {links.map((l) => {
                const icon = resolveIcon(l.iconPresetId, l.url, l.title);
                const Icon = icon?.Icon;
                return (
                  <a
                    key={l.id}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4 h-14 px-5 rounded-full bg-background text-[15px] font-medium text-ink shadow-[0_4px_16px_-6px_rgba(26,22,18,0.15)] hover:shadow-[0_10px_24px_-8px_rgba(26,22,18,0.25)] hover:-translate-y-0.5 transition-all"
                  >
                    <span
                      className="w-9 h-9 rounded-full grid place-items-center shrink-0"
                      style={{ background: `${accent.color}22`, color: accent.color }}
                    >
                      {Icon ? <Icon className="w-4 h-4" /> : null}
                    </span>
                    <span className="flex-1 truncate">{l.title}</span>
                    <ArrowUpRight className="w-4 h-4 text-ink/35 group-hover:text-ink shrink-0 transition-colors" />
                  </a>
                );
              })}
            </section>
          ) : null}

          <section
            className="mx-6 mb-6 rounded-3xl p-7"
            style={{ background: `${accent.color}12` }}
          >
            <p
              className="text-[24px] leading-[1.15] tracking-[-0.015em] text-ink text-center"
              style={{ fontFamily: font.display }}
            >
              Stay close.
            </p>
            <p className="mt-1.5 text-[13px] text-ink/65 text-center leading-[1.55]">
              A gentle letter, never more than monthly.
            </p>
            <div className="mt-5">{subscribeSlot}</div>
          </section>

          <footer className="px-8 py-5 border-t border-border/60 text-center text-[11.5px] uppercase tracking-[0.24em] text-ink/50">
            {footerSlot}
          </footer>
        </article>
      </main>
    </div>
  );
}

export const cozyTemplate: TemplateDefinition = {
  id: "garden",
  name: "Cozy",
  tagline: "Rounded, soft — peach glow, pillow buttons",
  palette: ["#fbe6cf", "#ed9f57", "#fffdf6"],
  isFree: false,
  defaults: {
    fontPairId: "house",
    accentId: "peach",
    backgroundPresetId: "warm-gradient",
  },
  Component: CozyTemplate,
};
