import { getCurrentUser, type CurrentUser } from "@/lib/current-user";
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
	// Only the auth/onboarding gate blocks the shell. Everything else
	// streams in via independent <Suspense> slots so the page's own
	// loading.tsx can paint immediately on navigation.
	const user = await getCurrentUser();
	if (!user) {
		redirect(`${routes.signin}?callbackUrl=/app/dashboard`);
	}
	if (!user.onboardedAt) {
		redirect(routes.onboarding.workspace);
	}

	return (
		<ThemeProvider>
			<Suspense fallback={null}>
				<NavProgress />
			</Suspense>
			<div className="min-h-screen flex bg-background text-foreground">
				<Suspense fallback={<SidebarFallback />}>
					<SidebarSlot user={user} />
				</Suspense>
				<div className="flex-1 min-w-0 flex flex-col">
					<Suspense fallback={null}>
						<TopBarSlot user={user} />
					</Suspense>
					<Suspense fallback={null}>
						<BannersSlot />
					</Suspense>
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

async function SidebarSlot({ user }: { user: CurrentUser }) {
	const [workspaces, ctx, creationEntitlement] = await Promise.all([
		listMyWorkspaces(),
		getCurrentContext(),
		getWorkspaceCreationEntitlement(user.id),
	]);
	const credits = ctx
		? await getCreditsSnapshot(ctx.workspace.ownerUserId)
		: null;
	return (
		<AppSidebar
			user={user}
			workspaces={workspaces}
			role={ctx?.role ?? null}
			canCreateWorkspace={creationEntitlement.allowed}
			credits={
				credits
					? { balance: credits.balance, monthlyGrant: credits.monthlyGrant }
					: null
			}
		/>
	);
}

async function TopBarSlot({ user }: { user: CurrentUser }) {
	const ctx = await getCurrentContext();
	return <AppTopBar user={user} role={ctx?.role ?? null} />;
}

async function BannersSlot() {
	const ctx = await getCurrentContext();
	if (!ctx) return null;
	const isOwner = ctx.user.id === ctx.workspace.ownerUserId;
	const trial = await getTrialState(ctx.workspace.id, ctx.workspace.ownerUserId);
	return (
		<>
			{ctx.workspace.frozenAt ? <FrozenBanner isOwner={isOwner} /> : null}
			{trial && (trial.expired || (trial.active && trial.daysRemaining <= 7)) ? (
				<TrialBanner
					expired={trial.expired}
					daysRemaining={trial.daysRemaining}
					isOwner={isOwner}
				/>
			) : null}
		</>
	);
}

// Reserves the collapsed sidebar width so the page shell doesn't shift
// while the sidebar slot resolves.
function SidebarFallback() {
	return (
		<aside
			aria-hidden
			className="hidden lg:flex lg:flex-col sticky top-0 h-screen shrink-0 border-r border-border bg-background-elev/60 backdrop-blur-md w-[68px] z-10"
		/>
	);
}
