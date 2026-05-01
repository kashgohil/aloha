import Link from "next/link";
import { redirect } from "next/navigation";
import {
	ArrowUpRight,
	Building2,
	Snowflake,
	Sparkles,
	UserCircle2,
} from "lucide-react";

import { getCurrentContext } from "@/lib/current-context";
import { hasRole, ROLES } from "@/lib/workspaces/roles";
import { loadAdminOverview } from "./_data";

export const dynamic = "force-dynamic";

function formatDate(d: Date) {
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(d);
}

export default async function OwnerAdminPage() {
	const ctx = await getCurrentContext();
	if (!ctx) redirect("/app/dashboard");
	if (!hasRole(ctx.role, ROLES.OWNER)) redirect("/app/dashboard");

	const ownerUserId = ctx.workspace.ownerUserId;
	const data = await loadAdminOverview(ownerUserId);

	return (
		<div className="max-w-5xl space-y-10">
			<header>
				<h1 className="font-display text-[34px] leading-[1.05] tracking-[-0.02em] text-ink">
					Admin<span className="text-primary font-light">.</span>
				</h1>
				<p className="mt-2 text-[13.5px] text-ink/65 leading-[1.55]">
					One pane for everything that spans your workspaces — seats, channels,
					credit usage. Visible only to owners.
				</p>
			</header>

			<SummaryGrid data={data} />

			<WorkspacesSection rows={data.workspaces} />

			<SeatsSection rows={data.seatRows} total={data.seats.total} />

			<UsageSection
				usage={data.usage}
				monthlyGrant={data.credits.monthlyGrant}
				balance={data.credits.balance}
			/>
		</div>
	);
}

function SummaryGrid({
	data,
}: {
	data: Awaited<ReturnType<typeof loadAdminOverview>>;
}) {
	return (
		<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
			<Stat
				label="Plan"
				value={
					data.plan.plan === "free"
						? "Trial / Free"
						: data.plan.plan === "basic_muse"
							? "Basic + Muse"
							: "Basic"
				}
				hint={
					data.plan.plan === "free"
						? "no paid sub"
						: `${data.plan.channels} channels`
				}
				href="/app/settings/billing"
			/>
			<Stat
				label="Seats"
				value={`${data.seats.consumed} / ${data.seats.total}`}
				hint={`${data.seats.used} active · ${data.seats.pendingInvites} pending`}
				href="/app/settings/billing#addons"
			/>
			<Stat
				label="Workspaces"
				value={String(data.workspaces.length)}
				hint={`${data.workspaces.filter((w) => w.frozen).length} frozen`}
				href="/app/settings/billing#addons"
			/>
			<Stat
				label="Credits"
				value={String(data.credits.balance)}
				hint={`of ${data.credits.monthlyGrant} this period`}
				href="/app/settings/billing"
			/>
		</div>
	);
}

function Stat({
	label,
	value,
	hint,
	href,
}: {
	label: string;
	value: string;
	hint: string;
	href: string;
}) {
	return (
		<Link
			href={href}
			className="group rounded-2xl border border-border bg-background-elev p-4 hover:bg-background transition-colors"
		>
			<div className="flex items-baseline justify-between gap-2">
				<p className="text-[10.5px] font-mono uppercase tracking-[0.18em] text-ink/55">
					{label}
				</p>
				<ArrowUpRight className="w-3.5 h-3.5 text-ink/30 group-hover:text-ink/60" />
			</div>
			<p className="mt-1.5 font-display text-[24px] leading-[1.1] tracking-[-0.01em] text-ink">
				{value}
			</p>
			<p className="mt-0.5 text-[11.5px] text-ink/55 font-mono">{hint}</p>
		</Link>
	);
}

function WorkspacesSection({
	rows,
}: {
	rows: Awaited<ReturnType<typeof loadAdminOverview>>["workspaces"];
}) {
	return (
		<section className="space-y-3">
			<div className="flex items-baseline gap-2">
				<Building2 className="w-4 h-4 text-ink/55" />
				<h2 className="text-[15px] font-semibold text-ink">Workspaces</h2>
				<span className="text-[11.5px] text-ink/50 font-mono">
					{rows.length} owned
				</span>
			</div>
			<div className="rounded-2xl border border-border overflow-hidden">
				<table className="w-full text-[13px]">
					<thead className="bg-background-elev text-ink/55 text-[11px] font-mono uppercase tracking-[0.16em]">
						<tr>
							<th className="text-left px-4 py-3">Name</th>
							<th className="text-right px-4 py-3">Channels</th>
							<th className="text-right px-4 py-3">Members</th>
							<th className="text-left px-4 py-3">Status</th>
							<th className="text-left px-4 py-3">Created</th>
						</tr>
					</thead>
					<tbody>
						{rows.length === 0 ? (
							<tr>
								<td colSpan={5} className="px-4 py-8 text-center text-ink/55">
									No workspaces yet.
								</td>
							</tr>
						) : (
							rows.map((w) => {
								const trialActive =
									w.trialEndsAt && w.trialEndsAt.getTime() > Date.now();
								return (
									<tr key={w.id} className="border-t border-border">
										<td className="px-4 py-3 font-medium text-ink">{w.name}</td>
										<td className="px-4 py-3 text-right text-ink/80 tabular-nums">
											{w.channelCount}
										</td>
										<td className="px-4 py-3 text-right text-ink/80 tabular-nums">
											{w.memberCount}
										</td>
										<td className="px-4 py-3">
											{w.frozen ? (
												<span className="inline-flex items-center gap-1 text-[11.5px] text-ink/70">
													<Snowflake className="w-3 h-3" /> Frozen
												</span>
											) : trialActive ? (
												<span className="inline-flex items-center h-5 px-2 rounded-full bg-peach-100/70 text-[10.5px] font-mono text-ink">
													Trial
												</span>
											) : (
												<span className="text-[11.5px] text-ink/55">—</span>
											)}
										</td>
										<td className="px-4 py-3 text-ink/55 text-[12px]">
											{formatDate(w.createdAt)}
										</td>
									</tr>
								);
							})
						)}
					</tbody>
				</table>
			</div>
		</section>
	);
}

function SeatsSection({
	rows,
	total,
}: {
	rows: Awaited<ReturnType<typeof loadAdminOverview>>["seatRows"];
	total: number;
}) {
	return (
		<section className="space-y-3">
			<div className="flex items-baseline gap-2">
				<UserCircle2 className="w-4 h-4 text-ink/55" />
				<h2 className="text-[15px] font-semibold text-ink">Seats</h2>
				<span className="text-[11.5px] text-ink/50 font-mono">
					{rows.length} of {total} used · one seat per human
				</span>
			</div>
			<div className="rounded-2xl border border-border overflow-hidden">
				<table className="w-full text-[13px]">
					<thead className="bg-background-elev text-ink/55 text-[11px] font-mono uppercase tracking-[0.16em]">
						<tr>
							<th className="text-left px-4 py-3">Person</th>
							<th className="text-left px-4 py-3">Workspaces</th>
						</tr>
					</thead>
					<tbody>
						{rows.length === 0 ? (
							<tr>
								<td colSpan={2} className="px-4 py-8 text-center text-ink/55">
									No teammates yet.
								</td>
							</tr>
						) : (
							rows.map((s) => (
								<tr key={s.userId} className="border-t border-border">
									<td className="px-4 py-3">
										<div className="flex items-center gap-2.5">
											{s.image ? (
												// eslint-disable-next-line @next/next/no-img-element
												<img
													src={s.image}
													alt=""
													className="w-7 h-7 rounded-full"
												/>
											) : (
												<span className="grid place-items-center w-7 h-7 rounded-full bg-background-elev text-[11px] font-medium text-ink/70">
													{(s.name ?? s.email).slice(0, 1).toUpperCase()}
												</span>
											)}
											<div className="min-w-0">
												<p className="text-ink text-[13px] truncate">
													{s.name ?? s.email.split("@")[0]}
												</p>
												<p className="text-[11.5px] text-ink/55 truncate">
													{s.email}
												</p>
											</div>
										</div>
									</td>
									<td className="px-4 py-3">
										<div className="flex flex-wrap gap-1.5">
											{s.assignments.map((a) => (
												<span
													key={`${s.userId}-${a.workspaceId}`}
													className="inline-flex items-center gap-1.5 h-6 px-2 rounded-full bg-background-elev text-[11px] text-ink/75"
												>
													<span className="font-medium text-ink">{a.workspaceName}</span>
													<span className="text-ink/45">· {a.role}</span>
												</span>
											))}
										</div>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</section>
	);
}

function UsageSection({
	usage,
	monthlyGrant,
	balance,
}: {
	usage: Awaited<ReturnType<typeof loadAdminOverview>>["usage"];
	monthlyGrant: number;
	balance: number;
}) {
	const totalConsumed = monthlyGrant - balance;
	return (
		<section className="space-y-3">
			<div className="flex items-baseline gap-2">
				<Sparkles className="w-4 h-4 text-primary" />
				<h2 className="text-[15px] font-semibold text-ink">Credit usage</h2>
				<span className="text-[11.5px] text-ink/50 font-mono">
					{Math.max(0, totalConsumed)} consumed this period
				</span>
			</div>
			{usage.length === 0 ? (
				<div className="rounded-2xl border border-border bg-background-elev p-6 text-[13px] text-ink/60">
					No AI activity yet this period. Credits get deducted as your team
					uses Muse — refine, drafts, image generation, and so on.
				</div>
			) : (
				<div className="space-y-2">
					{usage.map((g) => (
						<div
							key={g.workspaceId ?? "_account"}
							className="rounded-2xl border border-border bg-background-elev p-4"
						>
							<div className="flex items-baseline justify-between gap-3 mb-2">
								<p className="text-[13px] font-medium text-ink">
									{g.workspaceName}
								</p>
								<p className="text-[12.5px] font-mono text-ink/70 tabular-nums">
									{g.creditsUsed} credits
								</p>
							</div>
							<div className="flex flex-wrap gap-1.5">
								{g.byFeature.map((f) => (
									<span
										key={`${g.workspaceId}-${f.feature}`}
										className="inline-flex items-center gap-1.5 h-6 px-2 rounded-full bg-background text-[11px] text-ink/75"
									>
										<span className="font-mono text-ink/55">
											{labelForFeature(f.feature)}
										</span>
										<span className="text-ink/40">·</span>
										<span className="tabular-nums">{f.cost}</span>
									</span>
								))}
							</div>
						</div>
					))}
				</div>
			)}
		</section>
	);
}

function labelForFeature(key: string): string {
	const map: Record<string, string> = {
		"ai.refine": "refine",
		"ai.tags": "tags",
		"ai.altText": "alt-text",
		"ai.hashtags": "hashtags",
		"ai.draft": "draft",
		"ai.richDraft": "rich-draft",
		"ai.improve": "improve",
		"ai.scorePost": "score",
		"ai.image": "image",
	};
	return map[key] ?? key;
}
