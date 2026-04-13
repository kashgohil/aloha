import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { footerLinks } from "@/lib/routes";

// Sibling legal docs at the bottom of every page.
export function LegalFooter({ current }: { current: string }) {
  const legalGroup = footerLinks.secondary.find((g) => g.heading === "Legal");
  if (!legalGroup) return null;

  return (
    <footer className="not-prose mt-20 pt-10 border-t border-border">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-6">
        Other policies
      </p>
      <ul className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {legalGroup.links
          .filter((l) => l.href !== current)
          .map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="group inline-flex items-center justify-between w-full px-5 py-4 rounded-2xl bg-background-elev border border-border hover:bg-muted/50 transition-colors"
              >
                <span className="font-display text-[16px] tracking-[-0.005em] text-ink">
                  {l.label}
                </span>
                <ArrowUpRight className="w-4 h-4 text-ink/40 group-hover:text-primary transition-colors" />
              </Link>
            </li>
          ))}
      </ul>
    </footer>
  );
}
