import Link from "next/link";
import { Calendar, List, Rows3 } from "lucide-react";
import { cn } from "@/lib/utils";

const VIEWS = [
  { slug: "list", label: "List", Icon: List },
  { slug: "calendar", label: "Calendar", Icon: Calendar },
  { slug: "timeline", label: "Timeline", Icon: Rows3 },
] as const;

export type CanvasView = (typeof VIEWS)[number]["slug"];

export function isCanvasView(v: string): v is CanvasView {
  return VIEWS.some((entry) => entry.slug === v);
}

// Pill toggle implemented as Link nav rather than a client component — RSC
// re-renders the page with the new search param and the canvas redraws.
// `scroll={false}` keeps the user's scroll position when switching views.
export function ViewToggle({
  current,
  beat,
}: {
  current: CanvasView;
  beat?: string | null;
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border border-border bg-background p-0.5">
      {VIEWS.map(({ slug, label, Icon }) => {
        const params = new URLSearchParams();
        if (slug !== "list") params.set("view", slug);
        if (beat) params.set("beat", beat);
        const href = params.toString() ? `?${params.toString()}` : "?";
        const active = current === slug;
        return (
          <Link
            key={slug}
            href={href}
            scroll={false}
            prefetch={false}
            className={cn(
              "inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-medium transition-colors",
              active
                ? "bg-ink text-background"
                : "text-ink/65 hover:text-ink",
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
