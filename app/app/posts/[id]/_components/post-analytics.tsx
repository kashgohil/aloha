import { db } from "@/db";
import { postEngagementSnapshots, postSyncCursors } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import {
  BarChart3,
  Bookmark,
  Eye,
  Heart,
  MessageCircle,
  Repeat2,
  UserRound,
} from "lucide-react";

type MetricKey =
  | "likes"
  | "reposts"
  | "replies"
  | "views"
  | "bookmarks"
  | "profileClicks";

const METRIC_META: Array<{
  key: MetricKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "likes", label: "Likes", icon: Heart },
  { key: "reposts", label: "Reposts", icon: Repeat2 },
  { key: "replies", label: "Replies", icon: MessageCircle },
  { key: "views", label: "Views", icon: Eye },
  { key: "bookmarks", label: "Bookmarks", icon: Bookmark },
  { key: "profileClicks", label: "Profile clicks", icon: UserRound },
];

const HISTORY_LIMIT = 30;

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatDelta(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${formatCount(n)}`;
}

function formatRelative(when: Date, now: Date): string {
  const diff = Math.max(0, now.getTime() - when.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Render a sparkline for a single metric's series. Returns null when
// there's not enough data (<2 non-null points) so the tile just shows the
// current value alone — a flat line reads misleading.
function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;

  const width = 120;
  const height = 28;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-7 mt-2 text-primary"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

const PLATFORM_NOTES: Record<string, string> = {
  pinterest:
    "Pinterest returns a rolling 30-day window, not lifetime totals.",
};

export async function PostAnalytics({
  deliveryId,
  platform,
}: {
  deliveryId: string | null;
  platform: string | null;
}) {
  if (!deliveryId) {
    return (
      <div className="rounded-2xl border border-dashed border-border-strong bg-background-elev p-6 text-center">
        <BarChart3 className="w-5 h-5 text-ink/40 mx-auto" />
        <p className="mt-3 text-[13px] text-ink/55">
          Analytics become available once this channel publishes.
        </p>
      </div>
    );
  }

  // Pull the last N snapshots in chronological order. Latest = array[-1];
  // previous (for delta) = array[-2] per-metric (skipping nulls).
  const history = await db
    .select()
    .from(postEngagementSnapshots)
    .where(eq(postEngagementSnapshots.deliveryId, deliveryId))
    .orderBy(asc(postEngagementSnapshots.capturedAt))
    .limit(HISTORY_LIMIT);

  const [cursor] = await db
    .select({ lastSyncedAt: postSyncCursors.lastSyncedAt })
    .from(postSyncCursors)
    .where(
      and(
        eq(postSyncCursors.deliveryId, deliveryId),
        eq(postSyncCursors.kind, "snapshot"),
      ),
    )
    .limit(1);

  if (history.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border-strong bg-background-elev p-6 text-center">
        <BarChart3 className="w-5 h-5 text-ink/40 mx-auto" />
        <p className="mt-3 text-[13px] text-ink/55">
          No metrics captured yet. Hit Refresh to pull the latest.
        </p>
      </div>
    );
  }

  const latest = history[history.length - 1];

  // Per-metric series of non-null values, in chronological order.
  const seriesFor = (key: MetricKey): number[] =>
    history.map((h) => h[key]).filter((v): v is number => v !== null);

  // Keep metrics where the platform returned at least one non-null value
  // at any point in history. Avoids showing "Views: 0" for platforms that
  // simply don't report views.
  const present = METRIC_META.filter((m) => seriesFor(m.key).length > 0);

  if (present.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border-strong bg-background-elev p-6 text-center">
        <BarChart3 className="w-5 h-5 text-ink/40 mx-auto" />
        <p className="mt-3 text-[13px] text-ink/55">
          This platform didn&apos;t return any metrics on the scopes we hold.
        </p>
      </div>
    );
  }

  const lastSynced = cursor?.lastSyncedAt ?? latest.capturedAt;
  const platformNote = platform ? PLATFORM_NOTES[platform] : undefined;

  return (
    <div className="rounded-2xl border border-border bg-background-elev p-6">
      <div className="flex items-center justify-between mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/55">
          Analytics
        </p>
        <p className="text-[11px] text-ink/50">
          Last synced {formatRelative(lastSynced, new Date())}
        </p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {present.map(({ key, label, icon: Icon }) => {
          const series = seriesFor(key);
          const current = series[series.length - 1];
          const previous = series.length >= 2 ? series[series.length - 2] : null;
          const delta = previous !== null ? current - previous : null;

          return (
            <div
              key={key}
              className="rounded-xl border border-border bg-background p-4"
            >
              <div className="flex items-center gap-1.5 text-[11px] text-ink/55">
                <Icon className="w-3 h-3" />
                {label}
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="font-display text-[24px] leading-none text-ink">
                  {formatCount(current)}
                </p>
                {delta !== null && delta !== 0 && (
                  <span
                    className={
                      delta > 0
                        ? "text-[11px] font-medium text-emerald-700"
                        : "text-[11px] font-medium text-destructive"
                    }
                  >
                    {formatDelta(delta)}
                  </span>
                )}
              </div>
              <Sparkline values={series} />
            </div>
          );
        })}
      </div>
      {platformNote && (
        <p className="mt-4 text-[11.5px] text-ink/50 leading-[1.5]">
          {platformNote}
        </p>
      )}
    </div>
  );
}
