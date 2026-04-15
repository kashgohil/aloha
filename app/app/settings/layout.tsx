import type { ReactNode } from "react";
import { SettingsNav } from "./_components/settings-nav";

export default function SettingsLayout({ children }: { children: ReactNode }) {
	return (
		<div className="space-y-8">
			<header>
				<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
					Settings
				</p>
				<h1 className="mt-3 font-display text-[44px] lg:text-[52px] leading-[1.02] tracking-[-0.03em] text-ink font-normal">
					Keep your workspace
					<span className="text-primary font-light"> in order.</span>
				</h1>
			</header>

			<SettingsNav />

			<div className="max-w-4xl">{children}</div>
		</div>
	);
}
