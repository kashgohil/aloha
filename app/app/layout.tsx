import { getCurrentUser } from "@/lib/current-user";
import { getCurrentContext } from "@/lib/current-context";
import { listMyWorkspaces } from "@/app/actions/workspace-switch";
import { getCreditsSnapshot } from "@/lib/billing/credits";
import { getTrialState } from "@/lib/billing/trial";
import { getWorkspaceCreationEntitlement } from "@/lib/billing/workspace-limits";
import { routes } from "@/lib/routes";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { ComposerDialog } from "@/components/composer-dialog";
import { AppSidebar } from "./_components/app-sidebar";
import { AppTopBar } from "./_components/app-top-bar";
import { FrozenBanner } from "./_components/frozen-banner";
import { NavProgress } from "./_components/nav-progress";
import { ThemeProvider } from "./_components/theme-provider";
import { TrialBanner } from "./_components/trial-banner";

export default async function AppLayout({ children }: { children: ReactNode }) {
	const user = await getCurrentUser();
	if (!user) {
		redirect(`${routes.signin}?callbackUrl=/app/dashboard`);
	}
	if (!user.onboardedAt) {
		redirect(routes.onboarding.workspace);
	}

	const [workspaces, ctx, creationEntitlement] = await Promise.all([
		listMyWorkspaces(),
		getCurrentContext(),
		getWorkspaceCreationEntitlement(user.id),
	]);
	const role = ctx?.role ?? null;
	const [trial, credits] = ctx
		? await Promise.all([
				getTrialState(ctx.workspace.id, ctx.workspace.ownerUserId),
				getCreditsSnapshot(ctx.workspace.ownerUserId),
			])
		: [null, null];
	const isOwner = !!ctx && ctx.user.id === ctx.workspace.ownerUserId;

	return (
		<ThemeProvider>
			<Suspense fallback={null}>
				<NavProgress />
			</Suspense>
			<div className="min-h-screen flex bg-background text-foreground">
				<AppSidebar
					user={user}
					workspaces={workspaces}
					role={role}
					canCreateWorkspace={creationEntitlement.allowed}
					credits={
						credits
							? {
									balance: credits.balance,
									monthlyGrant: credits.monthlyGrant,
								}
							: null
					}
				/>
				<div className="flex-1 min-w-0 flex flex-col">
					<AppTopBar user={user} role={role} />
					{ctx?.workspace.frozenAt ? (
						<FrozenBanner isOwner={isOwner} />
					) : null}
					{trial && (trial.expired || (trial.active && trial.daysRemaining <= 7)) ? (
						<TrialBanner
							expired={trial.expired}
							daysRemaining={trial.daysRemaining}
							isOwner={isOwner}
						/>
					) : null}
					<main className="relative flex-1">
						<div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-10 lg:py-14">
							{children}
						</div>
					</main>
				</div>
			</div>
			<Suspense fallback={null}>
				<ComposerDialog />
			</Suspense>
		</ThemeProvider>
	);
}
