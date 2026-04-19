import Link from "next/link";
import { Wand2 } from "lucide-react";

interface ActivePlanCardProps {
	planId: string;
	goal: string;
	pending: number;
	rangeStart: Date;
	rangeEnd: Date;
}

export function ActivePlanCard({
	planId,
	goal,
	pending,
	rangeStart,
	rangeEnd,
}: ActivePlanCardProps) {
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
