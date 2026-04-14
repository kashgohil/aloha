import { ImageResponse } from "next/og";
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/seo";
import { OG_CONTENT_TYPE, OG_SIZE, loadOgFonts, ogCard } from "@/lib/og";

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function OpengraphImage() {
  return new ImageResponse(
    ogCard({
      eyebrow: SITE_TAGLINE,
      title: "The calm social media OS.",
      subtitle: DEFAULT_DESCRIPTION,
    }),
    { ...size, fonts: [...loadOgFonts()] },
  );
}
