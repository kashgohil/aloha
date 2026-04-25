"use client";

import type { WorkspaceChoice } from "@/app/actions/workspace-switch";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { CurrentUser } from "@/lib/current-user";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AvatarMenu } from "./avatar-menu";
import { NavLinks } from "./nav-links";
import { NotificationsBell } from "./notifications-bell";
import { ThemeToggle } from "./theme-toggle";
import { WorkspaceSwitcher } from "./workspace-switcher";

const STORAGE_KEY = "aloha:sidebar:expanded";

export function AppSidebar({
	user,
	workspaces,
	role,
	canCreateWorkspace,
}: {
	user: CurrentUser;
	workspaces: WorkspaceChoice[];
	role: import("@/lib/current-context").WorkspaceRole | null;
	canCreateWorkspace: boolean;
}) {
	const [expanded, setExpanded] = useState(false);

	useEffect(() => {
		try {
			if (window.localStorage.getItem(STORAGE_KEY) === "1") {
				setExpanded(true);
			}
		} catch {
			// ignore
		}
	}, []);

	const toggle = () => {
		setExpanded((prev) => {
			const next = !prev;
			try {
				window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
			} catch {
				// ignore
			}
			return next;
		});
	};

	const collapsed = !expanded;

	return (
		<TooltipProvider delay={120}>
			<aside
				className={cn(
					"hidden lg:flex lg:flex-col sticky top-0 h-screen shrink-0 border-r border-border bg-background-elev/60 backdrop-blur-md transition-[width] duration-200 z-10",
					collapsed ? "w-[68px]" : "w-[248px]",
				)}
			>
				<button
					type="button"
					onClick={toggle}
					aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
					title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
					className="absolute top-7 right-0 translate-x-1/2 z-10 h-6 w-6 grid place-items-center rounded-full border border-border-strong bg-background-elev text-ink/60 hover:text-ink hover:bg-muted/80 shadow-[0_4px_12px_-4px_rgba(26,22,18,0.18)] transition-colors"
				>
					{collapsed ? (
						<ChevronRight className="w-[14px] h-[14px]" />
					) : (
						<ChevronLeft className="w-[14px] h-[14px]" />
					)}
				</button>

				<div className="flex items-center pt-5 pb-4 px-3 h-[52px]">
					<Link
						href="/app/dashboard"
						className="inline-flex items-baseline gap-0.5 pl-3"
						aria-label="Aloha home"
					>
						<span className="font-display text-[24px] leading-none font-semibold tracking-[-0.03em] text-ink">
							{collapsed ? "A" : "Aloha"}
						</span>
						<span className="font-display text-primary text-[18px] leading-none">
							.
						</span>
					</Link>
				</div>

				<div
					className={cn(
						"pb-3",
						collapsed ? "px-0 flex justify-center" : "px-3",
					)}
				>
					<WorkspaceSwitcher
						initial={workspaces}
						collapsed={collapsed}
						canCreate={canCreateWorkspace}
					/>
				</div>

				<nav className="flex-1 overflow-y-auto px-3">
					<NavLinks variant="sidebar" collapsed={collapsed} role={role} />
				</nav>

				<div className="py-3 px-3 border-t border-border">
					<div className="flex flex-col gap-1 items-stretch">
						<ThemeToggle expandedLabel={!collapsed} />
						<NotificationsBell expandedLabel={!collapsed} />
						<AvatarMenu
							name={user.name}
							email={user.email}
							image={user.image}
							workspaceName={user.workspaceName}
							placement="top"
							expandedLabel={!collapsed}
						/>
					</div>
				</div>
			</aside>
		</TooltipProvider>
	);
}
