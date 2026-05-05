import {
	FilterTabsSkeleton,
	PageHeaderSkeleton,
} from "../_components/skeleton-bits";

export default function Loading() {
	const heights = [160, 220, 180, 260, 200, 240, 180, 220];
	return (
		<div className="space-y-8">
			<PageHeaderSkeleton actions={1} />
			<FilterTabsSkeleton count={2} />
			<div className="columns-1 sm:columns-2 xl:columns-3 gap-4 [column-fill:_balance] animate-pulse">
				{heights.map((h, i) => (
					<div
						key={i}
						style={{ height: h }}
						className="mb-4 break-inside-avoid rounded-2xl border border-border bg-background-elev"
					/>
				))}
			</div>
		</div>
	);
}
