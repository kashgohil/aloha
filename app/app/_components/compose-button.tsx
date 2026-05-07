"use client";

// Sidebar's primary action: opens the global compose dialog over whatever
// page the user is currently on. Uses `composeHref` so the underlying
// pathname + query state are preserved (we only swap in `?compose=new`),
// avoiding the side-effect of `<Link href="?compose=new">` which would
// strip every other query param.

import { PenSquare } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { composeHref } from "@/lib/compose-url";
import { cn } from "@/lib/utils";

export function ComposeButton({
  collapsed = false,
  variant = "sidebar",
}: {
  collapsed?: boolean;
  variant?: "sidebar" | "topbar";
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const href = composeHref(
    { pathname, search: new URLSearchParams(params.toString()) },
    { mode: "new" },
  );

  if (variant === "topbar") {
    const link = (
      <Link
        href={href}
        aria-label="Compose"
        className="h-9 w-9 grid place-items-center rounded-full bg-ink text-background hover:bg-primary transition-colors"
      >
        <PenSquare className="w-3.5 h-3.5" />
      </Link>
    );
    return (
      <Tooltip>
        <TooltipTrigger render={link} />
        <TooltipContent side="bottom">Compose</TooltipContent>
      </Tooltip>
    );
  }

  const link = (
    <Link
      href={href}
      aria-label={collapsed ? "Compose" : undefined}
      className={cn(
        "group flex items-center h-10 rounded-xl bg-ink text-background hover:bg-primary transition-colors gap-2.5",
        collapsed ? "w-10 justify-center mx-auto" : "px-3.5",
      )}
    >
      <PenSquare className="w-[16px] h-[16px] shrink-0" />
      {collapsed ? null : (
        <span className="text-[14px] font-semibold tracking-tight">
          Compose
        </span>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger render={link} />
        <TooltipContent side="right" sideOffset={12}>
          Compose
        </TooltipContent>
      </Tooltip>
    );
  }
  return link;
}
