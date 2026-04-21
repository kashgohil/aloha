import { db } from "@/db";
import { automations } from "@/db/schema";
import { hasMuseInviteEntitlement } from "@/lib/billing/muse";
import { getCurrentUser } from "@/lib/current-user";
import { cn } from "@/lib/utils";
import { desc, eq } from "drizzle-orm";
import { Clock, Lock, Pencil, Plus, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { DeleteAutomationButton } from "./_components/delete-confirm";
import { FlowDiagram } from "./_components/flow-diagram";
import { RunsPanel, type RunView } from "./_components/runs-panel";
import { ToggleAutomationButton } from "./_components/toggle-button";
import {
	TEMPLATES,
	TEMPLATE_LIST,
	templateIsComingSoon,
	templateRequiresMuse,
	type AutomationKind,
} from "./_lib/templates";
import { resolveSteps } from "./_lib/steps";
import { getRecentRuns, getRunStats, type RunStats } from "@/lib/automations/runs";
import { simulateRun, toggleAutomation } from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) =>
	Array.isArray(v) ? v[0] : v;

export default async function AutomationsPage({
	searchParams,
}: {
	searchParams: SearchParams;
}) {
	const user = (await getCurrentUser())!;
	const museAccess = await hasMuseInviteEntitlement(user.id);
	const params = await searchParams;
	const selectedId = first(params.id);

	const myAutomations = await db
		.select()
		.from(automations)
		.where(eq(automations.userId, user.id))
		.orderBy(desc(automations.createdAt));

	const hasAutomations = myAutomations.length > 0;
	const selected =
		myAutomations.find((a) => a.id === selectedId) ?? myAutomations[0];
	const selectedTemplate = selected
		? TEMPLATES[selected.kind as AutomationKind]
		: null;

	// Stats (for every automation) and recent runs (for the selected one)
	// are independent of each other and can run concurrently.
	const [stats, selectedRunsRaw] = await Promise.all([
		getRunStats(myAutomations.map((a) => a.id)),
		selected ? getRecentRuns(selected.id) : Promise.resolve([]),
	]);
	const selectedRuns: RunView[] = selectedRunsRaw.map((r) => ({
		id: r.id,
		status: r.status,
		startedAt: r.startedAt,
		finishedAt: r.finishedAt,
		stepResults: r.stepResults,
		error: r.error,
		trigger: r.trigger,
		resumeAt: r.resumeAt,
	}));
	const selectedSteps = selected ? resolveSteps(selected) : [];
	const devMode = process.env.NODE_ENV !== "production";

	return (
		<div className="space-y-12">
			{/* Header */}
			<header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
				<div>
					<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
						Quiet automations
					</p>
					<h1 className="mt-3 font-display text-[44px] lg:text-[52px] leading-[1.02] tracking-[-0.03em] text-ink font-normal">
						Logic Matrix,
						<span className="text-primary"> at ease.</span>
					</h1>
					<p className="mt-3 text-[14px] text-ink/65 max-w-xl leading-[1.55]">
						Small, specific jobs that run in the background so you don&apos;t
						have to think about them. Start from a template, keep what works,
						pause what doesn&apos;t.
					</p>
				</div>
				{hasAutomations ? (
					<Link
						href="/app/automations/new"
						className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors self-start lg:self-auto"
					>
						<Plus className="w-3.5 h-3.5" />
						New automation
					</Link>
				) : null}
			</header>

			{hasAutomations ? (
				<section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
					{/* List */}
					<aside className="lg:col-span-4 space-y-4">
						<SectionHeader
							eyebrow="Your routines"
							title={`${myAutomations.length} running`}
						/>
						<ul className="space-y-2">
							{myAutomations.map((a) => {
								const t = TEMPLATES[a.kind as AutomationKind];
								const isActive = a.id === selected?.id;
								const Icon = t?.icon ?? Sparkles;
								const stat = stats.get(a.id);
								return (
									<li key={a.id}>
										<Link
											href={`/app/automations?id=${a.id}`}
											prefetch={false}
											className={cn(
												"group block rounded-2xl border p-4 transition-colors",
												isActive
													? "bg-background-elev border-ink"
													: "bg-background-elev border-border hover:border-ink",
											)}
										>
											<div className="flex items-start gap-3">
												<span
													className={cn(
														"w-9 h-9 rounded-full grid place-items-center shrink-0 border",
														a.status === "active"
															? "bg-ink border-ink text-background"
															: "bg-peach-100 border-border text-ink/70",
													)}
												>
													<Icon className="w-4 h-4" />
												</span>
												<div className="min-w-0 flex-1">
													<p className="text-[14px] text-ink font-medium truncate">
														{a.name}
													</p>
													<div className="mt-1 flex items-center gap-2 text-[11.5px] text-ink/55">
														<StatusPill status={a.status} />
														<span>·</span>
														<span className="tabular-nums">
															{a.runCount} run{a.runCount === 1 ? "" : "s"}
														</span>
														<SuccessRateChip stat={stat} />
													</div>
													{a.status === "active" && a.nextFireAt ? (
														<p className="mt-1 text-[11px] text-ink/50 tabular-nums">
															Next: {formatFuture(a.nextFireAt)}
														</p>
													) : null}
												</div>
											</div>
										</Link>
									</li>
								);
							})}
						</ul>

						<TemplatePicker museAccess={museAccess} />
					</aside>

					{/* Selected */}
					<div className="lg:col-span-8 space-y-6">
						{selected && selectedTemplate ? (
							<>
								<SelectedHeader
									name={selected.name}
									status={selected.status}
									runCount={selected.runCount}
									lastRunAt={selected.lastRunAt}
									nextFireAt={selected.nextFireAt}
									id={selected.id}
									summary={selectedTemplate.summary}
									devMode={devMode}
								/>
								<FlowDiagram
								steps={selectedSteps}
								kind={selected.kind as AutomationKind}
							/>
								<RunsPanel runs={selectedRuns} steps={selectedSteps} />
							</>
						) : null}
					</div>
				</section>
			) : (
				<EmptyState museAccess={museAccess} />
			)}
		</div>
	);
}

// ── Components ────────────────────────────────────────────────────────

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
	return (
		<div>
			<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
				{eyebrow}
			</p>
			<h2 className="mt-1 font-display text-[22px] leading-[1.1] tracking-[-0.02em] text-ink">
				{title}
			</h2>
		</div>
	);
}

function StatusPill({ status }: { status: string }) {
	const styles: Record<string, string> = {
		active: "bg-peach-100 text-ink border-peach-300",
		paused: "bg-muted text-ink/65 border-border",
		draft: "bg-background border-dashed border-border-strong text-ink/65",
	};
	return (
		<span
			className={cn(
				"inline-flex items-center h-5 px-2 rounded-full border text-[10.5px] font-medium tracking-wide uppercase",
				styles[status] ?? styles.paused,
			)}
		>
			{status}
		</span>
	);
}

function SuccessRateChip({ stat }: { stat: RunStats | undefined }) {
	if (!stat || stat.successRate === null) return null;
	const pct = Math.round(stat.successRate * 100);
	const tone =
		pct >= 95 ? "text-ink" : pct >= 80 ? "text-ink/70" : "text-primary-deep";
	return (
		<>
			<span>·</span>
			<span className={cn("tabular-nums", tone)}>{pct}% 7d</span>
		</>
	);
}

function SelectedHeader({
	name,
	status,
	runCount,
	lastRunAt,
	nextFireAt,
	id,
	summary,
	devMode,
}: {
	name: string;
	status: string;
	runCount: number;
	lastRunAt: Date | null;
	nextFireAt: Date | null;
	id: string;
	summary: string;
	devMode: boolean;
}) {
	return (
		<div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
			<div className="min-w-0">
				<div className="flex items-center gap-3 flex-wrap">
					<StatusPill status={status} />
					{lastRunAt ? (
						<p className="text-[11.5px] text-ink/55">
							Last ran{" "}
							<time dateTime={lastRunAt.toISOString()} className="text-ink">
								{formatRelative(lastRunAt)}
							</time>{" "}
							· {runCount} total
						</p>
					) : (
						<p className="text-[11.5px] text-ink/55">
							Hasn&apos;t run yet — triggers first when its condition fires.
						</p>
					)}
					{status === "active" && nextFireAt ? (
						<p className="text-[11.5px] text-ink/55">
							<span className="text-ink/40">·</span> Next{" "}
							<time dateTime={nextFireAt.toISOString()} className="text-ink">
								{formatFuture(nextFireAt)}
							</time>
						</p>
					) : null}
				</div>
				<h3 className="mt-3 font-display text-[30px] leading-[1.1] tracking-[-0.02em] text-ink">
					{name}
				</h3>
				<p className="mt-2 text-[13.5px] text-ink/65 leading-[1.55] max-w-xl">
					{summary}
				</p>
			</div>
			<div className="flex items-center gap-2 shrink-0">
				<Link
					href={`/app/automations/${id}/edit`}
					className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-border-strong text-[13px] font-medium text-ink hover:border-ink transition-colors"
				>
					<Pencil className="w-3.5 h-3.5" />
					Edit
				</Link>
				{devMode ? (
					<form action={simulateRun}>
						<input type="hidden" name="id" value={id} />
						<input type="hidden" name="outcome" value="success" />
						<button
							type="submit"
							className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-dashed border-border-strong text-[13px] font-medium text-ink/70 hover:text-ink hover:border-ink transition-colors"
							title="Dev only: writes a synthetic run to the history panel"
						>
							<Zap className="w-3.5 h-3.5" />
							Simulate run
						</button>
					</form>
				) : null}
				<form action={toggleAutomation}>
					<input type="hidden" name="id" value={id} />
					<ToggleAutomationButton status={status} />
				</form>
				<DeleteAutomationButton automationId={id} name={name} />
			</div>
		</div>
	);
}

function TemplatePicker({ museAccess }: { museAccess: boolean }) {
	return (
		<div className="rounded-2xl border border-dashed border-border-strong p-4">
			<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
				Add another
			</p>
			<ul className="mt-3 space-y-1.5">
				{TEMPLATE_LIST.map((t) => {
					const comingSoon = templateIsComingSoon(t.kind);
					const locked = !comingSoon && templateRequiresMuse(t.kind) && !museAccess;
					const title = comingSoon
						? "Coming soon — not yet available"
						: locked
							? "Requires Muse — request access to use this template"
							: undefined;
					const row = (
						<>
							<span className="w-8 h-8 rounded-full bg-peach-100 border border-border grid place-items-center shrink-0 text-ink">
								<t.icon className="w-4 h-4" />
							</span>
							<span className="flex-1 min-w-0">
								<span className="block text-[13px] text-ink font-medium truncate">
									{t.name}
								</span>
								{comingSoon ? (
									<span className="block text-[11px] text-ink/55">
										Coming soon
									</span>
								) : locked ? (
									<span className="block text-[11px] text-ink/55">
										Requires Muse
									</span>
								) : null}
							</span>
							{comingSoon ? (
								<Clock className="w-3.5 h-3.5 text-ink/45" />
							) : locked ? (
								<Lock className="w-3.5 h-3.5 text-ink/45" />
							) : (
								<Plus className="w-3.5 h-3.5 text-ink/40 group-hover:text-ink transition-colors" />
							)}
						</>
					);
					if (comingSoon) {
						return (
							<li key={t.kind}>
								<div
									className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left opacity-60 cursor-not-allowed"
									title={title}
									aria-disabled
								>
									{row}
								</div>
							</li>
						);
					}
					const href = locked
						? "/app/settings/muse"
						: `/app/automations/new?kind=${t.kind}`;
					return (
						<li key={t.kind}>
							<Link
								href={href}
								className="group w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-muted/60 transition-colors"
								title={title}
							>
								{row}
							</Link>
						</li>
					);
				})}
			</ul>
		</div>
	);
}

function EmptyState({ museAccess }: { museAccess: boolean }) {
	return (
		<section>
			<SectionHeader
				eyebrow="Start from a template"
				title="Small jobs that pay off every week"
			/>
			<div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
				{TEMPLATE_LIST.map((t) => {
					const comingSoon = templateIsComingSoon(t.kind);
					const locked = !comingSoon && templateRequiresMuse(t.kind) && !museAccess;
					return (
						<article
							key={t.kind}
							className={cn(
								"rounded-2xl border bg-background-elev p-5 flex flex-col",
								comingSoon
									? "border-dashed border-border-strong opacity-60"
									: locked
										? "border-dashed border-border-strong"
										: "border-border",
							)}
							aria-disabled={comingSoon ? true : undefined}
						>
							<span className="w-10 h-10 rounded-full bg-peach-100 border border-border grid place-items-center text-ink">
								<t.icon className="w-4 h-4" />
							</span>
							<h3 className="mt-4 font-display text-[20px] leading-[1.2] tracking-[-0.01em] text-ink">
								{t.name}
							</h3>
							<p className="mt-2 text-[13px] text-ink/65 leading-[1.5] flex-1">
								{t.summary}
							</p>
							{comingSoon ? (
								<span className="mt-5 inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-border-strong text-[13px] font-medium text-ink/70 self-start">
									<Clock className="w-3.5 h-3.5" />
									Coming soon
								</span>
							) : locked ? (
								<Link
									href="/app/settings/muse"
									className="mt-5 inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-border-strong text-[13px] font-medium text-ink hover:border-ink transition-colors self-start"
								>
									<Lock className="w-3.5 h-3.5" />
									Requires Muse — request access
								</Link>
							) : (
								<Link
									href={`/app/automations/new?kind=${t.kind}`}
									className="mt-5 inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors self-start"
								>
									<Sparkles className="w-3.5 h-3.5" />
									Use this template
								</Link>
							)}
						</article>
					);
				})}
			</div>
			<p className="mt-6 text-[12.5px] text-ink/50">
				Templates are stored as routines you can rename, pause, or delete
				anytime.
			</p>
		</section>
	);
}

function formatRelative(d: Date) {
	const delta = Date.now() - d.getTime();
	const minutes = Math.round(delta / 60_000);
	if (minutes < 1) return "just now";
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.round(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.round(hours / 24);
	if (days < 30) return `${days}d ago`;
	return d.toLocaleDateString();
}

function formatFuture(d: Date) {
	const delta = d.getTime() - Date.now();
	if (delta <= 0) return "any moment";
	const minutes = Math.round(delta / 60_000);
	if (minutes < 1) return "in under a minute";
	if (minutes < 60) return `in ${minutes}m`;
	const hours = Math.round(minutes / 60);
	if (hours < 24) return `in ${hours}h`;
	const days = Math.round(hours / 24);
	if (days < 7) return `in ${days}d`;
	return d.toLocaleDateString(undefined, {
		weekday: "short",
		month: "short",
		day: "numeric",
	});
}
