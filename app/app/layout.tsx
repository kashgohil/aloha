import { getCurrentUser } from "@/lib/current-user";
import { routes } from "@/lib/routes";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppSidebar } from "./_components/app-sidebar";
import { AppTopBar } from "./_components/app-top-bar";
import { ThemeProvider } from "./_components/theme-provider";

export default async function AppLayout({ children }: { children: ReactNode }) {
	const user = await getCurrentUser();
	if (!user) {
		redirect(`${routes.signin}?callbackUrl=/app/dashboard`);
	}
	if (!user.onboardedAt) {
		redirect(routes.onboarding.workspace);
	}

	return (
		<ThemeProvider>
			<div className="min-h-screen flex bg-background text-foreground">
				<AppSidebar user={user} />
				<div className="flex-1 min-w-0 flex flex-col">
					<AppTopBar user={user} />
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
