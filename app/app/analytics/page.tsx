import { and, eq, notInArray } from "drizzle-orm";
import { Download } from "lucide-react";
import { db } from "@/db";
import { accounts, blueskyCredentials } from "@/db/schema";
import { getAnalyticsSummary } from "@/lib/analytics/summary";
import { getRepeatability } from "@/lib/analytics/repeatability";
import { AUTH_ONLY_PROVIDERS } from "@/lib/auth-providers";
import { getBestWindowsForUser } from "@/lib/best-time";
import { PLATFORM_GATING } from "@/lib/channel-state";
import { getCurrentContext } from "@/lib/current-context";
import {
  BestTimesSection,
  ChannelCompare,
  RepeatabilityCard,
  SummaryRow,
  TopPostsCard,
  WeeklyChart,
} from "./_components";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const ctx = (await getCurrentContext())!;
  const { user, workspace } = ctx;
  const tz = workspace.timezone ?? user.timezone ?? "UTC";

  const [summary, bestWindows, repeatability, connectedProviders, hasBluesky] =
    await Promise.all([
      getAnalyticsSummary(user.id),
      getBestWindowsForUser(user.id, tz),
      getRepeatability(user.id, tz),
      db
        .selectDistinct({ provider: accounts.provider })
        .from(accounts)
        .where(
          and(
            eq(accounts.workspaceId, workspace.id),
            notInArray(accounts.provider, AUTH_ONLY_PROVIDERS),
          ),
        ),
      db
        .select({ id: blueskyCredentials.id })
        .from(blueskyCredentials)
        .where(eq(blueskyCredentials.workspaceId, workspace.id))
        .limit(1),
    ]);

  const allProviders = [
    ...connectedProviders.map((p) => p.provider),
    ...(hasBluesky.length > 0 ? ["bluesky" as const] : []),
  ];
  const gatedConnected = allProviders.filter(
    (p) => PLATFORM_GATING[p] === "pending_approval",
  );

  return (
    <div className="space-y-12">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            Analytics
          </p>
          <h1 className="mt-3 font-display text-[44px] lg:text-[56px] leading-[1.02] tracking-[-0.03em] text-ink font-normal">
            Numbers that <span className="text-primary">lead somewhere.</span>
          </h1>
          <p className="mt-3 text-[15px] text-ink/65 max-w-xl leading-[1.55]">
            Twelve weeks of reach, compared against the twelve before it.
            Gaps are flagged, never filled in.
          </p>
        </div>
        <a
          href="/app/analytics/export"
          className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full border border-border-strong text-[14px] font-medium text-ink hover:border-ink transition-colors self-start lg:self-auto"
          download
        >
          <Download className="w-4 h-4" />
          Export CSV
        </a>
      </header>

      <SummaryRow
        totalImpressions={summary.totalImpressions}
        deltaPct={summary.deltaPct}
        totalEngagement={summary.totalEngagement}
        postCount={summary.postCount}
        prevPostCount={summary.prevPostCount}
      />

      <WeeklyChart weeks={summary.weeks} />

      <ChannelCompare
        channels={summary.channels}
        gatedConnected={gatedConnected}
      />

      <BestTimesSection windowsByPlatform={bestWindows} />

      <TopPostsCard
        topPosts={summary.topPosts}
        totalPostCount={summary.postCount}
      />

      <RepeatabilityCard gate={repeatability} />
    </div>
  );
}
