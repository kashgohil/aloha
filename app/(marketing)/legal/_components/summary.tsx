import type { ReactNode } from "react";
import { Sparkle } from "lucide-react";

// Plain-language summary callout at the top of every legal doc.
// The body is the lawyers' version; this box is what a human
// should remember.
export function Summary({ children }: { children: ReactNode }) {
  return (
    <aside className="not-prose my-10 rounded-3xl bg-peach-100 border border-peach-300/40 p-7 lg:p-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkle className="w-3.5 h-3.5 text-primary" />
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/60">
          In plain English
        </p>
      </div>
      <div className="text-[15px] text-ink/85 leading-[1.65] [&_p+p]:mt-3 [&_p]:m-0">
        {children}
      </div>
    </aside>
  );
}
