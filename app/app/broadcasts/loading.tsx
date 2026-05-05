import { Block, PageHeaderSkeleton } from "../_components/skeleton-bits";

export default function Loading() {
	return (
		<div className="space-y-8">
			<PageHeaderSkeleton actions={2} headingWidth="w-[26rem]" />
			<ul className="space-y-3 animate-pulse">
				{[0, 1, 2, 3].map((i) => (
					<li key={i}>
						<Block className="h-28 rounded-3xl" />
					</li>
				))}
			</ul>
		</div>
	);
}
