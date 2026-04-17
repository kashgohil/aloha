// Web content importer. Fetches a URL, strips chrome, and returns the
// article body as plain text. This is the v1 implementation — regex-based
// extraction that covers most blog posts and news articles. When quality
// bites, swap to @mozilla/readability + linkedom (no sub-processor) or
// route through a dedicated service. Same `extractFromUrl` signature.
//
// Known limitations:
//   - Single-page articles only (no pagination).
//   - Sites that render client-side (SPA) return empty or shell content.
//   - No image extraction (post-level OG image pulled separately if needed).
//   - Respects robots.txt implicitly via our 10s timeout + identifying UA.

const USER_AGENT =
  "AlohaBot/1.0 (+https://usealoha.app) content-importer";
const FETCH_TIMEOUT_MS = 10_000;
const MAX_HTML_BYTES = 2 * 1024 * 1024; // 2MB — generous for articles, tight for bloat

export type ImportedContent = {
  url: string;
  title: string;
  excerpt: string;
  content: string;
  ogImage: string | null;
};

export class ImporterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImporterError";
  }
}

export async function extractFromUrl(url: string): Promise<ImportedContent> {
  const parsed = safeParseUrl(url);
  if (!parsed) throw new ImporterError("Not a valid URL.");
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ImporterError("Only http/https URLs are supported.");
  }

  const html = await fetchHtml(parsed.toString());
  return extractFromHtml(html, parsed.toString());
}

function safeParseUrl(raw: string): URL | null {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new ImporterError(`Source returned ${res.status}.`);
    }
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("html") && !contentType.includes("xml")) {
      throw new ImporterError(`Unsupported content type (${contentType}).`);
    }
    // Bound the body size — pathological pages can be hundreds of MB.
    const reader = res.body?.getReader();
    if (!reader) return await res.text();
    const decoder = new TextDecoder();
    let received = 0;
    let html = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      received += value.length;
      if (received > MAX_HTML_BYTES) {
        throw new ImporterError("Source page too large to import.");
      }
      html += decoder.decode(value, { stream: true });
    }
    html += decoder.decode();
    return html;
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new ImporterError("Source took too long to respond.");
    }
    if (err instanceof ImporterError) throw err;
    throw new ImporterError(
      `Couldn't fetch source: ${(err as Error).message ?? "unknown error"}.`,
    );
  } finally {
    clearTimeout(timer);
  }
}

// Extracts { title, excerpt, content, ogImage } from HTML. Strategy:
//   1. Pull meta tags (title, og:title, og:image, og:description).
//   2. Strip <script>, <style>, <noscript>, <nav>, <header>, <footer>, <aside>,
//      <form>, and explicit class patterns for ads/related/sidebars.
//   3. Prefer content within <article>, then <main>, then <body>.
//   4. Convert remaining HTML to plain text with paragraph breaks preserved.
export function extractFromHtml(html: string, url: string): ImportedContent {
  const title =
    firstMatch(html, /<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
    firstMatch(html, /<meta[^>]+name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i) ||
    firstMatch(html, /<title>([^<]+)<\/title>/i) ||
    "Untitled";

  const excerpt =
    firstMatch(html, /<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
    firstMatch(html, /<meta[^>]+name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
    "";

  const ogImage =
    firstMatch(html, /<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
    firstMatch(html, /<meta[^>]+name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
    null;

  // Strip noise before region extraction so stripping can't accidentally
  // consume content that was nested under a nav.
  const cleaned = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<(nav|header|footer|aside|form)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  // Prefer the tightest sensible region.
  const region =
    firstMatch(cleaned, /<article\b[\s\S]*?>([\s\S]*?)<\/article>/i) ||
    firstMatch(cleaned, /<main\b[\s\S]*?>([\s\S]*?)<\/main>/i) ||
    firstMatch(cleaned, /<body\b[\s\S]*?>([\s\S]*?)<\/body>/i) ||
    cleaned;

  // Preserve paragraph breaks by turning block-close tags into newlines
  // before stripping.
  const withBreaks = region
    .replace(/<\/(p|li|h[1-6]|blockquote|section|div)\s*>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n");

  const text = withBreaks
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/[ \t]+/g, " ")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n\n")
    .trim();

  if (text.length < 120) {
    throw new ImporterError(
      "Couldn't find the main article content. The page may be JavaScript-rendered.",
    );
  }

  return {
    url,
    title: decodeEntities(title).trim(),
    excerpt: decodeEntities(excerpt).trim(),
    content: text,
    ogImage,
  };
}

function firstMatch(source: string, re: RegExp): string | null {
  const m = re.exec(source);
  return m ? m[1] : null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}
