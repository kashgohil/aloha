import { Block, PageHeaderSkeleton } from "../_components/skeleton-bits";

export default function Loading() {
	return (
		<div className="space-y-8">
			<PageHeaderSkeleton actions={1} />
			<div className="grid grid-cols-12 gap-6 animate-pulse">
				<aside className="col-span-12 lg:col-span-4 xl:col-span-3 space-y-2">
					{[0, 1, 2, 3, 4].map((i) => (
						<Block key={i} className="h-12 rounded-2xl" />
					))}
				</aside>
				<div className="col-span-12 lg:col-span-8 xl:col-span-9 space-y-3">
					{[0, 1, 2, 3].map((i) => (
						<Block key={i} className="h-28 rounded-2xl" />
					))}
				</div>
			</div>
		</div>
	);
}
