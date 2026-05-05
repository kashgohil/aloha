import { Bar, Block } from "../../_components/skeleton-bits";

export default function Loading() {
	return (
		<div className="space-y-8 animate-pulse">
			<div className="max-w-3xl space-y-3">
				<Bar className="h-3 w-32" />
				<Bar className="h-10 w-[28rem] max-w-full rounded-xl" />
				<Bar className="h-3 w-[32rem] max-w-full" />
			</div>
			<div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
				<Block className="h-[520px]" />
				<Block className="h-[420px]" />
			</div>
		</div>
	);
}
