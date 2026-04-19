import Link from "next/link";
import { PenSquare } from "lucide-react";

interface EmptyCardProps {
	icon: React.ComponentType<{ className?: string }>;
	title: string;
	body: string;
	ctaLabel: string;
	ctaHref: string;
}

export function EmptyCard({
	icon: Icon,
	title,
	body,
	ctaLabel,
	ctaHref,
}: EmptyCardProps) {
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
