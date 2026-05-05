import {
	Block,
	FilterTabsSkeleton,
	PageHeaderSkeleton,
} from "../_components/skeleton-bits";

export default function Loading() {
	return (
		<div className="space-y-8">
			<PageHeaderSkeleton actions={2} />
			<FilterTabsSkeleton count={4} />
			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
				{[0, 1, 2, 3, 4, 5].map((i) => (
					<Block key={i} className="h-44 rounded-2xl" />
				))}
			</div>
		</div>
	);
}
