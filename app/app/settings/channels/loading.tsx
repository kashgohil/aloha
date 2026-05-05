import { Bar, Block } from "../../_components/skeleton-bits";

export default function Loading() {
	return (
		<div className="space-y-6 animate-pulse">
			<div className="space-y-2">
				<Bar className="h-7 w-64 rounded-xl" />
				<Bar className="h-3 w-96 max-w-full" />
			</div>
			<div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
				<Block className="h-[420px]" />
				<div className="space-y-4">
					<Block className="h-32" />
					<Block className="h-24" />
				</div>
			</div>
		</div>
	);
}
