"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plug, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  {
    href: "/app/settings/profile",
    label: "Profile",
    caption: "You & the workspace",
    Icon: UserRound,
  },
  {
    href: "/app/settings/channels",
    label: "Channels",
    caption: "Connected accounts",
    Icon: Plug,
  },
];

export function SettingsNav() {
  const pathname = usePathname();
  const activeIndex = Math.max(
    0,
    ITEMS.findIndex((i) => pathname === i.href || pathname.startsWith(i.href + "/")),
  );

  return (
    <nav aria-label="Settings" className="relative">
      <div className="flex items-end justify-between gap-6 border-b border-border">
        <ul
          role="tablist"
          className="flex items-stretch gap-1 overflow-x-auto -mb-px [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {ITEMS.map((i, idx) => {
            const isActive = idx === activeIndex;
            return (
              <li key={i.href} className="shrink-0">
                <Link
                  href={i.href}
                  role="tab"
                  aria-selected={isActive}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 pl-4 pr-5 py-4 border-b-2 transition-colors",
                    isActive
                      ? "border-ink text-ink"
                      : "border-transparent text-ink/55 hover:text-ink",
                  )}
                >
                  <span
                    className={cn(
                      "font-display text-[11px] leading-none tabular-nums tracking-[0.18em] transition-colors",
                      isActive ? "text-primary" : "text-ink/35 group-hover:text-ink/55",
                    )}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={cn(
                      "w-8 h-8 rounded-full grid place-items-center border transition-colors",
                      isActive
                        ? "bg-ink border-ink text-background"
                        : "bg-background border-border-strong text-ink/65 group-hover:border-ink/60 group-hover:text-ink",
                    )}
                  >
                    <i.Icon className="w-[14px] h-[14px]" strokeWidth={1.75} />
                  </span>
                  <span className="flex flex-col items-start leading-tight">
                    <span className="text-[14px] font-medium">{i.label}</span>
                    <span
                      className={cn(
                        "text-[11px] mt-0.5 transition-colors",
                        isActive ? "text-ink/55" : "text-ink/40",
                      )}
                    >
                      {i.caption}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="hidden md:block shrink-0 pb-4 text-[10.5px] uppercase tracking-[0.24em] text-ink/40 font-medium">
          {String(activeIndex + 1).padStart(2, "0")} / {String(ITEMS.length).padStart(2, "0")}
        </p>
      </div>
    </nav>
  );
}
