import Link from "next/link";
import { type CampaignBeat } from "@/lib/ai/campaign";
import { CHANNEL_ICONS, channelLabel } from "@/components/channel-chip";
import { cn } from "@/lib/utils";

const PHASE_DOT: Record<string, string> = {
  teaser: "bg-peach-300",
  announce: "bg-ink",
  social_proof: "bg-primary",
  urgency: "bg-primary",
  last_call: "bg-primary",
  recap: "bg-border-strong",
  reminder: "bg-peach-300",
  follow_up: "bg-border-strong",
};

const MS_PER_DAY = 86_400_000;

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const isoOf = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

const CHANNEL_COL_WIDTH = 132;
const LANE_HEIGHT = 56;

// Horizontal date axis on x, one swimlane per channel on y. Surfaces
// per-channel cadence and clusters at a glance. Beats sit absolutely
// positioned within their channel lane so multi-beat days stack without
// overflowing the grid cell.
export function TimelineCanvas({
  beats,
  channels,
  rangeStart,
  rangeEnd,
  selectedBeatId,
}: {
  beats: CampaignBeat[];
  channels: string[];
  rangeStart: Date;
  rangeEnd: Date;
  selectedBeatId: string | null;
}) {
  const start = startOfDay(rangeStart);
  const end = startOfDay(rangeEnd);
  const totalDays =
    Math.max(1, Math.round((end.getTime() - start.getTime()) / MS_PER_DAY)) +
    1;
  const cellWidth = totalDays <= 21 ? 56 : totalDays <= 60 ? 36 : 22;
  const todayISO = isoOf(startOfDay(new Date()));

  const dayLabels = Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(start.getTime() + i * MS_PER_DAY);
    return {
      iso: isoOf(d),
      monthLabel: new Intl.DateTimeFormat("en-US", { month: "short" }).format(
        d,
      ),
      dayOfMonth: d.getDate(),
      isMonthStart: d.getDate() === 1 || i === 0,
      isWeekStart: d.getDay() === 1,
      isToday: isoOf(d) === todayISO,
    };
  });

  const beatsByChannel = new Map<string, CampaignBeat[]>();
  for (const b of beats) {
    const list = beatsByChannel.get(b.channel) ?? [];
    list.push(b);
    beatsByChannel.set(b.channel, list);
  }

  const totalWidth = CHANNEL_COL_WIDTH + totalDays * cellWidth;

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-background-elev">
      <div style={{ width: `${totalWidth}px` }}>
        {/* Date axis */}
        <div
          className="grid border-b border-border bg-background-elev"
          style={{
            gridTemplateColumns: `${CHANNEL_COL_WIDTH}px repeat(${totalDays}, ${cellWidth}px)`,
          }}
        >
          <div className="px-3 py-2 text-[10.5px] uppercase tracking-[0.18em] text-ink/40 border-r border-border">
            Channel
          </div>
          {dayLabels.map((d) => (
            <div
              key={d.iso}
              className={cn(
                "border-r border-border/60 py-1 text-center",
                d.isMonthStart ? "border-l border-border" : "",
              )}
            >
              <div
                className={cn(
                  "text-[9.5px] uppercase tracking-[0.16em] h-3",
                  d.isMonthStart ? "text-ink/55" : "text-transparent",
                )}
              >
                {d.monthLabel}
              </div>
              <div
                className={cn(
                  "text-[10.5px] tabular-nums mt-0.5",
                  d.isToday
                    ? "text-background bg-ink rounded-full mx-auto w-5 h-5 grid place-items-center"
                    : d.isWeekStart
                      ? "text-ink/65"
                      : "text-ink/35",
                )}
              >
                {d.dayOfMonth}
              </div>
            </div>
          ))}
        </div>

        {/* Lanes */}
        {channels.map((ch) => {
          const laneBeats = beatsByChannel.get(ch) ?? [];
          return (
            <div
              key={ch}
              className="relative border-b border-border last:border-b-0"
              style={{ height: `${LANE_HEIGHT}px` }}
            >
              {/* Background grid: channel column + day cells */}
              <div
                className="grid h-full"
                style={{
                  gridTemplateColumns: `${CHANNEL_COL_WIDTH}px repeat(${totalDays}, ${cellWidth}px)`,
                }}
              >
                <div className="px-3 flex items-center gap-1.5 border-r border-border bg-background">
                  <ChannelLabel channel={ch} />
                </div>
                {dayLabels.map((d) => (
                  <div
                    key={d.iso}
                    className={cn(
                      "border-r border-border/40",
                      d.isToday ? "bg-primary-soft/30" : "",
                    )}
                  />
                ))}
              </div>
              {/* Absolute-positioned chips overlaid on the lane */}
              {laneBeats.map((b) => {
                const idx = dayLabels.findIndex((dl) => dl.iso === b.date);
                if (idx < 0) return null;
                const left = CHANNEL_COL_WIDTH + idx * cellWidth + 2;
                const top = staggerTop(b.id);
                return (
                  <BeatChip
                    key={b.id}
                    beat={b}
                    selected={selectedBeatId === b.id}
                    style={{
                      left: `${left}px`,
                      top: `${top}px`,
                      width: `${cellWidth - 4}px`,
                    }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChannelLabel({ channel }: { channel: string }) {
  const Icon = CHANNEL_ICONS[channel];
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-ink/75 truncate">
      {Icon ? <Icon className="w-3.5 h-3.5" /> : null}
      {channelLabel(channel)}
    </span>
  );
}

function BeatChip({
  beat,
  selected,
  style,
}: {
  beat: CampaignBeat;
  selected: boolean;
  style: React.CSSProperties;
}) {
  const accepted = Boolean(beat.accepted);
  return (
    <Link
      href={`?beat=${beat.id}&view=timeline`}
      scroll={false}
      prefetch={false}
      title={`${beat.format} — ${beat.title}`}
      style={{ position: "absolute", height: "24px", ...style }}
      className={cn(
        "rounded-md px-1.5 flex items-center gap-1 text-[10.5px] font-medium leading-none transition-colors overflow-hidden",
        accepted
          ? "bg-primary-soft text-primary-deep border border-primary/40"
          : "bg-background border border-border text-ink/75 hover:border-ink",
        selected
          ? "ring-2 ring-ink ring-offset-1 ring-offset-background"
          : null,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "inline-block w-1.5 h-1.5 rounded-full shrink-0",
          PHASE_DOT[beat.phase] ?? PHASE_DOT.announce,
        )}
      />
      <span className="truncate">{beat.title}</span>
    </Link>
  );
}

// Multi-beat days stack vertically inside the lane via a deterministic
// vertical stagger derived from the beat id. Three slots fit comfortably in
// a 56px lane with 24px chips; collisions beyond that overlap (rare in
// practice and visible in the inspector overview).
function staggerTop(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) | 0;
  const slot = Math.abs(h) % 3;
  // base centers a single chip; slot 0/1/2 yields top values 6/16/26.
  return 6 + slot * 10;
}
