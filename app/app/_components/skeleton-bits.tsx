// Shared skeleton primitives so per-route loading.tsx files stay terse and
// match the real page chrome (avoiding layout shift when content arrives).
//
// All bits emit `animate-pulse` placeholders sized to match the real elements
// in each page's header / body. Keep widths in line with the actual font
// sizes — a 52px display heading is taller than the 44px settings heading.

import { cn } from "@/lib/utils";

export function Bar({
	className,
}: {
	className?: string;
}) {
	return <div className={cn("rounded-full bg-muted/60", className)} />;
}

export function Block({ className }: { className?: string }) {
	return (
		<div
			className={cn(
				"rounded-3xl border border-border bg-background-elev",
				className,
			)}
		/>
	);
}

// Default page header: eyebrow (uppercase tracking) + 44–52px display
// heading + 14px subtitle, optional trailing button placeholders.
// `compact` reduces heading size for settings-style pages (h2 28px).
export function PageHeaderSkeleton({
	subtitleWidth = "w-[28rem]",
	headingWidth = "w-64",
	withEyebrow = true,
	actions = 0,
	compact = false,
}: {
	subtitleWidth?: string;
	headingWidth?: string;
	withEyebrow?: boolean;
	actions?: number;
	compact?: boolean;
}) {
	return (
		<header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 animate-pulse">
			<div className="space-y-3">
				{withEyebrow ? <Bar className="h-3 w-24" /> : null}
				<Bar
					className={cn(
						compact ? "h-7" : "h-12 lg:h-14",
						headingWidth,
						"rounded-xl",
					)}
				/>
				<Bar className={cn("h-3 max-w-full", subtitleWidth)} />
			</div>
			{actions > 0 ? (
				<div className="flex items-center gap-2">
					{Array.from({ length: actions }).map((_, i) => (
						<Bar key={i} className="h-11 w-32" />
					))}
				</div>
			) : null}
		</header>
	);
}

// A row of pill-shaped filter tabs (used by posts/ideas/inbox).
export function FilterTabsSkeleton({ count = 4 }: { count?: number }) {
	return (
		<div className="flex items-center gap-2 animate-pulse">
			{Array.from({ length: count }).map((_, i) => (
				<Bar key={i} className="h-8 w-20" />
			))}
		</div>
	);
}
