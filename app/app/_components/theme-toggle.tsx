"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative h-9 w-9 shrink-0 grid place-items-center rounded-full text-ink/70 hover:text-ink hover:bg-muted/60 transition-colors",
        className,
      )}
    >
      {isDark ? (
        <Sun className="w-[17px] h-[17px]" />
      ) : (
        <Moon className="w-[17px] h-[17px]" />
      )}
    </button>
  );
}
