import { Block, PageHeaderSkeleton } from "../_components/skeleton-bits";

export default function Loading() {
	return (
		<div className="space-y-10">
			<PageHeaderSkeleton actions={2} headingWidth="w-96" />
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
				{[0, 1, 2, 3].map((i) => (
					<Block key={i} className="h-[116px]" />
				))}
			</div>
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
				<div className="lg:col-span-8 space-y-6">
					<Block className="h-[320px]" />
					<Block className="h-[240px]" />
				</div>
				<div className="lg:col-span-4 space-y-6">
					<Block className="h-[140px]" />
					<Block className="h-[140px]" />
					<Block className="h-[200px]" />
				</div>
			</div>
		</div>
	);
}
