import Link from "next/link";
import { PenSquare } from "lucide-react";
import { NavLinks } from "./nav-links";
import { AvatarMenu } from "./avatar-menu";
import { NotificationsBell } from "./notifications-bell";
import type { CurrentUser } from "@/lib/current-user";

export function AppTopBar({
  user,
  role,
}: {
  user: CurrentUser;
  role: import("@/lib/current-context").WorkspaceRole | null;
}) {
  return (
    <div className="lg:hidden sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="flex items-center justify-between px-5 h-[60px]">
        <Link
          href="/app/dashboard"
          className="flex items-baseline gap-1"
          aria-label="Aloha home"
        >
          <span className="font-display text-[22px] leading-none font-semibold tracking-[-0.03em] text-ink">
            Aloha
          </span>
          <span className="font-display text-primary text-[17px] leading-none">
            .
          </span>
        </Link>

        <div className="flex items-center gap-1.5">
          <Link
            href="?compose=new"
            aria-label="Compose"
            className="h-9 w-9 grid place-items-center rounded-full bg-ink text-background hover:bg-primary transition-colors"
          >
            <PenSquare className="w-3.5 h-3.5" />
          </Link>
          <NotificationsBell />
          <AvatarMenu
            name={user.name}
            email={user.email}
            image={user.image}
            workspaceName={user.workspaceName}
          />
        </div>
      </div>
      <div className="px-4 pb-2">
        <NavLinks role={role} />
      </div>
    </div>
  );
}
