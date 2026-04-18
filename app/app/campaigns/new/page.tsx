import { and, count, eq, isNotNull, ne, notInArray } from "drizzle-orm";
import {
  ArrowLeft,
  BarChart3,
  Check,
  Lightbulb,
  Rss,
  Sparkles,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import {
  accounts,
  brandVoice,
  feedItems,
  feeds,
  ideas,
  platformInsights,
} from "@/db/schema";
import { createCampaignAction } from "@/app/actions/campaigns";
import { AUTH_ONLY_PROVIDERS } from "@/lib/auth-providers";
import { getCurrentUser } from "@/lib/current-user";
import { CAMPAIGN_KINDS } from "@/lib/ai/campaign";
import { ChannelToggle } from "@/components/channel-chip";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const KIND_DETAIL: Record<
  string,
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
    blurb: "Evergreen cadence over a longer range, rotating phases.",
  },
  evergreen: {
    label: "Evergreen",
    blurb: "Steady announce + social proof + teaser, no urgency.",
  },
  custom: {
    label: "Custom",
    blurb: "Let Muse mix phases based on the goal.",
  },
};

export default async function NewCampaignPage() {
  const user = (await getCurrentUser())!;

  const [connected, ideaCount, feedItemCount, insightCount, voiceRow] =
    await Promise.all([
      db
        .selectDistinct({ provider: accounts.provider })
        .from(accounts)
        .where(
          and(
            eq(accounts.userId, user.id),
            notInArray(accounts.provider, AUTH_ONLY_PROVIDERS),
          ),
        ),
      db
        .select({ value: count() })
        .from(ideas)
        .where(and(eq(ideas.userId, user.id), ne(ideas.status, "archived"))),
      db
        .select({ value: count() })
        .from(feedItems)
        .innerJoin(feeds, eq(feedItems.feedId, feeds.id))
        .where(
          and(eq(feeds.userId, user.id), isNotNull(feedItems.savedAsIdeaId)),
        ),
      db
        .select({ value: count() })
        .from(platformInsights)
        .where(eq(platformInsights.userId, user.id)),
      db
        .select({ id: brandVoice.id })
        .from(brandVoice)
        .where(eq(brandVoice.userId, user.id))
        .limit(1),
    ]);
  const channels = connected.map((c) => c.provider);
  const research = {
    ideas: Number(ideaCount[0]?.value ?? 0),
    feedItems: Number(feedItemCount[0]?.value ?? 0),
    insights: Number(insightCount[0]?.value ?? 0),
    voiceTrained: voiceRow.length > 0,
  };

  const today = new Date();
  const twoWeeks = new Date(today);
  twoWeeks.setDate(twoWeeks.getDate() + 20);
  const defaultStart = today.toISOString().slice(0, 10);
  const defaultEnd = twoWeeks.toISOString().slice(0, 10);

  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <Link
          href="/app/campaigns"
          className="inline-flex items-center gap-1 text-[12.5px] text-ink/55 hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to campaigns
        </Link>
        <h1 className="mt-4 font-display text-[40px] leading-[1.05] tracking-[-0.02em] text-ink">
          Plan a campaign with <span className="text-primary font-light">Muse</span>
        </h1>
        <p className="mt-3 text-[14px] text-ink/65 leading-[1.55]">
          Tell Muse the shape of the run — launch, webinar, sale, drip. It
          produces a sequenced beat sheet: phase, channel, angle, format
          for every post in the arc. You review, accept, tune in composer.
        </p>
      </div>

      {channels.length === 0 ? (
        <div className="max-w-3xl rounded-3xl border border-dashed border-border-strong bg-background-elev px-6 py-10 text-center">
          <p className="text-[14px] text-ink font-medium">
            Connect a channel first.
          </p>
          <p className="mt-1 text-[12.5px] text-ink/60 max-w-md mx-auto leading-[1.55]">
            A campaign needs channels to target.{" "}
            <Link href="/app/settings/channels" className="underline">
              Connect one
            </Link>{" "}
            to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
          <form
            action={createCampaignAction}
            className="rounded-3xl border border-border bg-background-elev p-6 space-y-6 min-w-0"
          >
            <Field label="Name" hint="Short label. Optional — Muse drafts one from the goal if you skip.">
              <input
                name="name"
                placeholder="e.g. Q2 Pricing Refresh"
                className="w-full h-11 px-4 rounded-full border border-border bg-background text-[14px] text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink"
              />
            </Field>

            <Field label="Goal" hint="What's this campaign supposed to achieve?">
              <input
                name="goal"
                required
                placeholder="e.g. announce new tier, drive 200 trials over two weeks"
                className="w-full h-11 px-4 rounded-full border border-border bg-background text-[14px] text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink"
              />
            </Field>

            <Field label="Campaign kind" hint="Picks the phase arc Muse builds toward.">
              <KindPicker />
            </Field>

            <Field label="Channels">
              <ChannelPicker channels={channels} />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Start">
                <DatePicker
                  name="rangeStart"
                  defaultValue={defaultStart}
                  required
                />
              </Field>
              <Field label="End">
                <DatePicker
                  name="rangeEnd"
                  defaultValue={defaultEnd}
                  required
                />
              </Field>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
              >
                <Wand2 className="w-4 h-4" />
                Draft the beat sheet
              </button>
            </div>
          </form>

          <aside className="lg:sticky lg:top-6">
            <ResearchSummary research={research} />
          </aside>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-[11.5px] uppercase tracking-[0.18em] text-ink/55 font-medium">
        {label}
      </span>
      {hint ? <span className="block text-[12px] text-ink/55">{hint}</span> : null}
      {children}
    </label>
  );
}

function KindPicker() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {CAMPAIGN_KINDS.map((k, i) => {
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
              defaultChecked={i === 0}
              required
              className="sr-only"
            />
            <p className="text-[13.5px] text-ink font-medium">{detail.label}</p>
            <p className="mt-0.5 text-[12px] text-ink/60 leading-[1.5]">
              {detail.blurb}
            </p>
          </label>
        );
      })}
    </div>
  );
}

function ChannelPicker({ channels }: { channels: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {channels.map((c) => (
        <ChannelToggle key={c} channel={c} />
      ))}
    </div>
  );
}

function ResearchSummary({
  research,
}: {
  research: {
    ideas: number;
    feedItems: number;
    insights: number;
    voiceTrained: boolean;
  };
}) {
  type Row = {
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
    ready: boolean;
    value: string;
    detail: string;
  };
  const rows: Row[] = [
    {
      label: "Voice",
      Icon: Sparkles,
      ready: research.voiceTrained,
      value: research.voiceTrained ? "Trained" : "Not trained",
      detail: research.voiceTrained
        ? "Muse will mimic your tone per channel."
        : "Train it for sharper, on-brand drafts.",
    },
    {
      label: "Swipe file",
      Icon: Lightbulb,
      ready: research.ideas > 0,
      value: research.ideas > 0 ? `${research.ideas} ideas` : "Empty",
      detail:
        research.ideas > 0
          ? "Angles, hooks, and seeds to pull from."
          : "Capture a few first for richer beats.",
    },
    {
      label: "Past posts",
      Icon: BarChart3,
      ready: research.insights > 0,
      value:
        research.insights > 0 ? `${research.insights} insights` : "None yet",
      detail:
        research.insights > 0
          ? "High-performers shape angle suggestions."
          : "Read-back populates this nightly.",
    },
    {
      label: "Saved from feeds",
      Icon: Rss,
      ready: research.feedItems > 0,
      value:
        research.feedItems > 0 ? `${research.feedItems} saved` : "None yet",
      detail:
        research.feedItems > 0
          ? "Only feed items you've saved feed into Muse."
          : "Save interesting reads from your feeds — unsaved items are ignored.",
    },
  ];
  const readyCount = rows.filter((r) => r.ready).length;

  return (
    <section className="space-y-4 rounded-3xl border border-dashed border-peach-300/70 bg-peach-100/40 p-5">
      <header>
        <div className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-primary-deep">
          <Sparkles className="w-3 h-3" />
          Muse will reference
        </div>
        <p className="mt-2 text-[13px] text-ink/70 leading-[1.55]">
          <span className="text-ink font-medium">{readyCount}</span> of{" "}
          {rows.length} signals ready. Missing ones just mean leaner drafts.
        </p>
      </header>
      <ul className="space-y-2.5">
        {rows.map((r) => (
          <li
            key={r.label}
            className="flex items-start gap-3 pl-3 py-1 border-l-2 border-peach-300/60"
          >
            <span
              className={cn(
                "mt-0.5 inline-grid place-items-center w-6 h-6 rounded-full shrink-0",
                r.ready
                  ? "bg-primary-soft text-primary-deep"
                  : "bg-muted/60 text-ink/40",
              )}
            >
              {r.ready ? (
                <Check className="w-3 h-3" />
              ) : (
                <r.Icon className="w-3 h-3" />
              )}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[12.5px] text-ink font-medium">
                  {r.label}
                </span>
                <span
                  className={cn(
                    "text-[11.5px] tabular-nums",
                    r.ready ? "text-ink/70" : "text-ink/40",
                  )}
                >
                  {r.value}
                </span>
              </div>
              <p className="mt-0.5 text-[12px] text-ink/55 leading-[1.5]">
                {r.detail}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
