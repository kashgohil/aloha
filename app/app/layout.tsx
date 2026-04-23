import { getCurrentUser } from "@/lib/current-user";
import { getCurrentContext } from "@/lib/current-context";
import { listMyWorkspaces } from "@/app/actions/workspace-switch";
import { getWorkspaceCreationEntitlement } from "@/lib/billing/workspace-limits";
import { routes } from "@/lib/routes";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { AppSidebar } from "./_components/app-sidebar";
import { AppTopBar } from "./_components/app-top-bar";
import { NavProgress } from "./_components/nav-progress";
import { ThemeProvider } from "./_components/theme-provider";

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
				/>
				<div className="flex-1 min-w-0 flex flex-col">
					<AppTopBar user={user} role={role} />
					<main className="flex-1">
						<div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-10 lg:py-14">
							{children}
						</div>
					</main>
				</div>
			</div>
		</ThemeProvider>
	);
}
