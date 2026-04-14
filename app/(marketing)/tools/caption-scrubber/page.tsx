import { routes } from "@/lib/routes";
import { makeMetadata } from "@/lib/seo";
import { siblingTools } from "@/lib/tools";
import { ToolShell } from "../_components/tool-shell";
import { CaptionScrubber } from "./caption-scrubber";

export const metadata = makeMetadata({
	title: "Caption scrubber — strip the things that quietly hurt reach",
	description:
		"A free, in-browser caption cleaner. Removes invisible characters, normalises smart quotes and dashes, tidies whitespace, flags shadowban tokens.",
	path: routes.tools.captionScrubber,
});

export default function CaptionScrubberPage() {
	return (
		<ToolShell
			eyebrow="Caption scrubber"
			headline={
				<>
					Strip the things
					<br />
					<span className="text-primary font-light">
						that quietly hurt reach.
					</span>
				</>
			}
			lead="Paste a caption. The scrubber removes zero-width characters (a known shadowban vector), straightens curly quotes, normalises dashes, tidies whitespace, and flags risky phrases — without deleting them."
			tool={<CaptionScrubber />}
			howItWorks={[
				"Zero-width characters (\\u200B-\\u200D, etc.) get removed quietly — they look invisible to you and look like spam to platform classifiers.",
				"Smart quotes and ellipses get normalised to ASCII so they survive copy-paste between systems.",
				"Whitespace tidying: nbsp → space, multiple spaces → one, trailing spaces dropped, 3+ newlines → 2.",
				"Shadowban tokens are flagged but never deleted automatically — we surface them so you can decide.",
				"Each transformation is logged with a count so you can see exactly what changed.",
			]}
			productFeature={{
				name: "the Composer",
				href: "/composer",
				pitch:
					"Aloha's Composer scrubs every draft on save and flags risky phrases inline — same logic, no copy-paste round-trip.",
			}}
			otherTools={siblingTools("caption-scrubber")}
		/>
	);
}
