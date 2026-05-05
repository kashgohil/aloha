import Link from "next/link";
import { ChannelChip, channelLabel, CHANNEL_ICONS } from "@/components/channel-chip";
import { formatLabelFor, formatsFor } from "@/lib/campaigns/channel-formats";
import { cn } from "@/lib/utils";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

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

export type ShowMode = "all" | "pending" | "drafted";

export type CanvasFilters = {
  channels: Set<string>;
  phases: Set<string>;
  formats: Set<string>;
  show: ShowMode;
};

// Parse search params into a filters object. Empty sets mean "no filter
// applied for this dimension" — every value passes. The page-level filter
// fn applies AND across dimensions, OR within a dimension.
export function parseFilters(
  q: Record<string, string | string[] | undefined>,
): CanvasFilters {
  const csv = (v: string | string[] | undefined): string[] => {
    const raw = Array.isArray(v) ? v[0] : v;
    if (!raw) return [];
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  };
  const showRaw = Array.isArray(q.show) ? q.show[0] : q.show;
  const show: ShowMode =
    showRaw === "pending" || showRaw === "drafted" ? showRaw : "all";
  return {
    channels: new Set(csv(q.ch)),
    phases: new Set(csv(q.ph)),
    formats: new Set(csv(q.fmt)),
    show,
  };
}

export function applyFilters<
  B extends {
    channel: string;
    phase: string;
    format: string;
    accepted?: boolean;
  },
>(beats: B[], f: CanvasFilters): B[] {
  return beats.filter((b) => {
    if (f.channels.size > 0 && !f.channels.has(b.channel)) return false;
    if (f.phases.size > 0 && !f.phases.has(b.phase)) return false;
    if (f.formats.size > 0 && !f.formats.has(b.format)) return false;
    if (f.show === "pending" && b.accepted) return false;
    if (f.show === "drafted" && !b.accepted) return false;
    return true;
  });
}

// Single-row filter strip. Show-mode (All/Pending/Drafted) stays visible
// because it's the most-used dimension; channel/phase/format collapse
// into a `<details>` popover so the canvas isn't pushed down by 4 rows
// of pills. RSC-only — link nav drives all state via search params, no
// client component needed.
export function CanvasFilterBar({
  channels,
  phases,
  view,
  beat,
  filters,
  visibleCount,
  totalCount,
}: {
  channels: string[];
  phases: string[];
  view: string;
  beat?: string | null;
  filters: CanvasFilters;
  visibleCount: number;
  totalCount: number;
}) {
  const formats = uniqueFormatsFor(channels);

  const baseParams = (): URLSearchParams => {
    const p = new URLSearchParams();
    if (view !== "list") p.set("view", view);
    if (beat) p.set("beat", beat);
    if (filters.channels.size > 0) p.set("ch", [...filters.channels].join(","));
    if (filters.phases.size > 0) p.set("ph", [...filters.phases].join(","));
    if (filters.formats.size > 0)
      p.set("fmt", [...filters.formats].join(","));
    if (filters.show !== "all") p.set("show", filters.show);
    return p;
  };

  const toggleHref = (
    dim: "ch" | "ph" | "fmt",
    value: string,
  ): string => {
    const set = new Set(
      dim === "ch"
        ? filters.channels
        : dim === "ph"
          ? filters.phases
          : filters.formats,
    );
    if (set.has(value)) set.delete(value);
    else set.add(value);
    const p = baseParams();
    if (set.size > 0) p.set(dim, [...set].join(","));
    else p.delete(dim);
    return p.toString() ? `?${p.toString()}` : "?";
  };

  const showHref = (next: ShowMode): string => {
    const p = baseParams();
    if (next === "all") p.delete("show");
    else p.set("show", next);
    return p.toString() ? `?${p.toString()}` : "?";
  };

  const clearHref = (): string => {
    const p = new URLSearchParams();
    if (view !== "list") p.set("view", view);
    if (beat) p.set("beat", beat);
    return p.toString() ? `?${p.toString()}` : "?";
  };

  const dimensionCount =
    filters.channels.size + filters.phases.size + filters.formats.size;
  const hasAnyFilter = dimensionCount > 0 || filters.show !== "all";

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="inline-flex items-center gap-0.5 rounded-full border border-border bg-background p-0.5">
        {(["all", "pending", "drafted"] as ShowMode[]).map((mode) => {
          const active = filters.show === mode;
          return (
            <Link
              key={mode}
              href={showHref(mode)}
              scroll={false}
              prefetch={false}
              className={cn(
                "inline-flex items-center h-8 px-3 rounded-full text-[12px] font-medium transition-colors",
                active
                  ? "bg-ink text-background"
                  : "text-ink/65 hover:text-ink",
              )}
            >
              {mode === "all" ? "All" : mode === "pending" ? "Pending" : "Drafted"}
            </Link>
          );
        })}
      </div>

      {channels.length + phases.length + formats.length > 0 ? (
        <details className="relative group">
          <summary
            className={cn(
              "list-none cursor-pointer inline-flex items-center gap-1.5 h-8 px-3 rounded-full border text-[12px] font-medium transition-colors select-none",
              dimensionCount > 0
                ? "border-ink bg-ink text-background"
                : "border-border bg-background text-ink/70 hover:border-ink hover:text-ink",
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
            {dimensionCount > 0 ? (
              <span
                className={cn(
                  "inline-grid place-items-center min-w-4 h-4 px-1 rounded-full text-[10px] tabular-nums",
                  dimensionCount > 0
                    ? "bg-background/20 text-background"
                    : "bg-muted text-ink/65",
                )}
              >
                {dimensionCount}
              </span>
            ) : null}
            <ChevronDown className="w-3 h-3 transition-transform group-open:rotate-180" />
          </summary>

          <div className="absolute top-full left-0 mt-2 z-20 rounded-2xl border border-border-strong bg-background-elev shadow-lg p-4 space-y-4 min-w-[320px] max-w-[420px]">
            {channels.length > 0 ? (
              <FilterGroup label="Channel">
                {channels.map((c) => {
                  const Icon = CHANNEL_ICONS[c];
                  return (
                    <PillLink
                      key={c}
                      href={toggleHref("ch", c)}
                      active={filters.channels.has(c)}
                    >
                      {Icon ? <Icon className="w-3 h-3" /> : null}
                      {channelLabel(c)}
                    </PillLink>
                  );
                })}
              </FilterGroup>
            ) : null}

            {phases.length > 0 ? (
              <FilterGroup label="Phase">
                {phases.map((p) => (
                  <PillLink
                    key={p}
                    href={toggleHref("ph", p)}
                    active={filters.phases.has(p)}
                  >
                    {PHASE_LABELS[p] ?? p}
                  </PillLink>
                ))}
              </FilterGroup>
            ) : null}

            {formats.length > 0 ? (
              <FilterGroup label="Format">
                {formats.map((f) => (
                  <PillLink
                    key={f.slug}
                    href={toggleHref("fmt", f.slug)}
                    active={filters.formats.has(f.slug)}
                  >
                    {f.label}
                  </PillLink>
                ))}
              </FilterGroup>
            ) : null}
          </div>
        </details>
      ) : null}

      <span className="text-[11.5px] text-ink/55 tabular-nums ml-auto">
        {visibleCount} of {totalCount} shown
      </span>

      {hasAnyFilter ? (
        <Link
          href={clearHref()}
          scroll={false}
          prefetch={false}
          className="text-[11.5px] text-ink/55 hover:text-ink transition-colors"
        >
          Clear
        </Link>
      ) : null}
    </div>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10.5px] uppercase tracking-[0.18em] text-ink/45 font-medium">
        {label}
      </p>
      <div className="flex items-center gap-1.5 flex-wrap">{children}</div>
    </div>
  );
}

function PillLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      prefetch={false}
      className={cn(
        "inline-flex items-center gap-1 h-7 px-3 rounded-full border text-[11.5px] font-medium transition-colors",
        active
          ? "border-ink bg-ink text-background"
          : "border-border bg-background text-ink/70 hover:border-ink hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}

function uniqueFormatsFor(
  channels: string[],
): Array<{ slug: string; label: string }> {
  const seen = new Map<string, string>();
  for (const ch of channels) {
    for (const f of formatsFor(ch)) {
      if (!seen.has(f.slug)) seen.set(f.slug, f.label);
    }
  }
  return Array.from(seen.entries()).map(([slug, label]) => ({ slug, label }));
}

// Re-export for callers that already import from this module — keeps the
// page tidy.
export { ChannelChip, formatLabelFor };
