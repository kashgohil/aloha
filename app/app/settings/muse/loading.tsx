import { Bar, Block } from "../../_components/skeleton-bits";

export default function Loading() {
	return (
		<div className="max-w-4xl space-y-10 animate-pulse">
			<div className="space-y-2">
				<Bar className="h-7 w-64 rounded-xl" />
				<Bar className="h-3 w-96 max-w-full" />
			</div>
			<Block className="h-40" />
			<Block className="h-56" />
			<Block className="h-72" />
		</div>
	);
}
