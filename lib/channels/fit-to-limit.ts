import { getForm, getCapability } from "@/lib/channels/capabilities";

// Counts graphemes (user-visible characters) — emoji clusters, combining
// marks, ZWJ sequences all count as 1. This is what Bluesky's
// `app.bsky.feed.post` validator does, and what Twitter / Mastodon / etc
// approximate for their limits. Falls back to code-point count if the
// runtime lacks `Intl.Segmenter` (very old engines only).
function countGraphemes(text: string): number {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter("en", { granularity: "grapheme" });
    let n = 0;
    for (const _ of seg.segment(text)) n += 1;
    return n;
  }
  return Array.from(text).length;
}

function sliceGraphemes(text: string, limit: number): string {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter("en", { granularity: "grapheme" });
    let out = "";
    let n = 0;
    for (const part of seg.segment(text)) {
      if (n >= limit) break;
      out += part.segment;
      n += 1;
    }
    return out;
  }
  return Array.from(text).slice(0, limit).join("");
}

// Picks the canonical form for a given (channel, format) pair. The campaign
// beat carries a `format` slug (e.g. "thread", "post", "carousel"); we look
// it up first and fall back to the channel's first form when the slug
// doesn't match anything in the registry.
function resolveLimit(channel: string, format: string): number | null {
  const form = getForm(channel, format);
  if (form?.limits?.maxChars) return form.limits.maxChars;
  const cap = getCapability(channel);
  const fallback = cap?.forms[0]?.limits?.maxChars;
  return fallback ?? null;
}

// Trims content so it fits the (channel, format)'s `maxChars` limit
// (counted as graphemes — see `countGraphemes`). Strategy:
//   1. If already under, return as-is.
//   2. Drop trailing hashtag block. Hashtags inflate length and often add
//      no information once the body is constrained, so this is the
//      cheapest cut.
//   3. If still over, trim the body to (limit - 1) graphemes and append
//      "…" so it reads as truncated rather than mid-word.
//
// Used at draft creation time (campaign accept, future single-channel
// drafts) so the user never sees a draft that the publisher would reject.
// Publishers are still expected to validate; this is an upstream guard,
// not a substitute.
export function fitContentToChannelLimit(
  content: string,
  channel: string,
  format: string,
): string {
  const limit = resolveLimit(channel, format);
  if (!limit) return content;
  if (countGraphemes(content) <= limit) return content;

  // Strip a trailing hashtag block separated by blank line(s). Pattern is
  // intentionally narrow — only matches the "...\n\n#a #b #c" tail that
  // `composeBeatBody` generates, so we don't accidentally rip out
  // hashtags embedded mid-paragraph.
  const stripped = content.replace(/\n{2,}#[^\n]+$/u, "").trimEnd();
  if (countGraphemes(stripped) <= limit) return stripped;

  const ELLIPSIS = "…";
  const head = sliceGraphemes(stripped, limit - 1);
  return `${head}${ELLIPSIS}`;
}
