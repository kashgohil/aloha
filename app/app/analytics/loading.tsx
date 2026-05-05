import { Block, PageHeaderSkeleton } from "../_components/skeleton-bits";

export default function Loading() {
	return (
		<div className="space-y-12">
			<PageHeaderSkeleton actions={1} headingWidth="w-[28rem]" />
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
				{[0, 1, 2, 3].map((i) => (
					<Block key={i} className="h-[116px]" />
				))}
			</div>
			<Block className="h-[320px] animate-pulse" />
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
				<Block className="h-[280px]" />
				<Block className="h-[280px]" />
			</div>
		</div>
	);
}
