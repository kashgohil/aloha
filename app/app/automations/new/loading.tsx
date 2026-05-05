import { Bar, Block } from "../../_components/skeleton-bits";

export default function Loading() {
	return (
		<div className="space-y-8 animate-pulse">
			<div className="space-y-3">
				<Bar className="h-3 w-32" />
				<Bar className="h-9 w-80 rounded-xl" />
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
				{[0, 1, 2, 3, 4, 5].map((i) => (
					<Block key={i} className="h-44 rounded-2xl" />
				))}
			</div>
		</div>
	);
}
