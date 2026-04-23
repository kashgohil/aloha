"use client";

import { useTransition } from "react";
import { Crown, Loader2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	changeMemberRole,
	removeMember,
	transferOwnership,
	type MemberRow,
} from "@/app/actions/workspace-members";
import type { WorkspaceRole } from "@/lib/current-context";
import { hasRole, ROLES } from "@/lib/workspaces/roles";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<WorkspaceRole, string> = {
	owner: "Owner",
	admin: "Admin",
	editor: "Editor",
	reviewer: "Reviewer",
	viewer: "Viewer",
};

const ASSIGNABLE: WorkspaceRole[] = [
	"admin",
	"editor",
	"reviewer",
	"viewer",
];

export function MembersList({
	members,
	viewerRole,
	viewerUserId,
}: {
	members: MemberRow[];
	viewerRole: WorkspaceRole;
	viewerUserId: string;
}) {
	const canManage = hasRole(viewerRole, ROLES.ADMIN);
	const isOwner = viewerRole === "owner";

	return (
		<ul className="rounded-2xl border border-border bg-background-elev divide-y divide-border">
			{members.map((m) => (
				<MemberItem
					key={m.userId}
					member={m}
					canManage={canManage}
					isViewerOwner={isOwner}
					viewerUserId={viewerUserId}
				/>
			))}
		</ul>
	);
}

function MemberItem({
	member,
	canManage,
	isViewerOwner,
	viewerUserId,
}: {
	member: MemberRow;
	canManage: boolean;
	isViewerOwner: boolean;
	viewerUserId: string;
}) {
	const [isPending, startTransition] = useTransition();

	// Viewer can open the menu on a row when:
	//  - they have admin+ privileges, and
	//  - the row isn't themselves, and
	//  - the target isn't "above" them: owners can act on anyone except
	//    themselves; non-owner admins can't act on owners or other admins.
	const targetOutranksViewer =
		!isViewerOwner && (member.isOwner || member.role === "admin");
	const showMenu = canManage && !member.isSelf && !targetOutranksViewer;

	return (
		<li className="flex items-center gap-3 px-4 py-3">
			<Avatar name={member.name} email={member.email} image={member.image} />
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-1.5">
					<p className="text-[13px] font-medium text-ink truncate">
						{member.name ?? member.email}
					</p>
					{member.isOwner ? (
						<Crown className="w-3 h-3 text-amber-600" aria-label="Owner" />
					) : null}
					{member.isSelf ? (
						<span className="text-[10.5px] text-ink/55">· you</span>
					) : null}
				</div>
				<p className="text-[11.5px] text-ink/55 truncate">{member.email}</p>
			</div>
			<span
				className={cn(
					"inline-flex items-center h-6 px-2 rounded-full text-[11px] font-medium",
					member.isOwner
						? "bg-amber-100 text-amber-900"
						: "bg-muted text-ink/70",
				)}
			>
				{ROLE_LABEL[member.role]}
			</span>
			{showMenu ? (
				<MemberMenu
					member={member}
					isViewerOwner={isViewerOwner}
					isPending={isPending}
					startTransition={startTransition}
				/>
			) : (
				<span className="w-8" />
			)}
			{/* Keep viewerUserId around for potential future checks; currently only used to decide isSelf server-side. */}
			<span className="sr-only">{viewerUserId}</span>
		</li>
	);
}

function MemberMenu({
	member,
	isViewerOwner,
	isPending,
	startTransition,
}: {
	member: MemberRow;
	isViewerOwner: boolean;
	isPending: boolean;
	startTransition: React.TransitionStartFunction;
}) {
	const handleRoleChange = (role: WorkspaceRole) => {
		if (role === member.role) return;
		const toastId = toast.loading("Updating role…");
		const fd = new FormData();
		fd.set("userId", member.userId);
		fd.set("role", role);
		startTransition(async () => {
			try {
				await changeMemberRole(fd);
				toast.success("Role updated.", { id: toastId });
			} catch (err) {
				toast.error(
					err instanceof Error ? err.message : "Couldn't update.",
					{ id: toastId },
				);
			}
		});
	};

	const handleRemove = () => {
		if (!confirm(`Remove ${member.name ?? member.email} from the workspace?`))
			return;
		const toastId = toast.loading("Removing…");
		const fd = new FormData();
		fd.set("userId", member.userId);
		startTransition(async () => {
			try {
				await removeMember(fd);
				toast.success("Member removed.", { id: toastId });
			} catch (err) {
				toast.error(
					err instanceof Error ? err.message : "Couldn't remove.",
					{ id: toastId },
				);
			}
		});
	};

	const handleTransfer = () => {
		if (
			!confirm(
				`Transfer ownership to ${member.name ?? member.email}? You'll become an admin.`,
			)
		)
			return;
		const toastId = toast.loading("Transferring…");
		const fd = new FormData();
		fd.set("userId", member.userId);
		startTransition(async () => {
			try {
				await transferOwnership(fd);
				toast.success("Ownership transferred.", { id: toastId });
			} catch (err) {
				toast.error(
					err instanceof Error ? err.message : "Couldn't transfer.",
					{ id: toastId },
				);
			}
		});
	};

	return (
		<Popover>
			<PopoverTrigger
				className="p-1.5 rounded-full text-ink/50 hover:text-ink hover:bg-background-elev transition-colors"
				aria-label="Member actions"
				disabled={isPending}
			>
				{isPending ? (
					<Loader2 className="w-4 h-4 animate-spin" />
				) : (
					<MoreHorizontal className="w-4 h-4" />
				)}
			</PopoverTrigger>
			<PopoverContent
				align="end"
				className="w-52 p-1 rounded-xl border border-border bg-background-elev shadow-lg"
			>
				{isViewerOwner && !member.isOwner ? (
					<>
						<div className="px-3 pt-2 pb-1 text-[10.5px] uppercase tracking-[0.18em] text-ink/50">
							Change role
						</div>
						{ASSIGNABLE.map((r) => (
							<button
								key={r}
								type="button"
								onClick={() => handleRoleChange(r)}
								disabled={isPending}
								className={cn(
									"w-full text-left px-3 py-1.5 rounded-lg text-[12.5px] transition-colors",
									r === member.role
										? "bg-muted/70 text-ink"
										: "text-ink/70 hover:bg-muted/60 hover:text-ink",
								)}
							>
								{ROLE_LABEL[r]}
							</button>
						))}
						<div className="border-t border-border my-1" />
					</>
				) : null}

				{isViewerOwner && !member.isOwner ? (
					<button
						type="button"
						onClick={handleTransfer}
						disabled={isPending}
						className="w-full text-left px-3 py-1.5 rounded-lg text-[12.5px] text-ink/70 hover:bg-muted/60 hover:text-ink transition-colors"
					>
						Make owner
					</button>
				) : null}

				<button
					type="button"
					onClick={handleRemove}
					disabled={isPending}
					className="w-full text-left px-3 py-1.5 rounded-lg text-[12.5px] text-destructive hover:bg-destructive/10 transition-colors"
				>
					Remove from workspace
				</button>
			</PopoverContent>
		</Popover>
	);
}

function Avatar({
	name,
	email,
	image,
}: {
	name: string | null;
	email: string;
	image: string | null;
}) {
	if (image) {
		// eslint-disable-next-line @next/next/no-img-element
		return (
			<img
				src={image}
				alt={name ?? email}
				className="w-8 h-8 rounded-full object-cover bg-muted"
			/>
		);
	}
	const initial = (name ?? email).trim().charAt(0).toUpperCase();
	return (
		<div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[12px] font-medium text-ink/70">
			{initial}
		</div>
	);
}
