import { Mail, UserPlus } from "lucide-react";
import { getCurrentContext } from "@/lib/current-context";
import { listWorkspaceMembers } from "@/app/actions/workspace-members";
import { listPendingInvites } from "@/app/actions/workspace-invites";
import { hasRole, ROLES } from "@/lib/workspaces/roles";
import { MembersList } from "./_components/members-list";
import { InviteForm } from "./_components/invite-form";
import { PendingInvitesList } from "./_components/pending-invites";

export const dynamic = "force-dynamic";

export default async function MembersSettingsPage() {
	const ctx = (await getCurrentContext())!;
	const canInvite = hasRole(ctx.role, ROLES.ADMIN);

	const [members, invites] = await Promise.all([
		listWorkspaceMembers(),
		canInvite ? listPendingInvites() : Promise.resolve([]),
	]);

	return (
		<div className="max-w-3xl space-y-10">
			<header>
				<h1 className="font-display text-[32px] leading-[1.05] tracking-[-0.02em] text-ink">
					Members<span className="text-primary font-light">.</span>
				</h1>
				<p className="mt-2 text-[13.5px] text-ink/65 leading-[1.55]">
					People who can act inside <strong>{ctx.workspace.name}</strong>.
					Roles control what they can do; only owners can change roles.
				</p>
			</header>

			{canInvite ? (
				<section className="space-y-3">
					<div className="flex items-center gap-2">
						<UserPlus className="w-4 h-4 text-ink/60" />
						<h2 className="text-[13px] font-semibold text-ink">
							Invite someone
						</h2>
					</div>
					<InviteForm />
				</section>
			) : null}

			<section className="space-y-3">
				<h2 className="text-[13px] font-semibold text-ink">
					Workspace members
				</h2>
				<MembersList
					members={members}
					viewerRole={ctx.role}
					viewerUserId={ctx.user.id}
				/>
			</section>

			{canInvite && invites.length > 0 ? (
				<section className="space-y-3">
					<div className="flex items-center gap-2">
						<Mail className="w-4 h-4 text-ink/60" />
						<h2 className="text-[13px] font-semibold text-ink">
							Pending invites
						</h2>
					</div>
					<PendingInvitesList invites={invites} />
				</section>
			) : null}
		</div>
	);
}
