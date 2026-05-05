import Link from "next/link";
import { type CampaignBeat } from "@/lib/ai/campaign";
import { CHANNEL_ICONS } from "@/components/channel-chip";
import { cn } from "@/lib/utils";
import { DragChip, DropDate } from "./canvas-drag";

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

// Renders a month grid covering the campaign range. Each day shows a stack
// of beat chips (color = phase, icon = channel). Empty days within the
// range render as quiet placeholders so the eye picks up cadence gaps.
export function CalendarCanvas({
  beats,
  rangeStart,
  rangeEnd,
  selectedBeatId,
}: {
  beats: CampaignBeat[];
  rangeStart: Date;
  rangeEnd: Date;
  selectedBeatId: string | null;
}) {
  const months = monthsBetween(rangeStart, rangeEnd);
  const byDate = new Map<string, CampaignBeat[]>();
  for (const b of beats) {
    const list = byDate.get(b.date) ?? [];
    list.push(b);
    byDate.set(b.date, list);
  }

  const startISO = isoOf(startOfDay(rangeStart));
  const endISO = isoOf(startOfDay(rangeEnd));
  const todayISO = isoOf(startOfDay(new Date()));

  return (
    <div className="space-y-6">
      {months.map(({ year, month, days }) => (
        <section key={`${year}-${month}`} className="space-y-2">
          <header className="text-[11.5px] uppercase tracking-[0.18em] text-ink/55">
            {monthLabel(year, month)}
          </header>
          <div className="grid grid-cols-7 gap-px rounded-2xl overflow-hidden border border-border bg-border">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="bg-background-elev px-2 py-1.5 text-[10.5px] uppercase tracking-[0.16em] text-ink/40 text-center"
              >
                {d}
              </div>
            ))}
            {days.map((day) => {
              if (!day) {
                return (
                  <div
                    key={Math.random()}
                    className="bg-background min-h-[88px]"
                  />
                );
              }
              const inRange = day.iso >= startISO && day.iso <= endISO;
              const dayBeats = byDate.get(day.iso) ?? [];
              const isToday = day.iso === todayISO;
              const cell = (
                <div
                  className={cn(
                    "min-h-[88px] p-1.5 flex flex-col gap-1",
                    inRange ? "bg-background-elev" : "bg-background",
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-between text-[11px] tabular-nums",
                      inRange ? "text-ink/65" : "text-ink/30",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-grid place-items-center w-5 h-5 rounded-full",
                        isToday ? "bg-ink text-background" : "",
                      )}
                    >
                      {day.dayOfMonth}
                    </span>
                    {dayBeats.length > 1 ? (
                      <span className="text-[10px] text-ink/40">
                        ×{dayBeats.length}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-1">
                    {dayBeats.slice(0, 3).map((b) => (
                      <DragChip key={b.id} beatId={b.id} disabled={Boolean(b.accepted)}>
                        <BeatChip
                          beat={b}
                          selected={selectedBeatId === b.id}
                        />
                      </DragChip>
                    ))}
                    {dayBeats.length > 3 ? (
                      <Link
                        href={`?beat=${dayBeats[3].id}&view=calendar`}
                        scroll={false}
                        prefetch={false}
                        className="text-[10.5px] text-ink/55 hover:text-ink px-1.5"
                      >
                        +{dayBeats.length - 3} more
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
              return inRange ? (
                <DropDate key={day.iso} date={day.iso}>
                  {cell}
                </DropDate>
              ) : (
                <div key={day.iso}>{cell}</div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function BeatChip({
  beat,
  selected,
}: {
  beat: CampaignBeat;
  selected: boolean;
}) {
  const Icon = CHANNEL_ICONS[beat.channel];
  const accepted = Boolean(beat.accepted);
  return (
    <Link
      href={`?beat=${beat.id}&view=calendar`}
      scroll={false}
      prefetch={false}
      title={`${beat.channel} · ${beat.format} — ${beat.title}`}
      className={cn(
        "flex items-center gap-1 px-1.5 h-5 rounded-md text-[10.5px] font-medium leading-none transition-colors",
        accepted
          ? "bg-primary-soft text-primary-deep border border-primary/40"
          : "bg-background border border-border text-ink/75 hover:border-ink",
        // Ring rather than swap-bg keeps the accepted/pending state legible
        // while still calling out which chip is currently in the inspector.
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
      {Icon ? <Icon className="w-2.5 h-2.5 shrink-0" /> : null}
      <span className="truncate">{beat.title}</span>
    </Link>
  );
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type MonthCell =
  | null
  | {
      iso: string;
      dayOfMonth: number;
    };

function monthsBetween(
  start: Date,
  end: Date,
): Array<{ year: number; month: number; days: MonthCell[] }> {
  const out: Array<{ year: number; month: number; days: MonthCell[] }> = [];
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= last) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    out.push({ year, month, days: monthCells(year, month) });
    cursor = new Date(year, month + 1, 1);
  }
  return out;
}

function monthCells(year: number, month: number): MonthCell[] {
  const first = new Date(year, month, 1);
  const leadingBlanks = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: MonthCell[] = [];
  for (let i = 0; i < leadingBlanks; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push({
      iso: isoOf(new Date(year, month, d)),
      dayOfMonth: d,
    });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function monthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month, 1));
}

// Reference for a future caller — keep until task #11 (drag-to-reschedule).
export const _MS_PER_DAY = MS_PER_DAY;
