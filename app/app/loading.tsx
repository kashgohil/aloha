import { Block, PageHeaderSkeleton } from "./_components/skeleton-bits";

// Generic fallback. Per-route loading.tsx files override this where the
// real layout differs enough that this would cause a visible reflow.
export default function Loading() {
	return (
		<div className="space-y-12">
			<PageHeaderSkeleton />
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-pulse">
				{[0, 1, 2, 3].map((i) => (
					<Block key={i} className="h-36" />
				))}
			</div>
		</div>
	);
}
