// Curated customization tokens. All values are tuned to sit on the Aloha
// warm-cream palette (see --background, --ink, --peach-* in globals.css).
// Keep the set small and opinionated — the templates are the main design
// lever; tokens are for quiet personalization.

export type FontPair = {
  id: string;
  name: string;
  display: string; // CSS font-family for headings
  body: string; // CSS font-family for body
};

export type Accent = {
  id: string;
  name: string;
  color: string;
};

export type BackgroundPreset = {
  id: string;
  name: string;
  css: string;
};

// Only two next/font families load (Fraunces and Geist). Pairings combine
// them in ways that actually read differently on page.
export const FONT_PAIRS: FontPair[] = [
  {
    id: "house",
    name: "House",
    display: "var(--font-display)", // Fraunces
    body: "var(--font-sans)", // Geist
  },
  {
    id: "editorial",
    name: "Editorial",
    display: "var(--font-serif)", // Instrument Serif
    body: "var(--font-sans)",
  },
  {
    id: "mechanical",
    name: "Mechanical",
    display: "var(--font-mono)", // JetBrains Mono
    body: "var(--font-mono)",
  },
  {
    id: "plain",
    name: "Plain",
    display: "var(--font-sans)",
    body: "var(--font-sans)",
  },
  {
    id: "quiet",
    name: "Quiet",
    display: "var(--font-sans)",
    body: "var(--font-display)",
  },
];

// Six accents that all read against the cream background. Tested for
// contrast: every color passes AA against both background and background-elev
// at 14px.
export const ACCENTS: Accent[] = [
  { id: "peach", name: "Peach", color: "#ed9f57" },
  { id: "ink", name: "Ink", color: "#1a1612" },
  { id: "terracotta", name: "Terracotta", color: "#c86040" },
  { id: "olive", name: "Olive", color: "#6b7a3a" },
  { id: "indigo", name: "Indigo", color: "#4f46e5" },
  { id: "plum", name: "Plum", color: "#7a4e85" },
];

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: "cream",
    name: "Cream",
    css: "var(--background)",
  },
  {
    id: "peach-wash",
    name: "Peach wash",
    css: "radial-gradient(900px 500px at 80% -10%, var(--peach-200) 0%, transparent 55%), radial-gradient(700px 400px at -10% 60%, var(--peach-100) 0%, transparent 60%), var(--background)",
  },
  {
    id: "warm-gradient",
    name: "Warm",
    css: "linear-gradient(180deg, #FBE6CF 0%, #F6F1E4 60%)",
  },
  {
    id: "grain",
    name: "Grain",
    css: "var(--background) url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.08 0 0 0 0 0.06 0 0 0 0 0.03 0 0 0 0.18 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
  },
];

export const DEFAULT_FONT_PAIR_ID = "house";
export const DEFAULT_ACCENT_ID = "peach";
export const DEFAULT_BACKGROUND_PRESET_ID = "peach-wash";

export function getFontPair(id: string | undefined): FontPair {
  return (
    FONT_PAIRS.find((f) => f.id === id) ??
    FONT_PAIRS.find((f) => f.id === DEFAULT_FONT_PAIR_ID)!
  );
}

export function getAccent(id: string | undefined): Accent {
  return (
    ACCENTS.find((a) => a.id === id) ??
    ACCENTS.find((a) => a.id === DEFAULT_ACCENT_ID)!
  );
}

export function getBackgroundPreset(id: string | undefined): BackgroundPreset {
  return (
    BACKGROUND_PRESETS.find((b) => b.id === id) ??
    BACKGROUND_PRESETS.find((b) => b.id === DEFAULT_BACKGROUND_PRESET_ID)!
  );
}
