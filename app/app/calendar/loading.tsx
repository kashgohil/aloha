import { Bar, Block } from "../_components/skeleton-bits";

export default function Loading() {
	return (
		<div className="space-y-6 animate-pulse">
			<div className="flex items-end justify-between gap-3 flex-wrap">
				<div className="space-y-2">
					<Bar className="h-3 w-24" />
					<Bar className="h-7 w-48 rounded-xl" />
					<Bar className="h-3 w-64" />
				</div>
				<div className="flex items-center gap-2">
					<Bar className="h-9 w-9" />
					<Bar className="h-9 w-9" />
					<Bar className="h-9 w-24" />
				</div>
			</div>
			<Block className="h-[640px]" />
		</div>
	);
}
