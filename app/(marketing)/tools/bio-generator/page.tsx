import { routes } from "@/lib/routes";
import { makeMetadata } from "@/lib/seo";
import { siblingTools } from "@/lib/tools";
import { ToolShell } from "../_components/tool-shell";
import { BioGenerator } from "./bio-generator";

export const metadata = makeMetadata({
	title: "Bio generator — three honest drafts in 30 seconds",
	description:
		"A free, in-browser bio generator. Three length variants in three vibes. No sign-up; nothing goes to a server.",
	path: routes.tools.bioGenerator,
});

export default function BioGeneratorPage() {
	return (
		<ToolShell
			eyebrow="Bio generator"
			headline={
				<>
					Three honest bios,
					<br />
					<span className="text-primary font-light">thirty seconds.</span>
				</>
			}
			lead="Type your name, what you do, and one concrete detail. The generator hands back three length variants in a vibe you pick. It runs in your browser — nothing is uploaded, logged, or trained on."
			tool={<BioGenerator />}
			howItWorks={[
				"Fill three fields. Only two are required; 'one concrete detail' is optional but changes the output a lot.",
				"Pick a vibe — quiet, punchy, or warm. The generator uses small rule-based templates, not an LLM.",
				"Three variants show up: short (Instagram bio length), medium (LinkedIn about-section), long (newsletter footer).",
				"Copy what you want. We don't save your input; refresh to start over.",
			]}
			productFeature={{
				name: "the Composer",
				href: "/composer",
				pitch:
					"Aloha's Composer does this across every post you write, in your cadence, with diffs you can redline.",
			}}
			otherTools={siblingTools("bio-generator")}
		/>
	);
}
