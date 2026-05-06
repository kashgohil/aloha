import Link from "next/link";
import { Lightbulb } from "lucide-react";
import { markdownToPlain } from "@/lib/markdown";

interface IdeasCardProps {
	newCount: number;
	totalCount: number;
	fresh: Array<{
		id: string;
		title: string | null;
		body: string;
		source: string;
		createdAt: Date;
	}>;
}

export function IdeasCard({
	newCount,
	totalCount,
	fresh,
}: IdeasCardProps) {
	return (
		<article className="rounded-2xl border border-border bg-background-elev p-6">
			<div>
				<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
					Ideas
				</p>
				<p className="mt-1.5 font-display text-[20px] leading-[1.15] text-ink">
					{newCount > 0
						? `${newCount} new`
						: totalCount > 0
							? "Caught up"
							: "Empty swipe file"}
				</p>
			</div>
			{fresh.length > 0 ? (
				<ul className="mt-4 space-y-2">
					{fresh.map((idea) => (
						<li key={idea.id}>
							<Link
								href={`?compose=new&idea=${idea.id}`}
								className="group flex items-start gap-2.5 text-[13px] text-ink/80 hover:text-ink transition-colors"
							>
								<Lightbulb className="w-3.5 h-3.5 mt-[3px] text-primary shrink-0" />
								<span className="line-clamp-2 leading-[1.4]">
									{idea.title ?? markdownToPlain(idea.body)}
								</span>
							</Link>
						</li>
					))}
				</ul>
			) : (
				<p className="mt-3 text-[12.5px] text-ink/55 leading-normal">
					Capture something worth coming back to — a hook, a story, a link.
				</p>
			)}
			<Link
				href="/app/ideas"
				className="mt-5 inline-flex items-center justify-center w-full h-10 rounded-full border border-border-strong text-[13px] text-ink hover:border-ink transition-colors"
			>
				<Lightbulb className="w-3.5 h-3.5 mr-1.5" />
				Capture new
			</Link>
		</article>
	);
}
