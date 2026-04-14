import { ImageResponse } from "next/og";
import { PERSONAS } from "@/lib/personas";
import { OG_CONTENT_TYPE, OG_SIZE, loadOgFonts, ogCard } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Aloha for this persona";

export default async function PersonaOg({
  params,
}: {
  params: Promise<{ persona: string }>;
}) {
  const { persona } = await params;
  const p = PERSONAS[persona];
  const fonts = [...loadOgFonts()];
  if (!p) {
    return new ImageResponse(
      ogCard({ eyebrow: "For you", title: "Aloha for every creator." }),
      { ...size, fonts },
    );
  }
  return new ImageResponse(
    ogCard({
      eyebrow: p.eyebrow,
      title: `${p.headline.line1} ${p.headline.line2}`.trim(),
      subtitle: p.tagline,
    }),
    { ...size, fonts },
  );
}
