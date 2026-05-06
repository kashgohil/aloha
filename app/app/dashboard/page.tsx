import { ChannelChip, ChannelIcons } from "@/components/channel-chip";
import { db } from "@/db";
import {
  brandCorpus,
  campaigns,
  feedItems,
  feeds,
  ideas,
  inboxMessages,
  notionCredentials,
  posts,
} from "@/db/schema";
import { hasMuseInviteEntitlement } from "@/lib/billing/muse";
import { getLogicalSubscription } from "@/lib/billing/service";
import { PLATFORM_GATING } from "@/lib/channel-state";
import { getConnectedChannels } from "@/lib/channels/connected";
import { getCurrentContext } from "@/lib/current-context";
import type { CurrentUser } from "@/lib/current-user";
import { getRecentActivity } from "@/lib/dashboard/recent-activity";
import { previewContent } from "@/lib/post-preview";
import { getReachLast7Days } from "@/lib/reach-cache";
import { and, count, desc, eq, gte, notInArray, sql } from "drizzle-orm";
import { ArrowUpRight, CalendarDays, PenSquare, Sparkles } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import {
  ActiveCampaignCard,
  ActivityCard,
  ChannelsCard,
  EmptyCard,
  EngagementCard,
  FeedDigestCard,
  IdeasCard,
  KnowledgeCard,
  ReachCard,
  SectionHeader,
} from "./_components";

export const dynamic = "force-dynamic";

const PROVIDER_LABELS: Record<string, string> = {
  twitter: "X",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  bluesky: "Bluesky",
  medium: "Medium",
};

export default async function DashboardPage() {
  // Header renders synchronously from the session (no DB). The rest of
  // the dashboard streams in via Suspense so the shell paints fast.
  const ctx = (await getCurrentContext())!;
  const { user, workspace } = ctx;
  const tz = workspace.timezone ?? user.timezone ?? "UTC";
  const firstName = (user.name ?? user.email).split(/\s|@/)[0];
  const greeting = greet(new Date(), tz);

  return (
    <div className="space-y-14">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            {formatToday(new Date(), tz)}
          </p>
          <h1 className="mt-3 font-display text-[44px] lg:text-[56px] leading-[1.02] tracking-[-0.03em] text-ink font-normal">
            {greeting}, <span className="text-primary">{firstName}</span>
            <span className="text-primary font-light">.</span>
          </h1>
          <p className="mt-3 text-[15px] text-ink/65 max-w-xl leading-[1.55]">
            Here&apos;s what&apos;s on your calendar and what&apos;s landed
            since Monday.
          </p>
        </div>
      </header>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent user={user} workspaceId={workspace.id} tz={tz} />
      </Suspense>
    </div>
  );
}

async function DashboardContent({
  user,
  workspaceId,
  tz,
}: {
  user: CurrentUser;
  workspaceId: string;
  tz: string;
}) {
  const startOfWeek = (() => {
    // Monday-start week. Anchored to UTC for the SQL filter; tz-display is
    // separate from period bucketing here.
    const d = new Date();
    const day = (d.getUTCDay() + 6) % 7; // 0 = Monday
    d.setUTCDate(d.getUTCDate() - day);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  })();

  // ── Real metrics ────────────────────────────────────────────────────
  const now = new Date();

  // Fire every dashboard query concurrently. None of these depend on
  // each other; postgres-js pipelines them over a single connection so
  // the total wall-clock time is bounded by the slowest query, not the
  // sum. All downstream aggregations run off the resolved arrays.
  const [
    countsRows,
    connectedSnap,
    upcoming,
    recentPublished,
    reachRows,
    activeCampaign,
    ideaCounts,
    freshIdeas,
    feedTotals,
    latestFeedItems,
    inboxTotals,
    notionRows,
    notionDocCount,
    subscribedFeeds,
    logicalSub,
    museInvited,
    recentActivity,
  ] = await Promise.all([
    db
      .select({
        drafts: sql<number>`count(*) filter (where ${posts.status} = 'draft')`,
        scheduled: sql<number>`count(*) filter (where ${posts.status} = 'scheduled' and ${posts.scheduledAt} >= ${now.toISOString()})`,
        publishedThisWeek: sql<number>`count(*) filter (where ${posts.status} = 'published' and ${posts.publishedAt} >= ${startOfWeek.toISOString()})`,
      })
      .from(posts)
      .where(eq(posts.workspaceId, workspaceId)),

    getConnectedChannels(workspaceId),

    db
      .select({
        id: posts.id,
        content: posts.content,
        channelContent: posts.channelContent,
        platforms: posts.platforms,
        scheduledAt: posts.scheduledAt,
      })
      .from(posts)
      .where(
        and(
          eq(posts.workspaceId, workspaceId),
          eq(posts.status, "scheduled"),
          gte(posts.scheduledAt, now),
        ),
      )
      .orderBy(posts.scheduledAt)
      .limit(6),

    db
      .select({
        id: posts.id,
        content: posts.content,
        channelContent: posts.channelContent,
        platforms: posts.platforms,
        publishedAt: posts.publishedAt,
      })
      .from(posts)
      .where(
        and(eq(posts.workspaceId, workspaceId), eq(posts.status, "published")),
      )
      .orderBy(desc(posts.publishedAt))
      .limit(3),

    // Reach over the last 7 days, per platform, from the nightly
    // read-back cache. Only platforms that have returned data show up;
    // gated channels (Meta / TikTok / YouTube until approval) are
    // surfaced separately so the card is honest about what's missing
    // vs. what's zero. Cached with a 1h TTL + tag invalidation on
    // each readback cron run.
    getReachLast7Days(user.id),

    // Most recent non-archived campaign — list its beat progress so
    // the user can pick up a campaign mid-run from the dashboard.
    db
      .select({
        id: campaigns.id,
        name: campaigns.name,
        kind: campaigns.kind,
        status: campaigns.status,
        rangeStart: campaigns.rangeStart,
        rangeEnd: campaigns.rangeEnd,
        beats: campaigns.beats,
      })
      .from(campaigns)
      .where(
        and(
          eq(campaigns.workspaceId, workspaceId),
          notInArray(campaigns.status, ["archived", "complete"]),
        ),
      )
      .orderBy(desc(campaigns.createdAt))
      .limit(1),

    db
      .select({
        newCount: sql<number>`count(*) filter (where ${ideas.status} = 'new')`,
        total: count(),
      })
      .from(ideas)
      .where(eq(ideas.workspaceId, workspaceId)),

    db
      .select({
        id: ideas.id,
        title: ideas.title,
        body: ideas.body,
        source: ideas.source,
        createdAt: ideas.createdAt,
      })
      .from(ideas)
      .where(and(eq(ideas.workspaceId, workspaceId), eq(ideas.status, "new")))
      .orderBy(desc(ideas.createdAt))
      .limit(3),

    db
      .select({
        total: count(),
        unread: sql<number>`count(*) filter (where ${feedItems.isRead} = false)`,
      })
      .from(feedItems)
      .innerJoin(feeds, eq(feedItems.feedId, feeds.id))
      .where(eq(feeds.workspaceId, workspaceId)),

    db
      .select({
        id: feedItems.id,
        title: feedItems.title,
        url: feedItems.url,
        publishedAt: feedItems.publishedAt,
        feedTitle: feeds.title,
        isRead: feedItems.isRead,
      })
      .from(feedItems)
      .innerJoin(feeds, eq(feedItems.feedId, feeds.id))
      .where(eq(feeds.workspaceId, workspaceId))
      .orderBy(desc(feedItems.publishedAt))
      .limit(3),

    db
      .select({
        total: count(),
        unread: sql<number>`count(*) filter (where ${inboxMessages.isRead} = false)`,
      })
      .from(inboxMessages)
      .where(eq(inboxMessages.workspaceId, workspaceId)),

    db
      .select({
        workspaceName: notionCredentials.notionWorkspaceName,
        lastSyncedAt: notionCredentials.lastSyncedAt,
        reauthRequired: notionCredentials.reauthRequired,
      })
      .from(notionCredentials)
      .where(eq(notionCredentials.workspaceId, workspaceId))
      .limit(1),

    db
      .select({ total: count() })
      .from(brandCorpus)
      .where(
        and(
          eq(brandCorpus.workspaceId, workspaceId),
          eq(brandCorpus.source, "notion"),
        ),
      ),

    // Subscribed feed sources — used by FeedDigestCard to show *what*
    // the user is following, not just a static unread count.
    db
      .select({
        id: feeds.id,
        title: feeds.title,
        iconUrl: feeds.iconUrl,
        siteUrl: feeds.siteUrl,
      })
      .from(feeds)
      .where(eq(feeds.workspaceId, workspaceId))
      .orderBy(desc(feeds.lastFetchedAt))
      .limit(12),

    getLogicalSubscription(user.id),
    hasMuseInviteEntitlement(user.id),
    getRecentActivity(user.id),
  ]);

  const counts = countsRows[0];
  const connectedChannels = connectedSnap.providers.length;
  const allProviders = [...connectedSnap.providers];
  const totalAccountSlots = connectedSnap.perAccountCount;

  const reachByPlatform = new Map(
    reachRows
      .map((r) => ({
        platform: r.platform,
        impressions: Number(r.impressions ?? 0),
        posts: Number(r.posts ?? 0),
      }))
      .map((r) => [r.platform, r]),
  );
  const totalImpressions = reachRows.reduce(
    (sum, r) => sum + Number(r.impressions ?? 0),
    0,
  );
  const gatedConnected = allProviders.filter(
    (p) => PLATFORM_GATING[p] === "pending_approval",
  );
  const readbackConnected = allProviders.filter(
    (p) => p === "twitter" || p === "linkedin",
  );

  const activeCampaignRow = activeCampaign[0] ?? null;
  const campaignBeats = activeCampaignRow
    ? (activeCampaignRow.beats as Array<{ accepted?: boolean }>)
    : [];
  const campaignPendingCount = campaignBeats.filter((b) => !b.accepted).length;
  const campaignAcceptedCount = campaignBeats.length - campaignPendingCount;
  const newIdeaCount = Number(ideaCounts[0]?.newCount ?? 0);
  const totalIdeaCount = Number(ideaCounts[0]?.total ?? 0);
  const unreadFeedCount = Number(feedTotals[0]?.unread ?? 0);
  const totalFeedCount = Number(feedTotals[0]?.total ?? 0);
  const unreadInboxCount = Number(inboxTotals[0]?.unread ?? 0);
  const totalInboxCount = Number(inboxTotals[0]?.total ?? 0);
  const notion = notionRows[0] ?? null;
  const notionDocs = Number(notionDocCount[0]?.total ?? 0);
  const museEnabled = logicalSub.museEnabled || museInvited;

  // ── View ────────────────────────────────────────────────────────────
  const stats = [
    {
      label: "Drafts",
      value: counts.drafts ?? 0,
      hint: "in the writing room",
      href: "/app/posts?status=draft",
    },
    {
      label: "Scheduled",
      value: counts.scheduled ?? 0,
      hint: "across all channels",
      href: "/app/posts?status=scheduled",
    },
    {
      label: "Published this week",
      value: counts.publishedThisWeek ?? 0,
      hint: "since Monday",
      href: "/app/posts?status=published",
    },
    {
      label: "Connected channels",
      value: connectedChannels,
      hint:
        totalAccountSlots > 0
          ? `${totalAccountSlots} account${totalAccountSlots > 1 ? "s" : ""}`
          : "none yet",
      href: "/app/settings/channels",
    },
  ];

  return (
    <>
      {/* Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group rounded-2xl border border-border bg-background-elev p-5 transition-colors hover:bg-muted/40"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/55">
              {s.label}
            </p>
            <p className="mt-3 font-display text-[40px] leading-none tracking-[-0.025em] text-ink">
              {s.value}
            </p>
            <p className="mt-2 text-[12px] text-ink/55">{s.hint}</p>
          </Link>
        ))}
      </section>

      {/* Main grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Up next */}
        <div className="lg:col-span-8">
          <SectionHeader
            eyebrow="Up next"
            title="Scheduled to go out"
            actionLabel="See all"
            actionHref="/app/posts?status=scheduled"
          />

          {upcoming.length === 0 ? (
            <EmptyCard
              icon={Sparkles}
              title="Your queue is empty."
              body="Compose your first post — pick a channel, write a draft, and schedule when it goes out."
              ctaLabel="Open Composer"
              ctaHref="?compose=new"
            />
          ) : (
            <ul className="rounded-2xl border border-border bg-background-elev divide-y divide-border overflow-hidden">
              {upcoming.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/app/posts/${p.id}`}
                    className="group flex items-start gap-5 px-5 py-4 hover:bg-muted/40 transition-colors"
                  >
                    <div className="w-[88px] shrink-0 text-[12px] text-ink/55 leading-[1.4]">
                      <p className="text-ink font-medium">
                        {formatDay(p.scheduledAt!, tz)}
                      </p>
                      <p>{formatTime(p.scheduledAt!, tz)}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14.5px] text-ink leading-normal line-clamp-2">
                        {previewContent(p)}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {p.platforms.map((pl) => (
                          <ChannelChip key={pl} channel={pl} />
                        ))}
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-ink/30 group-hover:text-ink transition-colors mt-1" />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {recentPublished.length > 0 ? (
            <div className="mt-12">
              <SectionHeader
                eyebrow="Recently out the door"
                title="Published"
                actionLabel="See all"
                actionHref="/app/posts?status=published"
              />
              <ul className="rounded-2xl border border-border bg-background-elev divide-y divide-border overflow-hidden">
                {recentPublished.map((p) => (
                  <li key={p.id} className="flex items-start gap-5 px-5 py-4">
                    <div className="w-[88px] shrink-0 text-[12px] text-ink/55 leading-[1.4]">
                      <p className="text-ink font-medium">
                        {p.publishedAt ? formatDay(p.publishedAt, tz) : "—"}
                      </p>
                      <p>
                        {p.publishedAt ? formatTime(p.publishedAt, tz) : ""}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] text-ink/80 leading-normal line-clamp-2">
                        {previewContent(p)}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <ChannelIcons channels={p.platforms} size="sm" />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          {activeCampaignRow && campaignBeats.length > 0 ? (
            <ActiveCampaignCard
              campaignId={activeCampaignRow.id}
              name={activeCampaignRow.name}
              kind={activeCampaignRow.kind}
              pending={campaignPendingCount}
              accepted={campaignAcceptedCount}
              total={campaignBeats.length}
              rangeStart={activeCampaignRow.rangeStart}
              rangeEnd={activeCampaignRow.rangeEnd}
            />
          ) : null}

          <IdeasCard
            newCount={newIdeaCount}
            totalCount={totalIdeaCount}
            fresh={freshIdeas}
          />

          <ChannelsCard providers={allProviders} />

          {museEnabled ? (
            <KnowledgeCard
              connected={!!notion}
              workspaceName={notion?.workspaceName ?? null}
              reauthRequired={notion?.reauthRequired ?? false}
              lastSyncedAt={notion?.lastSyncedAt ?? null}
              docCount={notionDocs}
              tz={tz}
            />
          ) : null}

          {readbackConnected.length > 0 ? (
            <ReachCard
              totalImpressions={totalImpressions}
              perPlatform={readbackConnected.map((p) => ({
                platform: p,
                impressions: reachByPlatform.get(p)?.impressions ?? 0,
                posts: reachByPlatform.get(p)?.posts ?? 0,
                gated: PLATFORM_GATING[p] === "pending_approval",
              }))}
              gatedConnectedCount={gatedConnected.length}
            />
          ) : null}

          {totalFeedCount > 0 ? (
            <FeedDigestCard
              unread={unreadFeedCount}
              total={totalFeedCount}
              items={latestFeedItems}
              sources={subscribedFeeds}
            />
          ) : null}

          <ActivityCard items={recentActivity} />

          <EngagementCard unread={unreadInboxCount} total={totalInboxCount} />
        </aside>
      </section>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-background-elev p-5 h-[116px] animate-pulse"
          />
        ))}
      </section>
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 rounded-2xl border border-border bg-background-elev h-[320px] animate-pulse" />
        <aside className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-border bg-background-elev h-[140px] animate-pulse" />
          <div className="rounded-2xl border border-border bg-background-elev h-[140px] animate-pulse" />
          <div className="rounded-2xl border border-border bg-background-elev h-[140px] animate-pulse" />
        </aside>
      </section>
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────

function greet(now: Date, tz: string) {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      hour12: false,
      timeZone: tz,
    }).format(now),
  );
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 22) return "Good evening";
  return "Good night";
}

function formatToday(date: Date, tz: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: tz,
  }).format(date);
}

function formatDay(date: Date, tz: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: tz,
  }).format(date);
}

function formatTime(date: Date, tz: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz,
  }).format(date);
}
