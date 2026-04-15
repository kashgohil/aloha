import { db } from "@/db";
import { posts } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { cn } from "@/lib/utils";
import { and, eq, gte, lt } from "drizzle-orm";
import {
	AlertCircle,
	CalendarPlus,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	Clock,
	Sparkles,
} from "lucide-react";
import Link from "next/link";
import { GridScroll } from "./grid-scroll";
import { ViewSelect } from "./view-select";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type ViewMode = "month" | "week" | "day";
type PostRow = {
	id: string;
	content: string;
	platforms: string[];
	status: string;
	scheduledAt: Date | null;
	publishedAt: Date | null;
};

const first = (v: string | string[] | undefined) =>
	Array.isArray(v) ? v[0] : v;

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOUR_HEIGHT = 96;

export default async function CalendarPage({
	searchParams,
}: {
	searchParams: SearchParams;
}) {
	const user = (await getCurrentUser())!;
	const tz = user.timezone ?? "UTC";

	const params = await searchParams;
	const view = parseView(first(params.view));
	const anchor = parseAnchor(first(params.date), tz);
	const anchorKey = dateKey(anchor);

	const {
		from: rangeFrom,
		to: rangeTo,
		keys: rangeKeys,
	} = computeRange(view, anchor, tz);

	// UTC overshoot, then bucket by tz-local date.
	const fetchFrom = new Date(rangeFrom);
	fetchFrom.setUTCDate(fetchFrom.getUTCDate() - 2);
	const fetchTo = new Date(rangeTo);
	fetchTo.setUTCDate(fetchTo.getUTCDate() + 2);

	const rows: PostRow[] = await db
		.select({
			id: posts.id,
			content: posts.content,
			platforms: posts.platforms,
			status: posts.status,
			scheduledAt: posts.scheduledAt,
			publishedAt: posts.publishedAt,
		})
		.from(posts)
		.where(
			and(
				eq(posts.userId, user.id),
				gte(posts.scheduledAt, fetchFrom),
				lt(posts.scheduledAt, fetchTo),
			),
		);

	const buckets = new Map<string, PostRow[]>();
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
	const sub = buildSubLabel(view, postsInView);

	return (
		<div className="space-y-10">
			{/* Header */}
			<header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
				<div>
					<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
						{user.workspaceName ?? "Your workspace"} · {tz}
					</p>
					<h1 className="mt-3 font-display text-[44px] lg:text-[52px] leading-[1.02] tracking-[-0.03em] text-ink font-normal">
						{header.main}{" "}
						<span className="text-primary font-light">{header.accent}</span>
					</h1>
					<p className="mt-3 text-[14px] text-ink/65">{sub}</p>
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

					<Link
						href="/app/composer"
						className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-ink text-background text-[13.5px] font-medium hover:bg-primary transition-colors"
					>
						<CalendarPlus className="w-4 h-4" />
						New post
					</Link>
				</div>
			</header>

			{/* View */}
			{view === "month" ? (
				<MonthView
					anchor={anchor}
					tz={tz}
					buckets={buckets}
					todayKey={todayKey}
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
				/>
			)}

			{/* Legend */}
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
}: {
	anchor: Date;
	tz: string;
	buckets: Map<string, PostRow[]>;
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
										href={`/app/composer?day=${cell.key}`}
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
											href={`/app/composer?post=${p.id}`}
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
												{p.content}
											</p>
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
}: {
	days: GridDay[];
	tz: string;
	buckets: Map<string, PostRow[]>;
	todayKey: string;
	compact: boolean;
}) {
	const hours = Array.from({ length: 24 }, (_, i) => i);
	const gridCols = `72px repeat(${days.length}, minmax(0, 1fr))`;

	return (
		<section className="rounded-3xl border border-border bg-background-elev overflow-hidden">
			{/* Day headers (fixed above scroll area) */}
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

			{/* Scrollable time grid */}
			<GridScroll initialHour={7} hourHeight={HOUR_HEIGHT}>
				<div
					className="grid relative"
					style={{
						gridTemplateColumns: gridCols,
						gridTemplateRows: `repeat(24, ${HOUR_HEIGHT}px)`,
					}}
				>
					{/* Hour labels */}
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

					{/* Day/hour cells */}
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

					{/* Posts as absolutely-positioned chips */}
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
										href={`/app/composer?post=${p.id}`}
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
											{p.content}
										</p>
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
	view: ViewMode;
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

// ── View & header helpers ──────────────────────────────────────────────

function parseView(v: string | undefined): ViewMode {
	if (v === "week" || v === "day") return v;
	return "month";
}

// Anchor is a Date at UTC noon of the intended calendar day, so UTC
// date components equal the tz calendar day for every IANA tz.
function parseAnchor(input: string | undefined, tz: string): Date {
	if (input && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
		const [y, m, d] = input.split("-").map(Number);
		return new Date(Date.UTC(y, m - 1, d, 12));
	}
	const [y, m, d] = tzDateKey(new Date(), tz).split("-").map(Number);
	return new Date(Date.UTC(y, m - 1, d, 12));
}

function dateKey(d: Date): string {
	const y = d.getUTCFullYear();
	const m = String(d.getUTCMonth() + 1).padStart(2, "0");
	const day = String(d.getUTCDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

function shiftAnchor(view: ViewMode, anchor: Date, delta: 1 | -1): Date {
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
	view: ViewMode,
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
			keys.push(
				`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
			);
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
	// day
	const from = new Date(anchor);
	from.setUTCHours(0, 0, 0, 0);
	const to = new Date(from);
	to.setUTCDate(to.getUTCDate() + 1);
	return { from, to, keys: [tzDateKey(anchor, tz)] };
}

function buildHeader(
	view: ViewMode,
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

function buildSubLabel(view: ViewMode, count: number): string {
	if (count === 0) {
		if (view === "month")
			return "A clear month. Queue a post to start filling it in.";
		if (view === "week") return "Nothing on the books this week.";
		return "Nothing scheduled for this day.";
	}
	const plural = count === 1 ? "" : "s";
	if (view === "month") return `${count} post${plural} across the month.`;
	if (view === "week") return `${count} post${plural} this week.`;
	return `${count} post${plural} scheduled.`;
}

// ── Date helpers ───────────────────────────────────────────────────────

function tzDateKey(d: Date, tz: string) {
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

function buildWeekDays(anchor: Date, tz: string): GridDay[] {
	const weekdayTz = tzWeekdayIndex(anchor, tz); // Mon=0..Sun=6
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
