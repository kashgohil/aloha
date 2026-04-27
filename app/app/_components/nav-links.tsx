"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  BarChart3,
  CalendarDays,
  Images,
  Inbox,
  LayoutDashboard,
  Lightbulb,
  Mail,
  Megaphone,
  Newspaper,
  PenSquare,
  Rss,
  Users,
  // Workflow, // re-import when Automations nav entry is restored
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { WorkspaceRole } from "@/lib/current-context";
import { ROLES, hasRole } from "@/lib/workspaces/roles";

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  // Optional role gate — items without it are visible to every member.
  // Mirrors server-side role guards on the corresponding pages/actions
  // so nav hides what the user can't reach.
  requires?: readonly WorkspaceRole[];
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
  { label: "Analytics", href: "/app/analytics", icon: BarChart3 },
  { label: "Posts", href: "/app/posts", icon: Newspaper },
  { label: "Calendar", href: "/app/calendar", icon: CalendarDays },
  { label: "Composer", href: "/app/composer", icon: PenSquare },
  {
    label: "Campaigns",
    href: "/app/campaigns",
    icon: Megaphone,
    requires: ROLES.ADMIN,
  },
  { label: "Ideas", href: "/app/ideas", icon: Lightbulb },
  { label: "Library", href: "/app/library", icon: Images },
  { label: "Feeds", href: "/app/feeds", icon: Rss },
  { label: "Inbox", href: "/app/inbox", icon: Inbox },
  { label: "Audience", href: "/app/audience", icon: Users },
  { label: "Broadcasts", href: "/app/broadcasts", icon: Mail },
  // Automations hidden in production — feature is built but doesn't match
  // the social-first positioning yet. Re-enable when the wedge is decided.
  // {
  //   label: "Automations",
  //   href: "/app/automations",
  //   icon: Workflow,
  //   requires: ROLES.ADMIN,
  // },
];

type Variant = "horizontal" | "sidebar";

export function NavLinks({
  variant = "horizontal",
  collapsed = false,
  role = null,
}: {
  variant?: Variant;
  collapsed?: boolean;
  role?: WorkspaceRole | null;
}) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter(
    (i) => !i.requires || hasRole(role, i.requires),
  );

  if (variant === "sidebar") {
    return (
      <ul className="flex flex-col gap-1">
        {items.map((i) => {
          const isActive =
            pathname === i.href || pathname.startsWith(`${i.href}/`);
          const Icon = i.icon;

          const link = (
            <Link
              href={i.href}
              aria-label={collapsed ? i.label : undefined}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group flex items-center h-10 rounded-xl text-[14px] font-medium transition-colors gap-3 px-3",
                isActive
                  ? "bg-peach-100/70 text-ink"
                  : "text-ink/70 hover:text-ink hover:bg-muted/60",
              )}
            >
              <Icon
                className={cn(
                  "w-[18px] h-[18px] shrink-0 transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-ink/50 group-hover:text-ink",
                )}
              />
              {collapsed ? null : <span>{i.label}</span>}
            </Link>
          );

          return (
            <li key={i.href}>
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger render={link} />
                  <TooltipContent side="right" sideOffset={12}>
                    {i.label}
                  </TooltipContent>
                </Tooltip>
              ) : (
                link
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ul className="flex items-center gap-1 overflow-x-auto -mx-1 px-1">
      {items.map((i) => {
        const isActive =
          pathname === i.href || pathname.startsWith(`${i.href}/`);
        const Icon = i.icon;
        return (
          <li key={i.href}>
            <Link
              href={i.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative inline-flex items-center gap-2 h-10 px-3 rounded-full text-[13.5px] font-medium transition-colors whitespace-nowrap",
                isActive
                  ? "bg-peach-100/70 text-ink"
                  : "text-ink/65 hover:text-ink hover:bg-muted/60",
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0",
                  isActive ? "text-primary" : "text-ink/55",
                )}
              />
              {i.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
