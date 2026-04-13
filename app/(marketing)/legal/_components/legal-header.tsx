import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { routes } from "@/lib/routes";

type Props = {
  title: string;
  lastUpdated: string; // human-friendly: "April 10, 2026"
  description?: string;
};

// Shared header block for every legal doc — eyebrow, title, last-updated
// line, and the honest "this is what we can change" note.
export function LegalHeader({ title, lastUpdated, description }: Props) {
  return (
    <header className="not-prose mb-10">
      <div className="inline-flex items-center gap-2 mb-5 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/55">
        <span className="w-6 h-px bg-ink/35" />
        Legal
      </div>
      <h1 className="font-display font-normal text-ink leading-[1] tracking-[-0.02em] text-[44px] sm:text-[56px] lg:text-[68px]">
        {title}
      </h1>
      {description && (
        <p className="mt-5 text-[17px] text-ink/70 leading-[1.6] max-w-xl">
          {description}
        </p>
      )}
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px] text-ink/60">
        <span className="font-mono uppercase tracking-[0.16em]">
          Last updated · {lastUpdated}
        </span>
        <Link
          href={routes.company.contact}
          className="pencil-link inline-flex items-center gap-1.5"
        >
          Something unclear? Write us
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </header>
  );
}
