"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LogOut, Settings, Plug, LifeBuoy } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

export function AvatarMenu({
  name,
  email,
  image,
  workspaceName,
}: {
  name: string | null;
  email: string;
  image: string | null;
  workspaceName: string | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initials = (name ?? email)
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "h-9 w-9 rounded-full overflow-hidden border border-border-strong grid place-items-center bg-peach-100 text-ink text-[12px] font-semibold transition-colors",
          open && "ring-2 ring-ink/15"
        )}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          initials || "A"
        )}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-[280px] rounded-2xl border border-border-strong bg-background-elev shadow-[0_18px_48px_-24px_rgba(26,22,18,0.25)] overflow-hidden z-50"
        >
          <div className="px-4 py-4 border-b border-border">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/55">
              Workspace
            </p>
            <p className="mt-1 font-display text-[18px] tracking-[-0.01em] text-ink">
              {workspaceName ?? "Untitled workspace"}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full overflow-hidden border border-border grid place-items-center bg-peach-100 text-[11px] font-semibold">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="" className="w-full h-full object-cover" />
                ) : (
                  initials || "A"
                )}
              </span>
              <div className="min-w-0">
                <p className="text-[13px] text-ink truncate">{name ?? email}</p>
                <p className="text-[12px] text-ink/55 truncate">{email}</p>
              </div>
            </div>
          </div>

          <ul className="py-1 text-[13.5px]">
            <MenuItem href="/app/settings/profile" icon={Settings} label="Settings" />
            <MenuItem href="/app/settings/channels" icon={Plug} label="Channels" />
            <MenuItem href="/help" icon={LifeBuoy} label="Help & docs" external />
          </ul>

          <div className="border-t border-border py-1">
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full px-4 py-2.5 text-left text-[13.5px] text-ink/80 hover:bg-muted/60 inline-flex items-center gap-2.5 transition-colors"
              role="menuitem"
            >
              <LogOut className="w-4 h-4 text-ink/60" />
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({
  href,
  icon: Icon,
  label,
  external,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  external?: boolean;
}) {
  const className =
    "px-4 py-2.5 inline-flex items-center gap-2.5 w-full text-ink/80 hover:bg-muted/60 transition-colors";
  return (
    <li>
      {external ? (
        <a href={href} className={className} role="menuitem">
          <Icon className="w-4 h-4 text-ink/60" />
          {label}
        </a>
      ) : (
        <Link href={href} className={className} role="menuitem">
          <Icon className="w-4 h-4 text-ink/60" />
          {label}
        </Link>
      )}
    </li>
  );
}
