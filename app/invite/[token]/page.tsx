import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { workspaces } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { previewInviteByToken, acceptInviteAction } from "@/app/actions/workspace-invites-accept";
import { routes } from "@/lib/routes";

type Params = Promise<{ token: string }>;

export const dynamic = "force-dynamic";

export default async function AcceptInvitePage({
	params,
}: {
	params: Params;
}) {
	const { token } = await params;
	const invite = await previewInviteByToken(token);

	if (!invite) {
		return (
			<InviteShell
				title="Invite not found"
				body="This link doesn't match any invite. It may have been used or revoked."
			/>
		);
	}
	if (invite.status === "accepted") {
		return (
			<InviteShell
				title="Already accepted"
				body="This invite has already been used. Sign in to reach the workspace."
				action={
					<Link
						href={routes.signin}
						className="inline-flex items-center h-10 px-5 rounded-full bg-ink text-background text-[13px] font-medium"
					>
						Sign in
					</Link>
				}
			/>
		);
	}
	if (invite.status === "revoked") {
		return (
			<InviteShell
				title="Invite revoked"
				body="The admin who sent this invite has cancelled it. Ask for a fresh one."
			/>
		);
	}
	if (invite.status === "expired") {
		return (
			<InviteShell
				title="Invite expired"
				body="This invite has expired. Ask the admin to re-send — each invite is good for 7 days."
			/>
		);
	}

	const [workspace] = await db
		.select({ name: workspaces.name })
		.from(workspaces)
		.where(eq(workspaces.id, invite.workspaceId))
		.limit(1);

	const user = await getCurrentUser();
	if (!user) {
		// Route through sign-in, landing back here after.
		redirect(
			`${routes.signin}?callbackUrl=${encodeURIComponent(`/app/invite/${token}`)}&email=${encodeURIComponent(invite.email)}`,
		);
	}

	const mismatch = user.email.toLowerCase() !== invite.email.toLowerCase();

	if (mismatch) {
		return (
			<InviteShell
				title="Wrong account"
				body={`This invite is for ${invite.email}, but you're signed in as ${user.email}. Sign out and sign back in as ${invite.email} to accept.`}
				action={
					<Link
						href="/api/auth/signout"
						className="inline-flex items-center h-10 px-5 rounded-full border border-border text-[13px] font-medium text-ink"
					>
						Sign out
					</Link>
				}
			/>
		);
	}

	return (
		<InviteShell
			title={`Join ${workspace?.name ?? "this workspace"}`}
			body={`You've been invited as ${invite.role}. Accept to switch into this workspace.`}
			action={
				<form action={acceptInviteAction}>
					<input type="hidden" name="token" value={token} />
					<button
						type="submit"
						className="inline-flex items-center h-10 px-5 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors"
					>
						Accept invite
					</button>
				</form>
			}
		/>
	);
}

function InviteShell({
	title,
	body,
	action,
}: {
	title: string;
	body: string;
	action?: React.ReactNode;
}) {
	return (
		<div className="min-h-screen grid place-items-center px-6 py-20 bg-background">
			<div className="max-w-md w-full rounded-3xl border border-border bg-background-elev p-8 text-center space-y-5">
				<h1 className="font-display text-[28px] leading-[1.1] tracking-[-0.02em] text-ink">
					{title}
				</h1>
				<p className="text-[14px] text-ink/65 leading-[1.55]">{body}</p>
				{action ? <div className="pt-2">{action}</div> : null}
			</div>
		</div>
	);
}
