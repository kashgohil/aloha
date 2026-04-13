import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { navItems, routes } from "@/lib/routes";

export function MarketingNav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="max-w-[1320px] mx-auto flex items-center justify-between px-6 lg:px-10 h-[72px]">
        <div className="flex items-center gap-12">
          <Link href={routes.home} className="flex items-baseline gap-1 group">
            <span className="font-display text-[28px] leading-none font-semibold tracking-[-0.03em] text-ink">
              Aloha
            </span>
            <span className="font-display text-primary text-[22px] leading-none">.</span>
          </Link>
          <ul className="hidden lg:flex items-center gap-8">
            {navItems.map((i) => (
              <li key={i.href}>
                <Link
                  href={i.href}
                  className="pencil-link text-[14px] font-medium text-ink/80 hover:text-ink"
                >
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={routes.signin}
            className="hidden sm:inline-flex h-10 items-center px-4 text-[14px] font-medium text-ink/80 hover:text-ink"
          >
            Sign in
          </Link>
          <Link
            href={routes.signin}
            className="inline-flex h-10 items-center gap-1.5 bg-ink text-background px-5 rounded-full text-[13.5px] font-medium hover:bg-primary transition-colors"
          >
            Start free
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
