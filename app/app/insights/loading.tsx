import { Block, PageHeaderSkeleton } from "../_components/skeleton-bits";

export default function Loading() {
	return (
		<div className="max-w-3xl space-y-10">
			<PageHeaderSkeleton compact headingWidth="w-[26rem]" />
			<div className="space-y-3 animate-pulse">
				{[0, 1, 2, 3].map((i) => (
					<Block key={i} className="h-20 rounded-2xl" />
				))}
			</div>
			<div className="space-y-3 animate-pulse">
				{[0, 1, 2].map((i) => (
					<Block key={i} className="h-24 rounded-2xl" />
				))}
			</div>
		</div>
	);
}
