// Minimal RSS 2.0 + Atom 1.0 parser. DOM-free, dependency-free. Handles the
// subset of fields we actually consume: feed title/description/link, and
// per-item title, guid/link, summary, author, image, pubDate.
//
// Quality trade-off: malformed feeds or obscure namespaces may miss fields.
// When real feeds misbehave in practice, upgrade to a proper parser
// (fast-xml-parser or linkedom) rather than hardening regex.

export type ParsedFeed = {
  title: string;
  description: string | null;
  siteUrl: string | null;
  iconUrl: string | null;
  items: ParsedItem[];
};

export type ParsedItem = {
  guid: string; // falls back to url when no guid is emitted
  title: string;
  summary: string | null;
  url: string | null;
  author: string | null;
  imageUrl: string | null;
  publishedAt: Date | null;
};

export class FeedParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FeedParseError";
  }
}

export function parseFeed(xml: string): ParsedFeed {
  const trimmed = xml.replace(/^\uFEFF/, "").trim();
  if (!trimmed) throw new FeedParseError("Empty feed body.");

  // Detect format.
  const isAtom = /<feed\b[^>]*xmlns=["']http:\/\/www\.w3\.org\/2005\/Atom/i.test(
    trimmed,
  ) || /^<feed[\s>]/.test(trimmed.slice(0, 200));
  return isAtom ? parseAtom(trimmed) : parseRss(trimmed);
}

// ---- RSS 2.0 --------------------------------------------------------------

function parseRss(xml: string): ParsedFeed {
  const channel = firstBlock(xml, "channel");
  if (!channel) throw new FeedParseError("No <channel> element found.");

  const title = tagText(channel, "title") ?? "Untitled feed";
  const description = tagText(channel, "description");
  const siteUrl = tagText(channel, "link");
  const iconUrl =
    firstMatch(channel, /<image\b[\s\S]*?<url>([^<]+)<\/url>/i) ?? null;

  const items: ParsedItem[] = blocks(xml, "item").map((raw) => {
    const url = tagText(raw, "link") ?? tagText(raw, "guid");
    const guid = tagText(raw, "guid") ?? url ?? "";
    const title = tagText(raw, "title") ?? "(untitled)";
    const summary =
      tagText(raw, "description") ?? tagText(raw, "content:encoded");
    const author =
      tagText(raw, "dc:creator") ?? tagText(raw, "author") ?? null;
    const pub = tagText(raw, "pubDate") ?? tagText(raw, "dc:date");
    const image =
      attrFrom(raw, /<enclosure\b[^>]*url=["']([^"']+)["']/i) ??
      attrFrom(raw, /<media:thumbnail\b[^>]*url=["']([^"']+)["']/i) ??
      extractImgFromHtml(summary ?? "");

    return {
      guid,
      title: stripHtml(title),
      summary: summary ? cleanSummary(summary) : null,
      url,
      author: author ? stripHtml(author) : null,
      imageUrl: image,
      publishedAt: parseDate(pub),
    };
  });

  return {
    title: stripHtml(title),
    description: description ? cleanSummary(description) : null,
    siteUrl,
    iconUrl,
    items,
  };
}

// ---- Atom 1.0 -------------------------------------------------------------

function parseAtom(xml: string): ParsedFeed {
  const feedBlock = firstBlock(xml, "feed") ?? xml;
  const title = tagText(feedBlock, "title") ?? "Untitled feed";
  const description = tagText(feedBlock, "subtitle");
  const siteUrl = atomLink(feedBlock, "alternate") ?? atomLink(feedBlock);
  const iconUrl = tagText(feedBlock, "icon") ?? tagText(feedBlock, "logo");

  const items: ParsedItem[] = blocks(xml, "entry").map((raw) => {
    const url = atomLink(raw, "alternate") ?? atomLink(raw);
    const guid = tagText(raw, "id") ?? url ?? "";
    const title = tagText(raw, "title") ?? "(untitled)";
    const summary =
      tagText(raw, "summary") ??
      tagText(raw, "content");
    const authorName =
      firstMatch(raw, /<author\b[\s\S]*?<name>([^<]+)<\/name>/i) ?? null;
    const pub = tagText(raw, "published") ?? tagText(raw, "updated");
    const image =
      attrFrom(raw, /<media:thumbnail\b[^>]*url=["']([^"']+)["']/i) ??
      extractImgFromHtml(summary ?? "");

    return {
      guid,
      title: stripHtml(title),
      summary: summary ? cleanSummary(summary) : null,
      url,
      author: authorName ? stripHtml(authorName) : null,
      imageUrl: image,
      publishedAt: parseDate(pub),
    };
  });

  return {
    title: stripHtml(title),
    description: description ? cleanSummary(description) : null,
    siteUrl,
    iconUrl,
    items,
  };
}

function atomLink(
  block: string,
  rel: string = "self",
): string | null {
  // Prefer explicit rel match; fall back to first <link href=> with no rel.
  const relMatch = new RegExp(
    `<link\\b[^>]*rel=["']${rel}["'][^>]*href=["']([^"']+)["']`,
    "i",
  );
  const noRelMatch = /<link\b(?![^>]*rel=)(?:[^>]*href=["']([^"']+)["'])/i;
  return firstMatch(block, relMatch) ?? firstMatch(block, noRelMatch);
}

// ---- Helpers --------------------------------------------------------------

function blocks(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, "gi");
  return xml.match(re) ?? [];
}

function firstBlock(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, "i");
  const m = re.exec(xml);
  return m ? m[0] : null;
}

function tagText(xml: string, tag: string): string | null {
  // CDATA-aware: <tag>...</tag> or <tag><![CDATA[...]]></tag>. Escapes for
  // namespace-prefixed tags.
  const escaped = tag.replace(/:/g, "\\:");
  const cdata = new RegExp(
    `<${escaped}\\b[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${escaped}>`,
    "i",
  );
  const plain = new RegExp(
    `<${escaped}\\b[^>]*>([\\s\\S]*?)<\\/${escaped}>`,
    "i",
  );
  const cdMatch = cdata.exec(xml);
  if (cdMatch) return decodeEntities(cdMatch[1]).trim() || null;
  const match = plain.exec(xml);
  if (!match) return null;
  const body = match[1].trim();
  return body ? decodeEntities(body) : null;
}

function attrFrom(xml: string, re: RegExp): string | null {
  return firstMatch(xml, re);
}

function firstMatch(source: string, re: RegExp): string | null {
  const m = re.exec(source);
  return m ? m[1] : null;
}

function stripHtml(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function cleanSummary(s: string): string {
  const stripped = stripHtml(s);
  return stripped.length > 600 ? `${stripped.slice(0, 600).trim()}…` : stripped;
}

function extractImgFromHtml(html: string): string | null {
  return firstMatch(html, /<img\b[^>]*src=["']([^"']+)["']/i);
}

function parseDate(raw: string | null): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
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
