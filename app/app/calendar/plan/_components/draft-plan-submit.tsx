"use client";

import { Loader2, Wand2 } from "lucide-react";
import { useFormStatus } from "react-dom";

export function DraftPlanSubmit() {
	const { pending } = useFormStatus();
	return (
		<button
			type="submit"
			disabled={pending}
			aria-busy={pending}
			className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
		>
			{pending ? (
				<>
					<Loader2 className="w-4 h-4 animate-spin" />
					Drafting…
				</>
			) : (
				<>
					<Wand2 className="w-4 h-4" />
					Draft the plan
				</>
			)}
		</button>
	);
}
