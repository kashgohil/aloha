// Field-notes index — tiny manifest for /resources/field-notes.
// Each entry maps to an MDX page at:
//   app/(marketing)/resources/field-notes/{slug}/page.mdx
//
// To add a post: add an entry here AND a matching MDX file. The index
// page reads from this; the article shell on each post pulls in its
// metadata via getFieldNote(slug).

import { routes } from "@/lib/routes";

export type FieldNote = {
  slug: string;
  title: string;
  lead: string;
  date: string; // ISO
  dateLabel: string;
  readTime: string;
  // Display-tone for the index card + article hero stripe.
  accent: "bg-peach-100" | "bg-peach-200" | "bg-peach-300" | "bg-primary-soft";
  author: { name: string; role: string; ini: string; tone?: string };
  // 2-3 tags shown on the index card.
  tags: string[];
};

export const FIELD_NOTES: FieldNote[] = [
  {
    slug: "closing-the-tab",
    title: "On closing the tab",
    lead:
      "Why the default state of a good tool is 'you're done' — and the five places we broke that rule by accident.",
    date: "2026-04-10",
    dateLabel: "April 10, 2026",
    readTime: "7 min",
    accent: "bg-peach-200",
    author: { name: "Aarohi Mehta", role: "Co-founder · Product", ini: "A", tone: "bg-ink" },
    tags: ["product", "calm tools", "defaults"],
  },
  {
    slug: "seventh-telling",
    title: "The seventh telling",
    lead:
      "Launches are 20% building, 80% caring enough to tell people the seventh time. Notes from a creator who tracked it.",
    date: "2026-04-03",
    dateLabel: "April 3, 2026",
    readTime: "6 min",
    accent: "bg-peach-100",
    author: { name: "Leilani Okafor", role: "Community", ini: "L", tone: "bg-ink" },
    tags: ["launches", "patience", "creator economy"],
  },
  {
    slug: "voice-models-ghostwriter-problem",
    title: "Voice models and the ghostwriter problem",
    lead:
      "Why training on your twelve best posts beats training on your last twelve hundred — and what that means for your hooks.",
    date: "2026-03-27",
    dateLabel: "March 27, 2026",
    readTime: "9 min",
    accent: "bg-primary-soft",
    author: { name: "Aarohi Mehta", role: "Co-founder · Product", ini: "A", tone: "bg-ink" },
    tags: ["voice model", "AI", "writing"],
  },
];

export function getFieldNote(slug: string): FieldNote | undefined {
  return FIELD_NOTES.find((n) => n.slug === slug);
}

export function relatedFieldNotes(slug: string, count = 3) {
  return FIELD_NOTES.filter((n) => n.slug !== slug)
    .slice(0, count)
    .map((n) => ({
      title: n.title,
      href: `${routes.resources.fieldNotes}/${n.slug}`,
      read: n.readTime,
    }));
}
