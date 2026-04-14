"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/app/settings/profile", label: "Profile" },
  { href: "/app/settings/channels", label: "Channels" },
];

export function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Settings">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-3">
        Workspace
      </p>
      <ul className="space-y-0.5">
        {ITEMS.map((i) => {
          const isActive = pathname === i.href;
          return (
            <li key={i.href}>
              <Link
                href={i.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between h-10 px-3.5 rounded-full text-[13.5px] transition-colors",
                  isActive
                    ? "bg-ink text-background font-medium"
                    : "text-ink/70 hover:text-ink hover:bg-muted/60",
                )}
              >
                {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
