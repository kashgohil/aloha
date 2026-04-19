import Link from "next/link";
import { Megaphone } from "lucide-react";

const CAMPAIGN_KIND_LABELS: Record<string, string> = {
	launch: "Launch",
	webinar: "Webinar",
	sale: "Sale",
	drip: "Drip",
	evergreen: "Evergreen",
	custom: "Custom",
};

interface ActiveCampaignCardProps {
	campaignId: string;
	name: string;
	kind: string;
	pending: number;
	accepted: number;
	total: number;
	rangeStart: Date;
	rangeEnd: Date;
}

export function ActiveCampaignCard({
	campaignId,
	name,
	kind,
	pending,
	accepted,
	total,
	rangeStart,
	rangeEnd,
}: ActiveCampaignCardProps) {
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
