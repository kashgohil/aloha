import {
	BlueskyIcon,
	FacebookIcon,
	InstagramIcon,
	LinkedInIcon,
	MediumIcon,
	TikTokIcon,
	XIcon,
} from "@/app/auth/_components/provider-icons";
import { db } from "@/db";
import {
	accounts,
	blueskyCredentials,
	brandCorpus,
	campaigns,
	contentPlans,
	feedItems,
	feeds,
	ideas,
	inboxMessages,
	notionCredentials,
	platformInsights,
	posts,
} from "@/db/schema";
import { AUTH_ONLY_PROVIDERS } from "@/lib/auth-providers";
import { PLATFORM_GATING } from "@/lib/channel-state";
import { getCurrentUser } from "@/lib/current-user";
import { cn } from "@/lib/utils";
import { and, count, desc, eq, gte, notInArray, sql } from "drizzle-orm";
import {
	ArrowUpRight,
	BarChart3,
	BookOpen,
	CalendarDays,
	Inbox,
	Lightbulb,
	Megaphone,
	PenSquare,
	Plug,
	Sparkles,
	Wand2,
} from "lucide-react";
import Link from "next/link";

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

const PROVIDER_ICONS: Record<
	string,
	React.ComponentType<{ className?: string }>
> = {
	twitter: XIcon,
	linkedin: LinkedInIcon,
	facebook: FacebookIcon,
	instagram: InstagramIcon,
	tiktok: TikTokIcon,
	bluesky: BlueskyIcon,
	medium: MediumIcon,
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

	const [channelsCount] = await db
		.select({
			value: sql<number>`count(distinct ${accounts.provider})`,
		})
		.from(accounts)
		.where(
			and(
				eq(accounts.userId, user.id),
				notInArray(accounts.provider, AUTH_ONLY_PROVIDERS),
			),
		);

	const [hasBlueskyCount] = await db
		.select({ value: count() })
		.from(blueskyCredentials)
		.where(eq(blueskyCredentials.userId, user.id));

	const connectedChannels =
		Number(channelsCount.value ?? 0) + Number(hasBlueskyCount.value ?? 0);

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
		.where(
			and(
				eq(accounts.userId, user.id),
				notInArray(accounts.provider, AUTH_ONLY_PROVIDERS),
			),
		);

	const [hasBluesky] = await db
		.select({ value: sql<number>`1` })
		.from(blueskyCredentials)
		.where(eq(blueskyCredentials.userId, user.id))
		.limit(1);

	const channelProviders = await db
		.selectDistinct({ provider: accounts.provider })
		.from(accounts)
		.where(
			and(
				eq(accounts.userId, user.id),
				notInArray(accounts.provider, AUTH_ONLY_PROVIDERS),
			),
		);

	const allProviders = [
		...channelProviders.map((c) => c.provider),
		...(hasBluesky ? ["bluesky" as const] : []),
	];

	// Reach over the last 7 days, per platform, from the nightly read-back
	// cache. Only platforms that have returned data show up; gated channels
	// (Meta / TikTok / YouTube until approval) are surfaced separately so
	// the card is honest about what's missing vs. what's zero.
	const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
	const reachRows = await db
		.select({
			platform: platformInsights.platform,
			impressions: sql<string>`COALESCE(SUM(NULLIF(${platformInsights.metrics}->>'impressions', '')::bigint), 0)`,
			posts: sql<number>`COUNT(*)`,
		})
		.from(platformInsights)
		.where(
			and(
				eq(platformInsights.userId, user.id),
				gte(platformInsights.platformPostedAt, sevenDaysAgo),
			),
		)
		.groupBy(platformInsights.platform);

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

	// ── Phase 3 surfaces ────────────────────────────────────────────────
	const [
		activePlan,
		activeCampaign,
		ideaCounts,
		freshIdeas,
		feedTotals,
		latestFeedItems,
		inboxTotals,
		notionRows,
		notionDocCount,
	] = await Promise.all([
		// Latest plan with at least one un-accepted idea; surface as "Pick up
		// where you left off."
		db
			.select({
				id: contentPlans.id,
				goal: contentPlans.goal,
				rangeStart: contentPlans.rangeStart,
				rangeEnd: contentPlans.rangeEnd,
				status: contentPlans.status,
				ideas: contentPlans.ideas,
			})
			.from(contentPlans)
			.where(eq(contentPlans.userId, user.id))
			.orderBy(desc(contentPlans.createdAt))
			.limit(1),

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
					eq(campaigns.userId, user.id),
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
			.where(eq(ideas.userId, user.id)),

		db
			.select({
				id: ideas.id,
				title: ideas.title,
				body: ideas.body,
				source: ideas.source,
				createdAt: ideas.createdAt,
			})
			.from(ideas)
			.where(and(eq(ideas.userId, user.id), eq(ideas.status, "new")))
			.orderBy(desc(ideas.createdAt))
			.limit(3),

		db
			.select({
				total: count(),
				unread: sql<number>`count(*) filter (where ${feedItems.isRead} = false)`,
			})
			.from(feedItems)
			.innerJoin(feeds, eq(feedItems.feedId, feeds.id))
			.where(eq(feeds.userId, user.id)),

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
			.where(eq(feeds.userId, user.id))
			.orderBy(desc(feedItems.publishedAt))
			.limit(3),

		db
			.select({
				total: count(),
				unread: sql<number>`count(*) filter (where ${inboxMessages.isRead} = false)`,
			})
			.from(inboxMessages)
			.where(eq(inboxMessages.userId, user.id)),

		db
			.select({
				workspaceName: notionCredentials.workspaceName,
				lastSyncedAt: notionCredentials.lastSyncedAt,
				reauthRequired: notionCredentials.reauthRequired,
			})
			.from(notionCredentials)
			.where(eq(notionCredentials.userId, user.id))
			.limit(1),

		db
			.select({ total: count() })
			.from(brandCorpus)
			.where(
				and(eq(brandCorpus.userId, user.id), eq(brandCorpus.source, "notion")),
			),
	]);

	const activePlanRow = activePlan[0] ?? null;
	const planPendingCount = activePlanRow
		? (activePlanRow.ideas as Array<{ accepted?: boolean }>).filter(
				(i) => !i.accepted,
			).length
		: 0;

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

	// ── View ────────────────────────────────────────────────────────────
	const firstName = (user.name ?? user.email).split(/\s|@/)[0];
	const greeting = greet(new Date(), tz);
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
			value: connectedChannels ?? 0,
			hint: (() => {
				const total = Number(totalAccounts) + (hasBluesky ? 1 : 0);
				return total > 0
					? `${total} account${total > 1 ? "s" : ""}`
					: "none yet";
			})(),
			href: "/app/settings/channels",
		},
	];

	return (
		<div className="space-y-14">
			{/* Greeting */}
			<header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
				<div>
					<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
						{user.workspaceName ?? "Your workspace"} ·{" "}
						{formatToday(new Date(), tz)}
					</p>
					<h1 className="mt-3 font-display text-[44px] lg:text-[56px] leading-[1.02] tracking-[-0.03em] text-ink font-normal">
						{greeting}, <span className="text-primary">{firstName}</span>
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
											<p className="text-[14.5px] text-ink leading-normal line-clamp-2">
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
										<p className="flex-1 text-[14px] text-ink/80 leading-normal line-clamp-2">
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

					{activePlanRow && planPendingCount > 0 ? (
						<ActivePlanCard
							planId={activePlanRow.id}
							goal={activePlanRow.goal}
							pending={planPendingCount}
							rangeStart={activePlanRow.rangeStart}
							rangeEnd={activePlanRow.rangeEnd}
						/>
					) : null}

					<IdeasCard
						newCount={newIdeaCount}
						totalCount={totalIdeaCount}
						fresh={freshIdeas}
					/>

					<ChannelsCard providers={allProviders} />

					<KnowledgeCard
						connected={!!notion}
						workspaceName={notion?.workspaceName ?? null}
						reauthRequired={notion?.reauthRequired ?? false}
						lastSyncedAt={notion?.lastSyncedAt ?? null}
						docCount={notionDocs}
						tz={tz}
					/>

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
						/>
					) : null}

					<EngagementCard unread={unreadInboxCount} total={totalInboxCount} />
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

const CAMPAIGN_KIND_LABELS: Record<string, string> = {
	launch: "Launch",
	webinar: "Webinar",
	sale: "Sale",
	drip: "Drip",
	evergreen: "Evergreen",
	custom: "Custom",
};

function ActiveCampaignCard({
	campaignId,
	name,
	kind,
	pending,
	accepted,
	total,
	rangeStart,
	rangeEnd,
}: {
	campaignId: string;
	name: string;
	kind: string;
	pending: number;
	accepted: number;
	total: number;
	rangeStart: Date;
	rangeEnd: Date;
}) {
	const fmt = (d: Date) =>
		new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
			d,
		);
	const pct = total > 0 ? Math.round((accepted / total) * 100) : 0;
	return (
		<article className="rounded-2xl border border-primary/40 bg-primary-soft/40 p-6">
			<div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.22em] text-ink/55">
				<span className="inline-flex items-center gap-1.5 font-semibold">
					<Megaphone className="w-3 h-3" />
					Campaign
				</span>
				<span>{CAMPAIGN_KIND_LABELS[kind] ?? kind}</span>
			</div>
			<p className="mt-2 font-display text-[20px] leading-tight tracking-[-0.01em] text-ink">
				{name}
			</p>
			<p className="mt-1.5 text-[12.5px] text-ink/60">
				{accepted} of {total} beats drafted
				{pending > 0 ? ` · ${pending} pending` : ""} · {fmt(rangeStart)} →{" "}
				{fmt(rangeEnd)}
			</p>
			<div className="mt-3 h-1.5 rounded-full bg-background border border-border overflow-hidden">
				<div
					className="h-full bg-primary"
					style={{ width: `${pct}%` }}
					aria-label={`${pct}% drafted`}
				/>
			</div>
			<Link
				href={`/app/campaigns/${campaignId}`}
				className="mt-5 inline-flex items-center justify-center w-full h-10 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors"
			>
				<Megaphone className="w-3.5 h-3.5 mr-1.5" />
				Review beats
			</Link>
		</article>
	);
}

function ActivePlanCard({
	planId,
	goal,
	pending,
	rangeStart,
	rangeEnd,
}: {
	planId: string;
	goal: string;
	pending: number;
	rangeStart: Date;
	rangeEnd: Date;
}) {
	const fmt = (d: Date) =>
		new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
			d,
		);
	return (
		<article className="rounded-2xl border border-primary/40 bg-primary-soft/40 p-6">
			<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
				Muse plan · pending
			</p>
			<p className="mt-2 font-display text-[20px] leading-tight tracking-[-0.01em] text-ink">
				{goal}
			</p>
			<p className="mt-1.5 text-[12.5px] text-ink/60">
				{pending} idea{pending === 1 ? "" : "s"} waiting · {fmt(rangeStart)} →{" "}
				{fmt(rangeEnd)}
			</p>
			<Link
				href={`/app/calendar/plan?id=${planId}`}
				className="mt-5 inline-flex items-center justify-center w-full h-10 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors"
			>
				<Wand2 className="w-3.5 h-3.5 mr-1.5" />
				Review plan
			</Link>
		</article>
	);
}

function IdeasCard({
	newCount,
	totalCount,
	fresh,
}: {
	newCount: number;
	totalCount: number;
	fresh: Array<{
		id: string;
		title: string | null;
		body: string;
		source: string;
		createdAt: Date;
	}>;
}) {
	return (
		<article className="rounded-2xl border border-border bg-background-elev p-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
						Ideas
					</p>
					<p className="mt-1.5 font-display text-[20px] leading-[1.15] text-ink">
						{newCount > 0
							? `${newCount} new`
							: totalCount > 0
								? "Caught up"
								: "Empty swipe file"}
					</p>
				</div>
				<Link
					href="/app/ideas"
					className="pencil-link text-[12.5px] text-ink/70 hover:text-ink"
				>
					All ideas
				</Link>
			</div>
			{fresh.length > 0 ? (
				<ul className="mt-4 space-y-2">
					{fresh.map((idea) => (
						<li key={idea.id}>
							<Link
								href={`/app/composer?idea=${idea.id}`}
								className="group flex items-start gap-2.5 text-[13px] text-ink/80 hover:text-ink transition-colors"
							>
								<Lightbulb className="w-3.5 h-3.5 mt-[3px] text-primary shrink-0" />
								<span className="line-clamp-2 leading-[1.4]">
									{idea.title ?? idea.body}
								</span>
							</Link>
						</li>
					))}
				</ul>
			) : (
				<p className="mt-3 text-[12.5px] text-ink/55 leading-normal">
					Capture something worth coming back to — a hook, a story, a link.
				</p>
			)}
			<Link
				href="/app/ideas"
				className="mt-5 inline-flex items-center justify-center w-full h-10 rounded-full border border-border-strong text-[13px] text-ink hover:border-ink transition-colors"
			>
				<Lightbulb className="w-3.5 h-3.5 mr-1.5" />
				Capture new
			</Link>
		</article>
	);
}

function FeedDigestCard({
	unread,
	total,
	items,
}: {
	unread: number;
	total: number;
	items: Array<{
		id: string;
		title: string;
		url: string | null;
		publishedAt: Date | null;
		feedTitle: string;
		isRead: boolean;
	}>;
}) {
	return (
		<article className="rounded-2xl border border-border bg-background-elev p-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
						Feeds
					</p>
					<p className="mt-1.5 font-display text-[20px] leading-[1.15] text-ink">
						{unread > 0 ? `${unread} unread` : `${total} items`}
					</p>
				</div>
				<Link
					href="/app/feeds"
					className="pencil-link text-[12.5px] text-ink/70 hover:text-ink"
				>
					Reader
				</Link>
			</div>
			<ul className="mt-4 space-y-3">
				{items.map((item) => (
					<li key={item.id}>
						<a
							href={item.url ?? "#"}
							target="_blank"
							rel="noopener noreferrer"
							className={cn(
								"block text-[13px] leading-[1.45] hover:text-ink transition-colors",
								item.isRead ? "text-ink/60" : "text-ink/85",
							)}
						>
							<span className="block text-[11px] uppercase tracking-[0.16em] text-ink/45 mb-0.5">
								{item.feedTitle}
							</span>
							<span className="line-clamp-2">{item.title}</span>
						</a>
					</li>
				))}
			</ul>
		</article>
	);
}

function EngagementCard({ unread, total }: { unread: number; total: number }) {
	const hasUnread = unread > 0;
	return (
		<article className="rounded-2xl border border-border bg-background-elev p-6">
			<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
				Engagement
			</p>
			<div className="mt-4 flex items-start gap-4">
				<span
					className={cn(
						"w-10 h-10 rounded-full border grid place-items-center shrink-0",
						hasUnread
							? "bg-primary-soft border-primary/40"
							: "bg-peach-100 border-border",
					)}
				>
					<Inbox className="w-4 h-4 text-ink" />
				</span>
				<div className="flex-1">
					<p className="text-[14px] text-ink font-medium">
						{hasUnread
							? `${unread} new message${unread === 1 ? "" : "s"}`
							: total > 0
								? "Inbox is up to date"
								: "Nothing in the inbox yet"}
					</p>
					<p className="mt-1 text-[12.5px] text-ink/60 leading-normal">
						{hasUnread
							? "Replies and mentions waiting for triage."
							: total > 0
								? "No new replies, mentions, or DMs need triage right now."
								: "We'll surface replies, mentions, and DMs here once your channels start hearing back."}
					</p>
				</div>
			</div>
			<Link
				href="/app/inbox"
				className="mt-5 inline-flex items-center justify-center w-full h-10 rounded-full border border-border-strong text-[13px] text-ink hover:border-ink transition-colors"
			>
				Open Inbox
			</Link>
		</article>
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
					{providers.map((p) => {
						const Icon = PROVIDER_ICONS[p];
						return (
							<li
								key={p}
								className={cn(
									"inline-flex items-center h-7 px-2.5 rounded-full bg-peach-100 border border-border",
									"text-[12px] text-ink/80 gap-1.5",
								)}
							>
								{Icon && <Icon className="w-3.5 h-3.5" />}
								{PROVIDER_LABELS[p] ?? p}
							</li>
						);
					})}
				</ul>
			) : (
				<p className="mt-3 text-[13px] text-ink/60 leading-normal">
					Connect your first channel from Settings to start scheduling posts.
				</p>
			)}
			<Link
				href="/app/settings/channels"
				className="mt-5 inline-flex items-center justify-center w-full h-10 rounded-full border border-border-strong text-[13px] text-ink hover:border-ink transition-colors"
			>
				<Plug className="w-3.5 h-3.5 mr-1.5" />
				{hasAny ? "Add another" : "Connect a channel"}
			</Link>
		</article>
	);
}

function KnowledgeCard({
	connected,
	workspaceName,
	reauthRequired,
	lastSyncedAt,
	docCount,
	tz,
}: {
	connected: boolean;
	workspaceName: string | null;
	reauthRequired: boolean;
	lastSyncedAt: Date | null;
	docCount: number;
	tz: string;
}) {
	return (
		<article className="rounded-2xl border border-border bg-background-elev p-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
						Knowledge
					</p>
					<p className="mt-3 font-display text-[28px] leading-none tracking-[-0.02em] text-ink">
						{connected ? docCount.toLocaleString() : "—"}
					</p>
					<p className="mt-1 text-[12px] text-ink/55">
						{connected
							? docCount === 1
								? "doc training Muse"
								: "docs training Muse"
							: "train Muse on your writing"}
					</p>
				</div>
				<span className="w-10 h-10 rounded-full bg-peach-100 border border-border grid place-items-center shrink-0">
					<BookOpen className="w-4 h-4 text-ink" />
				</span>
			</div>

			{connected ? (
				<div className="mt-5 space-y-2 text-[12.5px]">
					<div className="flex items-center justify-between text-ink/75">
						<span className="inline-flex items-center gap-2">
							<span className="inline-flex items-center justify-center w-5 h-5 rounded bg-ink text-background text-[10px] font-bold">
								N
							</span>
							Notion
						</span>
						<span className="text-ink/55 truncate max-w-[55%]">
							{reauthRequired
								? "reconnect needed"
								: (workspaceName ?? "connected")}
						</span>
					</div>
					{lastSyncedAt && !reauthRequired ? (
						<p className="text-[11.5px] text-ink/50">
							Last synced {formatDay(lastSyncedAt, tz)} at{" "}
							{formatTime(lastSyncedAt, tz)}
						</p>
					) : null}
				</div>
			) : (
				<p className="mt-5 text-[12.5px] text-ink/60 leading-[1.55]">
					Connect Notion to let Muse learn from the docs you&apos;ve already
					written — not just your last few posts.
				</p>
			)}

			<Link
				href="/app/settings/muse"
				className="mt-5 inline-flex items-center justify-center w-full h-10 rounded-full border border-border-strong text-[13px] text-ink hover:border-ink transition-colors"
			>
				<BookOpen className="w-3.5 h-3.5 mr-1.5" />
				{reauthRequired
					? "Reconnect"
					: connected
						? "Manage sources"
						: "Connect Notion"}
			</Link>
		</article>
	);
}

function ReachCard({
	totalImpressions,
	perPlatform,
	gatedConnectedCount,
}: {
	totalImpressions: number;
	perPlatform: Array<{
		platform: string;
		impressions: number;
		posts: number;
		gated: boolean;
	}>;
	gatedConnectedCount: number;
}) {
	const hasAnyData =
		totalImpressions > 0 || perPlatform.some((p) => p.posts > 0);
	return (
		<article className="rounded-2xl border border-border bg-background-elev p-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
						Reach · last 7 days
					</p>
					<p className="mt-3 font-display text-[32px] leading-none tracking-[-0.02em] text-ink">
						{hasAnyData ? formatCompact(totalImpressions) : "—"}
					</p>
					<p className="mt-1 text-[12px] text-ink/55">
						{hasAnyData ? "impressions" : "syncing nightly"}
					</p>
				</div>
				<span className="w-10 h-10 rounded-full bg-peach-100 border border-border grid place-items-center shrink-0">
					<BarChart3 className="w-4 h-4 text-ink" />
				</span>
			</div>

			{perPlatform.length > 0 ? (
				<ul className="mt-5 space-y-2">
					{perPlatform.map((p) => (
						<li
							key={p.platform}
							className="flex items-center justify-between text-[12.5px]"
						>
							<span className="inline-flex items-center gap-2 text-ink/75">
								{PROVIDER_ICONS[p.platform]
									? (() => {
											const Icon = PROVIDER_ICONS[p.platform];
											return <Icon className="w-3.5 h-3.5" />;
										})()
									: null}
								{PROVIDER_LABELS[p.platform] ?? p.platform}
							</span>
							<span className="text-ink/55">
								{p.gated
									? "awaiting approval"
									: p.posts === 0
										? "no posts yet"
										: `${formatCompact(p.impressions)} · ${p.posts} post${p.posts === 1 ? "" : "s"}`}
							</span>
						</li>
					))}
				</ul>
			) : null}

			{gatedConnectedCount > 0 ? (
				<p className="mt-5 text-[11.5px] text-ink/50 leading-[1.55]">
					{gatedConnectedCount} channel{gatedConnectedCount === 1 ? "" : "s"}{" "}
					waiting on platform approval. We&apos;ll backfill once it lands.
				</p>
			) : null}
		</article>
	);
}

function formatCompact(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 10_000) return `${(n / 1_000).toFixed(0)}K`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
	return n.toLocaleString();
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
