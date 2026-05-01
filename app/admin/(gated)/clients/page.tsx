import Link from "next/link";
import { Snowflake, Sparkles } from "lucide-react";

import { AdminPageHeader, DataCard } from "../../_components/page-header";
import { loadAllClients } from "./_data";

export const dynamic = "force-dynamic";

function formatDate(d: Date) {
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(d);
}

export default async function GodViewClientsPage() {
	const rows = await loadAllClients();

	const totals = rows.reduce(
		(acc, r) => {
			acc.workspaces += r.workspaceCount;
			acc.heads += r.memberHeads;
			acc.creditsConsumed += r.creditsConsumedThisPeriod;
			if (r.plan !== "free") acc.paid += 1;
			return acc;
		},
		{ workspaces: 0, heads: 0, creditsConsumed: 0, paid: 0 },
	);

	return (
		<div className="space-y-10">
			<AdminPageHeader
				eyebrow="God-view"
				title="Clients"
				subtitle={`Every workspace owner on Aloha. ${rows.length} accounts · ${totals.paid} paid · ${totals.workspaces} workspaces · ${totals.heads} humans · ${totals.creditsConsumed} credits this period.`}
			/>

			<DataCard>
				<table className="w-full text-[13px]">
					<thead className="text-[11px] uppercase tracking-[0.14em] text-ink/55 border-b border-border">
						<tr>
							<Th>Owner</Th>
							<Th>Plan</Th>
							<Th align="right">Channels</Th>
							<Th align="right">Workspaces</Th>
							<Th align="right">Seats</Th>
							<Th>Credits</Th>
							<Th>Joined</Th>
						</tr>
					</thead>
					<tbody>
						{rows.length === 0 ? (
							<tr>
								<td
									colSpan={7}
									className="px-4 py-12 text-center text-ink/55 text-[13px]"
								>
									No clients yet.
								</td>
							</tr>
						) : (
							rows.map((r) => {
								const trialActive =
									r.plan === "free" &&
									r.trialEndsAt &&
									r.trialEndsAt.getTime() > Date.now();
								return (
									<tr
										key={r.ownerUserId}
										className="border-b border-border last:border-b-0 hover:bg-muted/40"
									>
										<Td>
											<div className="flex flex-col">
												<Link
													href={`/admin/users?q=${encodeURIComponent(r.email)}`}
													className="text-ink font-medium hover:underline"
												>
													{r.name ?? r.email.split("@")[0]}
												</Link>
												<span className="text-[11.5px] text-ink/55">
													{r.email}
												</span>
											</div>
										</Td>
										<Td>
											<div className="flex items-center gap-1.5">
												<span className="inline-flex items-center h-6 px-2 rounded-full bg-peach-100/70 text-[11px] text-ink">
													{r.plan === "basic_muse"
														? "Basic+Muse"
														: r.plan === "basic"
															? "Basic"
															: trialActive
																? "Trial"
																: "Free"}
												</span>
												{r.plan === "free" &&
												r.trialEndsAt &&
												!trialActive ? (
													<span className="text-[10.5px] text-ink/50 font-mono">
														exp {formatDate(r.trialEndsAt)}
													</span>
												) : null}
											</div>
										</Td>
										<Td align="right" className="tabular-nums">
											{r.planSeats || "—"}
										</Td>
										<Td align="right" className="tabular-nums">
											<div className="inline-flex items-center gap-1.5 justify-end">
												{r.workspaceCount}
												{r.frozenWorkspaceCount > 0 ? (
													<span
														className="inline-flex items-center gap-0.5 text-[10.5px] text-ink/55"
														title={`${r.frozenWorkspaceCount} frozen`}
													>
														<Snowflake className="w-3 h-3" />
														{r.frozenWorkspaceCount}
													</span>
												) : null}
												{r.addonWorkspaceSeats > 0 ? (
													<span
														className="text-[10.5px] text-ink/45 font-mono"
														title={`${r.addonWorkspaceSeats} add-on seats`}
													>
														+{r.addonWorkspaceSeats}
													</span>
												) : null}
											</div>
										</Td>
										<Td align="right" className="tabular-nums">
											<div className="inline-flex items-center gap-1.5 justify-end">
												{r.memberHeads}
												{r.addonMemberSeats > 0 ? (
													<span
														className="text-[10.5px] text-ink/45 font-mono"
														title={`${r.addonMemberSeats} add-on seats`}
													>
														+{r.addonMemberSeats}
													</span>
												) : null}
											</div>
										</Td>
										<Td>
											<div className="inline-flex items-center gap-1.5">
												<Sparkles
													className={
														r.creditsBalance > 0
															? "w-3 h-3 text-primary"
															: "w-3 h-3 text-ink/30"
													}
												/>
												<span className="font-mono text-[12px] tabular-nums">
													{r.creditsBalance}
													<span className="text-ink/40">
														{" "}/ {r.monthlyGrant || "—"}
													</span>
												</span>
												{r.creditsConsumedThisPeriod > 0 ? (
													<span className="text-[10.5px] text-ink/45 font-mono">
														({r.creditsConsumedThisPeriod} used)
													</span>
												) : null}
											</div>
										</Td>
										<Td className="text-ink/55 text-[12px]">
											{formatDate(r.createdAt)}
										</Td>
									</tr>
								);
							})
						)}
					</tbody>
				</table>
			</DataCard>
		</div>
	);
}

function Th({
	children,
	align = "left",
}: {
	children: React.ReactNode;
	align?: "left" | "right";
}) {
	return (
		<th
			className={`px-4 py-3 font-medium ${align === "right" ? "text-right" : "text-left"}`}
		>
			{children}
		</th>
	);
}

function Td({
	children,
	className = "",
	align = "left",
}: {
	children: React.ReactNode;
	className?: string;
	align?: "left" | "right";
}) {
	return (
		<td
			className={`px-4 py-3 text-ink/80 ${align === "right" ? "text-right" : ""} ${className}`}
		>
			{children}
		</td>
	);
}
