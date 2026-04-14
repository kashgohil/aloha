import type { Metadata } from "next";

const SITE_NAME = "Aloha";
const SITE_URL = "https://usealoha.app";
const DEFAULT_DESCRIPTION =
  "The calm social media OS for creators who'd rather be making the work than managing the posting of the work.";

export function makeMetadata(opts: {
  title: string;
  description?: string;
  path: string;
  image?: string;
  noindex?: boolean;
}): Metadata {
  const {
    title,
    description = DEFAULT_DESCRIPTION,
    path,
    image,
    noindex,
  } = opts;

  const isHome = path === "/";
  const fullTitle = isHome ? `${SITE_NAME} — ${title}` : `${title} · ${SITE_NAME}`;
  const url = `${SITE_URL}${path}`;
  const ogImage = image ?? `${SITE_URL}/og-default.png`;

  return {
    title: fullTitle,
    description,
    alternates: { canonical: url },
    robots: noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
    },
  };
}
