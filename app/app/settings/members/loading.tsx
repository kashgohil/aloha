import { Bar, Block } from "../../_components/skeleton-bits";

export default function Loading() {
	return (
		<div className="max-w-3xl space-y-10 animate-pulse">
			<div className="space-y-2">
				<Bar className="h-7 w-48 rounded-xl" />
				<Bar className="h-3 w-72" />
			</div>
			<Block className="h-32" />
			<div className="space-y-2">
				{[0, 1, 2].map((i) => (
					<Block key={i} className="h-16 rounded-2xl" />
				))}
			</div>
		</div>
	);
}
