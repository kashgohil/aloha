import { Bar, Block } from "../../_components/skeleton-bits";

export default function Loading() {
	return (
		<div className="space-y-8 animate-pulse">
			<div>
				<Bar className="h-3 w-32" />
				<div className="mt-4 flex items-start justify-between gap-3 flex-wrap">
					<div className="flex items-center gap-3">
						<Bar className="h-6 w-20" />
						<Bar className="h-6 w-20" />
					</div>
					<Bar className="h-9 w-32" />
				</div>
				<div className="mt-4 space-y-3">
					<Bar className="h-10 lg:h-12 w-80 rounded-xl" />
					<Bar className="h-3 w-[28rem] max-w-full" />
				</div>
			</div>
			<div className="flex items-center gap-2">
				<Bar className="h-9 w-64" />
			</div>
			<div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
				<Block className="h-[520px]" />
				<Block className="h-[520px]" />
			</div>
		</div>
	);
}
