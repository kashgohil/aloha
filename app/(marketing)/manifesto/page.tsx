import { routes } from "@/lib/routes";
import { makeMetadata } from "@/lib/seo";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export const metadata = makeMetadata({
	title: "Manifesto — what we believe and why we build",
	description:
		"A longer essay about the beliefs behind Aloha — why a quiet tool is a better tool, and what we're trying to protect.",
	path: routes.company.manifesto,
});

export default function ManifestoPage() {
	return (
		<>
			{/* ─── HERO ────────────────────────────────────────────────────── */}
			<header className="relative overflow-hidden bg-peach-200 pb-16 lg:pb-20">
				<span
					aria-hidden
					className="absolute top-[18%] left-[5%] font-display text-[34px] text-ink/25 rotate-[-8deg] select-none"
				>
					✳
				</span>
				<span
					aria-hidden
					className="absolute top-[72%] right-[10%] font-display text-[26px] text-primary/55 rotate-14 select-none"
				>
					+
				</span>
				<span
					aria-hidden
					className="absolute top-[34%] right-[6%] font-display text-[40px] text-ink/15 rotate-18 select-none"
				>
					※
				</span>
			</header>

			<section className="bg-peach-200 wavy">
				<div className="relative max-w-[820px] mx-auto px-6 lg:px-10 pt-24 lg:pt-36 pb-32 lg:pb-40 text-center">
					<div className="inline-flex items-center gap-3 mb-10 text-[11px] font-semibold uppercase tracking-[0.24em] text-ink/55">
						<span className="w-8 h-px bg-ink/35" />
						Manifesto
						<span className="w-8 h-px bg-ink/35" />
					</div>
					<h1 className="font-display font-normal text-ink leading-[0.96] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[96px]">
						We're building
						<br />
						<span className="text-primary font-light">a calm thing,</span>
						<br />
						on purpose.
					</h1>
					<p className="mt-12 max-w-xl mx-auto text-[14px] font-mono text-ink/55 uppercase tracking-[0.18em]">
						An essay · eleven minutes · last revised Apr 10, 2026
					</p>
				</div>
			</section>

			{/* ─── ESSAY ──────────────────────────────────────────────────── */}
			<section className="bg-ink relative">
				<div
					aria-hidden
					className="absolute inset-0 top-2.5! opacity-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<article className="py-20 lg:py-28 bg-background wavy pb-32 lg:pb-40">
					<div className="max-w-[720px] mx-auto px-6 lg:px-10 text-ink/85 text-[17px] lg:text-[18px] leading-[1.8]">
						{/* — opening — */}
						<p className="font-display text-[26px] lg:text-[34px] leading-[1.3] tracking-[-0.01em] text-ink mb-12">
							The category is loud. Every tool in it is designed to make you
							post more. We think that's the wrong problem. The right problem is
							helping you notice when you've said the thing — and stop.
						</p>

						<p>
							Aloha is a social media tool. We help creators and small teams
							schedule posts across eight networks, triage comments and DMs in
							one place, and automate the quiet choreography that used to be
							manual — a welcome DM to a new follower, a reminder post the day
							after a launch, a carousel cross-posted as a Threads reply chain.
						</p>

						<p>
							Nothing in that sentence is novel. What is, we think, is the set
							of choices we've made about <em>how</em> to do it.
						</p>

						<h2 className="font-display text-[28px] lg:text-[36px] font-normal leading-[1.15] tracking-[-0.015em] text-ink mt-16 mb-5 scroll-mt-20">
							1. The category is upside-down.
						</h2>

						<p>
							Most social tools measure their success by how much you use them.
							Time in app. Posts per week. Notifications delivered. These are
							the same metrics the platforms themselves optimise for. Your
							scheduler inherits the incentive structure of the thing you're
							using it to escape.
						</p>

						<p>
							We turned that around early. We measure our success by how much of
							your week you get <em>back</em>. A creator who used to spend nine
							hours a week on social and now spends three is a win, even if they
							post less. Our onboarding asks you to estimate the hours you want
							to save. Our quarterly review checks whether we did.
						</p>

						<h2 className="font-display text-[28px] lg:text-[36px] font-normal leading-[1.15] tracking-[-0.015em] text-ink mt-16 mb-5 scroll-mt-20">
							2. Voice is the point.
						</h2>

						<p>
							Most AI writing tools in this category ship with a bank of
							templates. "Five lessons I learned from a plumber." "Here's a hot
							take that will get engagement." They're fast, and they make every
							creator sound interchangeable. We built a voice model that trains
							on your best posts — not your whole archive, the twelve that
							sounded most like you — so the rewrites it gives back have your
							cadence, your hook habits, your line breaks.
						</p>

						<p>
							It's slower to start. The first weekend is training. But the
							outputs feel like a careful ghostwriter, not a karaoke machine.
							Your editor can't always tell which drafts you wrote and which
							Aloha did. That's the bar we wanted.
						</p>

						<figure className="my-12 pl-6 lg:pl-8 border-l-2 border-peach-300">
							<blockquote className="font-display text-[22px] lg:text-[26px] leading-[1.3] tracking-[-0.005em] text-ink">
								The output of AI should sound more like you, not more like
								everyone else who used AI.
							</blockquote>
						</figure>

						<h2 className="font-display text-[28px] lg:text-[36px] font-normal leading-[1.15] tracking-[-0.015em] text-ink mt-16 mb-5 scroll-mt-20">
							3. Automation with a thumb in the loop.
						</h2>

						<p>
							The Matrix — our automation canvas — ships with human approvals as
							the <em>default</em>. Every outbound DM, reply and comment the
							automations generate pauses for you to confirm. You can turn
							approvals off per-matrix when you know what you're doing, but you
							have to choose that actively. We designed the defaults so you
							can't accidentally become one of those brands that spams its own
							audience with templated
							<em>
								{" "}
								"Hey {"{firstName}"}, I noticed you're interested in…"
							</em>{" "}
							messages.
						</p>

						<p>
							Automation is powerful. It's also how brands lose trust. We picked
							defaults that make that harder.
						</p>

						<h2 className="font-display text-[28px] lg:text-[36px] font-normal leading-[1.15] tracking-[-0.015em] text-ink mt-16 mb-5 scroll-mt-20">
							4. The notification budget is zero.
						</h2>

						<p>
							Aloha sends one email a day and zero push notifications by
							default. The app cannot light up your phone unless you explicitly
							ask it to. The opt-in is buried under a confirmation dialog that
							reads "are you sure? we'd rather you not."
						</p>

						<p>
							We made this choice because every other social tool's notification
							strategy is a function of <em>its</em> growth, not yours. The more
							pings we send, the more "engaged" you look on our churn dashboard
							— and the more distracted you are in real life. So we don't. If
							you miss something urgent, our daily digest will surface it. If
							you truly want push, turn it on, and we'll respect that choice.
						</p>

						<h2 className="font-display text-[28px] lg:text-[36px] font-normal leading-[1.15] tracking-[-0.015em] text-ink mt-16 mb-5 scroll-mt-20">
							5. The export button is the point.
						</h2>

						<p>
							Every piece of data Aloha holds is exportable, without friction,
							in the format your next tool wants. CSV or JSON for posts. ICS for
							the calendar. Markdown digest for your team's Notion. Your
							subscribers as whatever standard your email provider imports. No
							"email us for a backup". No "enterprise-only data access". No{" "}
							<em>charge-you-for-leaving</em> migration fees.
						</p>

						<p>
							Our importers go the other way with the same respect —{" "}
							<Link href={routes.compare.migrationGuide}>
								every major competitor has a one-click migration path into us
							</Link>
							. The offramp and the onramp are the same size. That's how we
							build trust: the tool should earn the stay every month, not trap
							you when the stay is over.
						</p>

						<h2 className="font-display text-[28px] lg:text-[36px] font-normal leading-[1.15] tracking-[-0.015em] text-ink mt-16 mb-5 scroll-mt-20">
							6. We'll tell you to go elsewhere.
						</h2>

						<p>
							There are kinds of work Aloha isn't the best answer for.
							Enterprise social-listening at scale — go to Hootsuite.
							Customer-care orgs with 10,000 DMs a week — go to Sprout. Pure-X
							thread writers who never expect to post elsewhere — Typefully's
							editor is better. We wrote{" "}
							<Link href={routes.compare.migrationGuide}>
								honest comparison pages
							</Link>{" "}
							that say so plainly. If we aren't the right tool, our job is to
							point you at the right one, not to trick you into staying through
							friction.
						</p>

						<p>
							This sounds obvious. In practice, it means writing a comparison
							page that starts with "here's where the competitor is stronger"
							before "here's where we are." We keep it in our content style
							guide as a hard rule.
						</p>

						<h2 className="font-display text-[28px] lg:text-[36px] font-normal leading-[1.15] tracking-[-0.015em] text-ink mt-16 mb-5 scroll-mt-20">
							7. Growth at the right speed.
						</h2>

						<p>
							Our seed investors signed a side letter that says, in writing:
							Aloha is a calm tool, not a growth engine. Revenue per creator,
							not creators per quarter. Profitability before velocity. We read
							it out loud at the last board meeting and got uncomfortable
							laughter, but we meant it.
						</p>

						<p>
							This doesn't mean we won't grow. It means we won't do the things
							that most "growth" playbooks want us to do — push notifications on
							day two, daily email drips, referral programmes that pay creators
							to tag their audience. We'd rather have forty thousand customers
							who love the tool than four million who are passively using it.
						</p>

						<figure className="my-14 p-10 rounded-3xl bg-primary-soft border border-primary/15">
							<p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary mb-5">
								What this adds up to
							</p>
							<p className="font-display text-[22px] lg:text-[28px] leading-tight tracking-[-0.005em] text-ink">
								Not a louder tool. Not a bigger feature list. A tool that helps
								you notice when you're done — and close the tab.
							</p>
						</figure>

						<h2 className="font-display text-[28px] lg:text-[36px] font-normal leading-[1.15] tracking-[-0.015em] text-ink mt-16 mb-5 scroll-mt-20">
							8. Who this is for.
						</h2>

						<p>
							Solopreneurs who don't have time to become a social media agency
							on the side. Creators whose voice is the product. Small teams that
							don't need fifty SKUs. Agencies that want their clients to feel
							cared for, not processed. Nonprofits with missions that deserve
							better tooling than they can usually afford. We wrote{" "}
							<Link href={routes.for.solopreneurs}>dedicated pages</Link> for
							each — they're more useful than a generic "who it's for".
						</p>

						<p>
							If you're a marketing ops leader at a Fortune 100 company running
							a hundred-seat deployment, we probably aren't for you. And that's
							fine. Go build something calm of your own.
						</p>

						<h2 className="font-display text-[28px] lg:text-[36px] font-normal leading-[1.15] tracking-[-0.015em] text-ink mt-16 mb-5 scroll-mt-20">
							9. How this holds up.
						</h2>

						<p>
							A manifesto is worth nothing if the product doesn't keep it. We
							built three commitments into how we run:
						</p>

						<ol className="list-decimal pl-6 mt-6 space-y-4">
							<li>
								Every quarterly plan includes a &ldquo;what we didn't ship to
								preserve the calm&rdquo; note. Things that would have added
								growth but cost more than they paid.
							</li>
							<li>
								Every hire signs a short values document before day one. It
								includes &ldquo;we will tell customers to use a competitor when
								it's right&rdquo; as a bullet.
							</li>
							<li>
								This manifesto has a{" "}
								<Link href={routes.product.whatsNew}>revision history</Link>.
								When we change a belief, we show you the diff.
							</li>
						</ol>

						<h2 className="font-display text-[28px] lg:text-[36px] font-normal leading-[1.15] tracking-[-0.015em] text-ink mt-16 mb-5 scroll-mt-20">
							10. Try the tool.
						</h2>

						<p>
							You've read a lot of our words. If the beliefs above map to your
							own, the product is the rest of the argument. The free plan is
							free forever, without a card. Three channels, ten posts per
							channel per month. It won't run out, and we won't email you to
							upgrade.
						</p>

						<p>
							The best manifesto is the product behaving the way it said it
							would. Ours is below.
						</p>

						{/* — close — */}
						<div className="mt-20 pt-10 border-t border-border flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
							<div>
								<p className="font-display italic text-[28px] lg:text-[32px] text-ink leading-[1.15]">
									— the Aloha team
								</p>
								<p className="mt-2 text-[13px] text-ink/55 font-mono uppercase tracking-[0.18em]">
									Lisbon · Oakland · Jakarta · April 2026
								</p>
							</div>
							<div className="flex flex-col gap-2 sm:items-end">
								<Link
									href={routes.compare.whyDifferent}
									className="pencil-link text-[14px] text-ink/70 inline-flex items-center gap-2"
								>
									The short version of this
									<ArrowUpRight className="w-3.5 h-3.5" />
								</Link>
								<Link
									href={routes.company.about}
									className="pencil-link text-[14px] text-ink/70 inline-flex items-center gap-2"
								>
									About the team
									<ArrowUpRight className="w-3.5 h-3.5" />
								</Link>
							</div>
						</div>
					</div>
				</article>
			</section>

			{/* ─── FOOT CTA ───────────────────────────────────────────────── */}
			<section className="relative overflow-hidden bg-ink wavy text-background-elev">
				<div
					aria-hidden
					className="absolute inset-0 top-2.5! opacity-10 -z-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<div className="max-w-[820px] mx-auto px-6 lg:px-10 pt-12 lg:pt-20 pb-24 lg:pb-32">
					<div className="p-10 lg:p-14 rounded-3xl">
						<p className="font-display text-[28px] lg:text-[36px] leading-[1.2] tracking-[-0.01em]">
							If any of this read like the shape of a tool you'd use,{" "}
							<span className="text-peach-300">try it.</span>
						</p>
						<div className="mt-8 flex flex-wrap gap-4">
							<Link
								href={routes.signin}
								className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-peach-300 text-ink text-[14px] font-medium hover:bg-peach-400 transition-colors"
							>
								Start free — no card
								<ArrowRight className="w-4 h-4" />
							</Link>
							<Link
								href="/"
								className="inline-flex items-center gap-2 h-12 px-6 rounded-full border border-peach-200/25 text-peach-200 text-[14px] font-medium hover:bg-background-elev/10 transition-colors"
							>
								See what it looks like
								<ArrowUpRight className="w-4 h-4" />
							</Link>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
