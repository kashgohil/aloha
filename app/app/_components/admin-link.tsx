"use client";

import { Shield } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Props = {
	collapsed: boolean;
};

// Owner-only entry to /app/admin. Lives in the sidebar footer alongside
// the theme/notifications/avatar controls — it's an account-level
// affordance, not part of the main per-workspace nav.
export function AdminLink({ collapsed }: Props) {
	const pathname = usePathname();
	const active =
		pathname === "/app/admin" || pathname.startsWith("/app/admin/");

	const label = "Admin";

	const link = (
		<Link
			href="/app/admin"
			aria-label={label}
			className={cn(
				"group flex items-center h-10 w-full rounded-xl gap-3 px-3 text-[14px] font-medium transition-colors",
				active
					? "bg-muted/70 text-ink"
					: "text-ink/70 hover:text-ink hover:bg-muted/60",
			)}
		>
			<Shield
				className={cn(
					"w-[18px] h-[18px] shrink-0 transition-colors",
					active ? "text-ink" : "text-ink/50 group-hover:text-ink",
				)}
			/>
			{!collapsed ? <span className="truncate">{label}</span> : null}
		</Link>
	);

	if (!collapsed) return link;

	return (
		<Tooltip>
			<TooltipTrigger render={link} />
			<TooltipContent side="right" sideOffset={12}>
				{label}
			</TooltipContent>
		</Tooltip>
	);
}
