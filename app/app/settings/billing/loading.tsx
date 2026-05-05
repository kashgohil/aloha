import { Block } from "../../_components/skeleton-bits";

export default function Loading() {
	return (
		<div className="max-w-4xl space-y-8 animate-pulse">
			<Block className="h-40" />
			<Block className="h-32" />
			<Block className="h-56" />
			<Block className="h-40" />
		</div>
	);
}
