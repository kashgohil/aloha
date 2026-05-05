// Per-channel format registry for campaign beats and posts.
//
// Each channel exposes its native post shapes. Beats and posts carry a
// `format` slug that must belong to its channel's allowlist. The Muse
// prompts inject this allowlist so the model picks valid formats from the
// start; the parser validates against it; the inspector + composer
// dropdowns are populated from it.

export type ChannelFormat = {
  slug: string;
  label: string;
  // One-sentence guidance shown to the model + the user.
  guidance: string;
};

export const CHANNEL_FORMATS: Record<string, ChannelFormat[]> = {
  x: [
    {
      slug: "single",
      label: "Tweet",
      guidance:
        "Single tweet — one tight thought, hook + payoff. ≤280 chars.",
    },
    {
      slug: "thread",
      label: "Thread",
      guidance:
        "Thread — opening hook tweet, then 3–8 numbered tweets, each ≤280 chars and each setting up the next.",
    },
    {
      slug: "long-post",
      label: "Long post",
      guidance:
        "Long post (X premium) — single multi-paragraph post up to ~25k chars. Reads like an essay, not a thread.",
    },
  ],
  threads: [
    {
      slug: "single",
      label: "Post",
      guidance: "Single post — conversational, ≤500 chars.",
    },
    {
      slug: "thread",
      label: "Thread",
      guidance:
        "Threaded reply chain — opening post + 2–6 replies, each ≤500 chars.",
    },
  ],
  bluesky: [
    {
      slug: "single",
      label: "Post",
      guidance: "Single skeet — ≤300 chars, conversational.",
    },
    {
      slug: "thread",
      label: "Thread",
      guidance:
        "Threaded skeets — hook + 3–6 follow-ups, each ≤300 chars.",
    },
  ],
  mastodon: [
    {
      slug: "single",
      label: "Toot",
      guidance: "Single toot — ≤500 chars, content warning if needed.",
    },
    {
      slug: "thread",
      label: "Thread",
      guidance: "Threaded toots — hook + 3–6 follow-ups, each ≤500 chars.",
    },
  ],
  linkedin: [
    {
      slug: "single",
      label: "Post",
      guidance:
        "Single post — hook in first 2 lines (above 'see more'), 100–300 words, line breaks between paragraphs.",
    },
    {
      slug: "long-form",
      label: "Article",
      guidance:
        "Article — title + scannable sections, 600–1500 words, depth over brevity.",
    },
    {
      slug: "document",
      label: "Document carousel",
      guidance:
        "PDF document carousel — 6–12 slides, big type, one idea per slide, hook on slide 1, CTA on the last.",
    },
    {
      slug: "short-video",
      label: "Short video",
      guidance:
        "Native short video — 30–90s, hook in the first 3s, captions baked in.",
    },
    {
      slug: "newsletter",
      label: "Newsletter",
      guidance:
        "LinkedIn newsletter — title + lead + 2–4 sections, longer than a post, sent to subscribers.",
    },
  ],
  instagram: [
    {
      slug: "single",
      label: "Post",
      guidance:
        "Single image/video post — caption with soft first line + line break, then payoff.",
    },
    {
      slug: "carousel",
      label: "Carousel",
      guidance:
        "Carousel — up to 10 slides, big type, one idea per slide, hook on slide 1, CTA on the last.",
    },
    {
      slug: "reel",
      label: "Reel",
      guidance:
        "Reel — 15–60s vertical video, hook in first 3s, on-screen captions, trending audio when fitting.",
    },
    {
      slug: "story",
      label: "Story",
      guidance:
        "Story sequence — 3–6 frames, can include polls, questions, link stickers.",
    },
  ],
  facebook: [
    {
      slug: "single",
      label: "Post",
      guidance: "Single text/image post — conversational, no length limit.",
    },
    {
      slug: "carousel",
      label: "Carousel",
      guidance: "Carousel — 2–10 cards, each with image + caption + link.",
    },
    {
      slug: "short-video",
      label: "Reel",
      guidance:
        "Facebook reel — 15–60s vertical video, hook first, captions baked in.",
    },
    {
      slug: "link",
      label: "Link share",
      guidance:
        "Link post — framing copy outside the link preview; let the link title carry weight.",
    },
  ],
  tiktok: [
    {
      slug: "short-video",
      label: "TikTok",
      guidance:
        "15–60s vertical video — hook in first 1–2s, on-screen captions, sound-on-by-default.",
    },
    {
      slug: "carousel",
      label: "Photo carousel",
      guidance:
        "Photo carousel — 2–35 photos with text overlays, music required.",
    },
  ],
  youtube: [
    {
      slug: "short-video",
      label: "Short",
      guidance:
        "Vertical short ≤60s — hook in first 3s, captions baked in, loop-friendly.",
    },
    {
      slug: "long-video",
      label: "Long-form video",
      guidance:
        "Long-form video — title + description + chapters, 5–20 min, hook in first 30s.",
    },
    {
      slug: "community",
      label: "Community post",
      guidance:
        "Community post — text/image/poll for subscribers, conversational.",
    },
  ],
  pinterest: [
    {
      slug: "pin",
      label: "Pin",
      guidance:
        "Standard pin — vertical image with text overlay, title + 100–200 char description, link to source.",
    },
    {
      slug: "idea-pin",
      label: "Idea pin",
      guidance:
        "Idea pin — multi-page vertical pin, 4–8 pages, each with a single takeaway.",
    },
  ],
  medium: [
    {
      slug: "long-form",
      label: "Article",
      guidance:
        "Article — title + subtitle + 800–2000 words, scannable sections, hero image.",
    },
  ],
  reddit: [
    {
      slug: "single",
      label: "Text post",
      guidance:
        "Self/text post — title carries the hook, body 100–600 words, no marketing copy.",
    },
    {
      slug: "long-form",
      label: "Long-form text",
      guidance:
        "Long-form post — title + 600–1500 words, structured sections, fits subs that reward depth.",
    },
    {
      slug: "link",
      label: "Link post",
      guidance:
        "Link post — title is the entire pitch; comment with framing/context separately.",
    },
  ],
  telegram: [
    {
      slug: "single",
      label: "Message",
      guidance:
        "Single message — markdown supported, can include preview-able link or media.",
    },
    {
      slug: "long-form",
      label: "Long post",
      guidance:
        "Long-form message — title + sections, broadcast-style, supports markdown.",
    },
    {
      slug: "link",
      label: "Link share",
      guidance: "Link share with framing copy and big preview card.",
    },
  ],
};

const DEFAULT_FORMATS: ChannelFormat[] = [
  {
    slug: "single",
    label: "Post",
    guidance: "Single post — hook, payoff, close. Tight.",
  },
];

export function formatsFor(channel: string): ChannelFormat[] {
  return CHANNEL_FORMATS[channel] ?? DEFAULT_FORMATS;
}

export function isValidFormat(channel: string, format: string): boolean {
  return formatsFor(channel).some((f) => f.slug === format);
}

export function defaultFormatFor(channel: string): string {
  return formatsFor(channel)[0]?.slug ?? "single";
}

export function formatGuidanceFor(channel: string, format: string): string {
  const found = formatsFor(channel).find((f) => f.slug === format);
  if (found) return found.guidance;
  // Unknown format — return a neutral hint rather than throwing, so old
  // beats persisted with a now-deprecated format slug still render.
  return "Single post — hook, payoff, close.";
}

export function formatLabelFor(channel: string, format: string): string {
  const found = formatsFor(channel).find((f) => f.slug === format);
  return found?.label ?? format;
}

// Used by the campaign prompts: produces a per-channel allowlist block the
// model sees in its system prompt, e.g.:
//   - x: single | thread | long-post
//   - linkedin: single | long-form | document | short-video | newsletter
export function formatAllowlistBlock(channels: string[]): string {
  if (channels.length === 0) return "(no channels)";
  return channels
    .map((ch) => {
      const fmts = formatsFor(ch)
        .map((f) => f.slug)
        .join(" | ");
      return `  - ${ch}: ${fmts}`;
    })
    .join("\n");
}

// Per-channel format guidance the prompts append so the model emits
// format-appropriate scaffolding (thread keyPoints = tweets; carousel
// keyPoints = slides; etc.).
export function formatGuidanceBlock(channels: string[]): string {
  if (channels.length === 0) return "(no channels)";
  const lines: string[] = [];
  for (const ch of channels) {
    for (const f of formatsFor(ch)) {
      lines.push(`  - ${ch}/${f.slug}: ${f.guidance}`);
    }
  }
  return lines.join("\n");
}
