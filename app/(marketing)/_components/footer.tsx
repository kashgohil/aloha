import { footerLinks, routes } from "@/lib/routes";
import { Rss, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { SOCIAL_ICONS } from "./social-icons";

export function MarketingFooter() {
	return (
		<footer className="bg-background pt-20 lg:pt-24">
			<div className="max-w-[1320px] mx-auto px-6 lg:px-10">
				<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-8 pb-16 border-b border-border">
					<div className="col-span-12 lg:col-span-4">
						<Link href={routes.home} className="flex items-baseline gap-1">
							<span className="font-display text-[40px] leading-none font-semibold tracking-[-0.03em] text-ink">
								Aloha
							</span>
							<span className="font-display text-primary text-[32px] leading-none">
								.
							</span>
						</Link>
						<p className="mt-6 text-[14.5px] text-ink/70 leading-[1.6] max-w-sm">
							The calm social media OS for people who'd rather be making the
							work than managing the posting of the work.
						</p>

						<div className="mt-8 flex items-center gap-3">
							<a
								href={routes.misc.appStore}
								aria-label="App Store"
								className="h-11 px-4 inline-flex items-center gap-2 rounded-xl border border-border-strong hover:bg-muted/50 transition-colors"
							>
								<span className="font-display text-[18px]">Aa</span>
								<div className="leading-tight text-left">
									<p className="text-[9px] uppercase tracking-[0.18em] text-ink/50">
										Download
									</p>
									<p className="text-[12.5px] font-medium">App Store</p>
								</div>
							</a>
							<a
								href={routes.misc.googlePlay}
								aria-label="Google Play"
								className="h-11 px-4 inline-flex items-center gap-2 rounded-xl border border-border-strong hover:bg-muted/50 transition-colors"
							>
								<span className="font-display text-[18px]">▶</span>
								<div className="leading-tight text-left">
									<p className="text-[9px] uppercase tracking-[0.18em] text-ink/50">
										Get it on
									</p>
									<p className="text-[12.5px] font-medium">Google Play</p>
								</div>
							</a>
						</div>
					</div>

					<div className="col-span-12 lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-8 lg:gap-10 text-[13.5px]">
						{footerLinks.primary.map((col) => (
							<div key={col.heading}>
								<p className="font-display text-[14px] text-ink mb-5">
									{col.heading}
								</p>
								<ul className="space-y-3">
									{col.links.map((l) => (
										<li key={l.href}>
											<Link
												href={l.href}
												className="text-ink/70 hover:text-primary block transition-colors"
											>
												{l.label}
											</Link>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</div>

				<div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-8 lg:gap-8 py-14 border-b border-border text-[13.5px]">
					{footerLinks.secondary.map((col) => (
						<div key={col.heading}>
							<p className="font-display text-[14px] text-ink mb-4">
								{col.heading}
							</p>
							<ul className="space-y-2.5">
								{col.links.map((l) => (
									<li key={l.href}>
										<Link
											href={l.href}
											className="text-ink/70 hover:text-primary block transition-colors"
										>
											{l.label}
										</Link>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>

				<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 py-10 border-b border-border">
					<ul className="flex items-center flex-wrap gap-1">
						{SOCIAL_ICONS.map((s) => (
							<li key={s.n}>
								<a
									href="#"
									aria-label={s.n}
									className="w-10 h-10 grid place-items-center rounded-full border border-border-strong text-ink hover:bg-ink hover:text-background-elev hover:border-ink transition-colors"
								>
									<svg
										viewBox="0 0 24 24"
										className="w-[15px] h-[15px]"
										fill={s.custom ? undefined : "currentColor"}
									>
										{s.custom ?? <path d={s.path} />}
									</svg>
								</a>
							</li>
						))}
						<li>
							<a
								href="#"
								aria-label="RSS"
								className="w-10 h-10 grid place-items-center rounded-full border border-border-strong text-ink hover:bg-ink hover:text-background-elev hover:border-ink transition-colors"
							>
								<Rss className="w-4 h-4" />
							</a>
						</li>
					</ul>
					<div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px]">
						<div className="inline-flex items-center gap-2">
							<svg
								viewBox="0 0 24 24"
								className="w-4 h-4 text-ink/60"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.8"
							>
								<circle cx="12" cy="12" r="9.5" />
								<path d="M3 12h18M12 2.5c3 3 3 16 0 19M12 2.5c-3 3-3 16 0 19" />
							</svg>
							<select className="bg-transparent border-0 font-medium outline-none cursor-pointer">
								<option>English (US)</option>
								<option>English (UK)</option>
								<option>Français</option>
								<option>Español</option>
								<option>Deutsch</option>
								<option>日本語</option>
							</select>
						</div>
						<Link
							href={routes.resources.status}
							className="pencil-link inline-flex items-center gap-2"
						>
							<span className="w-2 h-2 rounded-full bg-primary" />
							All systems normal
						</Link>
						<Link
							href={routes.trust}
							className="pencil-link inline-flex items-center gap-2"
						>
							<ShieldCheck className="w-4 h-4" /> Trust center
						</Link>
					</div>
				</div>

				<div className="py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[12.5px] text-ink/60">
					<p>
						© 2026 Aloha, Inc. Made with uncomfortable amounts of
						<span className="font-display italic text-ink"> coffee</span> and
						<span className="font-display italic text-ink"> care</span> in
						India.
					</p>
					<div className="flex items-center gap-5">
						{footerLinks.bottom.map((l) => (
							<Link key={l.href} href={l.href} className="pencil-link">
								{l.label}
							</Link>
						))}
					</div>
				</div>
			</div>
		</footer>
	);
}
