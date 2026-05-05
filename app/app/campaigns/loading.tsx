import {
	Bar,
	Block,
	PageHeaderSkeleton,
} from "../_components/skeleton-bits";

export default function Loading() {
	return (
		<div className="space-y-12">
			<PageHeaderSkeleton actions={1} subtitleWidth="w-[36rem]" />
			<section className="space-y-4 animate-pulse">
				<Bar className="h-3 w-20" />
				<ul className="grid grid-cols-1 lg:grid-cols-2 gap-4">
					{[0, 1].map((i) => (
						<li key={i}>
							<Block className="h-56 p-6" />
						</li>
					))}
				</ul>
			</section>
			<section className="space-y-4 animate-pulse">
				<Bar className="h-3 w-24" />
				<ul className="space-y-2">
					{[0, 1, 2].map((i) => (
						<li key={i}>
							<Block className="h-14" />
						</li>
					))}
				</ul>
			</section>
		</div>
	);
}
