import { routes } from "@/lib/routes";
import { makeMetadata } from "@/lib/seo";
import { siblingTools } from "@/lib/tools";
import { ToolShell } from "../_components/tool-shell";
import { HashtagDecoder } from "./hashtag-decoder";

export const metadata = makeMetadata({
	title: "Hashtag decoder — volume, competition, vibe",
	description:
		"A free tag-anatomy tool. Type a hashtag, see its volume, competition, vibe, and shadowban risk. Same framework we use inside Aloha.",
	path: routes.tools.hashtagDecoder,
});

export default function HashtagDecoderPage() {
	return (
		<ToolShell
			path={routes.tools.hashtagDecoder}
			eyebrow="Hashtag decoder"
			headline={
				<>
					Anatomy of a tag,
					<br />
					<span className="text-primary font-light">in three numbers.</span>
				</>
			}
			lead="Type a hashtag. The decoder hands back its rough volume, competition score, vibe, and any shadowban risk. The numbers are illustrative; the framework is what we use inside the product."
			tool={<HashtagDecoder />}
			howItWorks={[
				"Numbers come from a deterministic hash of the tag string — illustrative, not live platform data.",
				"Vibe classifier runs against six bucket archetypes (discovery / niche / aesthetic / saturated / branded / flagged).",
				"Shadowban risk is checked against a curated allow/deny list of well-documented soft-suppression tags.",
				"Companion suggestions stem from the tag root + a small library of editorial suffixes — clickable to re-decode.",
			]}
			productFeature={{
				name: "the Composer",
				href: "/composer",
				pitch:
					"Aloha's Composer pulls live tag data per channel and suggests companions tuned to your voice — not a generic chart.",
			}}
			otherTools={siblingTools("hashtag-decoder")}
		/>
	);
}
