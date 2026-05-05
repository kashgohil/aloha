import { Block, PageHeaderSkeleton } from "../_components/skeleton-bits";

export default function Loading() {
	return (
		<div className="space-y-10">
			<PageHeaderSkeleton actions={3} headingWidth="w-[28rem]" />
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
				<div className="lg:col-span-7 space-y-6">
					<Block className="h-72" />
					<Block className="h-56" />
				</div>
				<div className="lg:col-span-5 space-y-6">
					<Block className="h-44" />
					<Block className="h-44" />
				</div>
			</div>
		</div>
	);
}
