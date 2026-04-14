import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Generic crawl policy. Auth pages are left crawlable so Google can reach the
// `noindex` meta tag set on each page (blocking here would prevent that).
const DISALLOWED_PATHS = ["/app/", "/api/", "/u/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOWED_PATHS,
      },
      // Explicitly welcome AI search/citation bots. Separate entries so the
      // policy is visible even when user-agent sniffing is strict.
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "OAI-SearchBot",
          "PerplexityBot",
          "Perplexity-User",
          "ClaudeBot",
          "Claude-Web",
          "anthropic-ai",
          "Applebot-Extended",
          "Google-Extended",
          "CCBot",
          "Bytespider",
          "DuckAssistBot",
          "cohere-ai",
        ],
        allow: "/",
        disallow: DISALLOWED_PATHS,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
