import { Bar, Block } from "../_components/skeleton-bits";

export default function Loading() {
	return (
		<div className="space-y-6 animate-pulse">
			<div className="flex items-center justify-between gap-3 flex-wrap">
				<Bar className="h-6 w-40" />
				<div className="flex items-center gap-2">
					<Bar className="h-9 w-24" />
					<Bar className="h-9 w-32" />
				</div>
			</div>
			<Block className="h-[420px]" />
			<Block className="h-32" />
		</div>
	);
}
