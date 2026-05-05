import Link from "next/link";
import { ChannelChip, channelLabel, CHANNEL_ICONS } from "@/components/channel-chip";
import { formatLabelFor, formatsFor } from "@/lib/campaigns/channel-formats";
import { cn } from "@/lib/utils";

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

export function CanvasFilterBar({
  channels,
  phases,
  view,
  beat,
  filters,
}: {
  channels: string[];
  phases: string[];
  view: string;
  beat?: string | null;
  filters: CanvasFilters;
}) {
  // Format options derived from the campaign's channel set so the user
  // doesn't see formats that aren't relevant to any selected channel.
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

  const hasAnyFilter =
    filters.channels.size > 0 ||
    filters.phases.size > 0 ||
    filters.formats.size > 0 ||
    filters.show !== "all";

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 flex-wrap">
        <FilterGroupLabel>Show</FilterGroupLabel>
        {(["all", "pending", "drafted"] as ShowMode[]).map((mode) => (
          <PillLink
            key={mode}
            href={showHref(mode)}
            active={filters.show === mode}
          >
            {mode === "all" ? "All" : mode === "pending" ? "Pending" : "Drafted"}
          </PillLink>
        ))}
      </div>

      {channels.length > 0 ? (
        <div className="flex items-center gap-2 flex-wrap">
          <FilterGroupLabel>Channel</FilterGroupLabel>
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
        </div>
      ) : null}

      {phases.length > 0 ? (
        <div className="flex items-center gap-2 flex-wrap">
          <FilterGroupLabel>Phase</FilterGroupLabel>
          {phases.map((p) => (
            <PillLink
              key={p}
              href={toggleHref("ph", p)}
              active={filters.phases.has(p)}
            >
              {PHASE_LABELS[p] ?? p}
            </PillLink>
          ))}
        </div>
      ) : null}

      {formats.length > 0 ? (
        <div className="flex items-center gap-2 flex-wrap">
          <FilterGroupLabel>Format</FilterGroupLabel>
          {formats.map((f) => (
            <PillLink
              key={f.slug}
              href={toggleHref("fmt", f.slug)}
              active={filters.formats.has(f.slug)}
            >
              {f.label}
            </PillLink>
          ))}
        </div>
      ) : null}

      {hasAnyFilter ? (
        <Link
          href={clearHref()}
          scroll={false}
          prefetch={false}
          className="inline-block text-[11.5px] text-ink/55 hover:text-ink transition-colors"
        >
          Clear filters
        </Link>
      ) : null}
    </div>
  );
}

function FilterGroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10.5px] uppercase tracking-[0.18em] text-ink/45 mr-1">
      {children}
    </span>
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
