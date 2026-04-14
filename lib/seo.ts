import type { Metadata } from "next";

export const SITE_NAME = "Aloha";
export const SITE_URL = "https://usealoha.app";
export const SITE_TAGLINE = "Grow with intention";
export const SITE_LOCALE = "en_US";
export const DEFAULT_DESCRIPTION =
  "The calm social media OS for creators who'd rather be making the work than managing the posting of the work.";

// Social presences used by Organization JSON-LD.
export const SOCIAL_PROFILES = [
  "https://instagram.com/usealoha",
  "https://linkedin.com/company/usealoha",
  "https://x.com/usealoha",
  "https://threads.net/@usealoha",
  "https://youtube.com/@usealoha",
] as const;

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

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
  const fullTitle = isHome
    ? `${SITE_NAME} — ${title}`
    : `${title} · ${SITE_NAME}`;
  const url = absoluteUrl(path);

  // When `image` is omitted we intentionally do NOT set `openGraph.images` so
  // Next's opengraph-image.(tsx|png) file convention provides the default.
  const explicitImages = image
    ? [{ url: image, width: 1200, height: 630 }]
    : undefined;

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
      locale: SITE_LOCALE,
      type: "website",
      ...(explicitImages ? { images: explicitImages } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

// ──────────────────────────────────────────────────────────────────────────
// JSON-LD structured-data builders. Each returns a plain object serialised
// into an `application/ld+json` <script> via the `<JsonLd>` component
// (see `lib/json-ld.tsx`). Schemas here aim for the subset Google's
// Rich Results guidelines validate; anything extra is noise.
// ──────────────────────────────────────────────────────────────────────────

const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    legalName: "Aloha, Inc.",
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/aloha.png"),
      width: 512,
      height: 512,
    },
    description: DEFAULT_DESCRIPTION,
    slogan: SITE_TAGLINE,
    sameAs: SOCIAL_PROFILES,
    foundingDate: "2025-03",
    foundingLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Bengaluru",
        addressRegion: "Karnataka",
        addressCountry: "IN",
      },
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Bengaluru",
      addressRegion: "Karnataka",
      addressCountry: "IN",
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        email: "hello@usealoha.app",
        contactType: "customer support",
        availableLanguage: ["en"],
      },
      {
        "@type": "ContactPoint",
        email: "press@usealoha.app",
        contactType: "press",
      },
      {
        "@type": "ContactPoint",
        email: "sales@usealoha.app",
        contactType: "sales",
      },
      {
        "@type": "ContactPoint",
        email: "security@usealoha.app",
        contactType: "security",
      },
    ],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    inLanguage: "en",
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export function softwareApplicationJsonLd(opts?: {
  name?: string;
  path?: string;
  description?: string;
  applicationCategory?: string;
  operatingSystem?: string;
  offers?: { price: string | number; priceCurrency: string };
}) {
  const {
    name = SITE_NAME,
    path = "/",
    description = DEFAULT_DESCRIPTION,
    applicationCategory = "BusinessApplication",
    operatingSystem = "Web, iOS, Android",
    offers = { price: "0", priceCurrency: "USD" },
  } = opts ?? {};
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    url: absoluteUrl(path),
    description,
    applicationCategory,
    operatingSystem,
    publisher: { "@id": ORGANIZATION_ID },
    offers: {
      "@type": "Offer",
      ...offers,
    },
  };
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function reviewJsonLd(opts: {
  // What's being reviewed — almost always Aloha itself.
  itemName?: string;
  itemPath?: string;
  body: string;
  authorName: string;
  authorRole?: string;
  datePublished: string;
}) {
  const {
    itemName = SITE_NAME,
    itemPath = "/",
    body,
    authorName,
    authorRole,
    datePublished,
  } = opts;
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: {
      "@type": "SoftwareApplication",
      name: itemName,
      url: absoluteUrl(itemPath),
      applicationCategory: "BusinessApplication",
    },
    reviewBody: body,
    author: {
      "@type": "Person",
      name: authorName,
      ...(authorRole ? { jobTitle: authorRole } : {}),
    },
    datePublished,
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export function articleJsonLd(opts: {
  headline: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified?: string;
  authorName: string;
  authorRole?: string;
  image?: string;
  articleSection?: string;
}) {
  const {
    headline,
    description,
    path,
    datePublished,
    dateModified,
    authorName,
    authorRole,
    image,
    articleSection,
  } = opts;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    url: absoluteUrl(path),
    mainEntityOfPage: absoluteUrl(path),
    datePublished,
    dateModified: dateModified ?? datePublished,
    author: {
      "@type": "Person",
      name: authorName,
      ...(authorRole ? { jobTitle: authorRole } : {}),
    },
    publisher: { "@id": ORGANIZATION_ID },
    ...(image ? { image } : {}),
    ...(articleSection ? { articleSection } : {}),
    inLanguage: "en",
  };
}
