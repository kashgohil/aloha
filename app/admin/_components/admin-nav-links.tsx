"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  LayoutDashboard,
  Users,
  MailCheck,
  CreditCard,
  Sparkles,
  ScrollText,
  BellRing,
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

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Requests", href: "/admin/requests", icon: MailCheck },
  {
    label: "Channel interest",
    href: "/admin/channel-interest",
    icon: BellRing,
  },
  { label: "Billing", href: "/admin/billing", icon: CreditCard },
  { label: "AI usage", href: "/admin/ai-usage", icon: Sparkles },
  { label: "Audit log", href: "/admin/audit", icon: ScrollText },
];

type Variant = "horizontal" | "sidebar";

export function AdminNavLinks({
  variant = "horizontal",
  collapsed = false,
}: {
  variant?: Variant;
  collapsed?: boolean;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin"
      ? pathname === "/admin"
      : pathname === href || pathname.startsWith(`${href}/`);

  if (variant === "sidebar") {
    return (
      <ul className="flex flex-col gap-1">
        {ADMIN_NAV_ITEMS.map((i) => {
          const active = isActive(i.href);
          const Icon = i.icon;
          const link = (
            <Link
              href={i.href}
              aria-label={collapsed ? i.label : undefined}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex items-center h-10 rounded-xl text-[14px] font-medium transition-colors gap-3 px-3",
                active
                  ? "bg-peach-100/70 text-ink"
                  : "text-ink/70 hover:text-ink hover:bg-muted/60",
              )}
            >
              <Icon
                className={cn(
                  "w-[18px] h-[18px] shrink-0 transition-colors",
                  active ? "text-primary" : "text-ink/50 group-hover:text-ink",
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
      {ADMIN_NAV_ITEMS.map((i) => {
        const active = isActive(i.href);
        const Icon = i.icon;
        return (
          <li key={i.href}>
            <Link
              href={i.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative inline-flex items-center gap-2 h-10 px-3 rounded-full text-[13.5px] font-medium transition-colors whitespace-nowrap",
                active
                  ? "bg-peach-100/70 text-ink"
                  : "text-ink/65 hover:text-ink hover:bg-muted/60",
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0",
                  active ? "text-primary" : "text-ink/55",
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
