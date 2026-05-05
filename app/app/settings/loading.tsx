import { Block } from "../_components/skeleton-bits";

// Settings layout already renders the page header + nav. A loading.tsx
// placed at the segment root covers any settings/* child route that
// doesn't have its own.
export default function Loading() {
	return (
		<div className="max-w-4xl space-y-6 animate-pulse">
			<Block className="h-32" />
			<Block className="h-48" />
			<Block className="h-72" />
		</div>
	);
}
