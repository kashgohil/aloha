import Link from "next/link";
import { Clock, Lock } from "lucide-react";

type Props = {
	expired: boolean;
	daysRemaining: number;
	isOwner: boolean;
};

// Top-of-layout banner shown while the workspace's 30-day Basic trial is
// running, or after it has expired without a paid subscription. Hidden
// completely once the owner upgrades.
export function TrialBanner({ expired, daysRemaining, isOwner }: Props) {
	if (expired) {
		return (
			<div className="border-b border-border bg-peach-100/70">
				<div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-3 flex flex-wrap items-center gap-3 text-[13px]">
					<span className="grid place-items-center w-6 h-6 rounded-full bg-background">
						<Lock className="w-3.5 h-3.5 text-ink" />
					</span>
					<div className="min-w-0 flex-1">
						<span className="font-medium text-ink">
							Trial ended — view-only mode.
						</span>
						<span className="text-ink/70">
							{" "}
							{isOwner
								? "Upgrade to keep publishing and using Aloha's AI tools. Your data is safe."
								: "The workspace owner needs to upgrade to resume publishing."}
						</span>
					</div>
					{isOwner ? (
						<Link
							href="/app/settings/billing"
							className="inline-flex items-center h-8 px-4 rounded-full bg-ink text-background text-[12.5px] font-medium hover:bg-primary transition-colors shrink-0"
						>
							Upgrade
						</Link>
					) : null}
				</div>
			</div>
		);
	}

	// Soft nudge in the last week.
	if (daysRemaining > 7) return null;

	return (
		<div className="border-b border-border bg-background-elev">
			<div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-2.5 flex flex-wrap items-center gap-3 text-[12.5px]">
				<span className="grid place-items-center w-5 h-5 rounded-full bg-peach-100">
					<Clock className="w-3 h-3 text-ink" />
				</span>
				<div className="min-w-0 flex-1 text-ink/75">
					<span className="font-medium text-ink">
						{daysRemaining === 0
							? "Trial ends today."
							: daysRemaining === 1
								? "1 day left in your trial."
								: `${daysRemaining} days left in your trial.`}
					</span>
					<span>
						{" "}
						{isOwner
							? "Upgrade now to avoid the view-only drop."
							: "The owner can upgrade from billing settings."}
					</span>
				</div>
				{isOwner ? (
					<Link
						href="/app/settings/billing"
						className="pencil-link text-[12px] text-ink/70 hover:text-ink shrink-0"
					>
						Upgrade
					</Link>
				) : null}
			</div>
		</div>
	);
}
