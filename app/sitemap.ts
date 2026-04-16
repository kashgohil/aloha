import type { MetadataRoute } from "next";
import { routes } from "@/lib/routes";
import { SITE_URL } from "@/lib/seo";
import { CHANNEL_SLUGS } from "@/lib/channels";
import { COMPETITOR_SLUGS } from "@/lib/competitors";
import { PERSONA_SLUGS } from "@/lib/personas";

type Entry = MetadataRoute.Sitemap[number];

const url = (path: string) => `${SITE_URL}${path}`;

function entry(
  path: string,
  priority: number,
  changeFrequency: Entry["changeFrequency"],
  lastModified?: string | Date,
): Entry {
  return {
    url: url(path),
    lastModified: lastModified ?? new Date(),
    changeFrequency,
    priority,
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: Entry[] = [];

  // Homepage — highest priority, refreshes often (pricing, changelog).
  entries.push(entry(routes.home, 1, "weekly"));

  // Product features — primary conversion surfaces.
  for (const path of Object.values(routes.product)) {
    entries.push(entry(path, 0.9, "weekly"));
  }

  // Channels (static params).
  for (const slug of CHANNEL_SLUGS) {
    entries.push(entry(`/channels/${slug}`, 0.8, "monthly"));
  }

  // Compare — quarterly verified; weekly sitemap signal is fine.
  for (const slug of COMPETITOR_SLUGS) {
    entries.push(entry(`/compare/${slug}`, 0.8, "monthly"));
  }
  entries.push(entry(routes.compare.migrationGuide, 0.7, "monthly"));
  entries.push(entry(routes.compare.whyDifferent, 0.7, "monthly"));

  // Personas.
  for (const slug of PERSONA_SLUGS) {
    entries.push(entry(`/for/${slug}`, 0.8, "monthly"));
  }

  // Resources hub + collection indexes.
  entries.push(entry(routes.resources.index, 0.7, "weekly"));
  entries.push(entry(routes.resources.templates, 0.7, "monthly"));
  entries.push(entry(routes.resources.creatorGuides, 0.7, "monthly"));
  entries.push(entry("/resources/creator-guides/voice-foundations", 0.6, "monthly"));
  entries.push(entry(routes.resources.helpCenter, 0.7, "weekly"));
  entries.push(entry(routes.resources.apiDocs, 0.7, "weekly"));
  entries.push(entry(routes.resources.status, 0.5, "daily"));

  // Company.
  for (const path of Object.values(routes.company)) {
    entries.push(entry(path, 0.6, "monthly"));
  }

  // Free tools.
  for (const path of Object.values(routes.tools)) {
    entries.push(entry(path, 0.7, "monthly"));
  }

  // Connect.
  for (const path of Object.values(routes.connect)) {
    entries.push(entry(path, 0.5, "monthly"));
  }

  // Legal — low priority but should be discoverable.
  for (const path of Object.values(routes.legal)) {
    entries.push(entry(path, 0.3, "yearly"));
  }

  // Trust.
  entries.push(entry(routes.trust, 0.6, "monthly"));

  // Pricing — coming-soon page in production, lower priority + slower crawl.
  entries.push(entry(routes.pricing, 0.6, "monthly"));

  // Human-readable utility pages (footer).
  entries.push(entry(routes.misc.sitemap, 0.3, "monthly"));
  entries.push(entry(routes.misc.accessibility, 0.3, "yearly"));

  return entries;
}
