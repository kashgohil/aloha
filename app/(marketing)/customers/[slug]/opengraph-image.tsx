import { ImageResponse } from "next/og";
import { CASE_STUDIES } from "@/lib/case-studies";
import { OG_CONTENT_TYPE, OG_SIZE, loadOgFonts, ogCard } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Customer story";

export default async function CaseStudyOg({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = CASE_STUDIES[slug];
  const fonts = [...loadOgFonts()];
  if (!s) {
    return new ImageResponse(
      ogCard({ eyebrow: "Customers", title: "Customer stories." }),
      { ...size, fonts },
    );
  }
  return new ImageResponse(
    ogCard({
      eyebrow: `${s.customer.business} · ${s.readTime} read`,
      title: s.pull.replace(/["']/g, "\u201C"),
      subtitle: s.summary,
      accent: "primary",
      footer: s.publishedLabel,
    }),
    { ...size, fonts },
  );
}
