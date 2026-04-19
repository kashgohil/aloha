import Link from "next/link";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface EngagementCardProps {
	unread: number;
	total: number;
}

export function EngagementCard({ unread, total }: EngagementCardProps) {
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
