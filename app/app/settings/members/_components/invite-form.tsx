"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { sendWorkspaceInvite } from "@/app/actions/workspace-invites";

const ROLE_CHOICES: Array<{ value: string; label: string }> = [
	{ value: "editor", label: "Editor" },
	{ value: "reviewer", label: "Reviewer" },
	{ value: "admin", label: "Admin" },
	{ value: "viewer", label: "Viewer" },
];

export function InviteForm() {
	const formRef = useRef<HTMLFormElement>(null);
	const [isPending, startTransition] = useTransition();
	const [role, setRole] = useState("editor");

	const handleSubmit = (formData: FormData) => {
		const toastId = toast.loading("Sending invite…");
		startTransition(async () => {
			try {
				await sendWorkspaceInvite(formData);
				toast.success("Invite sent.", { id: toastId });
				formRef.current?.reset();
				setRole("editor");
			} catch (err) {
				toast.error(
					err instanceof Error ? err.message : "Couldn't send.",
					{ id: toastId },
				);
			}
		});
	};

	return (
		<form
			ref={formRef}
			action={handleSubmit}
			className="rounded-2xl border border-border bg-background-elev p-4 flex flex-wrap items-center gap-3"
		>
			<input
				type="email"
				name="email"
				required
				placeholder="teammate@example.com"
				className="flex-1 min-w-[240px] h-10 px-4 rounded-full border border-border bg-background text-[13px] text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink"
			/>
			<select
				name="role"
				value={role}
				onChange={(e) => setRole(e.target.value)}
				className="h-10 px-3 rounded-full border border-border bg-background text-[13px] text-ink"
			>
				{ROLE_CHOICES.map((r) => (
					<option key={r.value} value={r.value}>
						{r.label}
					</option>
				))}
			</select>
			<button
				type="submit"
				disabled={isPending}
				className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary disabled:opacity-40 transition-colors"
			>
				{isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
				Send invite
			</button>
		</form>
	);
}
