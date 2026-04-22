// Paper — Magazine spread. Literary-journal layout: issue kicker, huge
// italic headline, drop-cap bio with first lines wrapping around, pull quote
// in the margin, numbered "Further Reading" for links, folio at the bottom.
// Ink on ivory. Instrument Serif italic for display, Geist body.

import { Avatar } from "./avatar";
import { resolveIcon } from "./link-icons";
import { getAccent, getBackgroundPreset, getFontPair } from "./tokens";
import type { TemplateDefinition, TemplateProps } from "./types";

function EditorialTemplate({
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
  const bio = page.bio?.trim() ?? "";
  const firstLetter = bio[0]?.toUpperCase() ?? "";
  const bioRest = bio.slice(1);

  return (
    <div
      className="relative min-h-screen text-ink"
      style={{ ...bgStyle, fontFamily: font.body }}
    >
      <main className="mx-auto max-w-[640px] px-6 py-14 lg:py-18">
        {/* Kicker — masthead line */}
        <div className="flex items-center gap-3 text-[10.5px] uppercase tracking-[0.32em] text-ink/55">
          <span>@{page.slug}</span>
          <div className="flex-1 h-px bg-ink/15" aria-hidden />
          <span style={{ color: accent.color }}>The Quarterly</span>
        </div>

        {/* Headline — italic serif, takes the room */}
        <h1
          className="mt-8 text-[72px] sm:text-[96px] leading-[0.9] tracking-[-0.035em] text-ink"
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontWeight: 400,
          }}
        >
          {displayName}
        </h1>

        {/* Byline */}
        <p
          className="mt-5 text-[14px] text-ink/75"
          style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}
        >
          by <span className="text-ink">@{page.slug}</span>
        </p>

        {/* Rule */}
        <div className="mt-8 h-[3px] bg-ink/90 relative">
          <div
            className="absolute top-0 left-0 h-[3px] w-24"
            style={{ background: accent.color }}
            aria-hidden
          />
        </div>

        {/* Lede + drop cap + pull quote in margin */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_180px] gap-10">
          <div>
            {bio ? (
              <p className="text-[18px] text-ink/85 leading-[1.75]">
                <span
                  className="float-left mr-3 mt-1 text-[84px] leading-[0.82]"
                  style={{
                    fontFamily: "var(--font-serif)",
                    color: accent.color,
                    fontWeight: 400,
                  }}
                >
                  {firstLetter}
                </span>
                {bioRest}
              </p>
            ) : null}
          </div>

          {/* Avatar + pull quote in right rail */}
          <aside className="flex flex-col items-start gap-5">
            <Avatar
              url={avatarUrl}
              name={displayName}
              size={84}
              shape="square"
              className="rounded-sm"
            />
            <div
              className="border-l-2 pl-3 py-1"
              style={{ borderColor: accent.color }}
            >
              <p
                className="text-[14px] leading-[1.4] text-ink/80"
                style={{
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                }}
              >
                A page, a quiet corner of the internet.
              </p>
            </div>
          </aside>
        </div>

        {/* Further reading */}
        {links.length > 0 ? (
          <section className="mt-14">
            <div className="flex items-baseline gap-3">
              <h2
                className="text-[22px] tracking-[-0.01em]"
                style={{
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                }}
              >
                Further reading
              </h2>
              <div className="flex-1 h-px bg-ink/15" aria-hidden />
            </div>

            <ol className="mt-5 divide-y divide-ink/12 border-y border-ink/12">
              {links.map((l) => {
                const icon = resolveIcon(l.iconPresetId, l.url, l.title);
                const Icon = icon?.Icon;
                return (
                  <li key={l.id}>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group grid grid-cols-[24px_1fr_auto] items-baseline gap-5 py-5"
                    >
                      {Icon ? (
                        <Icon
                          className="w-4 h-4 shrink-0 mt-1"
                          style={{ color: accent.color }}
                        />
                      ) : (
                        <span className="w-4" aria-hidden />
                      )}
                      <div className="min-w-0">
                        <span
                          className="block text-[20px] leading-[1.2] tracking-[-0.005em] text-ink group-hover:italic transition-all"
                          style={{ fontFamily: "var(--font-serif)" }}
                        >
                          {l.title}
                        </span>
                        <span className="block mt-0.5 text-[11.5px] text-ink/55 tracking-[0.02em] truncate">
                          {hostOf(l.url)}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.28em] text-ink/60">
                        Read
                      </span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </section>
        ) : null}

        {/* Sub column — mimics a newsletter opt-in tucked into a magazine */}
        <section className="mt-14 rounded-sm border-y-2 border-ink py-6">
          <p className="text-[10.5px] uppercase tracking-[0.32em] text-ink/55">
            Correspondence
          </p>
          <p
            className="mt-2 text-[24px] leading-[1.05] tracking-[-0.015em]"
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
            }}
          >
            By post, occasionally.
          </p>
          <p className="mt-3 text-[13px] text-ink/70 leading-[1.55] max-w-[52ch]">
            A letter now and again, when something is worth saying. No
            schedule. Unsubscribe any time.
          </p>
          <div className="mt-5">{subscribeSlot}</div>
        </section>

        <footer className="mt-14 text-center text-[10.5px] uppercase tracking-[0.32em] text-ink/50">
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

export const editorialTemplate: TemplateDefinition = {
  id: "paper",
  name: "Editorial",
  tagline: "Magazine spread — italic serifs, drop caps, folio",
  palette: ["#f6f1e4", "#1a1612", "#ed9f57"],
  isFree: false,
  defaults: {
    fontPairId: "editorial",
    accentId: "ink",
    backgroundPresetId: "cream",
  },
  Component: EditorialTemplate,
};
