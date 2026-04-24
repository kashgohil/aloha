"use client";

import { useState, useTransition } from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import {
	buyWorkspaceSeats,
	releaseWorkspaceSeats,
} from "@/app/actions/billing-addons";

type Props = {
	included: number; // base-plan included
	addonSeats: number; // currently purchased add-on seats
	usedWorkspaces: number; // owned workspace count
	monthlyPerSeat: number; // $25
	interval: "month" | "year";
};

export function WorkspaceAddonSection(props: Props) {
	const [pending, startTransition] = useTransition();
	// Local copy of seat count so the UI reflects the change optimistically
	// while the webhook reconciles the DB row behind the scenes.
	const [seats, setSeats] = useState(props.addonSeats);

	const total = props.included + seats;
	const remaining = Math.max(0, total - props.usedWorkspaces);

	const handleAdd = () => {
		const toastId = toast.loading("Opening checkout…");
		startTransition(async () => {
			try {
				const result = await buyWorkspaceSeats(1);
				if (result.kind === "checkout") {
					toast.dismiss(toastId);
					window.location.href = result.url;
				} else {
					setSeats(result.seats);
					toast.success(`Added 1 workspace seat.`, { id: toastId });
				}
			} catch (err) {
				toast.error(
					err instanceof Error ? err.message : "Couldn't add seat.",
					{ id: toastId },
				);
			}
		});
	};

	const handleRemove = () => {
		if (seats <= 0) return;
		if (props.usedWorkspaces > total - 1) {
			toast.error(
				"Delete or transfer a workspace first — you're using all of them.",
			);
			return;
		}
		const toastId = toast.loading("Releasing seat…");
		startTransition(async () => {
			try {
				const result = await releaseWorkspaceSeats(1);
				setSeats(result.canceledAtPeriodEnd ? 0 : result.seats);
				if (result.canceledAtPeriodEnd) {
					toast.success(
						"Workspace add-on set to cancel at period end.",
						{ id: toastId },
					);
				} else {
					toast.success(`Seat count now ${result.seats}.`, { id: toastId });
				}
			} catch (err) {
				toast.error(
					err instanceof Error ? err.message : "Couldn't remove seat.",
					{ id: toastId },
				);
			}
		});
	};

	return (
		<section
			id="workspaces"
			className="rounded-3xl border border-border bg-background-elev overflow-hidden"
		>
			<div className="p-6 lg:p-8">
				<div className="grid md:grid-cols-[260px_1fr] gap-6 items-start">
					<div>
						<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
							Workspaces
						</p>
						<h3 className="mt-1.5 font-display text-[20px] leading-[1.15] tracking-[-0.01em] text-ink">
							Extra tenants for clients or brands.
						</h3>
						<p className="mt-2 text-[12.5px] text-ink/60 leading-normal">
							Each add-on workspace includes 3 channels and 3 member slots.
							${props.monthlyPerSeat}/mo per workspace
							{props.interval === "year" ? " (billed yearly)" : ""}.
						</p>
					</div>
					<div className="space-y-4">
						<div className="flex items-baseline gap-3">
							<span className="font-display text-[32px] leading-none tracking-[-0.02em] text-ink tabular-nums">
								{props.usedWorkspaces}
							</span>
							<span className="text-[13px] text-ink/55">
								of {total} in use
								{seats > 0 ? (
									<span className="text-ink/40">
										{" "}
										· {seats} add-on seat{seats === 1 ? "" : "s"}
									</span>
								) : null}
							</span>
							{remaining > 0 ? (
								<span className="inline-flex items-center h-6 px-2 rounded-full bg-peach-100/70 text-[11px] text-ink ml-auto">
									{remaining} slot{remaining === 1 ? "" : "s"} free
								</span>
							) : null}
						</div>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={handleRemove}
								disabled={pending || seats === 0}
								className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-border text-[13px] text-ink/75 hover:text-ink hover:border-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
							>
								<Minus className="w-3.5 h-3.5" />
								Remove seat
							</button>
							<button
								type="button"
								onClick={handleAdd}
								disabled={pending}
								className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
							>
								<Plus className="w-3.5 h-3.5" />
								Add seat (+${props.monthlyPerSeat}/mo)
							</button>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
