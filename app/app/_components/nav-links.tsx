"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  CalendarDays,
  FileText,
  Images,
  Inbox,
  LayoutDashboard,
  Lightbulb,
  Megaphone,
  PenSquare,
  Rss,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
  { label: "Posts", href: "/app/posts", icon: FileText },
  { label: "Calendar", href: "/app/calendar", icon: CalendarDays },
  { label: "Composer", href: "/app/composer", icon: PenSquare },
  { label: "Campaigns", href: "/app/campaigns", icon: Megaphone },
  { label: "Ideas", href: "/app/ideas", icon: Lightbulb },
  { label: "Library", href: "/app/library", icon: Images },
  { label: "Feeds", href: "/app/feeds", icon: Rss },
  { label: "Inbox", href: "/app/inbox", icon: Inbox },
  { label: "Audience", href: "/app/audience", icon: Users },
  { label: "Automations", href: "/app/automations", icon: Sparkles },
];

type Variant = "horizontal" | "sidebar";

export function NavLinks({
  variant = "horizontal",
  collapsed = false,
}: {
  variant?: Variant;
  collapsed?: boolean;
}) {
  const pathname = usePathname();

  if (variant === "sidebar") {
    return (
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map((i) => {
          const isActive =
            pathname === i.href || pathname.startsWith(`${i.href}/`);
          const Icon = i.icon;

          const link = (
            <Link
              href={i.href}
              aria-label={collapsed ? i.label : undefined}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group relative flex items-center h-10 rounded-xl text-[14px] font-medium transition-colors",
                collapsed
                  ? "w-10 mx-auto justify-center"
                  : "gap-3 px-3",
                isActive
                  ? "bg-peach-100/70 text-ink"
                  : "text-ink/70 hover:text-ink hover:bg-muted/60",
              )}
            >
              {isActive && !collapsed ? (
                <span
                  aria-hidden
                  className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-primary"
                />
              ) : null}
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
      {NAV_ITEMS.map((i) => {
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
