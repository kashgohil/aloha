// Stateless calendar rendering. All data resolved upstream — page.tsx does
// the DB fetch + date math; this file just paints the grid. Reused by the
// screenshot route with hardcoded fixtures.

import { ChannelIcons } from "@/components/channel-chip";
import { previewContent } from "@/lib/post-preview";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  Sparkles,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { GridScroll } from "../grid-scroll";
import { ViewSelect } from "../view-select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type CalendarViewMode = "month" | "week" | "day";

export type CalendarPostRow = {
  id: string;
  content: string;
  channelContent?: Record<string, { content?: string } | null> | null;
  platforms: string[];
  status: string;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  campaignId: string | null;
};

export type CalendarCampaignIndex = Map<
  string,
  { name: string; colorIdx: number }
>;

export type CalendarViewProps = {
  view: CalendarViewMode;
  tz: string;
  workspaceName: string | null;
  header: { main: string; accent: string };
  subLabel: string;
  anchor: Date;
  anchorKey: string;
  prevAnchor: Date;
  nextAnchor: Date;
  buckets: Map<string, CalendarPostRow[]>;
  todayKey: string;
  campaignIndex: CalendarCampaignIndex;
  museAccess?: boolean;
};

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOUR_HEIGHT = 96;

export function CalendarView({
  view,
  tz,
  workspaceName,
  header,
  subLabel,
  anchor,
  anchorKey,
  prevAnchor,
  nextAnchor,
  buckets,
  todayKey,
  campaignIndex,
  museAccess = false,
}: CalendarViewProps) {
  return (
    <div className="space-y-10">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            Calendar · {tz}
          </p>
          <h1 className="mt-3 font-display text-[44px] lg:text-[52px] leading-[1.02] tracking-[-0.03em] text-ink font-normal">
            {header.main}{" "}
            <span className="text-primary">
              {header.accent}
              <span className="font-light">.</span>
            </span>
          </h1>
          <p className="mt-3 text-[14px] text-ink/65">{subLabel}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center rounded-full border border-border-strong bg-background-elev overflow-hidden">
            <NavArrow view={view} anchor={prevAnchor} aria={`Previous ${view}`}>
              <ChevronLeft className="w-4 h-4" />
            </NavArrow>
            <Link
              href={`/app/calendar?view=${view}`}
              className="h-10 px-4 inline-flex items-center text-[13px] font-medium text-ink hover:bg-muted/60 border-x border-border transition-colors"
            >
              Today
            </Link>
            <NavArrow view={view} anchor={nextAnchor} aria={`Next ${view}`}>
              <ChevronRight className="w-4 h-4" />
            </NavArrow>
          </div>

          <ViewSelect value={view} anchorKey={anchorKey} />

          <TooltipProvider delay={150}>
            {museAccess ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Link
                      href="/app/campaigns/new"
                      aria-label="New campaign"
                      className="inline-flex items-center justify-center h-10 w-10 rounded-full border border-border-strong text-ink hover:border-ink transition-colors"
                    >
                      <Wand2 className="w-4 h-4 text-primary" />
                    </Link>
                  }
                />
                <TooltipContent side="bottom">New campaign</TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span
                      aria-label="New campaign"
                      className="inline-flex items-center justify-center h-10 w-10 rounded-full border border-border-strong text-ink/40 cursor-not-allowed"
                    >
                      <Lock className="w-4 h-4 text-ink/30" />
                    </span>
                  }
                />
                <TooltipContent
                  side="bottom"
                  className="max-w-[240px] text-center"
                >
                  <p className="font-medium">Campaigns need Muse</p>
                  <p className="text-ink/60 mt-1">
                    Muse plans the arc — beats, dates, hooks — so you can review
                    and ship.
                  </p>
                </TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger
                render={
                  <Link
                    href="?compose=new"
                    aria-label="New post"
                    className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-ink text-background hover:bg-primary transition-colors"
                  >
                    <CalendarPlus className="w-4 h-4" />
                  </Link>
                }
              />
              <TooltipContent side="bottom">New post</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </header>

      {view === "month" ? (
        <MonthView
          anchor={anchor}
          tz={tz}
          buckets={buckets}
          todayKey={todayKey}
          campaignIndex={campaignIndex}
        />
      ) : (
        <TimeGridView
          days={
            view === "week"
              ? buildWeekDays(anchor, tz)
              : buildDayList(anchor, tz)
          }
          tz={tz}
          buckets={buckets}
          todayKey={todayKey}
          compact={view === "week"}
          campaignIndex={campaignIndex}
        />
      )}

      <section className="flex flex-wrap items-center gap-x-8 gap-y-3 text-[12.5px] text-ink/65">
        <LegendSwatch kind="scheduled" label="Scheduled" />
        <LegendSwatch kind="published" label="Published" />
        <LegendSwatch kind="failed" label="Failed" />
        <LegendSwatch kind="draft" label="Draft" />
        <span className="inline-flex items-center gap-2 ml-auto">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          All times shown in {tz}.
        </span>
      </section>
    </div>
  );
}

// ── Month view ─────────────────────────────────────────────────────────

function MonthView({
  anchor,
  tz,
  buckets,
  todayKey,
  campaignIndex,
}: {
  anchor: Date;
  tz: string;
  campaignIndex: CalendarCampaignIndex;
  buckets: Map<string, CalendarPostRow[]>;
  todayKey: string;
}) {
  const [yStr, mStr] = tzDateKey(anchor, tz).split("-");
  const year = Number(yStr);
  const month = Number(mStr);
  const cells = buildGridCells(year, month, tz);

  return (
    <section className="rounded-3xl border border-border bg-background-elev overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAY_LABELS.map((d, i) => (
          <div
            key={d}
            className={cn(
              "px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/55",
              i < WEEKDAY_LABELS.length - 1 && "border-r border-border",
              i >= 5 && "bg-peach-100/40",
            )}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 auto-rows-[minmax(124px,1fr)]">
        {cells.map((cell, idx) => {
          const dayPosts = buckets.get(cell.key) ?? [];
          const isToday = cell.key === todayKey;
          const isWeekend = idx % 7 >= 5;
          const rightmost = idx % 7 === 6;
          const bottomRow = idx >= cells.length - 7;
          return (
            <div
              key={cell.key}
              className={cn(
                "relative p-2.5 flex flex-col gap-1.5",
                !rightmost && "border-r border-border",
                !bottomRow && "border-b border-border",
                !cell.inMonth && "bg-muted/30",
                isWeekend && cell.inMonth && "bg-peach-100/30",
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full text-[12px] tabular-nums",
                    isToday
                      ? "bg-primary text-background font-semibold"
                      : cell.inMonth
                        ? "text-ink/80"
                        : "text-ink/30",
                  )}
                >
                  {cell.day}
                </span>
                {dayPosts.length > 0 ? (
                  <Link
                    href={`?compose=new&day=${cell.key}`}
                    prefetch={false}
                    className="text-[11px] text-ink/40 hover:text-ink transition-colors"
                    aria-label={`Add post on ${cell.key}`}
                  >
                    +
                  </Link>
                ) : null}
              </div>

              <ul className="space-y-1 flex-1">
                {dayPosts.slice(0, 3).map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/app/posts/${p.id}`}
                      prefetch={false}
                      className={cn(
                        "group block px-2 py-1.5 rounded-lg border text-[11.5px] leading-[1.35]",
                        postChipClasses(p.status),
                      )}
                    >
                      <div className="flex items-center gap-1 text-ink/60 mb-0.5">
                        <StatusIcon status={p.status} />
                        <span className="tabular-nums">
                          {formatTime(p.scheduledAt ?? p.publishedAt!, tz)}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-ink group-hover:text-ink/90">
                        {previewContent(p)}
                      </p>
                      <CampaignPill
                        campaignId={p.campaignId}
                        campaignIndex={campaignIndex}
                      />
                      <div className="mt-1">
                        <ChannelIcons
                          channels={p.platforms}
                          size="sm"
                          visible={5}
                        />
                      </div>
                    </Link>
                  </li>
                ))}
                {dayPosts.length > 3 ? (
                  <li className="px-2 text-[11px] text-ink/55">
                    +{dayPosts.length - 3} more
                  </li>
                ) : null}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Week & Day views (shared time grid) ────────────────────────────────

type GridDay = { date: Date; key: string; day: number };

function TimeGridView({
  days,
  tz,
  buckets,
  todayKey,
  compact,
  campaignIndex,
}: {
  days: GridDay[];
  campaignIndex: CalendarCampaignIndex;
  tz: string;
  buckets: Map<string, CalendarPostRow[]>;
  todayKey: string;
  compact: boolean;
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const gridCols = `72px repeat(${days.length}, minmax(0, 1fr))`;

  return (
    <section className="rounded-3xl border border-border bg-background-elev overflow-hidden">
      <div
        className="grid border-b border-border"
        style={{ gridTemplateColumns: gridCols }}
      >
        <div className="border-r border-border" />
        {days.map((d, i) => {
          const isToday = d.key === todayKey;
          const weekdayShort = new Intl.DateTimeFormat("en-US", {
            weekday: "short",
            timeZone: tz,
          }).format(d.date);
          const weekdayLong = new Intl.DateTimeFormat("en-US", {
            weekday: "long",
            timeZone: tz,
          }).format(d.date);
          const monthShort = new Intl.DateTimeFormat("en-US", {
            month: "short",
            timeZone: tz,
          }).format(d.date);
          return (
            <div
              key={d.key}
              className={cn(
                "px-4 py-3 flex items-center gap-2",
                i < days.length - 1 && "border-r border-border",
                isToday && !compact && "bg-peach-100/30",
              )}
            >
              {compact ? (
                <>
                  <span
                    className={cn(
                      "text-[11px] font-semibold uppercase tracking-[0.2em]",
                      isToday ? "text-primary" : "text-ink/55",
                    )}
                  >
                    {weekdayShort}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full text-[12px] tabular-nums",
                      isToday
                        ? "bg-primary text-background font-semibold"
                        : "text-ink/80",
                    )}
                  >
                    {d.day}
                  </span>
                </>
              ) : (
                <div>
                  <div
                    className={cn(
                      "text-[11px] font-semibold uppercase tracking-[0.2em]",
                      isToday ? "text-primary" : "text-ink/55",
                    )}
                  >
                    {weekdayLong}
                  </div>
                  <div className="text-[15px] tabular-nums text-ink/80 mt-0.5">
                    {monthShort} {d.day}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <GridScroll initialHour={7} hourHeight={HOUR_HEIGHT}>
        <div
          className="grid relative"
          style={{
            gridTemplateColumns: gridCols,
            gridTemplateRows: `repeat(24, ${HOUR_HEIGHT}px)`,
          }}
        >
          {hours.map((h) => (
            <div
              key={`label-${h}`}
              className={cn(
                "border-r border-border text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink/45 pt-1.5 pl-2",
                h < 23 && "border-b border-border",
              )}
              style={{ gridColumn: 1, gridRow: h + 1 }}
            >
              {formatHourLabel(h)}
            </div>
          ))}

          {days.map((d, colIdx) => {
            const isToday = d.key === todayKey;
            return hours.map((h) => (
              <div
                key={`cell-${d.key}-${h}`}
                className={cn(
                  colIdx < days.length - 1 && "border-r border-border",
                  h < 23 && "border-b border-border",
                  isToday && "bg-peach-100/25",
                )}
                style={{ gridColumn: colIdx + 2, gridRow: h + 1 }}
              />
            ));
          })}

          {days.map((d, colIdx) => {
            const dayPosts = buckets.get(d.key) ?? [];
            return dayPosts.map((p) => {
              const when = p.scheduledAt ?? p.publishedAt;
              if (!when) return null;
              const { hour, minute } = tzHourMinute(when, tz);
              const top = hour * HOUR_HEIGHT + (minute / 60) * HOUR_HEIGHT;
              return (
                <div
                  key={p.id}
                  className="absolute px-1.5 pt-0.5"
                  style={{
                    top: `${top}px`,
                    left: `calc(72px + (100% - 72px) * ${colIdx} / ${days.length})`,
                    width: `calc((100% - 72px) / ${days.length})`,
                  }}
                >
                  <Link
                    href={`/app/posts/${p.id}`}
                    prefetch={false}
                    className={cn(
                      "group block px-2 py-1.5 rounded-lg border text-[11.5px] leading-[1.35] shadow-sm",
                      postChipClasses(p.status),
                    )}
                  >
                    <div className="flex items-center gap-1 text-ink/60 mb-0.5">
                      <StatusIcon status={p.status} />
                      <span className="tabular-nums">
                        {formatTime(when, tz)}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "text-ink group-hover:text-ink/90",
                        compact ? "line-clamp-2" : "line-clamp-4",
                      )}
                    >
                      {previewContent(p)}
                    </p>
                    <CampaignPill
                      campaignId={p.campaignId}
                      campaignIndex={campaignIndex}
                    />
                    <div className="mt-1">
                      <ChannelIcons
                        channels={p.platforms}
                        size={compact ? "sm" : "md"}
                        visible={6}
                      />
                    </div>
                  </Link>
                </div>
              );
            });
          })}
        </div>
      </GridScroll>
    </section>
  );
}

// ── Nav / Switcher ─────────────────────────────────────────────────────

function NavArrow({
  view,
  anchor,
  aria,
  children,
}: {
  view: CalendarViewMode;
  anchor: Date;
  aria: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={`/app/calendar?view=${view}&date=${dateKey(anchor)}`}
      aria-label={aria}
      className="h-10 w-10 grid place-items-center text-ink/70 hover:text-ink hover:bg-muted/60 transition-colors"
    >
      {children}
    </Link>
  );
}

// ── Small shared UI ────────────────────────────────────────────────────

function StatusIcon({ status }: { status: string }) {
  const className = "w-3 h-3";
  if (status === "published") return <CheckCircle2 className={className} />;
  if (status === "failed") return <AlertCircle className={className} />;
  if (status === "draft") return <Sparkles className={className} />;
  return <Clock className={className} />;
}

function postChipClasses(status: string) {
  if (status === "published") {
    return "bg-peach-100 border-peach-300 hover:border-peach-400";
  }
  if (status === "failed") {
    return "bg-background border-primary/30 text-primary-deep hover:border-primary";
  }
  if (status === "draft") {
    return "bg-muted/60 border-dashed border-border-strong hover:border-ink";
  }
  return "bg-background border-border-strong hover:border-ink";
}

function LegendSwatch({
  kind,
  label,
}: {
  kind: "scheduled" | "published" | "failed" | "draft";
  label: string;
}) {
  const swatch =
    kind === "published"
      ? "bg-peach-100 border-peach-300"
      : kind === "failed"
        ? "bg-background border-primary/40"
        : kind === "draft"
          ? "bg-muted/60 border-dashed border-border-strong"
          : "bg-background border-border-strong";
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("w-3.5 h-3.5 rounded-md border", swatch)} />
      {label}
    </span>
  );
}

const CAMPAIGN_PALETTE = [
  "bg-primary-soft text-primary-deep border-primary/50",
  "bg-peach-200 text-ink border-peach-300",
  "bg-peach-300 text-ink border-peach-400",
  "bg-peach-400 text-ink border-ink/30",
  "bg-ink/10 text-ink border-ink/20",
  "bg-ink text-background border-ink",
] as const;

function CampaignPill({
  campaignId,
  campaignIndex,
}: {
  campaignId: string | null;
  campaignIndex: CalendarCampaignIndex;
}) {
  if (!campaignId) return null;
  const meta = campaignIndex.get(campaignId);
  if (!meta) return null;
  const color = CAMPAIGN_PALETTE[meta.colorIdx % CAMPAIGN_PALETTE.length];
  return (
    <div className="mt-1">
      <span
        title={`Campaign · ${meta.name}`}
        className={cn(
          "inline-flex items-center h-4 px-1.5 rounded-full text-[9.5px] font-medium leading-none tracking-wide border gap-1 max-w-full",
          color,
        )}
      >
        <span
          aria-hidden
          className="inline-block w-1 h-1 rounded-full bg-current opacity-60"
        />
        <span className="truncate">{meta.name}</span>
      </span>
    </div>
  );
}

// ── Date helpers ───────────────────────────────────────────────────────

export function dateKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function tzDateKey(d: Date, tz: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: tz,
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${day}`;
}

function formatTime(d: Date, tz: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz,
  }).format(d);
}

function tzHourMinute(d: Date, tz: string): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: tz,
  }).formatToParts(d);
  const hour = Number(parts.find((p) => p.type === "hour")!.value);
  const minute = Number(parts.find((p) => p.type === "minute")!.value);
  return { hour: hour === 24 ? 0 : hour, minute };
}

function formatHourLabel(h: number): string {
  const suffix = h < 12 ? "AM" : "PM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour} ${suffix}`;
}

function buildGridCells(year: number, month: number, tz: string) {
  const firstUtc = new Date(Date.UTC(year, month - 1, 1, 12));
  const firstKey = tzDateKey(firstUtc, tz);
  const weekdayTz = tzWeekdayIndex(firstUtc, tz);
  const start = new Date(firstUtc);
  start.setUTCDate(start.getUTCDate() - weekdayTz);

  const cells: { day: number; key: string; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const key = tzDateKey(d, tz);
    const day = Number(key.slice(8, 10));
    const inMonth =
      key.slice(0, 7) === `${year}-${String(month).padStart(2, "0")}`;
    cells.push({ day, key, inMonth });
    if (i >= 34 && !cells.some((c) => c.key.slice(0, 7) > firstKey.slice(0, 7)))
      continue;
  }
  return cells;
}

export function buildWeekDays(anchor: Date, tz: string): GridDay[] {
  const weekdayTz = tzWeekdayIndex(anchor, tz);
  const start = new Date(anchor);
  start.setUTCDate(start.getUTCDate() - weekdayTz);
  const days: GridDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const key = tzDateKey(d, tz);
    days.push({ date: d, key, day: Number(key.slice(8, 10)) });
  }
  return days;
}

function buildDayList(anchor: Date, tz: string): GridDay[] {
  const key = tzDateKey(anchor, tz);
  return [{ date: anchor, key, day: Number(key.slice(8, 10)) }];
}

function tzWeekdayIndex(d: Date, tz: string) {
  const name = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: tz,
  }).format(d);
  const map: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  return map[name] ?? 0;
}
