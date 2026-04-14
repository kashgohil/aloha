import Link from "next/link";
import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import {
  ArrowUpRight,
  CalendarDays,
  Inbox,
  PenSquare,
  Plug,
  Sparkles,
} from "lucide-react";
import { db } from "@/db";
import { posts, accounts } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  github: "GitHub",
  twitter: "X",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
};

export default async function DashboardPage() {
  const user = (await getCurrentUser())!;
  const tz = user.timezone ?? "UTC";

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
  const [counts] = await db
    .select({
      drafts: sql<number>`count(*) filter (where ${posts.status} = 'draft')`,
      scheduled: sql<number>`count(*) filter (where ${posts.status} = 'scheduled')`,
      publishedThisWeek: sql<number>`count(*) filter (where ${posts.status} = 'published' and ${posts.publishedAt} >= ${startOfWeek.toISOString()})`,
    })
    .from(posts)
    .where(eq(posts.userId, user.id));

  const [{ value: connectedChannels }] = await db
    .select({
      value: sql<number>`count(distinct ${accounts.provider})`,
    })
    .from(accounts)
    .where(eq(accounts.userId, user.id));

  const upcoming = await db
    .select({
      id: posts.id,
      content: posts.content,
      platforms: posts.platforms,
      scheduledAt: posts.scheduledAt,
    })
    .from(posts)
    .where(
      and(
        eq(posts.userId, user.id),
        eq(posts.status, "scheduled"),
        gte(posts.scheduledAt, new Date()),
      ),
    )
    .orderBy(posts.scheduledAt)
    .limit(6);

  const recentPublished = await db
    .select({
      id: posts.id,
      content: posts.content,
      platforms: posts.platforms,
      publishedAt: posts.publishedAt,
    })
    .from(posts)
    .where(and(eq(posts.userId, user.id), eq(posts.status, "published")))
    .orderBy(desc(posts.publishedAt))
    .limit(3);

  const [{ value: totalAccounts }] = await db
    .select({ value: count() })
    .from(accounts)
    .where(eq(accounts.userId, user.id));

  const channelProviders = await db
    .selectDistinct({ provider: accounts.provider })
    .from(accounts)
    .where(eq(accounts.userId, user.id));

  // ── View ────────────────────────────────────────────────────────────
  const firstName = (user.name ?? user.email).split(/\s|@/)[0];
  const greeting = greet(new Date(), tz);
  const stats = [
    { label: "Drafts", value: counts.drafts ?? 0, hint: "in the writing room" },
    { label: "Scheduled", value: counts.scheduled ?? 0, hint: "across all channels" },
    {
      label: "Published this week",
      value: counts.publishedThisWeek ?? 0,
      hint: "since Monday",
    },
    {
      label: "Connected channels",
      value: connectedChannels ?? 0,
      hint: totalAccounts > 0 ? `${totalAccounts} account${totalAccounts > 1 ? "s" : ""}` : "none yet",
    },
  ];

  return (
    <div className="space-y-14">
      {/* Greeting */}
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            {user.workspaceName ?? "Your workspace"} · {formatToday(new Date(), tz)}
          </p>
          <h1 className="mt-3 font-display text-[44px] lg:text-[56px] leading-[1.02] tracking-[-0.03em] text-ink font-normal">
            {greeting}, {firstName}
            <span className="text-ink/25">.</span>
          </h1>
          <p className="mt-3 text-[15px] text-ink/65 max-w-xl leading-[1.55]">
            Here&apos;s what&apos;s on your calendar and what&apos;s landed
            since Monday.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/app/calendar"
            className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full border border-border-strong text-[14px] font-medium text-ink hover:border-ink transition-colors"
          >
            <CalendarDays className="w-4 h-4" />
            Open calendar
          </Link>
          <Link
            href="/app/composer"
            className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
          >
            <PenSquare className="w-4 h-4" />
            Compose
          </Link>
        </div>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <article
            key={s.label}
            className="rounded-2xl border border-border bg-background-elev p-5"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/55">
              {s.label}
            </p>
            <p className="mt-3 font-display text-[40px] leading-none tracking-[-0.025em] text-ink">
              {s.value}
            </p>
            <p className="mt-2 text-[12px] text-ink/55">{s.hint}</p>
          </article>
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
            actionHref="/app/calendar"
          />

          {upcoming.length === 0 ? (
            <EmptyCard
              icon={Sparkles}
              title="Your queue is empty."
              body="Compose your first post — pick a channel, write a draft, and schedule when it goes out."
              ctaLabel="Open Composer"
              ctaHref="/app/composer"
            />
          ) : (
            <ul className="rounded-2xl border border-border bg-background-elev divide-y divide-border overflow-hidden">
              {upcoming.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/app/composer?post=${p.id}`}
                    className="group flex items-start gap-5 px-5 py-4 hover:bg-muted/40 transition-colors"
                  >
                    <div className="w-[88px] shrink-0 text-[12px] text-ink/55 leading-[1.4]">
                      <p className="text-ink font-medium">
                        {formatDay(p.scheduledAt!, tz)}
                      </p>
                      <p>{formatTime(p.scheduledAt!, tz)}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14.5px] text-ink leading-[1.5] line-clamp-2">
                        {p.content}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {p.platforms.map((pl) => (
                          <span
                            key={pl}
                            className="inline-flex items-center h-6 px-2 rounded-full bg-peach-100 border border-border text-[11px] text-ink/75"
                          >
                            {PROVIDER_LABELS[pl] ?? pl}
                          </span>
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
                actionLabel="Open analytics"
                actionHref="/analytics"
              />
              <ul className="rounded-2xl border border-border bg-background-elev divide-y divide-border overflow-hidden">
                {recentPublished.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-start gap-5 px-5 py-4"
                  >
                    <div className="w-[88px] shrink-0 text-[12px] text-ink/55 leading-[1.4]">
                      <p className="text-ink font-medium">
                        {p.publishedAt ? formatDay(p.publishedAt, tz) : "—"}
                      </p>
                      <p>{p.publishedAt ? formatTime(p.publishedAt, tz) : ""}</p>
                    </div>
                    <p className="flex-1 text-[14px] text-ink/80 leading-[1.5] line-clamp-2">
                      {p.content}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          <ChannelsCard providers={channelProviders.map((c) => c.provider)} />

          <article className="rounded-2xl border border-border bg-peach-100/60 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
              From the field
            </p>
            <p className="mt-4 font-display text-[22px] leading-[1.2] tracking-[-0.01em] text-ink italic">
              &ldquo;Show up consistently. Skip the rest.&rdquo;
            </p>
            <p className="mt-4 text-[13px] text-ink/65 leading-[1.55]">
              Most of the lift comes from cadence. Keep your queue full one
              week at a time and the rest takes care of itself.
            </p>
            <Link
              href="/resources/field-notes"
              className="mt-5 pencil-link inline-flex items-center gap-1 text-[13px] text-ink"
            >
              Read more field notes
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </article>

          <article className="rounded-2xl border border-border bg-background-elev p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
              Engagement
            </p>
            <div className="mt-4 flex items-start gap-4">
              <span className="w-10 h-10 rounded-full bg-peach-100 border border-border grid place-items-center shrink-0">
                <Inbox className="w-4 h-4 text-ink" />
              </span>
              <div className="flex-1">
                <p className="text-[14px] text-ink font-medium">
                  Inbox is up to date
                </p>
                <p className="mt-1 text-[12.5px] text-ink/60 leading-[1.5]">
                  No new replies, mentions, or DMs need triage right now.
                </p>
              </div>
            </div>
            <Link
              href="/inbox"
              className="mt-5 inline-flex items-center justify-center w-full h-10 rounded-full border border-border-strong text-[13px] text-ink hover:border-ink transition-colors"
            >
              Open Inbox
            </Link>
          </article>
        </aside>
      </section>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────

function SectionHeader({
  eyebrow,
  title,
  actionLabel,
  actionHref,
}: {
  eyebrow: string;
  title: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          {eyebrow}
        </p>
        <h2 className="mt-1.5 font-display text-[26px] leading-[1.1] tracking-[-0.02em] text-ink">
          {title}
        </h2>
      </div>
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="pencil-link text-[13px] text-ink/70 hover:text-ink"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

function EmptyCard({
  icon: Icon,
  title,
  body,
  ctaLabel,
  ctaHref,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border-strong bg-background-elev px-8 py-12 text-center">
      <span className="inline-grid place-items-center w-12 h-12 rounded-full bg-peach-100 border border-border">
        <Icon className="w-5 h-5 text-ink" />
      </span>
      <p className="mt-5 font-display text-[24px] leading-[1.15] tracking-[-0.01em] text-ink">
        {title}
      </p>
      <p className="mt-2 text-[13.5px] text-ink/60 max-w-md mx-auto leading-[1.55]">
        {body}
      </p>
      <Link
        href={ctaHref}
        className="mt-6 inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
      >
        <PenSquare className="w-4 h-4" />
        {ctaLabel}
      </Link>
    </div>
  );
}

function ChannelsCard({ providers }: { providers: string[] }) {
  const hasAny = providers.length > 0;
  return (
    <article className="rounded-2xl border border-border bg-background-elev p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            Channels
          </p>
          <p className="mt-1.5 font-display text-[20px] leading-[1.15] text-ink">
            {hasAny ? `${providers.length} connected` : "No channels yet"}
          </p>
        </div>
        <Link
          href="/app/settings/channels"
          className="pencil-link text-[12.5px] text-ink/70 hover:text-ink"
        >
          Manage
        </Link>
      </div>
      {hasAny ? (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {providers.map((p) => (
            <li
              key={p}
              className={cn(
                "inline-flex items-center h-7 px-2.5 rounded-full bg-peach-100 border border-border",
                "text-[12px] text-ink/80",
              )}
            >
              {PROVIDER_LABELS[p] ?? p}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[13px] text-ink/60 leading-[1.5]">
          Connect your first channel from Settings to start scheduling posts.
        </p>
      )}
      <Link
        href="/app/settings"
        className="mt-5 inline-flex items-center justify-center w-full h-10 rounded-full border border-border-strong text-[13px] text-ink hover:border-ink transition-colors"
      >
        <Plug className="w-3.5 h-3.5 mr-1.5" />
        {hasAny ? "Add another" : "Connect a channel"}
      </Link>
    </article>
  );
}

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
