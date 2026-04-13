import type { ReactNode } from "react";
import { LegalToc } from "./_components/legal-toc";

// Reading shell for every legal doc. Three-column layout on desktop:
// a left spacer, the prose column, and a sticky TOC on the right.
export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-16 lg:py-24">
        <div className="grid grid-cols-12 gap-10 lg:gap-16">
          <article
            data-legal-prose
            className="col-span-12 lg:col-span-9 max-w-[68ch] legal-prose"
          >
            {children}
          </article>
          <aside className="hidden lg:block lg:col-span-3">
            <LegalToc />
          </aside>
        </div>
      </div>
    </div>
  );
}
