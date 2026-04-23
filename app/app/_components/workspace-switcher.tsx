"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	listMyWorkspaces,
	switchWorkspace,
	type WorkspaceChoice,
} from "@/app/actions/workspace-switch";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<WorkspaceChoice["role"], string> = {
	owner: "Owner",
	admin: "Admin",
	editor: "Editor",
	reviewer: "Reviewer",
	viewer: "Viewer",
};

export function WorkspaceSwitcher({
	initial,
	collapsed,
}: {
	initial: WorkspaceChoice[];
	collapsed: boolean;
}) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [workspaces, setWorkspaces] = useState<WorkspaceChoice[]>(initial);
	const [isPending, startTransition] = useTransition();

	// Refresh the list each time the menu opens so newly-created or
	// newly-accepted invites show up without a page reload.
	useEffect(() => {
		if (!open) return;
		listMyWorkspaces()
			.then(setWorkspaces)
			.catch(() => {
				// Silent — stale list is fine, user can close and retry.
			});
	}, [open]);

	const active = workspaces.find((w) => w.isActive) ?? workspaces[0] ?? null;

	const handleSwitch = (id: string) => {
		if (!active || id === active.id) {
			setOpen(false);
			return;
		}
		const toastId = toast.loading("Switching…");
		startTransition(async () => {
			try {
				await switchWorkspace(id);
				toast.success("Workspace switched.", { id: toastId });
				setOpen(false);
				router.refresh();
			} catch (err) {
				toast.error(
					err instanceof Error ? err.message : "Couldn't switch.",
					{ id: toastId },
				);
			}
		});
	};

	if (!active) {
		// Defensive fallback — every authed user should have at least one.
		return null;
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				className={cn(
					"w-full flex items-center gap-2 rounded-xl border border-border bg-background-elev hover:border-border-strong transition-colors",
					collapsed ? "h-10 w-10 justify-center p-0" : "h-10 px-3",
				)}
				aria-label="Switch workspace"
			>
				<span
					className={cn(
						"grid place-items-center shrink-0 rounded-md bg-muted text-ink/70",
						collapsed ? "w-6 h-6" : "w-6 h-6",
					)}
				>
					<Building2 className="w-3.5 h-3.5" />
				</span>
				{collapsed ? null : (
					<>
						<span className="min-w-0 flex-1 text-left">
							<span className="block text-[12.5px] font-medium text-ink truncate">
								{active.name}
							</span>
							<span className="block text-[10.5px] text-ink/55 truncate">
								{ROLE_LABEL[active.role]}
							</span>
						</span>
						{isPending ? (
							<Loader2 className="w-3.5 h-3.5 animate-spin text-ink/50 shrink-0" />
						) : (
							<ChevronsUpDown className="w-3.5 h-3.5 text-ink/50 shrink-0" />
						)}
					</>
				)}
			</PopoverTrigger>
			<PopoverContent
				align="start"
				side={collapsed ? "right" : "bottom"}
				sideOffset={6}
				className="w-64 p-1 rounded-xl border border-border bg-background-elev shadow-lg"
			>
				<div className="px-3 pt-2 pb-1 text-[10.5px] uppercase tracking-[0.18em] text-ink/50">
					Workspaces
				</div>
				<ul className="max-h-72 overflow-y-auto py-1">
					{workspaces.map((ws) => (
						<li key={ws.id}>
							<button
								type="button"
								onClick={() => handleSwitch(ws.id)}
								disabled={isPending}
								className={cn(
									"w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors",
									ws.isActive
										? "bg-muted/70"
										: "hover:bg-muted/60",
								)}
							>
								<span className="grid place-items-center w-6 h-6 rounded-md bg-background border border-border shrink-0">
									<Building2 className="w-3 h-3 text-ink/55" />
								</span>
								<span className="min-w-0 flex-1">
									<span className="block text-[13px] font-medium text-ink truncate">
										{ws.name}
									</span>
									<span className="block text-[10.5px] text-ink/55">
										{ROLE_LABEL[ws.role]}
									</span>
								</span>
								{ws.isActive ? (
									<Check className="w-3.5 h-3.5 text-ink shrink-0" />
								) : null}
							</button>
						</li>
					))}
				</ul>
				<div className="border-t border-border mt-1 pt-1">
					<Link
						href="/app/workspace/new"
						onClick={() => setOpen(false)}
						className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-ink/70 hover:text-ink hover:bg-muted/60 transition-colors"
					>
						<Plus className="w-3.5 h-3.5" />
						Create workspace
					</Link>
				</div>
			</PopoverContent>
		</Popover>
	);
}
