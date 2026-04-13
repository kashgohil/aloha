"use client";

import { useEffect, useState } from "react";

type Heading = { id: string; label: string };

// Scrapes h2 elements inside the legal reading column on mount, then
// renders a sticky table of contents. Entries activate as their section
// scrolls into view via an IntersectionObserver.
export function LegalToc() {
  const [items, setItems] = useState<Heading[]>([]);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const column = document.querySelector<HTMLElement>("[data-legal-prose]");
    if (!column) return;
    const h2s = Array.from(column.querySelectorAll<HTMLElement>("h2"));
    const found = h2s
      .map((h) => {
        if (!h.id) {
          const slug = (h.textContent ?? "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
          h.id = slug;
        }
        return { id: h.id, label: h.textContent?.trim() ?? "" };
      })
      .filter((h) => h.label);
    setItems(found);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive((visible[0].target as HTMLElement).id);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 },
    );
    h2s.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, []);

  if (items.length === 0) return null;

  return (
    <nav aria-label="On this page" className="sticky top-[96px]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
        On this page
      </p>
      <ul className="space-y-2.5 border-l border-border-strong/50 pl-4">
        {items.map((h) => {
          const isActive = h.id === active;
          return (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                className={`block text-[12.5px] leading-[1.45] transition-colors ${
                  isActive
                    ? "text-ink font-medium"
                    : "text-ink/55 hover:text-ink"
                }`}
              >
                {h.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
