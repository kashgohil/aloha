import {
	Bar,
	FilterTabsSkeleton,
	PageHeaderSkeleton,
} from "../_components/skeleton-bits";

export default function Loading() {
	return (
		<div className="space-y-6">
			<PageHeaderSkeleton actions={2} />
			<FilterTabsSkeleton count={2} />
			<div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] rounded-2xl border border-border bg-background-elev overflow-hidden animate-pulse">
				<div className="divide-y divide-border">
					{[0, 1, 2, 3, 4].map((i) => (
						<div key={i} className="flex items-start gap-3 p-4">
							<Bar className="h-9 w-9" />
							<div className="flex-1 space-y-2 min-w-0">
								<Bar className="h-3 w-32" />
								<Bar className="h-3 w-full" />
							</div>
						</div>
					))}
				</div>
				<div className="hidden lg:block border-l border-border p-6 space-y-3">
					<Bar className="h-4 w-1/2" />
					<Bar className="h-3 w-3/4" />
					<Bar className="h-3 w-2/3" />
				</div>
			</div>
		</div>
	);
}
