import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createWorkspaceAction } from "@/app/actions/workspace-switch";
import { getCurrentUser } from "@/lib/current-user";

const ROLE_CHOICES: Array<{ value: string; label: string; hint: string }> = [
	{ value: "solo", label: "Solo", hint: "Just me, personal brand." },
	{ value: "creator", label: "Creator", hint: "Audience-first, content-led." },
	{ value: "team", label: "Team", hint: "A few people posting together." },
	{ value: "agency", label: "Agency", hint: "Managing multiple clients." },
	{ value: "nonprofit", label: "Nonprofit", hint: "Mission-driven org." },
];

export const dynamic = "force-dynamic";

export default async function NewWorkspacePage() {
	const user = (await getCurrentUser())!;
	const timezone = user.timezone ?? "UTC";

	return (
		<div className="max-w-xl space-y-8">
			<div>
				<Link
					href="/app/dashboard"
					className="inline-flex items-center gap-1 text-[12.5px] text-ink/55 hover:text-ink transition-colors"
				>
					<ArrowLeft className="w-3.5 h-3.5" />
					Back
				</Link>
				<h1 className="mt-4 font-display text-[36px] leading-[1.05] tracking-[-0.02em] text-ink">
					New workspace<span className="text-primary font-light">.</span>
				</h1>
				<p className="mt-3 text-[14px] text-ink/65 leading-[1.55]">
					Spin up a separate tenant — its own channels, posts, subscribers,
					and billing. You&apos;ll be the owner; invite others later.
				</p>
			</div>

			<form
				action={createWorkspaceAction}
				className="rounded-3xl border border-border bg-background-elev p-6 space-y-6"
			>
				<Field
					label="Name"
					hint="Shown in the sidebar switcher. 60 characters max."
				>
					<input
						name="name"
						required
						maxLength={60}
						autoFocus
						placeholder="e.g. Acme Marketing"
						className="w-full h-11 px-4 rounded-full border border-border bg-background text-[14px] text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink"
					/>
				</Field>

				<Field label="Type" hint="Used for onboarding nudges and pricing.">
					<div className="grid grid-cols-2 gap-2">
						{ROLE_CHOICES.map((r, i) => (
							<label
								key={r.value}
								className="flex items-start gap-2 rounded-xl border border-border bg-background px-3 py-2 cursor-pointer has-[:checked]:border-ink has-[:checked]:bg-muted/60"
							>
								<input
									type="radio"
									name="role"
									value={r.value}
									defaultChecked={i === 0}
									className="mt-1"
								/>
								<span className="min-w-0">
									<span className="block text-[13px] font-medium text-ink">
										{r.label}
									</span>
									<span className="block text-[11.5px] text-ink/55 leading-snug">
										{r.hint}
									</span>
								</span>
							</label>
						))}
					</div>
				</Field>

				<input type="hidden" name="timezone" value={timezone} />

				<div className="flex items-center justify-end gap-3 border-t border-border pt-5">
					<Link
						href="/app/dashboard"
						className="inline-flex items-center h-10 px-4 rounded-full text-[13px] text-ink/65 hover:text-ink transition-colors"
					>
						Cancel
					</Link>
					<button
						type="submit"
						className="inline-flex items-center h-10 px-5 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors"
					>
						Create workspace
					</button>
				</div>
			</form>
		</div>
	);
}

function Field({
	label,
	hint,
	children,
}: {
	label: string;
	hint?: string;
	children: React.ReactNode;
}) {
	return (
		<label className="block space-y-1.5">
			<span className="block text-[11.5px] uppercase tracking-[0.18em] text-ink/55 font-medium">
				{label}
			</span>
			{hint ? (
				<span className="block text-[12px] text-ink/55">{hint}</span>
			) : null}
			{children}
		</label>
	);
}
