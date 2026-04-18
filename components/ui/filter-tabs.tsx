import Link from "next/link";
import { cn } from "@/lib/utils";

export type FilterTabItem = {
  key: string;
  label: string;
  href?: string;
  count?: number;
};

export function FilterTabs({
  items,
  activeKey,
  onSelect,
  className,
}: {
  items: FilterTabItem[];
  activeKey: string;
  onSelect?: (key: string) => void;
  className?: string;
}) {
  return (
    <nav aria-label="Filter" className={cn("relative", className)}>
      <ul
        role="tablist"
        className="flex items-stretch gap-1 border-b border-border overflow-x-auto -mb-px [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {items.map((t) => {
          const active = t.key === activeKey;
          const tabClass = cn(
            "inline-flex items-center gap-2 h-10 px-4 border-b-2 text-[13.5px] font-medium transition-colors whitespace-nowrap",
            active
              ? "border-ink text-ink"
              : "border-transparent text-ink/55 hover:text-ink",
          );
          const inner = (
            <>
              {t.label}
              {typeof t.count === "number" ? (
                <span
                  className={cn(
                    "text-[11.5px] tabular-nums transition-colors",
                    active ? "text-primary" : "text-ink/40",
                  )}
                >
                  {t.count}
                </span>
              ) : null}
            </>
          );
          return (
            <li key={t.key} className="shrink-0">
              {onSelect ? (
                <button
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onSelect(t.key)}
                  className={cn(tabClass, "cursor-pointer outline-none")}
                >
                  {inner}
                </button>
              ) : (
                <Link
                  href={t.href ?? "#"}
                  role="tab"
                  aria-selected={active}
                  aria-current={active ? "page" : undefined}
                  className={tabClass}
                >
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
