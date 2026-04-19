"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export function CreateDraftsSubmit({ formId }: { formId: string }) {
	const [pending, setPending] = useState(false);

	useEffect(() => {
		const form = document.getElementById(formId) as HTMLFormElement | null;
		if (!form) return;
		const onSubmit = () => setPending(true);
		form.addEventListener("submit", onSubmit);
		return () => form.removeEventListener("submit", onSubmit);
	}, [formId]);

	return (
		<button
			type="submit"
			form={formId}
			disabled={pending}
			aria-busy={pending}
			className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
		>
			{pending ? (
				<>
					<Loader2 className="w-4 h-4 animate-spin" />
					Creating drafts…
				</>
			) : (
				<>
					<Sparkles className="w-4 h-4" />
					Create drafts
				</>
			)}
		</button>
	);
}
