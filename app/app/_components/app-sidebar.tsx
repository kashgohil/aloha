"use client";

import type { CurrentUser } from "@/lib/current-user";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AvatarMenu } from "./avatar-menu";
import { NavLinks } from "./nav-links";
import { NotificationsBell } from "./notifications-bell";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

const STORAGE_KEY = "aloha:sidebar:expanded";

export function AppSidebar({ user }: { user: CurrentUser }) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") {
        setExpanded(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const toggle = () => {
    setExpanded((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  const collapsed = !expanded;

  return (
    <TooltipProvider delay={120}>
      <aside
        className={cn(
          "relative hidden lg:flex lg:flex-col sticky top-0 h-screen shrink-0 border-r border-border bg-background-elev/60 backdrop-blur-md transition-[width] duration-200",
          collapsed ? "w-[68px]" : "w-[248px]",
        )}
      >
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute top-7 right-0 translate-x-1/2 z-10 h-6 w-6 grid place-items-center rounded-full border border-border-strong bg-background-elev text-ink/60 hover:text-ink hover:bg-muted/80 shadow-[0_4px_12px_-4px_rgba(26,22,18,0.18)] transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-[14px] h-[14px]" />
          ) : (
            <ChevronLeft className="w-[14px] h-[14px]" />
          )}
        </button>

        <div className="flex items-center pt-5 pb-4 px-3 h-[52px]">
          <Link
            href="/app/dashboard"
            className={cn(
              "inline-flex items-baseline gap-0.5",
              collapsed ? "mx-auto" : "pl-3",
            )}
            aria-label="Aloha home"
          >
            <span className="font-display text-[24px] leading-none font-semibold tracking-[-0.03em] text-ink">
              {collapsed ? "A" : "Aloha"}
            </span>
            <span className="font-display text-primary text-[18px] leading-none">
              .
            </span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3">
          <NavLinks variant="sidebar" collapsed={collapsed} />
        </nav>

        <div className="py-3 px-3 border-t border-border">
          <div
            className={cn(
              "flex gap-2",
              collapsed ? "flex-col items-center" : "items-center justify-between",
            )}
          >
            <AvatarMenu
              name={user.name}
              email={user.email}
              image={user.image}
              workspaceName={user.workspaceName}
              placement="top"
              expandedLabel={!collapsed}
            />
            <ThemeToggle />
            <NotificationsBell />
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
