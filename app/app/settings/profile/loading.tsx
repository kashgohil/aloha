import { Bar } from "../../_components/skeleton-bits";

export default function Loading() {
	return (
		<div className="max-w-4xl space-y-6 animate-pulse">
			{[0, 1, 2, 3].map((i) => (
				<div
					key={i}
					className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 py-8 border-b border-border"
				>
					<div className="space-y-2">
						<Bar className="h-4 w-32" />
						<Bar className="h-3 w-48" />
					</div>
					<div className="space-y-3">
						<Bar className="h-11 w-full max-w-md" />
						<Bar className="h-11 w-full max-w-md" />
					</div>
				</div>
			))}
		</div>
	);
}
