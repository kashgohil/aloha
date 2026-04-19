import Link from "next/link";
import { NotionIcon } from "@/app/auth/_components/provider-icons";

interface KnowledgeCardProps {
	connected: boolean;
	workspaceName: string | null;
	reauthRequired: boolean;
	lastSyncedAt: Date | null;
	docCount: number;
	tz: string;
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

export function KnowledgeCard({
	connected,
	workspaceName,
	reauthRequired,
	lastSyncedAt,
	docCount,
	tz,
}: KnowledgeCardProps) {
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
					<NotionIcon className="w-4 h-4 text-ink" />
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
				<NotionIcon className="w-3.5 h-3.5 mr-1.5" />
				{reauthRequired
					? "Reconnect"
					: connected
						? "Manage sources"
						: "Connect Notion"}
			</Link>
		</article>
	);
}
