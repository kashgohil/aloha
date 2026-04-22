// Mono — minimal, retro. Inspired by 70s/80s Japanese product catalogs and
// Swiss-grid documents: JetBrains Mono throughout, tight information grid,
// 1px rules, uppercase micro-labels, product-code aesthetic. Restrained and
// rational. Ink on cream with a single accent.

import { Avatar } from "./avatar";
import { resolveIcon } from "./link-icons";
import { getAccent, getBackgroundPreset } from "./tokens";
import type { TemplateDefinition, TemplateProps } from "./types";

function RetroTemplate({
  page,
  links,
  theme,
  avatarUrl,
  backgroundUrl,
  subscribeSlot,
  footerSlot,
}: TemplateProps) {
  const accent = getAccent(theme.accentId);
  const bg = getBackgroundPreset(theme.backgroundPresetId);
  const bgStyle = backgroundUrl
    ? { background: `center/cover no-repeat url(${backgroundUrl})` }
    : { background: bg.css };

  const displayName = page.title ?? page.slug;

  return (
    <div
      className="relative min-h-screen text-ink"
      style={{
        ...bgStyle,
        fontFamily: "var(--font-mono)",
        fontSize: 12.5,
      }}
    >
      <main className="mx-auto max-w-[620px] px-6 py-10 lg:py-14">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-ink pb-2 text-[10.5px] uppercase tracking-[0.24em]">
          <span>@{page.slug}</span>
          <span className="inline-flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: accent.color }}
              aria-hidden
            />
            Online
          </span>
        </header>

        {/* Masthead */}
        <div className="mt-10 grid grid-cols-[100px_1fr] gap-8">
          <Avatar
            url={avatarUrl}
            name={displayName}
            size={100}
            shape="square"
            className="rounded-none border border-ink"
          />
          <div className="min-w-0">
            <p className="text-[10.5px] uppercase tracking-[0.32em] text-ink/60">
              Profile
            </p>
            <h1 className="mt-3 text-[34px] leading-[1.02] tracking-[-0.02em] text-ink font-medium uppercase">
              {displayName}
            </h1>
            {page.bio ? (
              <p className="mt-5 text-[13.5px] text-ink/80 leading-[1.65] max-w-[46ch] whitespace-pre-wrap">
                {page.bio}
              </p>
            ) : null}
          </div>
        </div>

        {/* Links */}
        {links.length > 0 ? (
          <section className="mt-12">
            <div className="text-[10.5px] uppercase tracking-[0.32em] text-ink/60">
              Links
            </div>
            <ul className="mt-2 divide-y divide-ink/15">
              {links.map((l) => {
                const icon = resolveIcon(l.iconPresetId, l.url, l.title);
                const Icon = icon?.Icon;
                return (
                  <li key={l.id}>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group grid grid-cols-[24px_1fr_auto] items-center gap-3 py-3 hover:bg-ink/[0.03] transition-colors"
                    >
                      {Icon ? (
                        <Icon
                          className="w-3.5 h-3.5"
                          style={{ color: accent.color }}
                        />
                      ) : (
                        <span className="w-3.5" aria-hidden />
                      )}
                      <span className="text-ink truncate text-[13px] uppercase tracking-[0.02em]">
                        {l.title}
                      </span>
                      <span className="text-[11px] text-ink/55 truncate max-w-[200px]">
                        {hostOf(l.url)} ↗
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {/* Subscribe */}
        <section className="mt-12">
          <div className="text-[10.5px] uppercase tracking-[0.32em] text-ink/60">
            Subscribe
          </div>
          <p className="mt-3 text-[13px] text-ink/70">
            Quiet updates, delivered to inbox.
          </p>
          <div className="mt-4">{subscribeSlot}</div>
        </section>

        <footer className="mt-16 border-t border-ink pt-3 text-center text-[10.5px] uppercase tracking-[0.22em] text-ink/55">
          {footerSlot}
        </footer>
      </main>
    </div>
  );
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export const retroTemplate: TemplateDefinition = {
  id: "mono",
  name: "Retro",
  tagline: "Minimal, retro — catalog grid, product codes, mono type",
  palette: ["#f6f1e4", "#1a1612", "#6b7a3a"],
  isFree: false,
  defaults: {
    fontPairId: "mechanical",
    accentId: "olive",
    backgroundPresetId: "cream",
  },
  Component: RetroTemplate,
};
