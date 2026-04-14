import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOut } from "@/auth";
import { getCurrentUser } from "@/lib/current-user";
import { routes } from "@/lib/routes";

export default async function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`${routes.signin}?callbackUrl=${encodeURIComponent(routes.onboarding.workspace)}`);
  }
  if (user.onboardedAt) {
    redirect("/app/dashboard");
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="flex items-center justify-between px-6 lg:px-10 h-[72px] border-b border-border">
        <Link
          href={routes.home}
          className="flex items-baseline gap-1"
          aria-label="Aloha home"
        >
          <span className="font-display text-[26px] leading-none font-semibold tracking-[-0.03em] text-ink">
            Aloha
          </span>
          <span className="font-display text-primary text-[20px] leading-none">
            .
          </span>
        </Link>

        <div className="flex items-center gap-5">
          <div className="hidden sm:flex items-center gap-2 text-[12px] text-ink/55">
            Signed in as
            <span className="text-ink font-medium">{user.email}</span>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: routes.home });
            }}
          >
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 text-[12.5px] text-ink/60 hover:text-ink transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 flex flex-col">{children}</main>

      <footer className="px-6 lg:px-10 py-5 flex items-center justify-between gap-4 text-[12px] text-ink/50 border-t border-border">
        <p>Setting up your workspace · takes under a minute</p>
        <div className="flex items-center gap-5">
          <Link href={routes.legal.privacy} className="pencil-link">
            Privacy
          </Link>
          <Link href={routes.legal.terms} className="pencil-link">
            Terms
          </Link>
        </div>
      </footer>
    </div>
  );
}
