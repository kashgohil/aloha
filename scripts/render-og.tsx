// One-off render of the OG cards to /tmp/aloha-og/*.png so the team can
// preview them without running the full server. Uses the same ogCard()
// helper as the per-route opengraph-image handlers.
//
// Run with: `bun scripts/render-og.tsx`

import type { ReactElement } from "react";
import { writeFileSync, mkdirSync } from "node:fs";
import { ImageResponse } from "next/og";
import { CHANNELS } from "../lib/channels";
import { COMPETITORS } from "../lib/competitors";
import { PERSONAS } from "../lib/personas";
import { CASE_STUDIES } from "../lib/case-studies";
import { DEFAULT_DESCRIPTION, SITE_TAGLINE } from "../lib/seo";
import { OG_SIZE, loadOgFonts, ogCard } from "../lib/og";

const OUT = "/tmp/aloha-og";
mkdirSync(OUT, { recursive: true });

const fonts = [...loadOgFonts()];

async function save(name: string, node: ReactElement) {
  const res = new ImageResponse(node, { ...OG_SIZE, fonts });
  const buf = Buffer.from(await res.arrayBuffer());
  const path = `${OUT}/${name}`;
  writeFileSync(path, buf);
  console.log(`✓ ${path} (${(buf.length / 1024).toFixed(1)}KB)`);
}

await save(
  "01-default.png",
  ogCard({
    eyebrow: SITE_TAGLINE,
    title: "The calm social media OS.",
    subtitle: DEFAULT_DESCRIPTION,
  }),
);

const ig = CHANNELS.instagram;
await save(
  "02-channel-instagram.png",
  ogCard({
    eyebrow: `For ${ig.name}`,
    title: `${ig.headline.line1} ${ig.headline.line2}`.trim(),
    subtitle: ig.lead,
  }),
);

const li = CHANNELS.linkedin;
await save(
  "03-channel-linkedin.png",
  ogCard({
    eyebrow: `For ${li.name}`,
    title: `${li.headline.line1} ${li.headline.line2}`.trim(),
    subtitle: li.lead,
  }),
);

const buf = COMPETITORS.buffer;
await save(
  "04-compare-buffer.png",
  ogCard({
    eyebrow: "Compared",
    title: `Aloha vs ${buf.name}.`,
    subtitle: buf.positioning,
    accent: "primary",
    footer: `Verified ${buf.verifiedLabel}`,
  }),
);

const creators = PERSONAS.creators;
await save(
  "05-for-creators.png",
  ogCard({
    eyebrow: creators.eyebrow,
    title: `${creators.headline.line1} ${creators.headline.line2}`.trim(),
    subtitle: creators.tagline,
  }),
);

const braid = CASE_STUDIES["braid-studio"];
await save(
  "06-customer-braid-studio.png",
  ogCard({
    eyebrow: `${braid.customer.business} · ${braid.readTime} read`,
    title: braid.pull.replace(/["']/g, "\u201C"),
    subtitle: braid.summary,
    accent: "primary",
    footer: braid.publishedLabel,
  }),
);

console.log("Done.");
