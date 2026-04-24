"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteWorkspaceAction } from "@/app/actions/workspace-delete";

// Danger-zone section for workspace owners. Two-stage: "Delete" unlocks
// a confirm input that only enables the final submit once the typed
// name matches exactly. Mirrors the GitHub repo-delete pattern.
export function DeleteWorkspaceSection({
	workspaceName,
}: {
	workspaceName: string;
}) {
	const [armed, setArmed] = useState(false);
	const [typed, setTyped] = useState("");
	const [pending, startTransition] = useTransition();

	const matches = typed === workspaceName;

	const handleSubmit = () => {
		if (!matches) return;
		const fd = new FormData();
		fd.set("confirmName", typed);
		startTransition(async () => {
			try {
				await deleteWorkspaceAction(fd);
				// The action redirects to /app/dashboard — reaching here is
				// unusual, but surface a toast in case redirect doesn't fire.
				toast.success("Workspace deleted.");
			} catch (err) {
				// next/navigation.redirect throws a sentinel that we should
				// swallow — only surface real errors.
				const msg = err instanceof Error ? err.message : String(err);
				if (msg.includes("NEXT_REDIRECT")) return;
				toast.error(msg);
			}
		});
	};

	return (
		<section className="rounded-2xl border border-red-200/60 bg-red-50/40 dark:border-red-900/40 dark:bg-red-950/20 p-6">
			<div className="flex items-start gap-3">
				<span className="grid place-items-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 shrink-0">
					<AlertTriangle className="w-4 h-4 text-red-700 dark:text-red-400" />
				</span>
				<div className="min-w-0 flex-1">
					<h3 className="text-[14px] font-semibold text-ink">
						Delete this workspace
					</h3>
					<p className="mt-1 text-[12.5px] text-ink/65 leading-[1.55]">
						Cancels every Polar subscription on this workspace and permanently
						removes its posts, members, connected channels, inbox, and
						analytics. This can't be undone.
					</p>

					{armed ? (
						<div className="mt-4 space-y-3">
							<label className="block">
								<span className="block text-[12px] text-ink/65 mb-1.5">
									Type <strong className="text-ink">{workspaceName}</strong> to
									confirm:
								</span>
								<input
									type="text"
									value={typed}
									onChange={(e) => setTyped(e.target.value)}
									autoFocus
									className="w-full h-10 px-3 rounded-lg border border-border-strong bg-background text-[13.5px] text-ink focus:outline-none focus:border-ink transition-colors"
								/>
							</label>
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={() => {
										setArmed(false);
										setTyped("");
									}}
									disabled={pending}
									className="inline-flex items-center h-9 px-4 rounded-full border border-border text-[12.5px] text-ink/75 hover:text-ink hover:border-ink transition-colors disabled:opacity-40"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={handleSubmit}
									disabled={!matches || pending}
									className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-red-600 text-white text-[12.5px] font-medium hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
								>
									{pending ? (
										<Loader2 className="w-3.5 h-3.5 animate-spin" />
									) : null}
									Delete permanently
								</button>
							</div>
						</div>
					) : (
						<button
							type="button"
							onClick={() => setArmed(true)}
							className="mt-4 inline-flex items-center h-9 px-4 rounded-full border border-red-300 dark:border-red-800 text-[12.5px] font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
						>
							Delete workspace…
						</button>
					)}
				</div>
			</div>
		</section>
	);
}
