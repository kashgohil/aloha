// Zine — striking neo-noir. Deep ink background, cream/peach type,
// dramatic italic serif title, heavy contrast, a single film-poster accent
// color. Vignetted corners, restrained ornament, cinematic title-card feel.

import { Avatar } from "./avatar";
import { resolveIcon } from "./link-icons";
import { getAccent, getFontPair } from "./tokens";
import type { TemplateDefinition, TemplateProps } from "./types";

function NoirTemplate({
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

  // Noir is locked to a dark background regardless of the chosen preset —
  // bg image can override.
  const bgStyle = backgroundUrl
    ? {
        background: `linear-gradient(180deg, rgba(10,8,7,0.55) 0%, rgba(10,8,7,0.85) 100%), center/cover no-repeat url(${backgroundUrl})`,
      }
    : { background: "#0c0907" };

  const displayName = page.title ?? page.slug;
  const textCream = "#e9ddc4";

  return (
    <div
      className="relative min-h-screen"
      style={{ ...bgStyle, fontFamily: font.body, color: textCream }}
    >
      {/* Vignette */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 30%, transparent 40%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      {/* Film grain — subtle SVG noise */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.14] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />

      <main className="relative mx-auto max-w-[620px] px-6 py-16 lg:py-20">
        {/* Title card frame */}
        <div
          className="border px-8 py-10 relative"
          style={{
            borderColor: "rgba(233,221,196,0.3)",
          }}
        >
          {/* Corner ornaments */}
          <Corner placement="tl" color={accent.color} />
          <Corner placement="tr" color={accent.color} />
          <Corner placement="bl" color={accent.color} />
          <Corner placement="br" color={accent.color} />

          {/* Presented by */}
          <p
            className="text-center text-[10.5px] uppercase tracking-[0.4em]"
            style={{ color: `${textCream}99` }}
          >
            — presented —
          </p>

          {/* Title */}
          <h1
            className="mt-6 text-center text-[64px] sm:text-[88px] leading-[0.9] tracking-[-0.02em]"
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              color: textCream,
            }}
          >
            {displayName}
          </h1>

          {/* Accent underline */}
          <div className="mt-4 flex items-center justify-center gap-3">
            <span
              className="h-px w-16"
              style={{ background: `${textCream}55` }}
            />
            <span
              className="text-[11px] uppercase tracking-[0.4em]"
              style={{ color: accent.color }}
            >
              @{page.slug}
            </span>
            <span
              className="h-px w-16"
              style={{ background: `${textCream}55` }}
            />
          </div>

          {/* Avatar + bio */}
          <div className="mt-10 flex items-start gap-5">
            <Avatar
              url={avatarUrl}
              name={displayName}
              size={72}
              shape="circle"
              className="border-2"
              style={{ borderColor: accent.color }}
            />
            {page.bio ? (
              <p
                className="pt-2 text-[15px] leading-[1.7] max-w-[46ch]"
                style={{ color: `${textCream}d9` }}
              >
                {page.bio}
              </p>
            ) : null}
          </div>
        </div>

        {/* Cast / links */}
        {links.length > 0 ? (
          <section className="mt-12">
            <p
              className="text-[10.5px] uppercase tracking-[0.4em] text-center"
              style={{ color: `${textCream}80` }}
            >
              featuring
            </p>
            <ul className="mt-6 space-y-0">
              {links.map((l) => {
                const icon = resolveIcon(l.iconPresetId, l.url, l.title);
                const Icon = icon?.Icon;
                return (
                  <li
                    key={l.id}
                    className="border-b"
                    style={{ borderColor: "rgba(233,221,196,0.2)" }}
                  >
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group grid grid-cols-[24px_1fr_auto] items-baseline gap-4 py-5 transition-colors"
                    >
                      {Icon ? (
                        <Icon
                          className="w-4 h-4 shrink-0 mt-1.5"
                          style={{ color: accent.color }}
                        />
                      ) : (
                        <span className="w-4" aria-hidden />
                      )}
                      <span
                        className="text-[22px] sm:text-[26px] leading-[1.15] tracking-[-0.01em] truncate group-hover:translate-x-1 transition-transform"
                        style={{
                          fontFamily: "var(--font-serif)",
                          fontStyle: "italic",
                          color: textCream,
                        }}
                      >
                        {l.title}
                      </span>
                      <span
                        className="text-[11px] uppercase tracking-[0.32em] pt-1.5"
                        style={{ color: `${textCream}88` }}
                      >
                        open ↗
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {/* Subscribe — flows on the noir backdrop. The subscribe form itself
            renders in inverted variant so fields and button pick up the
            accent + cream tones. */}
        <section
          className="mt-14 border p-6"
          style={{
            borderColor: "rgba(233,221,196,0.3)",
          }}
        >
          <p
            className="text-[10.5px] uppercase tracking-[0.4em] text-center"
            style={{ color: accent.color }}
          >
            subscribe · no spoilers
          </p>
          <p
            className="mt-3 text-[22px] text-center leading-[1.2] tracking-[-0.01em]"
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              color: textCream,
            }}
          >
            Notes from the dark room.
          </p>
          <div className="mt-5">{subscribeSlot}</div>
        </section>

        <footer
          className="mt-12 text-center text-[10.5px] uppercase tracking-[0.32em]"
          style={{ color: textCream }}
        >
          {footerSlot}
        </footer>
      </main>
    </div>
  );
}

function Corner({
  placement,
  color,
}: {
  placement: "tl" | "tr" | "bl" | "br";
  color: string;
}) {
  const positions = {
    tl: "top-0 left-0",
    tr: "top-0 right-0 rotate-90",
    bl: "bottom-0 left-0 -rotate-90",
    br: "bottom-0 right-0 rotate-180",
  };
  return (
    <svg
      aria-hidden
      className={`absolute ${positions[placement]} w-4 h-4`}
      viewBox="0 0 16 16"
    >
      <path
        d="M0 0 L 8 0 M 0 0 L 0 8"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}

export const noirTemplate: TemplateDefinition = {
  id: "zine",
  name: "Noir",
  tagline: "Neo-noir — dark, cinematic, italic serif title card",
  palette: ["#0c0907", "#e9ddc4", "#c86040"],
  isFree: false,
  subscribeVariant: "inverted",
  defaults: {
    fontPairId: "editorial",
    accentId: "terracotta",
    backgroundPresetId: "cream",
  },
  Component: NoirTemplate,
};
