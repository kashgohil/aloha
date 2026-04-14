import { routes } from "@/lib/routes";
import { makeMetadata } from "@/lib/seo";
import { siblingTools } from "@/lib/tools";
import { ToolShell } from "../_components/tool-shell";
import { PostCritic } from "./post-critic";

export const metadata = makeMetadata({
	title: "Post critic — six honest, mechanical checks on a draft",
	description:
		"A free post-critique tool. Paste a draft; get six checks against length, hook, CTA, emoji density, shadowban tokens, and exclamation count.",
	path: routes.tools.postCritic,
});

export default function PostCriticPage() {
	return (
		<ToolShell
			path={routes.tools.postCritic}
			eyebrow="Post critic"
			headline={
				<>
					A second pair of eyes,
					<br />
					<span className="text-primary font-light">six rules deep.</span>
				</>
			}
			lead="Paste a draft. The critic runs six rules-based checks — length, hook, invitation to reply, emoji density, shadowban tokens, exclamation discipline — and grades the mechanics. It doesn't grade your taste."
			tool={<PostCritic />}
			howItWorks={[
				"Length is checked against per-channel sweet spots (X 80-200 chars, LinkedIn 600-1500, etc.) and the platform's hard ceiling.",
				'Hook is rated on first-line texture; recognised opening formulas ("here\'s why…", "3 ways…") get downgraded.',
				"Invitation to reply detects questions and explicit CTAs (reply / comment / book / sign up).",
				"Emoji density: ratio of emoji to words. >15% triggers a soft warning.",
				"Shadowban tokens: scans for known soft-suppression phrases (f4f, like-for-like, etc.).",
				"Exclamation count >=4 reads as 'screaming' and gets flagged.",
			]}
			productFeature={{
				name: "the Composer",
				href: "/composer",
				pitch:
					"Aloha's Composer runs these checks live as you write — plus a voice-match score against your own best posts.",
			}}
			otherTools={siblingTools("post-critic")}
		/>
	);
}
