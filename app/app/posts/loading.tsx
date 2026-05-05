import {
	Bar,
	FilterTabsSkeleton,
	PageHeaderSkeleton,
} from "../_components/skeleton-bits";

export default function Loading() {
	return (
		<div className="space-y-8">
			<PageHeaderSkeleton actions={1} />
			<div className="flex items-center justify-between gap-3 flex-wrap animate-pulse">
				<FilterTabsSkeleton count={4} />
				<Bar className="h-8 w-24" />
			</div>
			<ul className="divide-y divide-border animate-pulse">
				{[0, 1, 2, 3, 4, 5].map((i) => (
					<li key={i} className="flex items-center gap-4 py-4">
						<Bar className="h-9 w-9" />
						<div className="flex-1 space-y-2 min-w-0">
							<Bar className="h-3 w-3/4 max-w-md" />
							<Bar className="h-3 w-1/2 max-w-sm" />
						</div>
						<Bar className="h-3 w-20" />
					</li>
				))}
			</ul>
		</div>
	);
}
