// Peach — the house style. Warm + personal, centered card with a soft peach
// wash and a few sparse marks. Kept approachable and friendly — the default
// template when nothing else suits.

import { ArrowUpRight } from "lucide-react";
import { Avatar } from "./avatar";
import { resolveIcon } from "./link-icons";
import { getAccent, getBackgroundPreset, getFontPair } from "./tokens";
import type { TemplateDefinition, TemplateProps } from "./types";

function DefaultTemplate({
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
      className="relative min-h-screen text-ink flex flex-col overflow-hidden"
      style={{ ...bgStyle, fontFamily: font.body }}
    >
      {/* Sparse decorative marks — each sized up and in full accent color
          so changing the accent is immediately visible in the preview */}
      <span
        aria-hidden
        className="absolute top-[9%] left-[7%] font-display text-[40px] rotate-[-8deg] select-none pointer-events-none"
        style={{ color: accent.color }}
      >
        ✳
      </span>
      <span
        aria-hidden
        className="absolute top-[16%] right-[9%] font-display text-[48px] rotate-[12deg] select-none pointer-events-none"
        style={{ color: accent.color, opacity: 0.6 }}
      >
        ✳
      </span>
      <span
        aria-hidden
        className="absolute bottom-[16%] left-[10%] font-display text-[36px] rotate-12 select-none pointer-events-none"
        style={{ color: accent.color }}
      >
        +
      </span>

      <main className="flex-1 flex items-start sm:items-center justify-center px-4 py-16 lg:py-20">
        <article className="w-full max-w-[460px] rounded-[28px] border border-border bg-background-elev overflow-hidden shadow-[0_28px_68px_-30px_rgba(26,22,18,0.22)]">
          <header className="px-8 pt-10 pb-6 text-center">
            <Avatar
              url={avatarUrl}
              name={displayName}
              size={88}
              className="mx-auto"
            />
            <h1
              className="mt-5 text-[32px] leading-[1.05] tracking-[-0.025em] text-ink"
              style={{ fontFamily: font.display }}
            >
              {displayName}
            </h1>
            <div className="mt-3 flex items-center justify-center gap-2">
              <span
                aria-hidden
                className="h-px w-8"
                style={{ background: accent.color }}
              />
              <p className="text-[12px] uppercase tracking-[0.24em] text-ink/55">
                @{page.slug}
              </p>
              <span
                aria-hidden
                className="h-px w-8"
                style={{ background: accent.color }}
              />
            </div>
            {page.bio ? (
              <p className="mt-4 text-[14.5px] text-ink/75 leading-[1.6] max-w-[360px] mx-auto">
                {page.bio}
              </p>
            ) : null}
          </header>

          {links.length > 0 ? (
            <section className="px-6 pb-2">
              <ul className="space-y-2">
                {links.map((l) => {
                  const icon = resolveIcon(l.iconPresetId, l.url, l.title);
                  const Icon = icon?.Icon;
                  return (
                    <li key={l.id}>
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 h-12 px-4 rounded-full bg-background border border-border-strong text-[14px] font-medium text-ink transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-12px_rgba(26,22,18,0.25)]"
                      >
                        {Icon ? (
                          <Icon
                            className="w-4 h-4 shrink-0 transition-colors"
                            style={{ color: accent.color }}
                          />
                        ) : null}
                        <span className="flex-1 truncate">{l.title}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-ink/40 group-hover:text-ink transition-colors shrink-0" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          <section className="px-8 pt-6 pb-8 border-t border-border mt-6">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.24em] text-center"
              style={{ color: accent.color }}
            >
              Quiet updates
            </p>
            <div className="mt-4">{subscribeSlot}</div>
          </section>

          <footer className="px-8 py-4 border-t border-border text-center">
            {footerSlot}
          </footer>
        </article>
      </main>
    </div>
  );
}

export const defaultTemplate: TemplateDefinition = {
  id: "peach",
  name: "Default",
  tagline: "The house pour — warm, centered, friendly",
  palette: ["#fbe6cf", "#ed9f57", "#1a1612"],
  isFree: true,
  defaults: {
    fontPairId: "house",
    accentId: "peach",
    backgroundPresetId: "peach-wash",
  },
  Component: DefaultTemplate,
};
