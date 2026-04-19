import Link from "next/link";

interface SectionHeaderProps {
	eyebrow: string;
	title: string;
	actionLabel?: string;
	actionHref?: string;
}

export function SectionHeader({
	eyebrow,
	title,
	actionLabel,
	actionHref,
}: SectionHeaderProps) {
	return (
		<div className="flex items-end justify-between mb-4">
			<div>
				<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
					{eyebrow}
				</p>
				<h2 className="mt-1.5 font-display text-[26px] leading-[1.1] tracking-[-0.02em] text-ink">
					{title}
				</h2>
			</div>
			{actionLabel && actionHref ? (
				<Link
					href={actionHref}
					className="pencil-link text-[13px] text-ink/70 hover:text-ink"
				>
					{actionLabel}
				</Link>
			) : null}
		</div>
	);
}
