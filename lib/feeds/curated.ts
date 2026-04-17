// Aloha-curated feed catalog. Seeded by hand; updated with real usage
// signal. Each entry is subscribable by a single click from the feed
// reader's "Discover" section.

export type CuratedFeed = {
  url: string;
  siteUrl: string;
  title: string;
  description: string;
  category: string;
};

export const CURATED_CATEGORIES = [
  "Marketing",
  "Product",
  "Design",
  "Engineering",
  "AI",
  "Creators",
  "Business",
] as const;

export type CuratedCategory = (typeof CURATED_CATEGORIES)[number];

export const CURATED_FEEDS: CuratedFeed[] = [
  // Marketing
  {
    url: "https://www.marketingbrew.com/rss.xml",
    siteUrl: "https://www.marketingbrew.com/",
    title: "Marketing Brew",
    description: "Daily marketing news, without the marketing-speak.",
    category: "Marketing",
  },
  {
    url: "https://cxl.com/institute/blog/feed/",
    siteUrl: "https://cxl.com/institute/blog/",
    title: "CXL",
    description: "Conversion, analytics, and growth essays.",
    category: "Marketing",
  },

  // Product
  {
    url: "https://www.lennysnewsletter.com/feed",
    siteUrl: "https://www.lennysnewsletter.com/",
    title: "Lenny's Newsletter",
    description: "Product, growth, and career by Lenny Rachitsky.",
    category: "Product",
  },
  {
    url: "https://www.producttalk.org/feed/",
    siteUrl: "https://www.producttalk.org/",
    title: "Product Talk",
    description: "Teresa Torres on continuous discovery.",
    category: "Product",
  },

  // Design
  {
    url: "https://uxdesign.cc/feed",
    siteUrl: "https://uxdesign.cc/",
    title: "UX Collective",
    description: "Essays on product design, curated.",
    category: "Design",
  },
  {
    url: "https://www.nngroup.com/feed/rss/",
    siteUrl: "https://www.nngroup.com/articles/",
    title: "Nielsen Norman Group",
    description: "UX research and usability articles.",
    category: "Design",
  },

  // Engineering
  {
    url: "https://newsletter.pragmaticengineer.com/feed",
    siteUrl: "https://newsletter.pragmaticengineer.com/",
    title: "The Pragmatic Engineer",
    description: "Big-tech engineering culture and career.",
    category: "Engineering",
  },
  {
    url: "https://martinfowler.com/feed.atom",
    siteUrl: "https://martinfowler.com/",
    title: "Martin Fowler",
    description: "Software architecture, refactoring, patterns.",
    category: "Engineering",
  },

  // AI
  {
    url: "https://simonwillison.net/atom/everything/",
    siteUrl: "https://simonwillison.net/",
    title: "Simon Willison",
    description: "Daily notes on AI, LLMs, and the web.",
    category: "AI",
  },
  {
    url: "https://www.latent.space/feed",
    siteUrl: "https://www.latent.space/",
    title: "Latent Space",
    description: "AI engineering and tooling essays.",
    category: "AI",
  },

  // Creators
  {
    url: "https://creatoreconomy.so/feed",
    siteUrl: "https://creatoreconomy.so/",
    title: "Creator Economy",
    description: "Data-forward creator and publishing trends.",
    category: "Creators",
  },
  {
    url: "https://newsletter.systemsapproach.org/feed",
    siteUrl: "https://newsletter.systemsapproach.org/",
    title: "The Systems Approach",
    description: "Essays on creator habits and workflow.",
    category: "Creators",
  },

  // Business
  {
    url: "https://stratechery.com/feed",
    siteUrl: "https://stratechery.com/",
    title: "Stratechery",
    description: "Ben Thompson on tech strategy.",
    category: "Business",
  },
  {
    url: "https://hbr.org/rss",
    siteUrl: "https://hbr.org/",
    title: "Harvard Business Review",
    description: "HBR articles across leadership and strategy.",
    category: "Business",
  },
];

export function catalogByCategory(): Record<CuratedCategory, CuratedFeed[]> {
  const out = {} as Record<CuratedCategory, CuratedFeed[]>;
  for (const c of CURATED_CATEGORIES) out[c] = [];
  for (const f of CURATED_FEEDS) {
    const cat = f.category as CuratedCategory;
    (out[cat] ??= []).push(f);
  }
  return out;
}
