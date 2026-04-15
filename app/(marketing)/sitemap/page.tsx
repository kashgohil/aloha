import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CASE_STUDIES, CASE_STUDY_SLUGS } from "@/lib/case-studies";
import { FIELD_NOTES } from "@/lib/field-notes";
import { PLAYBOOKS } from "@/lib/playbooks";
import { footerLinks, routes } from "@/lib/routes";
import { absoluteUrl, makeMetadata } from "@/lib/seo";

export const metadata = makeMetadata({
	title: "Sitemap",
	description:
		"A directory of every major page on usealoha.app — product, resources, legal, and long-tail guides. For crawlers, there is also sitemap.xml.",
	path: routes.misc.sitemap,
});

const QUICK = [
	{ label: "Home", href: routes.home },
	{ label: "Pricing", href: routes.pricing },
	{ label: "Trust center", href: routes.trust },
];

function LinkColumn({
	heading,
	links,
}: {
	heading: string;
	links: readonly { label: string; href: string }[];
}) {
	return (
		<div>
			<h2 className="font-display text-[15px] text-ink mb-4">{heading}</h2>
			<ul className="space-y-2.5 text-[13.5px]">
				{links.map((l) => (
					<li key={l.href}>
						<Link
							href={l.href}
							className="text-ink/70 hover:text-primary transition-colors"
						>
							{l.label}
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
}

export default function SitemapPage() {
	const caseStudyLinks = CASE_STUDY_SLUGS.map((slug) => {
		const cs = CASE_STUDIES[slug];
		return {
			href: `/customers/${slug}`,
			label: cs ? `${cs.customer.business}` : slug,
		};
	});
	const fieldNoteLinks = FIELD_NOTES.map((n) => ({
		href: `/resources/field-notes/${n.slug}`,
		label: n.title,
	}));
	const playbookLinks = PLAYBOOKS.map((p) => ({
		href: `/resources/playbooks/${p.slug}`,
		label: p.title,
	}));

	return (
		<div className="bg-background">
			<div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-16 lg:py-24">
				<header className="max-w-2xl mb-14 lg:mb-20">
					<p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
						Site directory
					</p>
					<h1 className="font-display font-normal text-ink leading-none tracking-[-0.02em] text-[40px] sm:text-[52px] lg:text-[60px]">
						Sitemap
					</h1>
					<p className="mt-5 text-[17px] text-ink/70 leading-[1.6]">
						Everything we surface in the nav and footer, plus individual case
						studies, field notes, and playbooks. Machines can use{" "}
						<a
							href={absoluteUrl("/sitemap.xml")}
							className="pencil-link inline-flex items-center gap-1"
						>
							the XML sitemap
							<ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
						</a>
						.
					</p>
				</header>

				<section className="mb-14 lg:mb-16">
					<h2 className="font-display text-[15px] text-ink mb-4">Start here</h2>
					<ul className="flex flex-wrap gap-x-6 gap-y-2 text-[14px]">
						{QUICK.map((l) => (
							<li key={l.href}>
								<Link href={l.href} className="pencil-link">
									{l.label}
								</Link>
							</li>
						))}
					</ul>
				</section>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 pb-16 border-b border-border">
					{footerLinks.primary.map((col) => (
						<LinkColumn key={col.heading} heading={col.heading} links={col.links} />
					))}
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 py-16 border-b border-border">
					{footerLinks.secondary.map((col) => (
						<LinkColumn key={col.heading} heading={col.heading} links={col.links} />
					))}
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-14 py-16 border-b border-border">
					<LinkColumn heading="Case studies" links={caseStudyLinks} />
					<LinkColumn heading="Field notes" links={fieldNoteLinks} />
					<LinkColumn heading="Playbooks" links={playbookLinks} />
				</div>

				<section className="pt-14">
					<h2 className="font-display text-[15px] text-ink mb-4">
						Creator guides
					</h2>
					<ul className="text-[13.5px] space-y-2.5">
						<li>
							<Link
								href="/resources/creator-guides/voice-foundations"
								className="text-ink/70 hover:text-primary transition-colors"
							>
								Voice foundations
							</Link>
						</li>
					</ul>
				</section>
			</div>
		</div>
	);
}
