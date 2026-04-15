import { routes } from "@/lib/routes";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
	eyebrow?: string;
	title: ReactNode;
	subtitle?: ReactNode;
	children: ReactNode;
	footer?: ReactNode;
	narrative?: ReactNode;
};

export function AuthShell({
	eyebrow,
	title,
	subtitle,
	children,
	footer,
	narrative,
}: AuthShellProps) {
	return (
		<div className="min-h-screen bg-background text-foreground grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
			<AuthNarrative>{narrative}</AuthNarrative>

			<section className="relative flex flex-col min-h-screen">
				<header className="flex items-center justify-between px-6 lg:px-10 h-[72px]">
					<Link
						href={routes.home}
						className="flex items-baseline gap-1 group"
						aria-label="Aloha home"
					>
						<span className="font-display text-[26px] leading-none font-semibold tracking-[-0.03em] text-ink">
							Aloha
						</span>
						<span className="font-display text-primary text-[20px] leading-none">
							.
						</span>
					</Link>
					<Link
						href={routes.home}
						className="inline-flex items-center gap-2 text-[13px] text-ink/60 hover:text-ink transition-colors"
					>
						<ArrowLeft className="w-3.5 h-3.5" />
						Back to usealoha.app
					</Link>
				</header>

				<div className="flex-1 flex items-center justify-center px-6 lg:px-10 py-12">
					<div className="w-full max-w-[420px]">
						{eyebrow ? (
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60 mb-5">
								{eyebrow}
							</p>
						) : null}
						<h1 className="font-display text-[40px] lg:text-[46px] leading-[1.02] tracking-[-0.03em] text-ink font-normal">
							{title}
						</h1>
						{subtitle ? (
							<p className="mt-4 text-[15px] text-ink/70 leading-[1.55]">
								{subtitle}
							</p>
						) : null}

						<div className="mt-9">{children}</div>

						{footer ? (
							<div className="mt-8 text-[13.5px] text-ink/70">{footer}</div>
						) : null}
					</div>
				</div>

				<footer className="px-6 lg:px-10 py-6 flex flex-wrap items-center justify-between gap-4 text-[12px] text-ink/55 border-t border-border">
					<p>© {new Date().getFullYear()} Aloha, Inc.</p>
					<div className="flex items-center gap-5">
						<Link href={routes.legal.privacy} className="pencil-link">
							Privacy
						</Link>
						<Link href={routes.legal.terms} className="pencil-link">
							Terms
						</Link>
						<Link
							href={routes.trust}
							className="inline-flex items-center gap-1.5 pencil-link"
						>
							<ShieldCheck className="w-3.5 h-3.5" />
							Trust
						</Link>
					</div>
				</footer>
			</section>
		</div>
	);
}

function AuthNarrative({ children }: { children?: ReactNode }) {
	return (
		<aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-peach-200 px-12 xl:px-16 py-12">
			{/* sparse hero-style marks */}
			<span
				aria-hidden
				className="absolute top-[12%] left-[8%] font-display text-[28px] text-ink/30 rotate-[-8deg] select-none"
			>
				✳
			</span>
			<span
				aria-hidden
				className="absolute top-[26%] right-[14%] font-display text-[38px] text-ink/15 rotate-[14deg] select-none"
			>
				✳
			</span>
			<span
				aria-hidden
				className="absolute top-[62%] left-[10%] font-display text-[22px] text-primary/60 rotate-12 select-none"
			>
				+
			</span>
			<span
				aria-hidden
				className="absolute top-[82%] right-[18%] font-display text-[18px] text-ink/30 select-none"
			>
				※
			</span>
			<span
				aria-hidden
				className="absolute top-[48%] left-[6%] w-2 h-2 rounded-full bg-primary/50"
			/>
			<span
				aria-hidden
				className="absolute top-[18%] right-[28%] w-1.5 h-1.5 rounded-full bg-ink/30"
			/>
			<span
				aria-hidden
				className="absolute top-[70%] right-[8%] w-3 h-3 rounded-full border border-ink/30"
			/>

			<div className="relative">
				<div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
					<span className="w-1.5 h-1.5 rounded-full bg-primary" />
					The calm social media OS
				</div>
			</div>

			{children ?? <DefaultNarrative />}

			<div className="relative text-[12px] text-ink/55 flex items-center gap-2">
				<span className="w-2 h-2 rounded-full bg-primary" />
				All systems normal
			</div>
		</aside>
	);
}

function DefaultNarrative() {
	return (
		<div className="relative max-w-[520px]">
			<p className="font-display text-[40px] xl:text-[52px] leading-[1.1] tracking-[-0.025em] text-ink font-normal">
				Show up everywhere
				<span className="text-ink/25">,</span>{" "}
				<span className="text-primary font-light">
					without losing yourself to it.
				</span>
			</p>
			<p className="mt-8 text-[15px] text-ink/75 leading-[1.6] max-w-[420px]">
				One composer, nine networks, a calendar that breathes, and a logic
				matrix that handles the rest. Built for people who&apos;d rather be
				making the work than managing the posting of it.
			</p>

			<ul className="mt-10 space-y-3 text-[14px] text-ink/80">
				{[
					"Free forever for 3 channels",
					"No credit card to start",
					"Your content is always yours",
				].map((t) => (
					<li key={t} className="flex items-center gap-3">
						<span className="w-1.5 h-1.5 rounded-full bg-primary" />
						{t}
					</li>
				))}
			</ul>
		</div>
	);
}
