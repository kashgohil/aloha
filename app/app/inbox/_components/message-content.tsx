import React from "react";
import { cn } from "@/lib/utils";

type Token =
  | { type: "text"; value: string }
  | { type: "url"; value: string; href: string }
  | { type: "mention"; value: string; href: string | null }
  | { type: "hashtag"; value: string; href: string | null }
  | { type: "email"; value: string };

// Each platform's mention/hashtag deep-link pattern. Keys missing here mean
// the platform either has no canonical URL (mastodon depends on the
// instance, telegram has none for hashtags) or the social mention surface
// doesn't exist as a public profile URL.
const MENTION_URL: Record<string, ((handle: string) => string) | null> = {
  twitter: (h) => `https://x.com/${h}`,
  bluesky: (h) => `https://bsky.app/profile/${h}`,
  instagram: (h) => `https://instagram.com/${h}`,
  threads: (h) => `https://threads.net/@${h}`,
  telegram: (h) => `https://t.me/${h}`,
  facebook: null,
  mastodon: null,
};

const HASHTAG_URL: Record<string, ((tag: string) => string) | null> = {
  twitter: (t) => `https://x.com/hashtag/${t}`,
  bluesky: (t) => `https://bsky.app/hashtag/${t}`,
  instagram: (t) => `https://instagram.com/explore/tags/${t}`,
  threads: (t) => `https://threads.net/search?q=%23${encodeURIComponent(t)}&serp_type=tags`,
  facebook: (t) => `https://facebook.com/hashtag/${t}`,
  mastodon: null,
  telegram: null,
};

// Combined matcher. Order in alternation = priority — URLs first so a URL
// containing '#' isn't sliced into hashtags. Bounded so Twitter-style
// handles can't run away. \p{L}\p{N} would be more inclusive but we lean
// ASCII for the social platforms we ship.
const TOKEN_RE =
  /(https?:\/\/[^\s<>")]+|www\.[^\s<>")]+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|@[A-Za-z0-9_]{1,30}|#[A-Za-z0-9_]{1,50})/g;

function tokenize(text: string, platform: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(TOKEN_RE)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      tokens.push({ type: "text", value: text.slice(lastIndex, start) });
    }
    const raw = match[0];
    if (raw.startsWith("http") || raw.startsWith("www.")) {
      // Strip trailing punctuation that almost certainly isn't part of the
      // URL — the regex is greedy on purpose so `(see https://x.com/y).`
      // hands us the dot/parens to peel back.
      const clean = trimTrailingPunctuation(raw);
      const consumed = raw.slice(0, clean.length);
      const href = consumed.startsWith("http") ? consumed : `https://${consumed}`;
      tokens.push({ type: "url", value: consumed, href });
      // If we trimmed punctuation back into the text stream, restore it.
      const tail = raw.slice(consumed.length);
      if (tail) tokens.push({ type: "text", value: tail });
    } else if (raw.includes("@") && !raw.startsWith("@")) {
      tokens.push({ type: "email", value: raw });
    } else if (raw.startsWith("@")) {
      const handle = raw.slice(1);
      const builder = MENTION_URL[platform];
      tokens.push({
        type: "mention",
        value: raw,
        href: builder ? builder(handle) : null,
      });
    } else if (raw.startsWith("#")) {
      const tag = raw.slice(1);
      const builder = HASHTAG_URL[platform];
      tokens.push({
        type: "hashtag",
        value: raw,
        href: builder ? builder(tag) : null,
      });
    }
    lastIndex = start + raw.length;
  }
  if (lastIndex < text.length) {
    tokens.push({ type: "text", value: text.slice(lastIndex) });
  }
  return tokens;
}

function trimTrailingPunctuation(s: string): string {
  let end = s.length;
  while (end > 0 && /[.,!?;:'")\]]/.test(s[end - 1])) {
    // Don't strip a closing paren if there's an opening one — handles
    // wikipedia-style "foo_(bar)" links.
    if (s[end - 1] === ")" && s.slice(0, end - 1).includes("(")) break;
    end -= 1;
  }
  return s.slice(0, end);
}

export function MessageContent({
  text,
  platform,
  className,
  linkClassName,
}: {
  text: string;
  platform: string;
  className?: string;
  linkClassName?: string;
}) {
  const tokens = tokenize(text, platform);
  return (
    <span
      className={cn(
        // overflow-wrap: anywhere wins where break-words still leaves long
        // shortlinks blowing past the bubble width.
        "[overflow-wrap:anywhere] whitespace-pre-wrap",
        className,
      )}
    >
      {tokens.map((t, i) => {
        if (t.type === "text") return <span key={i}>{t.value}</span>;
        if (t.type === "email") {
          return (
            <a
              key={i}
              href={`mailto:${t.value}`}
              className={cn("underline underline-offset-2", linkClassName)}
            >
              {t.value}
            </a>
          );
        }
        if (t.type === "url") {
          return (
            <a
              key={i}
              href={t.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn("underline underline-offset-2", linkClassName)}
            >
              {displayUrl(t.value)}
            </a>
          );
        }
        if (t.type === "mention" || t.type === "hashtag") {
          if (!t.href) {
            return (
              <span
                key={i}
                className={cn("font-medium", linkClassName)}
              >
                {t.value}
              </span>
            );
          }
          return (
            <a
              key={i}
              href={t.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn("font-medium underline underline-offset-2", linkClassName)}
            >
              {t.value}
            </a>
          );
        }
        return null;
      })}
    </span>
  );
}

function displayUrl(url: string): string {
  // Show the URL without the protocol for cleanliness; full target stays
  // in the href so the link still works.
  return url.replace(/^https?:\/\//, "").replace(/^www\./, "");
}
