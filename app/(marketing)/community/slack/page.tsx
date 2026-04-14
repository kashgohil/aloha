import { routes } from "@/lib/routes";
import { makeMetadata } from "@/lib/seo";
import { ArrowRight, MessageSquare, Sparkle, Users } from "lucide-react";

export const metadata = makeMetadata({
	title: "Community Slack — where Aloha customers talk to each other",
	description:
		"Join the Aloha community on Slack. 4K+ creators sharing what's working, what isn't, and catching the team between newsletter issues.",
	path: routes.connect.slack,
});

const CHANNELS = [
	{
		name: "#field-notes",
		desc: "Long-form thinking from members. The closest thing to the newsletter in real time.",
		tone: "bg-peach-100",
	},
	{
		name: "#voice-lab",
		desc: "Show your voice-model experiments. Members who crit kindly.",
		tone: "bg-primary-soft",
	},
	{
		name: "#whats-working",
		desc: "One-post-a-week wins. No vanity metrics, only useful patterns.",
		tone: "bg-peach-200",
	},
	{
		name: "#product-feedback",
		desc: "Where the team actually reads.",
		tone: "bg-peach-300",
	},
	{
		name: "#agency-nook",
		desc: "Just for members on the Agency plan.",
		tone: "bg-primary-soft",
	},
	{
		name: "#off-topic",
		desc: "Books, chairs, coffee, the weather in Jakarta.",
		tone: "bg-peach-100",
	},
];

const RULES = [
	{
		h: "Be kind, be specific",
		p: "Crit the post, not the poster. 'I'd tighten the hook' beats 'doesn't work'.",
	},
	{
		h: "No lurking dunk tanks",
		p: "If a post or opinion annoys you, respond generously or skip it. Drive-by dunks get warned once, then removed.",
	},
	{
		h: "No recruiting",
		p: "Members are here to talk, not to be pitched. Hiring? Use #jobs, once per role, no DMs.",
	},
	{
		h: "Aloha team included",
		p: "We're in most channels, under our real names. We'll flag when we speak officially.",
	},
];

const CITY_PULSE = [
	{ city: "Lisbon", active: 180, tz: "UTC+1" },
	{ city: "New York", active: 240, tz: "UTC−5" },
	{ city: "San Francisco", active: 210, tz: "UTC−8" },
	{ city: "London", active: 165, tz: "UTC+0" },
	{ city: "Berlin", active: 140, tz: "UTC+1" },
	{ city: "Jakarta", active: 95, tz: "UTC+7" },
];

export default function SlackCommunityPage() {
	return (
		<>
			{/* ─── HERO ────────────────────────────────────────────────────── */}
			<header className="relative overflow-hidden bg-peach-200 pb-16 lg:pb-20">
				<span
					aria-hidden
					className="absolute top-[14%] left-[5%] font-display text-[28px] text-ink/25 rotate-[-8deg] select-none"
				>
					✳
				</span>
				<span
					aria-hidden
					className="absolute top-[68%] right-[10%] font-display text-[22px] text-primary/55 rotate-14 select-none"
				>
					+
				</span>
			</header>

			<section className="bg-peach-200 wavy">
				<div className="relative max-w-[1180px] mx-auto px-6 lg:px-10 pt-20 lg:pt-28 pb-32 lg:pb-40">
					<div className="inline-flex items-center gap-3 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
						Community Slack
						<span className="px-2 py-0.5 bg-background-elev border border-border rounded-full text-ink/65 text-[10px] font-mono normal-case tracking-normal inline-flex items-center gap-1.5">
							<span className="relative flex w-2 h-2">
								<span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
								<span className="relative w-2 h-2 rounded-full bg-primary" />
							</span>
							4,128 members
						</span>
					</div>
					<h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[96px]">
						Where Aloha
						<br />
						<span className="text-primary font-light">customers talk</span>
						<br />
						to each other.
					</h1>
					<p className="mt-8 max-w-2xl text-[17px] lg:text-[18px] leading-[1.6] text-ink/75">
						Four thousand creators, operators and team members sharing what's
						working, what isn't, and catching the team between newsletter
						issues. Invite-only; quiet by design.
					</p>

					<div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
						<form
							action="#"
							method="post"
							className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
						>
							<input
								type="email"
								required
								placeholder="you@wherever.works"
								className="h-14 px-5 rounded-full bg-background-elev border border-border-strong text-[15px] text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary w-full sm:w-80"
							/>
							<button
								type="submit"
								className="inline-flex items-center justify-center gap-2 h-14 px-7 rounded-full bg-ink text-background font-medium text-[15px] hover:bg-primary transition-colors"
							>
								Request invite
								<ArrowRight className="w-4 h-4" />
							</button>
						</form>
					</div>
					<p className="mt-4 text-[12.5px] text-ink/55 max-w-xl">
						Invites approved within a business day. Free, no plan required. By
						joining you accept the{" "}
						<a href="#rules" className="pencil-link text-ink">
							community rules
						</a>
						.
					</p>
				</div>
			</section>

			{/* ─── CHANNELS ───────────────────────────────────────────────── */}
			<section className="bg-background-elev">
				<section className="py-24 lg:py-32 pb-32 lg:pb-40 wavy bg-background">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
						<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 mb-14 items-end">
							<div className="col-span-12 lg:col-span-7">
								<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
									What happens here
								</p>
								<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
									Six channels.
									<br />
									<span className="text-primary">All active.</span>
								</h2>
							</div>
							<p className="col-span-12 lg:col-span-5 text-[15.5px] text-ink/70 leading-[1.55]">
								We deliberately keep the channel list short. The mothership is
								#whats-working; most people find their way there first.
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
							{CHANNELS.map((c) => (
								<article
									key={c.name}
									className={`p-7 rounded-3xl ${c.tone} flex flex-col min-h-[180px]`}
								>
									<div className="flex items-center gap-2 mb-5">
										<MessageSquare className="w-4 h-4 text-ink/60" />
										<span className="font-mono text-[13px] font-semibold text-ink">
											{c.name}
										</span>
									</div>
									<p className="text-[14px] text-ink/75 leading-[1.6]">
										{c.desc}
									</p>
								</article>
							))}
						</div>
					</div>
				</section>
			</section>

			{/* ─── CITY PULSE ─────────────────────────────────────────────── */}
			<section className="py-20 lg:py-24 bg-background-elev wavy">
				<div className="max-w-[1180px] mx-auto px-6 lg:px-10 pb-8 lg:pb-12">
					<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 mb-12 items-end">
						<div className="col-span-12 lg:col-span-7">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Where members are
							</p>
							<h2 className="font-display text-[32px] lg:text-[44px] leading-[1.02] tracking-[-0.02em]">
								Someone's awake,
								<span className="text-primary"> somewhere.</span>
							</h2>
						</div>
						<p className="col-span-12 lg:col-span-5 text-[15px] text-ink/70 leading-[1.55]">
							Top six member cities, roughly. The channel cycles around the
							clock — post when you have the thought.
						</p>
					</div>

					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
						{CITY_PULSE.map((c) => (
							<div
								key={c.city}
								className="p-5 rounded-2xl bg-background border border-border"
							>
								<p className="font-display text-[20px] leading-[1.1] tracking-[-0.005em]">
									{c.city}
								</p>
								<p className="mt-1 text-[11px] font-mono uppercase tracking-[0.14em] text-ink/55">
									{c.tz}
								</p>
								<p className="mt-4 font-mono text-[12.5px] text-ink/75">
									{c.active} active
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ─── RULES ──────────────────────────────────────────────────── */}
			<section className="bg-background-elev">
				<section
					id="rules"
					className="py-24 lg:py-32 pb-32 lg:pb-40 wavy bg-background"
				>
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
						<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 mb-14 items-end">
							<div className="col-span-12 lg:col-span-7">
								<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
									Community rules
								</p>
								<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
									Four lines.
									<br />
									<span className="text-primary">We mean all of them.</span>
								</h2>
							</div>
							<p className="col-span-12 lg:col-span-5 text-[15.5px] text-ink/70 leading-[1.55]">
								Moderation here is three people with name-tags. They're gentle,
								direct, and don't pile on. If something's off, message{" "}
								<a
									href="mailto:moderators@usealoha.app"
									className="pencil-link text-ink"
								>
									moderators@usealoha.app
								</a>
								.
							</p>
						</div>

						<ol className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
							{RULES.map((r, i) => (
								<li
									key={r.h}
									className={`p-8 rounded-3xl ${i % 2 === 0 ? "bg-peach-100" : "bg-primary-soft"} flex gap-5`}
								>
									<span className="font-display text-[40px] text-ink/30 leading-none shrink-0">
										0{i + 1}
									</span>
									<div>
										<h3 className="font-display text-[22px] leading-[1.15] tracking-[-0.005em]">
											{r.h}
										</h3>
										<p className="mt-3 text-[14px] text-ink/75 leading-[1.6]">
											{r.p}
										</p>
									</div>
								</li>
							))}
						</ol>
					</div>
				</section>
			</section>

			{/* ─── MEMBER HIGHLIGHTS ──────────────────────────────────────── */}
			<section className="bg-ink relative">
				<div
					aria-hidden
					className="absolute inset-0 top-2.5! opacity-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<section className="py-24 lg:py-32 bg-background-elev pb-32 lg:pb-40 wavy">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
						<div className="mb-14">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Members, in their words
							</p>
							<h2 className="font-display text-[36px] lg:text-[48px] leading-[1.02] tracking-[-0.02em]">
								The flavour of the room.
							</h2>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
							{[
								{
									q: "Best product-feedback loop I've ever been in. Posted a bug Tuesday, was fixed Friday.",
									n: "Deniz K.",
									r: "Indie maker",
									tone: "bg-peach-200",
									ini: "D",
								},
								{
									q: "The voice-lab channel is worth the plan by itself. I stole a line rhythm from it last week and it works.",
									n: "Priya N.",
									r: "Ghostwriter",
									tone: "bg-primary-soft",
									ini: "P",
								},
								{
									q: "Nobody's selling anything. I didn't realise how rare that is.",
									n: "Naledi O.",
									r: "Founder",
									tone: "bg-peach-100",
									ini: "N",
								},
							].map((t, i) => (
								<figure
									key={i}
									className={`p-7 rounded-3xl ${t.tone} flex flex-col`}
								>
									<Sparkle className="w-4 h-4 text-primary mb-5" />
									<blockquote className="font-display text-[18px] lg:text-[19px] leading-[1.3] tracking-[-0.005em] text-ink">
										"{t.q}"
									</blockquote>
									<figcaption className="mt-6 flex items-center gap-3">
										<span className="w-9 h-9 rounded-full bg-ink text-background-elev font-display flex items-center justify-center">
											{t.ini}
										</span>
										<div>
											<p className="font-medium text-[13.5px] text-ink">
												{t.n}
											</p>
											<p className="text-[12px] text-ink/60">{t.r}</p>
										</div>
									</figcaption>
								</figure>
							))}
						</div>
					</div>
				</section>
			</section>

			{/* ─── FINAL CTA ──────────────────────────────────────────────── */}
			<section className="relative overflow-hidden bg-ink text-background-elev wavy">
				<div
					aria-hidden
					className="absolute inset-0 top-2.5! opacity-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-20 lg:py-28 pb-32 lg:pb-40">
					<div className="p-10 lg:p-14 rounded-3xl bg-ink text-background-elev">
						<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
							<div>
								<Users className="w-7 h-7 text-peach-300 mb-5" />
								<p className="font-display text-[32px] lg:text-[42px] leading-[1.1] tracking-[-0.015em] max-w-2xl">
									Bring your draft,
									<br />
									<span className="text-peach-300">
										leave with a tighter one.
									</span>
								</p>
							</div>
							<form
								action="#"
								method="post"
								className="flex flex-col sm:flex-row gap-3"
							>
								<input
									type="email"
									required
									placeholder="you@wherever.works"
									className="h-12 px-5 rounded-full bg-background-elev/10 border border-peach-200/20 text-[14px] text-background-elev placeholder:text-background-elev/40 focus:outline-none focus:border-peach-300 w-full sm:w-72"
								/>
								<button
									type="submit"
									className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-peach-300 text-ink font-medium text-[14px] hover:bg-peach-400 transition-colors shrink-0"
								>
									Request invite
									<ArrowRight className="w-4 h-4" />
								</button>
							</form>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
