import { ImageResponse } from "next/og";
import { COMPETITORS } from "@/lib/competitors";
import { OG_CONTENT_TYPE, OG_SIZE, loadOgFonts, ogCard } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Aloha vs competitor";

export default async function CompareOg({
  params,
}: {
  params: Promise<{ competitor: string }>;
}) {
  const { competitor } = await params;
  const c = COMPETITORS[competitor];
  const fonts = [...loadOgFonts()];
  if (!c) {
    return new ImageResponse(
      ogCard({ eyebrow: "Compare", title: "Aloha, compared." }),
      { ...size, fonts },
    );
  }
  return new ImageResponse(
    ogCard({
      eyebrow: "Compared",
      title: `Aloha vs ${c.name}.`,
      subtitle: c.positioning,
      accent: "primary",
      footer: `Verified ${c.verifiedLabel}`,
    }),
    { ...size, fonts },
  );
}
