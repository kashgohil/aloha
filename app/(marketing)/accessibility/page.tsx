import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { routes } from "@/lib/routes";
import { makeMetadata } from "@/lib/seo";

export const metadata = makeMetadata({
	title: "Accessibility",
	description:
		"How Aloha thinks about accessible software — our standards, known gaps, and how to reach us when something does not work with your setup.",
	path: routes.misc.accessibility,
});

export default function AccessibilityPage() {
	return (
		<div className="bg-background">
			<div className="max-w-[68ch] mx-auto px-6 lg:px-10 py-16 lg:py-24">
				<header className="mb-14">
					<p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
						Company
					</p>
					<h1 className="font-display font-normal text-ink leading-none tracking-[-0.02em] text-[40px] sm:text-[52px] lg:text-[60px]">
						Accessibility
					</h1>
					<p className="mt-5 text-[17px] text-ink/70 leading-[1.6]">
						We want Aloha to be usable for as many people as possible —
						including anyone who relies on assistive technology, keyboard-only
						navigation, or reduced motion.
					</p>
					<div className="mt-6 text-[12.5px] text-ink/60">
						<span className="font-mono uppercase tracking-[0.16em]">
							Last updated · April 15, 2026
						</span>
					</div>
				</header>

				<div className="space-y-10 text-[15px] text-ink/80 leading-[1.7]">
					<section>
						<h2 className="font-display text-[20px] text-ink mb-3">
							What we are aiming for
						</h2>
						<p>
							We treat{" "}
							<a
								href="https://www.w3.org/TR/WCAG22/"
								className="pencil-link inline-flex items-center gap-1"
								rel="noopener noreferrer"
							>
								WCAG&nbsp;2.2
								<ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
							</a>{" "}
							level&nbsp;AA as our design and engineering bar for the marketing
							site and the signed-in product. That includes semantic HTML,
							focus-visible styles, sufficient colour contrast on default themes,
							and labels that work with screen readers.
						</p>
					</section>

					<section>
						<h2 className="font-display text-[20px] text-ink mb-3">
							How we test
						</h2>
						<p>
							We run automated checks in CI, manual keyboard passes on new
							flows, and spot checks with VoiceOver and NVDA. We know that is
							not a substitute for testing with every real-world assistive setup
							— which is why we want to hear from you when something breaks.
						</p>
					</section>

					<section>
						<h2 className="font-display text-[20px] text-ink mb-3">
							Known rough edges
						</h2>
						<p>
							Third-party embeds (for example calendar widgets or hosted video)
							may not meet the same bar as our own UI. The composer preview is
							visual-first; we are improving structure and announcements there as
							the surface matures.
						</p>
					</section>

					<section>
						<h2 className="font-display text-[20px] text-ink mb-3">
							Tell us what you are seeing
						</h2>
						<p>
							If you hit a barrier — confusing focus order, missing labels,
							contrast that fails in your environment, or anything else — email{" "}
							<a href="mailto:accessibility@usealoha.app" className="pencil-link">
								accessibility@usealoha.app
							</a>{" "}
							with the page URL, your browser or assistive tech, and (if you can)
							a short screen recording. We read every message and typically reply within two business days.
						</p>
						<p className="mt-4">
							You can also reach us through the general{" "}
							<Link href={routes.company.contact} className="pencil-link">
								contact page
							</Link>
							.
						</p>
					</section>

					<section>
						<h2 className="font-display text-[20px] text-ink mb-3">
							Related
						</h2>
						<ul className="list-disc pl-5 space-y-2">
							<li>
								<Link href={routes.trust} className="pencil-link">
									Trust center
								</Link>
							</li>
							<li>
								<Link href={routes.legal.privacy} className="pencil-link">
									Privacy policy
								</Link>
							</li>
						</ul>
					</section>
				</div>
			</div>
		</div>
	);
}
