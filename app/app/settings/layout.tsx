import type { ReactNode } from "react";
import { SettingsNav } from "./_components/settings-nav";

export default function SettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="space-y-10">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          Settings
        </p>
        <h1 className="mt-3 font-display text-[44px] lg:text-[52px] leading-[1.02] tracking-[-0.03em] text-ink font-normal">
          Keep your workspace
          <span className="text-primary font-light italic"> in order.</span>
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <aside className="lg:col-span-3 lg:sticky lg:top-[96px]">
          <SettingsNav />
        </aside>
        <div className="lg:col-span-9">{children}</div>
      </div>
    </div>
  );
}
