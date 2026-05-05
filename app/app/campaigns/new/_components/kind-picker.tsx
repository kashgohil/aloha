"use client";

import { useState } from "react";

// Kept in sync with CAMPAIGN_KINDS / CADENCE_KINDS in lib/ai/campaign.ts.
// Inlined here because that module imports `@/db`, which drags `postgres`
// into the client bundle.
const CAMPAIGN_KINDS = [
  "launch",
  "webinar",
  "sale",
  "drip",
  "evergreen",
  "reach",
  "custom",
] as const;
type CampaignKind = (typeof CAMPAIGN_KINDS)[number];
const CADENCE_KINDS: readonly CampaignKind[] = ["drip", "evergreen", "reach"];

const KIND_DETAIL: Record<
  CampaignKind,
  { label: string; blurb: string }
> = {
  launch: {
    label: "Launch",
    blurb: "Teaser → announce → social proof → urgency → recap.",
  },
  webinar: {
    label: "Webinar",
    blurb: "Teaser → announce → reminders → recap + follow-up.",
  },
  sale: {
    label: "Sale",
    blurb: "Teaser → announce → social proof → urgency → last call → recap.",
  },
  drip: {
    label: "Drip",
    blurb: "Ongoing cadence — N posts/week per channel, no urgency.",
  },
  evergreen: {
    label: "Evergreen",
    blurb: "Steady rhythm of announce + social proof + teaser. No urgency.",
  },
  reach: {
    label: "Reach",
    blurb:
      "Discovery push — hook-led posts in high-reach formats (threads, reels, carousels).",
  },
  custom: {
    label: "Custom",
    blurb: "Let Muse mix phases based on the goal.",
  },
};

const isCadence = (k: CampaignKind): boolean => CADENCE_KINDS.includes(k);

export function CampaignKindPicker() {
  const [kind, setKind] = useState<CampaignKind>(CAMPAIGN_KINDS[0]);
  const cadence = isCadence(kind);

  return (
    <>
      <label className="block space-y-1.5">
        <span className="block text-[11.5px] uppercase tracking-[0.18em] text-ink/55 font-medium">
          Campaign kind
        </span>
        <span className="block text-[12px] text-ink/55">
          Picks the arc Muse builds toward.
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CAMPAIGN_KINDS.map((k) => {
            const detail = KIND_DETAIL[k];
            return (
              <label
                key={k}
                className="block border border-border rounded-2xl p-3.5 cursor-pointer bg-background hover:border-ink transition-colors has-[:checked]:bg-peach-100/60 has-[:checked]:border-ink"
              >
                <input
                  type="radio"
                  name="kind"
                  value={k}
                  checked={kind === k}
                  onChange={() => setKind(k)}
                  required
                  className="sr-only"
                />
                <p className="text-[13.5px] text-ink font-medium">
                  {detail.label}
                </p>
                <p className="mt-0.5 text-[12px] text-ink/60 leading-[1.5]">
                  {detail.blurb}
                </p>
              </label>
            );
          })}
        </div>
      </label>

      {cadence ? (
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 rounded-2xl border border-dashed border-peach-300/70 bg-peach-100/30 p-4">
          <label className="block space-y-1.5">
            <span className="block text-[11.5px] uppercase tracking-[0.18em] text-ink/55 font-medium">
              Themes
            </span>
            <span className="block text-[12px] text-ink/55">
              Comma-separated. Muse biases beats toward these.
            </span>
            <input
              name="themes"
              placeholder="e.g. first-principles thinking, founder essays, pricing"
              className="w-full h-11 px-4 rounded-full border border-border bg-background text-[14px] text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="block text-[11.5px] uppercase tracking-[0.18em] text-ink/55 font-medium">
              Posts / week per channel
            </span>
            <span className="block text-[12px] text-ink/55">
              1–14. Applies to each selected channel independently.
            </span>
            <input
              name="postsPerWeek"
              type="number"
              min={1}
              max={14}
              defaultValue={5}
              className="w-28 h-11 px-4 rounded-full border border-border bg-background text-[14px] text-ink focus:outline-none focus:border-ink"
            />
          </label>
        </div>
      ) : null}
    </>
  );
}
