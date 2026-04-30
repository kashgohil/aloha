import { db } from "@/db";
import { campaigns, posts } from "@/db/schema";
import { getCurrentContext } from "@/lib/current-context";
import { hasMuseInviteEntitlement } from "@/lib/billing/muse";
import { and, eq, gte, lt } from "drizzle-orm";
import {
	buildWeekDays,
	CalendarView,
	type CalendarPostRow,
	type CalendarViewMode,
	dateKey,
	tzDateKey,
} from "./_components/calendar-view";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (v: string | string[] | undefined) =>
	Array.isArray(v) ? v[0] : v;

export default async function CalendarPage({
	searchParams,
}: {
	searchParams: SearchParams;
}) {
	const ctx = (await getCurrentContext())!;
	const { user, workspace } = ctx;
	const tz = workspace.timezone ?? user.timezone ?? "UTC";
	const museAccess = await hasMuseInviteEntitlement(user.id);

	const params = await searchParams;
	const view = parseView(first(params.view));
	const anchor = parseAnchor(first(params.date), tz);
	const anchorKey = dateKey(anchor);

	const { from: rangeFrom, to: rangeTo, keys: rangeKeys } = computeRange(
		view,
		anchor,
		tz,
	);

	const fetchFrom = new Date(rangeFrom);
	fetchFrom.setUTCDate(fetchFrom.getUTCDate() - 2);
	const fetchTo = new Date(rangeTo);
	fetchTo.setUTCDate(fetchTo.getUTCDate() + 2);

	const [rows, userCampaigns] = await Promise.all([
		db
			.select({
				id: posts.id,
				content: posts.content,
				channelContent: posts.channelContent,
				platforms: posts.platforms,
				status: posts.status,
				scheduledAt: posts.scheduledAt,
				publishedAt: posts.publishedAt,
				campaignId: posts.campaignId,
			})
			.from(posts)
			.where(
				and(
					eq(posts.workspaceId, workspace.id),
					gte(posts.scheduledAt, fetchFrom),
					lt(posts.scheduledAt, fetchTo),
				),
			) as Promise<CalendarPostRow[]>,
		db
			.select({
				id: campaigns.id,
				name: campaigns.name,
			})
			.from(campaigns)
			.where(eq(campaigns.workspaceId, workspace.id)),
	]);

	const campaignIndex = new Map<string, { name: string; colorIdx: number }>();
	userCampaigns.forEach((c, i) => {
		campaignIndex.set(c.id, { name: c.name, colorIdx: i });
	});

	const buckets = new Map<string, CalendarPostRow[]>();
	for (const r of rows) {
		const anchorTs = r.scheduledAt ?? r.publishedAt;
		if (!anchorTs) continue;
		const key = tzDateKey(anchorTs, tz);
		const list = buckets.get(key) ?? [];
		list.push(r);
		buckets.set(key, list);
	}

	const todayKey = tzDateKey(new Date(), tz);
	const prevAnchor = shiftAnchor(view, anchor, -1);
	const nextAnchor = shiftAnchor(view, anchor, 1);

	const rangeKeySet = new Set(rangeKeys);
	const postsInView = rows.filter((r) => {
		const when = r.scheduledAt ?? r.publishedAt;
		if (!when) return false;
		return rangeKeySet.has(tzDateKey(when, tz));
	}).length;

	const header = buildHeader(view, anchor, tz);
	const subLabel = buildSubLabel(view, postsInView);

	return (
		<CalendarView
			view={view}
			tz={tz}
			workspaceName={user.workspaceName}
			header={header}
			subLabel={subLabel}
			anchor={anchor}
			anchorKey={anchorKey}
			prevAnchor={prevAnchor}
			nextAnchor={nextAnchor}
			buckets={buckets}
			todayKey={todayKey}
			campaignIndex={campaignIndex}
			museAccess={museAccess}
		/>
	);
}

// ── View & header helpers ──────────────────────────────────────────────

function parseView(v: string | undefined): CalendarViewMode {
	if (v === "week" || v === "day") return v;
	return "month";
}

function parseAnchor(input: string | undefined, tz: string): Date {
	if (input && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
		const [y, m, d] = input.split("-").map(Number);
		return new Date(Date.UTC(y, m - 1, d, 12));
	}
	const [y, m, d] = tzDateKey(new Date(), tz).split("-").map(Number);
	return new Date(Date.UTC(y, m - 1, d, 12));
}

function shiftAnchor(view: CalendarViewMode, anchor: Date, delta: 1 | -1): Date {
	if (view === "month") {
		const y = anchor.getUTCFullYear();
		const m = anchor.getUTCMonth();
		return new Date(Date.UTC(y, m + delta, 15, 12));
	}
	const step = view === "week" ? 7 : 1;
	const result = new Date(anchor);
	result.setUTCDate(result.getUTCDate() + delta * step);
	return result;
}

function computeRange(
	view: CalendarViewMode,
	anchor: Date,
	tz: string,
): { from: Date; to: Date; keys: string[] } {
	if (view === "month") {
		const [y, m] = tzDateKey(anchor, tz).split("-").map(Number);
		const from = new Date(Date.UTC(y, m - 1, 1));
		const to = new Date(Date.UTC(y, m, 1));
		const keys: string[] = [];
		const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
		for (let d = 1; d <= last; d++) {
			keys.push(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
		}
		return { from, to, keys };
	}
	if (view === "week") {
		const days = buildWeekDays(anchor, tz);
		const from = new Date(days[0].date);
		const to = new Date(days[6].date);
		to.setUTCDate(to.getUTCDate() + 1);
		return { from, to, keys: days.map((d) => d.key) };
	}
	const from = new Date(anchor);
	from.setUTCHours(0, 0, 0, 0);
	const to = new Date(from);
	to.setUTCDate(to.getUTCDate() + 1);
	return { from, to, keys: [tzDateKey(anchor, tz)] };
}

function buildHeader(
	view: CalendarViewMode,
	anchor: Date,
	tz: string,
): { main: string; accent: string } {
	if (view === "month") {
		const monthLabel = new Intl.DateTimeFormat("en-US", {
			month: "long",
			timeZone: tz,
		}).format(anchor);
		const year = new Intl.DateTimeFormat("en-US", {
			year: "numeric",
			timeZone: tz,
		}).format(anchor);
		return { main: monthLabel, accent: year };
	}
	if (view === "week") {
		const days = buildWeekDays(anchor, tz);
		const startKey = days[0].key;
		const endKey = days[6].key;
		const startMonth = new Intl.DateTimeFormat("en-US", {
			month: "short",
			timeZone: tz,
		}).format(days[0].date);
		const endMonth = new Intl.DateTimeFormat("en-US", {
			month: "short",
			timeZone: tz,
		}).format(days[6].date);
		const startDay = Number(startKey.slice(8, 10));
		const endDay = Number(endKey.slice(8, 10));
		const main =
			startMonth === endMonth
				? `${startMonth} ${startDay} – ${endDay}`
				: `${startMonth} ${startDay} – ${endMonth} ${endDay}`;
		const accent = endKey.slice(0, 4);
		return { main, accent };
	}
	const weekday = new Intl.DateTimeFormat("en-US", {
		weekday: "long",
		timeZone: tz,
	}).format(anchor);
	const monthDay = new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		timeZone: tz,
	}).format(anchor);
	const year = new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		timeZone: tz,
	}).format(anchor);
	return { main: `${weekday}, ${monthDay}`, accent: year };
}

function buildSubLabel(view: CalendarViewMode, count: number): string {
	if (count === 0) {
		if (view === "month") return "A clear month. Queue a post to start filling it in.";
		if (view === "week") return "Nothing on the books this week.";
		return "Nothing scheduled for this day.";
	}
	const plural = count === 1 ? "" : "s";
	if (view === "month") return `${count} post${plural} across the month.`;
	if (view === "week") return `${count} post${plural} this week.`;
	return `${count} post${plural} scheduled.`;
}
