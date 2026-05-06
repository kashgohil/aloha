import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Check,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { ChannelChip } from "@/components/channel-chip";
import { CalendarCanvas } from "./_components/calendar-canvas";
import { DragSurface } from "./_components/canvas-drag";
import {
  applyFilters,
  CanvasFilterBar,
  parseFilters,
} from "./_components/canvas-filters";
import { TimelineCanvas } from "./_components/timeline-canvas";
import { CampaignActionBand } from "./_components/action-band";
import { CampaignControls } from "./_components/campaign-controls";
import {
  BeatInspector,
  CampaignOverview,
} from "./_components/inspector";
import {
  isCanvasView,
  ViewToggle,
  type CanvasView,
} from "./_components/view-toggle";
import { acceptCampaignBeatsAction } from "@/app/actions/campaigns";
import { loadCampaign, type CampaignBeat } from "@/lib/ai/campaign";
import { formatLabelFor } from "@/lib/campaigns/channel-formats";
import { getCurrentContext } from "@/lib/current-context";
import { hasRole, ROLES } from "@/lib/workspaces/roles";
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
  reach: "Reach",
  custom: "Custom",
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

const STATUS_CHIPS: Record<string, { label: string; className: string }> = {
  scheduled: {
    label: "Scheduled",
    className: "border-peach-300 bg-peach-100 text-ink",
  },
  running: {
    label: "Running",
    className: "border-primary/40 bg-primary-soft text-primary-deep",
  },
  paused: {
    label: "Paused",
    className:
      "border-dashed border-primary/50 bg-background text-primary-deep",
  },
  complete: {
    label: "Complete",
    className: "border-ink bg-ink text-background",
  },
  archived: {
    label: "Archived",
    className: "border-dashed border-border-strong bg-background text-ink/45",
  },
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
  const [ctx, { id }, q] = await Promise.all([
    getCurrentContext(),
    params,
    searchParams,
  ]);
  const ctxOrThrow = ctx!;
  if (!hasRole(ctxOrThrow.role, ROLES.ADMIN)) {
    redirect("/app/dashboard");
  }
  const canManage = hasRole(ctxOrThrow.role, ROLES.ADMIN);
  const selectedBeatId = first(q.beat) ?? null;
  const viewParam = first(q.view) ?? "list";
  const view: CanvasView = isCanvasView(viewParam) ? viewParam : "list";
  const filters = parseFilters(q);

  const campaign = await loadCampaign(ctxOrThrow.user.id, id);
  if (!campaign) notFound();

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
  const visibleBeats = applyFilters(campaign.beats, filters);
  const phasesPresent = Array.from(
    new Set(campaign.beats.map((b) => b.phase)),
  );
  const byDate = new Map<string, CampaignBeat[]>();
  for (const beat of visibleBeats) {
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
  const total = campaign.beats.length;
  const pct = total === 0 ? 0 : Math.round((accepted / total) * 100);

  const selectedBeat = selectedBeatId
    ? campaign.beats.find((b) => b.id === selectedBeatId) ?? null
    : null;

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
        <div className="mt-4 flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center h-6 px-2.5 rounded-full border border-border text-[11px] uppercase tracking-[0.18em] text-ink/60">
              {KIND_LABELS[campaign.kind] ?? campaign.kind}
            </span>
            {STATUS_CHIPS[campaign.status] ? (
              <span
                className={cn(
                  "inline-flex items-center h-6 px-2.5 rounded-full border text-[11px] uppercase tracking-[0.18em]",
                  STATUS_CHIPS[campaign.status].className,
                )}
              >
                {STATUS_CHIPS[campaign.status].label}
              </span>
            ) : null}
            <div className="flex items-center gap-1.5 flex-wrap">
              {campaign.channels.map((c) => (
                <ChannelChip key={c} channel={c} />
              ))}
            </div>
          </div>
          <CampaignControls
            campaignId={campaign.id}
            canManage={canManage}
          />
        </div>
        <h1 className="mt-3 font-display text-[40px] leading-[1.05] tracking-[-0.02em] text-ink">
          {campaign.name}
        </h1>
        <p className="mt-2 text-[14px] text-ink/70 leading-[1.5]">
          {campaign.goal}
        </p>
        <div className="mt-3 flex items-center gap-4 flex-wrap text-[12.5px] text-ink/55">
          <span className="tabular-nums">
            {campaign.beats.length} beat{campaign.beats.length === 1 ? "" : "s"}
          </span>
          <span aria-hidden>·</span>
          <span>
            {new Intl.DateTimeFormat("en-US", {
              month: "short",
              day: "numeric",
            }).format(campaign.rangeStart)}{" "}
            →{" "}
            {new Intl.DateTimeFormat("en-US", {
              month: "short",
              day: "numeric",
            }).format(campaign.rangeEnd)}
          </span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">
            {accepted} drafted · {pending} pending · {pct}%
          </span>
        </div>
      </div>

      {/* Container for the BeatRow checkbox island. The action band reads
          this form's FormData on click; the `action` attribute is a
          fallback in case a native submit ever fires (it shouldn't —
          there's no submit button inside, and checkboxes don't submit on
          Enter). The toast UX flows through the action band. */}
      <form
        id="campaign-accept-form"
        action={acceptCampaignBeatsAction}
        className="contents"
      >
        <input type="hidden" name="campaignId" value={campaign.id} />
      </form>

      <CampaignActionBand
        campaignId={campaign.id}
        status={campaign.status}
        total={total}
        accepted={accepted}
        pending={pending}
        formId="campaign-accept-form"
        canManage={canManage}
      />

      <div className="flex items-center gap-3 flex-wrap">
        <ViewToggle
          current={view}
          beat={selectedBeatId}
          carry={{
            ch:
              filters.channels.size > 0
                ? [...filters.channels].join(",")
                : undefined,
            ph:
              filters.phases.size > 0 ? [...filters.phases].join(",") : undefined,
            fmt:
              filters.formats.size > 0
                ? [...filters.formats].join(",")
                : undefined,
            show: filters.show !== "all" ? filters.show : undefined,
          }}
        />
        <CanvasFilterBar
          channels={campaign.channels}
          phases={phasesPresent}
          view={view}
          beat={selectedBeatId}
          filters={filters}
          visibleCount={visibleBeats.length}
          totalCount={campaign.beats.length}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          {view === "calendar" ? (
            visibleBeats.length === 0 ? (
              <EmptyCanvas message={emptyCanvasMessage(campaign.beats.length)} />
            ) : (
              <DragSurface campaignId={campaign.id}>
                <CalendarCanvas
                  beats={visibleBeats}
                  rangeStart={campaign.rangeStart}
                  rangeEnd={campaign.rangeEnd}
                  selectedBeatId={selectedBeatId}
                />
              </DragSurface>
            )
          ) : view === "timeline" ? (
            visibleBeats.length === 0 ? (
              <EmptyCanvas message={emptyCanvasMessage(campaign.beats.length)} />
            ) : (
              <TimelineCanvas
                beats={visibleBeats}
                channels={
                  filters.channels.size > 0
                    ? campaign.channels.filter((c) => filters.channels.has(c))
                    : campaign.channels
                }
                rangeStart={campaign.rangeStart}
                rangeEnd={campaign.rangeEnd}
                selectedBeatId={selectedBeatId}
              />
            )
          ) : dates.length === 0 ? (
            <EmptyCanvas message={emptyCanvasMessage(campaign.beats.length)} />
          ) : (
            dates.map((date) => (
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
                      isSelected={selectedBeatId === beat.id}
                    />
                  ))}
                </ul>
              </section>
            ))
          )}

        </div>

        <div className="lg:sticky lg:top-6">
          {selectedBeat ? (
            <BeatInspector campaignId={campaign.id} beat={selectedBeat} />
          ) : (
            <CampaignOverview beats={campaign.beats} />
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyCanvas({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-border-strong bg-background-elev px-6 py-12 text-center text-[13px] text-ink/55">
      {message}
    </div>
  );
}

function emptyCanvasMessage(totalBeats: number): string {
  return totalBeats === 0
    ? "No beats yet."
    : "No beats match the current filters.";
}

function BeatRow({
  beat,
  isSelected,
}: {
  beat: CampaignBeat;
  isSelected: boolean;
}) {
  const accepted = Boolean(beat.accepted);
  // Drafted beats become Link-only cards: clicking opens the post in the
  // composer (which redirects to studio if studioMode). Pending beats keep
  // a checkbox so the action band's bulk submit can pick them up.
  return (
    <li
      className={cn(
        "rounded-2xl border transition-colors group",
        accepted
          ? "border-primary/40 bg-primary-soft/30 hover:border-primary"
          : isSelected
            ? "border-ink bg-background-elev"
            : "border-border-strong bg-background-elev hover:border-ink/50",
      )}
    >
      {accepted ? (
        <BeatRowAccepted beat={beat} />
      ) : (
        <BeatRowPending beat={beat} />
      )}
    </li>
  );
}

function BeatRowPending({ beat }: { beat: CampaignBeat }) {
  return (
    <div className="flex items-stretch gap-3">
      <label className="flex items-start pl-4 pt-4 cursor-pointer">
        <input
          type="checkbox"
          name="beatIds"
          value={beat.id}
          form="campaign-accept-form"
          defaultChecked
          className="accent-ink"
        />
      </label>
      <Link
        href={`?beat=${beat.id}`}
        scroll={false}
        prefetch={false}
        className="flex-1 min-w-0 p-4 pl-2"
      >
        <BeatRowMeta beat={beat} />
        <BeatRowBody beat={beat} />
      </Link>
    </div>
  );
}

function BeatRowAccepted({ beat }: { beat: CampaignBeat }) {
  // Whole card opens the composer; a small inspector affordance opens the
  // side panel without leaving the page. acceptedPostId is set when the
  // beat was accepted; defensive fallback to the inspector if missing.
  const composerHref = beat.acceptedPostId
    ? `?compose=${beat.acceptedPostId}`
    : `?beat=${beat.id}`;
  return (
    <div className="flex items-stretch">
      <Link
        href={composerHref}
        prefetch={false}
        className="flex-1 min-w-0 p-4"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap text-[11px] uppercase tracking-[0.16em] text-ink/55 min-w-0">
            <span
              className={cn(
                "inline-flex items-center h-5 px-2 rounded-full border text-[10.5px] font-medium tracking-wide",
                PHASE_STYLES[beat.phase] ?? PHASE_STYLES.announce,
              )}
            >
              {PHASE_LABELS[beat.phase] ?? beat.phase}
            </span>
            <ChannelChip channel={beat.channel} />
            <span aria-hidden>·</span>
            <span className="text-ink/65">
              {formatLabelFor(beat.channel, beat.format)}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full bg-ink text-background text-[10.5px] tracking-wide shrink-0">
            <Check className="w-3 h-3" />
            Drafted
          </span>
        </div>
        <p className="mt-1.5 text-[14.5px] text-ink font-medium leading-[1.3]">
          {beat.title}
        </p>
        {beat.angle ? (
          <p className="mt-1 text-[13px] text-ink/65 leading-[1.55] line-clamp-2">
            {beat.angle}
          </p>
        ) : null}
        <p className="mt-2 inline-flex items-center gap-1 text-[11.5px] text-ink/55 group-hover:text-ink transition-colors">
          <ExternalLink className="w-3 h-3" />
          Open in composer
        </p>
      </Link>
      {beat.acceptedPostId ? (
        <Link
          href={`?beat=${beat.id}`}
          scroll={false}
          prefetch={false}
          aria-label="Inspect beat"
          className="shrink-0 self-stretch px-3 border-l border-border-strong/60 inline-flex items-center text-[11px] uppercase tracking-[0.16em] text-ink/45 hover:text-ink hover:bg-background-elev/60 transition-colors"
        >
          Inspect
        </Link>
      ) : null}
    </div>
  );
}

function BeatRowMeta({ beat }: { beat: CampaignBeat }) {
  return (
    <div className="flex items-center gap-2 flex-wrap text-[11px] uppercase tracking-[0.16em] text-ink/55">
      <span
        className={cn(
          "inline-flex items-center h-5 px-2 rounded-full border text-[10.5px] font-medium tracking-wide",
          PHASE_STYLES[beat.phase] ?? PHASE_STYLES.announce,
        )}
      >
        {PHASE_LABELS[beat.phase] ?? beat.phase}
      </span>
      <ChannelChip channel={beat.channel} />
      <span aria-hidden>·</span>
      <span className="text-ink/65">
        {formatLabelFor(beat.channel, beat.format)}
      </span>
    </div>
  );
}

function BeatRowBody({ beat }: { beat: CampaignBeat }) {
  return (
    <>
      <p className="mt-1.5 text-[14.5px] text-ink font-medium leading-[1.3]">
        {beat.title}
      </p>
      {beat.angle ? (
        <p className="mt-1 text-[13px] text-ink/65 leading-[1.55] line-clamp-2">
          {beat.angle}
        </p>
      ) : null}
    </>
  );
}
