"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";

import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Props = {
	balance: number;
	monthlyGrant: number;
	collapsed: boolean;
};

// Compact account-pool credit indicator. Sits in the sidebar footer next
// to the theme/notification toggles. Click navigates to billing.
export function CreditsPill({ balance, monthlyGrant, collapsed }: Props) {
	const empty = balance <= 0;
	const low = !empty && monthlyGrant > 0 && balance / monthlyGrant <= 0.15;

	const fullLabel = `${balance} of ${monthlyGrant} credits`;
	const shortLabel = `${balance} / ${monthlyGrant}`;

	const link = (
		<Link
			href="/app/settings/billing"
			aria-label={fullLabel}
			className={cn(
				"group flex items-center h-10 w-full rounded-xl gap-3 px-3 text-[14px] font-medium text-ink/70 hover:text-ink hover:bg-muted/60 transition-colors",
			)}
		>
			<Sparkles
				className={cn(
					"w-[18px] h-[18px] shrink-0 transition-colors",
					empty
						? "text-ink/40 group-hover:text-ink/60"
						: "text-ink/50 group-hover:text-ink",
				)}
			/>
			{!collapsed ? (
				<span
					className={cn(
						"truncate font-mono text-[12.5px] tabular-nums",
						empty ? "text-ink/55" : low ? "text-primary-deep" : "text-ink/80",
					)}
				>
					{shortLabel}
				</span>
			) : null}
		</Link>
	);

	if (!collapsed) return link;

	return (
		<Tooltip>
			<TooltipTrigger render={link} />
			<TooltipContent side="right" sideOffset={12}>
				{fullLabel}
			</TooltipContent>
		</Tooltip>
	);
}
