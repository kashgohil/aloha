import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Check,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  acceptCampaignBeatsAction,
  regenerateCampaignBeatAction,
} from "@/app/actions/campaigns";
import { loadCampaign, type CampaignBeat } from "@/lib/ai/campaign";
import { getCurrentUser } from "@/lib/current-user";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

const KIND_LABELS: Record<string, string> = {
  launch: "Launch",
  webinar: "Webinar",
  sale: "Sale",
  drip: "Drip",
  evergreen: "Evergreen",
  custom: "Custom",
};

const CHANNEL_LABELS: Record<string, string> = {
  twitter: "X",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  threads: "Threads",
  bluesky: "Bluesky",
  medium: "Medium",
  reddit: "Reddit",
  pinterest: "Pinterest",
  mastodon: "Mastodon",
};

const PHASE_LABELS: Record<string, string> = {
  teaser: "Teaser",
  announce: "Announce",
  social_proof: "Social proof",
  urgency: "Urgency",
  last_call: "Last call",
  recap: "Recap",
  reminder: "Reminder",
  follow_up: "Follow-up",
};

const PHASE_STYLES: Record<string, string> = {
  teaser: "bg-peach-100 text-ink border-peach-300",
  announce: "bg-ink text-background border-ink",
  social_proof: "bg-primary-soft text-primary-deep border-primary/40",
  urgency: "bg-primary-soft text-primary-deep border-primary/40",
  last_call: "bg-primary-soft text-primary-deep border-primary/40",
  recap: "bg-background text-ink/70 border-border-strong",
  reminder: "bg-peach-100 text-ink border-peach-300",
  follow_up: "bg-background text-ink/70 border-border-strong",
};

export default async function CampaignDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const user = (await getCurrentUser())!;
  const { id } = await params;
  const q = await searchParams;
  const acceptedFlash = first(q.accepted) === "1";

  const campaign = await loadCampaign(user.id, id);
  if (!campaign) notFound();

  // Group by date + order phases within each day in arc order.
  const phaseOrder: Record<string, number> = {
    teaser: 0,
    announce: 1,
    reminder: 2,
    social_proof: 3,
    urgency: 4,
    last_call: 5,
    recap: 6,
    follow_up: 7,
  };
  const byDate = new Map<string, CampaignBeat[]>();
  for (const beat of campaign.beats) {
    const list = byDate.get(beat.date) ?? [];
    list.push(beat);
    byDate.set(beat.date, list);
  }
  for (const list of byDate.values()) {
    list.sort(
      (a, b) =>
        (phaseOrder[a.phase] ?? 99) - (phaseOrder[b.phase] ?? 99),
    );
  }
  const dates = Array.from(byDate.keys()).sort();

  const accepted = campaign.beats.filter((b) => b.accepted).length;
  const pending = campaign.beats.length - accepted;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/app/campaigns"
          className="inline-flex items-center gap-1 text-[12.5px] text-ink/55 hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to campaigns
        </Link>
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center h-6 px-2.5 rounded-full border border-border text-[11px] uppercase tracking-[0.18em] text-ink/60">
            {KIND_LABELS[campaign.kind] ?? campaign.kind}
          </span>
          <span className="text-[11px] text-ink/55">
            {campaign.channels
              .map((c) => CHANNEL_LABELS[c] ?? c)
              .join(" · ")}
          </span>
        </div>
        <h1 className="mt-3 font-display text-[40px] leading-[1.05] tracking-[-0.02em] text-ink">
          {campaign.name}
        </h1>
        <p className="mt-2 text-[14px] text-ink/70 leading-[1.5]">
          {campaign.goal}
        </p>
        <p className="mt-3 text-[13.5px] text-ink/60">
          {campaign.beats.length} beat{campaign.beats.length === 1 ? "" : "s"} over{" "}
          {new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
          }).format(campaign.rangeStart)}{" "}
          →{" "}
          {new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
          }).format(campaign.rangeEnd)}
          {" · "}
          {accepted > 0 ? `${accepted} drafted · ` : ""}
          {pending} pending
        </p>
      </div>

      {acceptedFlash && accepted > 0 ? (
        <div className="rounded-2xl border border-primary/40 bg-primary-soft/50 px-4 py-3 flex items-center gap-2 text-[13px] text-ink">
          <Check className="w-4 h-4 text-primary" />
          Drafts created. Tune them in the composer, or see the run on the
          <Link href="/app/calendar" className="underline ml-1">
            calendar
          </Link>
          .
        </div>
      ) : null}

      <form
        id="campaign-accept-form"
        action={acceptCampaignBeatsAction}
        className="contents"
      >
        <input type="hidden" name="campaignId" value={campaign.id} />
      </form>

      <div className="space-y-6">
        {dates.map((date) => (
          <section key={date} className="space-y-2">
            <header className="flex items-center gap-2 text-[11.5px] uppercase tracking-[0.18em] text-ink/55">
              <CalendarIcon className="w-3 h-3" />
              {new Intl.DateTimeFormat("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              }).format(new Date(`${date}T12:00:00Z`))}
            </header>
            <ul className="space-y-2">
              {(byDate.get(date) ?? []).map((beat) => (
                <BeatRow
                  key={beat.id}
                  beat={beat}
                  campaignId={campaign.id}
                />
              ))}
            </ul>
          </section>
        ))}

        <div className="flex items-center justify-between gap-4 pt-4 border-t border-border">
          <p className="text-[12.5px] text-ink/55">
            Tick the beats you want. Each becomes a draft post scheduled
            for noon on its day — tune in composer.
          </p>
          <button
            type="submit"
            form="campaign-accept-form"
            className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Create drafts
          </button>
        </div>
      </div>
    </div>
  );
}

function BeatRow({
  beat,
  campaignId,
}: {
  beat: CampaignBeat;
  campaignId: string;
}) {
  const accepted = Boolean(beat.accepted);
  return (
    <li
      className={cn(
        "rounded-2xl border p-4 flex items-start gap-3",
        accepted
          ? "border-primary/40 bg-primary-soft/30"
          : "border-border-strong bg-background-elev",
      )}
    >
      <input
        type="checkbox"
        name="beatIds"
        value={beat.id}
        form="campaign-accept-form"
        disabled={accepted}
        defaultChecked={!accepted}
        className="mt-1 accent-ink"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap text-[11px] uppercase tracking-[0.16em] text-ink/55">
          <span
            className={cn(
              "inline-flex items-center h-5 px-2 rounded-full border text-[10.5px] font-medium tracking-wide",
              PHASE_STYLES[beat.phase] ?? PHASE_STYLES.announce,
            )}
          >
            {PHASE_LABELS[beat.phase] ?? beat.phase}
          </span>
          <span>{CHANNEL_LABELS[beat.channel] ?? beat.channel}</span>
          <span aria-hidden>·</span>
          <span>{beat.format}</span>
          {accepted ? (
            <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full bg-ink text-background tracking-wide">
              <Check className="w-3 h-3" />
              Drafted
            </span>
          ) : (
            <form
              action={regenerateCampaignBeatAction}
              className="ml-auto"
            >
              <input type="hidden" name="campaignId" value={campaignId} />
              <input type="hidden" name="beatId" value={beat.id} />
              <button
                type="submit"
                title="Regenerate this beat"
                className="inline-flex items-center gap-1.5 h-6 px-2 rounded-full border border-border-strong text-[10.5px] font-medium text-ink/65 hover:text-ink hover:border-ink transition-colors tracking-wide"
              >
                <RefreshCw className="w-3 h-3" />
                Regenerate
              </button>
            </form>
          )}
        </div>
        <p className="mt-1.5 text-[14.5px] text-ink font-medium leading-[1.3]">
          {beat.title}
        </p>
        {beat.angle ? (
          <p className="mt-1 text-[13px] text-ink/70 leading-[1.55]">
            {beat.angle}
          </p>
        ) : null}
        {accepted && beat.acceptedPostId ? (
          <Link
            href={`/app/composer?post=${beat.acceptedPostId}`}
            className="mt-2 inline-flex items-center gap-1 text-[12px] text-ink/60 hover:text-ink transition-colors"
          >
            Open draft
          </Link>
        ) : null}
      </div>
    </li>
  );
}
