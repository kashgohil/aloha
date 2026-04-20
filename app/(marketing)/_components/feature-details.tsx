type FeatureDetail = {
	title: string;
	body: string;
};

type Props = {
	eyebrow: string;
	heading: React.ReactNode;
	intro?: string;
	details: FeatureDetail[];
};

export function FeatureDetails({ eyebrow, heading, intro, details }: Props) {
	return (
		<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-12">
			<div className="col-span-12 lg:col-span-7">
				<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
					{eyebrow}
				</p>
				<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em] text-ink">
					{heading}
				</h2>
			</div>
			{intro && (
				<p className="col-span-12 lg:col-span-4 lg:col-start-9 self-end text-[15.5px] leading-[1.55] text-ink/70">
					{intro}
				</p>
			)}
			<div className="col-span-12 mt-2 grid grid-cols-1 gap-5 md:grid-cols-2 lg:mt-4 lg:grid-cols-3 lg:gap-6">
				{details.map((d, i) => (
					<article
						key={d.title}
						className="rounded-2xl border border-border-strong bg-background-elev p-7 lg:p-8"
					>
						<p className="mb-4 font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink/45">
							{String(i + 1).padStart(2, "0")}
						</p>
						<h3 className="font-display text-[20px] leading-[1.2] tracking-[-0.01em] text-ink lg:text-[22px]">
							{d.title}
						</h3>
						<p className="mt-3 text-[14px] leading-[1.55] text-ink/70">
							{d.body}
						</p>
					</article>
				))}
			</div>
		</div>
	);
}
