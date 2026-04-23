"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	assignReviewer,
	type ReviewerOption,
} from "@/app/actions/posts";
import { cn } from "@/lib/utils";

type Props = {
	postId: string;
	reviewers: ReviewerOption[];
	assignedUserId: string | null;
	// Who's viewing — enables the "assign to me" shortcut.
	viewerUserId: string;
	// Whether the viewer is allowed to change the assignment. Mirrors the
	// server-side rule in assignReviewer; hide the picker entirely for
	// users who can't act on it.
	canAssign: boolean;
};

export function ReviewerPicker({
	postId,
	reviewers,
	assignedUserId,
	viewerUserId,
	canAssign,
}: Props) {
	const [open, setOpen] = useState(false);
	const [isPending, startTransition] = useTransition();

	const current = assignedUserId
		? reviewers.find((r) => r.userId === assignedUserId) ?? null
		: null;

	const assign = (userId: string | null) => {
		const toastId = toast.loading("Updating reviewer…");
		startTransition(async () => {
			try {
				await assignReviewer(postId, userId);
				toast.success(userId ? "Reviewer assigned." : "Reviewer cleared.", {
					id: toastId,
				});
				setOpen(false);
			} catch (err) {
				toast.error(
					err instanceof Error ? err.message : "Couldn't update.",
					{ id: toastId },
				);
			}
		});
	};

	if (!canAssign && !current) {
		return (
			<span className="inline-flex items-center gap-1.5 text-[12px] text-ink/50">
				<UserX className="w-3.5 h-3.5" />
				Unassigned
			</span>
		);
	}

	if (!canAssign && current) {
		return (
			<span className="inline-flex items-center gap-2 text-[12px] text-ink/65">
				<Avatar option={current} />
				{current.name ?? current.email}
			</span>
		);
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				className={cn(
					"inline-flex items-center gap-2 h-8 pl-1.5 pr-3 rounded-full border border-border bg-background-elev text-[12px] text-ink/70 hover:text-ink hover:border-ink/40 transition-colors",
					isPending ? "opacity-50" : "",
				)}
				aria-label="Assign reviewer"
				disabled={isPending}
			>
				{current ? (
					<>
						<Avatar option={current} />
						<span className="truncate max-w-[160px]">
							{current.name ?? current.email}
						</span>
					</>
				) : (
					<>
						<UserCheck className="w-3.5 h-3.5 text-ink/50" />
						<span>Assign reviewer</span>
					</>
				)}
				{isPending ? (
					<Loader2 className="w-3 h-3 animate-spin ml-1" />
				) : null}
			</PopoverTrigger>
			<PopoverContent
				align="end"
				className="w-64 p-1 rounded-xl border border-border bg-background-elev shadow-lg"
			>
				{reviewers.length === 0 ? (
					<p className="px-3 py-2 text-[12.5px] text-ink/55">
						No reviewers in this workspace yet.
					</p>
				) : (
					<ul className="max-h-72 overflow-y-auto py-1">
						{reviewers.map((r) => {
							const isCurrent = r.userId === assignedUserId;
							const isSelf = r.userId === viewerUserId;
							return (
								<li key={r.userId}>
									<button
										type="button"
										onClick={() => assign(r.userId)}
										disabled={isPending}
										className={cn(
											"w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors",
											isCurrent
												? "bg-muted/70"
												: "hover:bg-muted/60",
										)}
									>
										<Avatar option={r} />
										<span className="min-w-0 flex-1">
											<span className="block text-[13px] font-medium text-ink truncate">
												{r.name ?? r.email}
												{isSelf ? (
													<span className="ml-1 text-[10.5px] text-ink/55">
														· you
													</span>
												) : null}
											</span>
											<span className="block text-[10.5px] text-ink/55 truncate">
												{r.email}
											</span>
										</span>
										{isCurrent ? (
											<Check className="w-3.5 h-3.5 text-ink shrink-0" />
										) : null}
									</button>
								</li>
							);
						})}
					</ul>
				)}
				{current ? (
					<div className="border-t border-border mt-1 pt-1">
						<button
							type="button"
							onClick={() => assign(null)}
							disabled={isPending}
							className="w-full text-left px-3 py-1.5 rounded-lg text-[12.5px] text-ink/65 hover:text-ink hover:bg-muted/60 transition-colors"
						>
							Clear assignment
						</button>
					</div>
				) : null}
			</PopoverContent>
		</Popover>
	);
}

function Avatar({ option }: { option: ReviewerOption }) {
	if (option.image) {
		// eslint-disable-next-line @next/next/no-img-element
		return (
			<img
				src={option.image}
				alt={option.name ?? option.email}
				className="w-6 h-6 rounded-full object-cover bg-muted shrink-0"
			/>
		);
	}
	const initial = (option.name ?? option.email).trim().charAt(0).toUpperCase();
	return (
		<span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10.5px] font-medium text-ink/70 shrink-0">
			{initial}
		</span>
	);
}
