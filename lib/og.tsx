// Shared layout for dynamic opengraph-image.tsx route handlers.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

// Brand fonts shipped alongside this file. Fontsource static TTFs (variable
// fonts with multiple axes break satori). Read synchronously from disk —
// Next's build worker can't fetch `file://` URLs, so `fs` is the reliable
// path for both prerender and request-time rendering.
const FONT_DIR = join(dirname(fileURLToPath(import.meta.url)), "og-fonts");
const readFont = (file: string) =>
  new Uint8Array(readFileSync(join(FONT_DIR, file))).buffer;

export function loadOgFonts() {
  return [
    {
      name: "Fraunces",
      data: readFont("Fraunces-Regular.ttf"),
      weight: 400,
      style: "normal",
    },
    {
      name: "Fraunces-Light",
      data: readFont("Fraunces-Light.ttf"),
      weight: 300,
      style: "normal",
    },
    {
      name: "Outfit",
      data: readFont("Outfit-Regular.ttf"),
      weight: 400,
      style: "normal",
    },
    {
      name: "Outfit-SemiBold",
      data: readFont("Outfit-SemiBold.ttf"),
      weight: 600,
      style: "normal",
    },
  ] as const;
}

// Brand icon as an inline data URL so satori doesn't need network fetches
// (embedding works in every runtime and prerender path).
const ICON_DATA_URL = (() => {
  const iconPath = join(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "public",
    "aloha.png",
  );
  const buf = readFileSync(iconPath);
  return `data:image/png;base64,${buf.toString("base64")}`;
})();

type AccentKey = "peach" | "primary" | "ink";

const ACCENTS: Record<AccentKey, { bg: string; fg: string; subtle: string }> = {
  peach: { bg: "#F5DFC9", fg: "#1A1714", subtle: "#1A171499" },
  primary: { bg: "#E8E6F6", fg: "#1A1714", subtle: "#1A171499" },
  ink: { bg: "#1A1714", fg: "#F5DFC9", subtle: "#F5DFC9AA" },
};

export function ogCard(opts: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  accent?: AccentKey;
  footer?: string;
}) {
  const { eyebrow, title, subtitle, accent = "peach", footer } = opts;
  const palette = ACCENTS[accent];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "80px",
        background: palette.bg,
        color: palette.fg,
        fontFamily: "Fraunces",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          color: palette.fg,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ICON_DATA_URL} width={44} height={44} alt="" />
        <span
          style={{
            fontFamily: "Fraunces",
            fontSize: 32,
            letterSpacing: "-0.01em",
            color: palette.fg,
          }}
        >
          {SITE_NAME}
        </span>
        <span
          style={{
            color: palette.subtle,
            fontSize: 22,
            marginLeft: 4,
          }}
        >
          ·
        </span>
        <span
          style={{
            fontFamily: "Outfit-SemiBold",
            fontSize: 18,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: palette.subtle,
            marginTop: 2,
          }}
        >
          {eyebrow}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            fontSize: 104,
            lineHeight: 0.98,
            letterSpacing: "-0.035em",
            maxWidth: 1000,
            display: "flex",
            flexWrap: "wrap",
            fontFamily: "Fraunces-Light",
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.4,
              maxWidth: 880,
              color: palette.subtle,
              fontFamily: "Outfit",
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 20,
          color: palette.subtle,
          fontFamily: "Outfit",
        }}
      >
        <span>{SITE_URL.replace(/^https?:\/\//, "")}</span>
        <span>{footer ?? "Grow with intention"}</span>
      </div>
    </div>
  );
}
