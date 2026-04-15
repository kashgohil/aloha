"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useState } from "react";
import { cancelMyPlan, resumeMyPlan } from "../actions";

function formatDate(d: Date) {
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(d);
}

type Props = {
	cancelAtPeriodEnd: boolean;
	currentPeriodEndISO: string | null;
	freeTierChannels: number;
	currentChannels: number;
};

export function DangerZone(props: Props) {
	const [confirming, setConfirming] = useState(false);
	const endDate = props.currentPeriodEndISO
		? new Date(props.currentPeriodEndISO)
		: null;

	if (props.cancelAtPeriodEnd) {
		return (
			<div className="rounded-3xl border border-dashed border-border-strong p-6 lg:p-8 flex flex-wrap items-start gap-4">
				<span className="mt-[2px] w-9 h-9 rounded-full bg-background border border-border-strong grid place-items-center shrink-0">
					<AlertTriangle className="w-4 h-4 text-ink/65" />
				</span>
				<div className="flex-1 min-w-0 min-w-[260px]">
					<p className="text-[13.5px] text-ink font-medium">
						Your plan is set to cancel.
					</p>
					<p className="mt-1 text-[12.5px] text-ink/60 leading-[1.55] max-w-2xl">
						Paid features stay on until{" "}
						{endDate ? (
							<span className="text-ink font-medium">
								{formatDate(endDate)}
							</span>
						) : (
							"the end of the current period"
						)}
						. After that you drop to the free tier. Change your mind? You can
						resume any time before the end date.
					</p>
				</div>
				<form action={resumeMyPlan}>
					<button
						type="submit"
						className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors"
					>
						<RotateCcw className="w-3.5 h-3.5" />
						Resume plan
					</button>
				</form>
			</div>
		);
	}

	return (
		<section className="rounded-3xl border border-dashed border-border-strong overflow-hidden">
			<div className="p-6 lg:p-8 flex items-start gap-4">
				<span className="mt-[2px] w-9 h-9 rounded-full bg-background border border-border-strong grid place-items-center shrink-0">
					<AlertTriangle className="w-4 h-4 text-ink/65" />
				</span>
				<div className="flex-1 min-w-0">
					<p className="text-[13.5px] text-ink font-medium">
						Cancel subscription
					</p>
					<p className="mt-1 text-[12.5px] text-ink/60 leading-[1.55] max-w-2xl">
						You&apos;ll keep paid features until the end of the current
						period, then drop back to the free tier ({props.freeTierChannels}{" "}
						channels). Connected accounts beyond the free limit are paused, not
						deleted.
					</p>
				</div>
				<button
					type="button"
					onClick={() => setConfirming(true)}
					disabled={confirming}
					className="inline-flex items-center h-10 px-4 rounded-full text-[13px] text-ink/65 hover:text-primary-deep hover:bg-peach-100/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-ink/65"
				>
					Cancel plan
				</button>
			</div>

			{confirming ? (
				<div className="border-t border-border-strong bg-peach-100/40 p-6 lg:p-8 space-y-5">
					<div className="flex items-center gap-2">
						<p className="text-[10.5px] font-mono uppercase tracking-[0.22em] text-primary-deep">
							Confirm cancellation
						</p>
						<span className="h-px flex-1 bg-border" />
					</div>

					<div className="grid sm:grid-cols-2 gap-5">
						<div>
							<p className="text-[10.5px] font-mono uppercase tracking-[0.18em] text-ink/55 mb-1">
								Access ends
							</p>
							<p className="font-display text-[22px] tracking-[-0.01em]">
								{endDate ? formatDate(endDate) : "end of current period"}
							</p>
							<p className="mt-1 text-[11.5px] text-ink/55">
								Everything keeps working until this date.
							</p>
						</div>
						<div>
							<p className="text-[10.5px] font-mono uppercase tracking-[0.18em] text-ink/55 mb-1">
								What changes after that
							</p>
							<ul className="text-[12.5px] text-ink/70 space-y-1.5 leading-[1.5]">
								<li>
									Dropped to free tier ({props.freeTierChannels} channels, AI
									companion)
								</li>
								<li>
									{Math.max(0, props.currentChannels - props.freeTierChannels)}{" "}
									extra channel
									{props.currentChannels - props.freeTierChannels === 1
										? ""
										: "s"}{" "}
									paused (not deleted — just stop publishing)
								</li>
								<li>Muse disabled if active</li>
								<li>No further charges</li>
							</ul>
						</div>
					</div>

					<form
						action={cancelMyPlan}
						className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border"
					>
						<p className="text-[11.5px] text-ink/50 inline-flex items-center gap-2 max-w-md">
							<AlertTriangle className="w-3.5 h-3.5" />
							You can resubscribe any time to restore channels and Muse.
						</p>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => setConfirming(false)}
								className="inline-flex items-center h-10 px-4 rounded-full text-[13px] text-ink/65 hover:text-ink transition-colors"
							>
								Keep my plan
							</button>
							<button
								type="submit"
								className="inline-flex items-center h-10 px-5 rounded-full bg-ink text-background text-[13.5px] font-medium hover:bg-destructive transition-colors"
							>
								Confirm cancellation
							</button>
						</div>
					</form>
				</div>
			) : null}
		</section>
	);
}
