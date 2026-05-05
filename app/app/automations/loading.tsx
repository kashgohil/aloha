import { Block, PageHeaderSkeleton } from "../_components/skeleton-bits";

export default function Loading() {
	return (
		<div className="space-y-8">
			<PageHeaderSkeleton actions={1} headingWidth="w-[24rem]" />
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
				<aside className="lg:col-span-4 space-y-2">
					{[0, 1, 2, 3].map((i) => (
						<Block key={i} className="h-16 rounded-2xl" />
					))}
				</aside>
				<div className="lg:col-span-8 space-y-6">
					<Block className="h-32" />
					<Block className="h-72" />
					<Block className="h-48" />
				</div>
			</div>
		</div>
	);
}
