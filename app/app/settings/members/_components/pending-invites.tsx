"use client";

import { useTransition } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
	revokeWorkspaceInvite,
	type PendingInvite,
} from "@/app/actions/workspace-invites";
import type { WorkspaceRole } from "@/lib/current-context";

const ROLE_LABEL: Record<WorkspaceRole, string> = {
	owner: "Owner",
	admin: "Admin",
	editor: "Editor",
	reviewer: "Reviewer",
	viewer: "Viewer",
};

export function PendingInvitesList({ invites }: { invites: PendingInvite[] }) {
	return (
		<ul className="rounded-2xl border border-border bg-background-elev divide-y divide-border">
			{invites.map((inv) => (
				<InviteRow key={inv.id} invite={inv} />
			))}
		</ul>
	);
}

function InviteRow({ invite }: { invite: PendingInvite }) {
	const [isPending, startTransition] = useTransition();

	const handleRevoke = () => {
		if (!confirm(`Revoke invite for ${invite.email}?`)) return;
		const toastId = toast.loading("Revoking…");
		startTransition(async () => {
			try {
				await revokeWorkspaceInvite(invite.id);
				toast.success("Invite revoked.", { id: toastId });
			} catch (err) {
				toast.error(
					err instanceof Error ? err.message : "Couldn't revoke.",
					{ id: toastId },
				);
			}
		});
	};

	return (
		<li className="flex items-center gap-3 px-4 py-3">
			<div className="min-w-0 flex-1">
				<p className="text-[13px] font-medium text-ink truncate">
					{invite.email}
				</p>
				<p className="text-[11.5px] text-ink/55">
					{ROLE_LABEL[invite.role]} · expires{" "}
					{new Intl.DateTimeFormat("en-US", {
						dateStyle: "medium",
					}).format(invite.expiresAt)}
				</p>
			</div>
			<button
				type="button"
				onClick={handleRevoke}
				disabled={isPending}
				className="inline-flex items-center gap-1 h-8 px-3 rounded-full border border-border text-[12px] text-ink/65 hover:text-ink hover:border-ink/40 disabled:opacity-40 transition-colors"
			>
				{isPending ? (
					<Loader2 className="w-3 h-3 animate-spin" />
				) : (
					<X className="w-3 h-3" />
				)}
				Revoke
			</button>
		</li>
	);
}
