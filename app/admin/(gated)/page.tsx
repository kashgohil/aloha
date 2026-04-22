import { db } from "@/db";
import {
  users,
  posts,
  generations,
  featureAccess,
  channelNotifications,
} from "@/db/schema";
import { sql, and, isNull, isNotNull, desc } from "drizzle-orm";
import Link from "next/link";
import { MailCheck, Users as UsersIcon } from "lucide-react";
import {
  AdminPageHeader,
  DataCard,
  SectionHeader,
  StatCard,
} from "../_components/page-header";

async function getStats() {
  const [
    [userCount],
    [postCount],
    [genAgg],
    [pendingReq],
    [notifyAgg],
    topChannels,
  ] = await Promise.all([
    db.select({ c: sql<number>`count(*)::int` }).from(users),
    db.select({ c: sql<number>`count(*)::int` }).from(posts),
    db
      .select({
        c: sql<number>`count(*)::int`,
        cost: sql<number>`coalesce(sum(${generations.costMicros}), 0)::bigint`,
      })
      .from(generations),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(featureAccess)
      .where(
        and(isNotNull(featureAccess.requestedAt), isNull(featureAccess.grantedAt)),
      ),
    db.select({ c: sql<number>`count(*)::int` }).from(channelNotifications),
    db
      .select({
        channel: channelNotifications.channel,
        count: sql<number>`count(*)::int`,
      })
      .from(channelNotifications)
      .groupBy(channelNotifications.channel)
      .orderBy(desc(sql`count(*)`))
      .limit(3),
  ]);
  return {
    users: userCount.c,
    posts: postCount.c,
    generations: genAgg.c,
    aiCostUsd: Number(genAgg.cost) / 1_000_000,
    pendingRequests: pendingReq.c,
    notifyMeTotal: notifyAgg.c,
    topChannels,
  };
}

export default async function AdminOverviewPage() {
  const stats = await getStats();
  return (
    <div className="space-y-14">
      <AdminPageHeader
        eyebrow="Operations"
        title="Overview"
        subtitle="Everything worth watching across Aloha — users, posts, spend, and pending approvals."
        actions={
          <>
            <Link
              href="/admin/requests"
              className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full border border-border-strong text-[14px] font-medium text-ink hover:border-ink transition-colors"
            >
              <MailCheck className="w-4 h-4" />
              Requests
            </Link>
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
            >
              <UsersIcon className="w-4 h-4" />
              Browse users
            </Link>
          </>
        }
      />

      <section>
        <SectionHeader eyebrow="At a glance" title="Platform numbers" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Users"
            value={stats.users.toLocaleString()}
            hint="total signups"
          />
          <StatCard
            label="Posts"
            value={stats.posts.toLocaleString()}
            hint="all statuses"
          />
          <StatCard
            label="AI calls"
            value={stats.generations.toLocaleString()}
            hint="lifetime generations"
          />
          <StatCard
            label="AI spend"
            value={`$${stats.aiCostUsd.toFixed(2)}`}
            hint="USD, lifetime"
          />
        </div>
      </section>

      <section>
        <SectionHeader eyebrow="Queue" title="Needs your attention" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DataCard>
            <div className="p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
                Access requests
              </p>
              <p className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-[40px] leading-none tracking-[-0.02em] text-ink">
                  {stats.pendingRequests.toLocaleString()}
                </span>
                <span className="text-[13px] text-ink/60">
                  pending
                </span>
              </p>
              <Link
                href="/admin/requests"
                className="mt-5 inline-flex items-center justify-center w-full h-10 rounded-full border border-border-strong text-[13px] text-ink hover:border-ink transition-colors"
              >
                Review queue
              </Link>
            </div>
          </DataCard>

          <DataCard>
            <div className="p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
                Channel interest
              </p>
              <p className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-[40px] leading-none tracking-[-0.02em] text-ink">
                  {stats.notifyMeTotal.toLocaleString()}
                </span>
                <span className="text-[13px] text-ink/60">
                  &ldquo;Notify me&rdquo; signal
                  {stats.notifyMeTotal === 1 ? "" : "s"}
                </span>
              </p>
              {stats.topChannels.length > 0 ? (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {stats.topChannels.map((c) => (
                    <li
                      key={c.channel}
                      className="inline-flex items-center h-6 px-2 rounded-full bg-peach-100/70 text-[11px] text-ink capitalize"
                    >
                      {c.channel} · {c.count}
                    </li>
                  ))}
                </ul>
              ) : null}
              <Link
                href="/admin/channel-interest"
                className="mt-5 inline-flex items-center justify-center w-full h-10 rounded-full border border-border-strong text-[13px] text-ink hover:border-ink transition-colors"
              >
                See all signals
              </Link>
            </div>
          </DataCard>
        </div>
      </section>
    </div>
  );
}
