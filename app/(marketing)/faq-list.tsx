"use client";

import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { useState } from "react";

export function FaqList({ items }: { items: { q: string; a: string }[] }) {
	const [openIndex, setOpenIndex] = useState<number | null>(null);

	return (
		<div>
			{items.map((f, i) => {
				const isOpen = openIndex === i;
				return (
					<div
						key={i}
						className={cn(
							"border-b border-border",
							i === items.length - 1 ? "border-b-0" : "",
						)}
					>
						<button
							type="button"
							onClick={() => setOpenIndex(isOpen ? null : i)}
							aria-expanded={isOpen}
							aria-controls={`faq-panel-${i}`}
							className="w-full flex items-center justify-between gap-8 py-6 text-left group"
						>
							<h3 className="font-display text-[20px] lg:text-[24px] leading-tight tracking-[-0.01em] text-ink transition-colors group-hover:text-primary">
								{f.q}
							</h3>
							<span
								className={`mt-2 shrink-0 w-8 h-8 rounded-full border grid place-items-center transition-[transform,background-color,border-color,color] duration-300 ease-out ${
									isOpen
										? "rotate-45 bg-ink text-background-elev border-ink"
										: "border-border-strong text-ink"
								}`}
							>
								<Plus className="w-4 h-4" />
							</span>
						</button>
						<div
							id={`faq-panel-${i}`}
							aria-hidden={!isOpen}
							className={`grid transition-[grid-template-rows,opacity,padding] duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
								isOpen
									? "grid-rows-[1fr] opacity-100 pb-6"
									: "grid-rows-[0fr] opacity-0 pb-0"
							}`}
						>
							<div className="overflow-hidden">
								<p
									className={`text-[15px] text-ink/75 leading-[1.6] max-w-[56ch] transition-transform duration-400 ease-out ${
										isOpen ? "translate-y-0" : "-translate-y-1"
									}`}
								>
									{f.a}
								</p>
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}
