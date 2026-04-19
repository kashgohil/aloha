import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { makeMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";

export const metadata = makeMetadata({
  title: "Why we're different — the shape of a calm tool",
  description:
    "Not a feature list. A short essay about the design decisions that make Aloha feel different from the rest of the category.",
  path: routes.compare.whyDifferent,
});

export default function WhyWereDifferentPage() {
  return (
    <>
      {/* ─── HERO ────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden bg-peach-200">
        <span aria-hidden className="absolute top-[18%] left-[5%] font-display text-[32px] text-ink/25 rotate-[-8deg] select-none">✳</span>
        <span aria-hidden className="absolute top-[72%] right-[10%] font-display text-[26px] text-primary/55 rotate-[14deg] select-none">+</span>
        <span aria-hidden className="absolute top-[34%] right-[6%] font-display text-[40px] text-ink/15 rotate-[18deg] select-none">※</span>

        <div className="relative max-w-[820px] mx-auto px-6 lg:px-10 pt-24 lg:pt-36 pb-16 lg:pb-24 text-center">
          <div className="inline-flex items-center gap-3 mb-10 text-[11px] font-semibold uppercase tracking-[0.24em] text-ink/55">
            <span className="w-8 h-px bg-ink/35" />
            Manifesto, briefly
            <span className="w-8 h-px bg-ink/35" />
          </div>

          <h1 className="font-display font-normal text-ink leading-[0.96] tracking-[-0.03em] text-[52px] sm:text-[68px] lg:text-[88px]">
            A calm tool
            <br />
            <span className="italic text-primary font-light">in a loud category.</span>
          </h1>

          <p className="mt-10 max-w-xl mx-auto text-[17px] lg:text-[18px] leading-[1.7] text-ink/75">
            Most social tools were designed to maximise the thing they measure:
            posts per hour, notifications per minute, seats per account. We
            picked different things to optimise for. This is what they are.
          </p>
        </div>
      </header>

      {/* ─── PULL QUOTE ──────────────────────────────────────────────── */}
      <section className="py-12 lg:py-20">
        <div className="max-w-[860px] mx-auto px-6 lg:px-10">
          <figure className="relative">
            <span
              aria-hidden
              className="absolute -top-4 -left-2 font-display italic text-[140px] lg:text-[200px] leading-none text-peach-300/60 select-none pointer-events-none"
            >
              "
            </span>
            <blockquote className="relative font-display italic font-light text-ink text-[28px] sm:text-[36px] lg:text-[48px] leading-[1.15] tracking-[-0.015em] pl-8 lg:pl-14">
              The point of the tool isn't to produce more posts. It's to
              help you notice when you've said the thing — and stop.
            </blockquote>
          </figure>
        </div>
      </section>

      {/* ─── THE FIVE CHOICES ────────────────────────────────────────── */}
      <section className="py-16 lg:py-24">
        <div className="max-w-[820px] mx-auto px-6 lg:px-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-3">
            Five design choices
          </p>
          <h2 className="font-display text-[34px] lg:text-[48px] leading-[1.05] tracking-[-0.02em]">
            We picked them deliberately.
            <br />
            <span className="italic text-primary">Not by accident.</span>
          </h2>

          <ol className="mt-14 lg:mt-16 space-y-14 lg:space-y-20">
            {[
              {
                h: "We chose voice over templates.",
                p: (
                  <>
                    Every other tool in this category ships with a bank of
                    generic templates: "🚀 5 lessons I learned from a
                    plumber", "Here's a hot take that will get engagement."
                    They're fast and they sound like everybody else. We
                    built Muse, a voice model that trains on your best posts —
                    not your whole archive, just the ones that sounded
                    like you — so the rewrites it hands back have your
                    cadence, your hook habits, your line breaks.{" "}
                    <span className="text-ink font-medium">
                      The result is slower to start with and much harder
                      to spot as AI.
                    </span>{" "}
                    That trade felt worth it — which is why Muse is
                    a per-channel switch you flip on only where it's
                    actually earning its keep. It's invite-only during
                    beta; paid tiers follow.
                  </>
                ),
              },
              {
                h: "We chose calm over notifications.",
                p: (
                  <>
                    By default, Aloha sends one email a day and zero push
                    notifications. The app can't light up your phone
                    unless you explicitly ask it to. We made this choice
                    because we noticed that{" "}
                    <em>
                      every social tool's notification strategy is a
                      function of its own growth, not yours.
                    </em>{" "}
                    The more times we ping you, the more "engaged" you
                    look on our churn dashboard — and the more distracted
                    you are in real life. So we don't.
                  </>
                ),
              },
              {
                h: "We chose honest limits over feature bloat.",
                p: (
                  <>
                    There's a pattern in software where every tool
                    eventually ships every feature. Hootsuite started as a
                    Twitter scheduler and now sells a social-listening
                    suite, a CRM, and a paid-media platform. We're
                    resisting that pull. Aloha will stay a calm social OS
                    for creators and small teams. If you need enterprise
                    social listening or a Salesforce-native comms suite,
                    we'll{" "}
                    <Link
                      href={routes.compare.hootsuite}
                      className="pencil-link text-ink"
                    >
                      tell you to stay with Hootsuite
                    </Link>{" "}
                    — and mean it.
                  </>
                ),
              },
              {
                h: "We chose export-by-default over lock-in.",
                p: (
                  <>
                    Every piece of data Aloha holds on your behalf is
                    exportable: posts as CSV or JSON, calendar as ICS,
                    analytics as Markdown digest, subscribers as whatever
                    format your next tool wants. No "email us for a
                    backup", no "enterprise-only data access", no{" "}
                    <em>charge-you-for-leaving</em> migration fee. If a
                    different tool suits you better, we want the offramp
                    to be frictionless. That's how we build trust; the
                    tool should earn the stay every month.
                  </>
                ),
              },
              {
                h: "We chose human approvals over auto-send.",
                p: (
                  <>
                    Every outbound action inside Aloha — DMs, replies,
                    comments from the Matrix — pauses at a human approve
                    step by default. You can turn approvals off per-matrix
                    when you're confident, but we'll never ship a default
                    that sends on your behalf without your thumb.
                    Automation is powerful; it's also how brands end up
                    spamming their own audiences with{" "}
                    <em>"Hey {"{firstName}"}, saw you're interested in…"</em>{" "}
                    templated messages. We don't want to be that. We
                    designed the defaults so you can't accidentally become
                    that.
                  </>
                ),
              },
            ].map((c, i) => (
              <li key={i} className="relative grid grid-cols-12 gap-x-0 gap-y-6 lg:gap-10">
                <div className="col-span-12 lg:col-span-2">
                  <p className="font-display italic text-[56px] lg:text-[72px] leading-[0.9] text-peach-300">
                    0{i + 1}
                  </p>
                </div>
                <div className="col-span-12 lg:col-span-10">
                  <h3 className="font-display text-[26px] lg:text-[34px] leading-[1.15] tracking-[-0.015em] text-ink">
                    {c.h}
                  </h3>
                  <p className="mt-5 text-[16px] lg:text-[17px] leading-[1.7] text-ink/75 max-w-[64ch]">
                    {c.p}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─── MID CALLOUT ─────────────────────────────────────────────── */}
      <section className="py-16 lg:py-24">
        <div className="max-w-[900px] mx-auto px-6 lg:px-10">
          <div className="relative rounded-3xl bg-ink text-background-elev p-10 lg:p-14 overflow-hidden">
            <div
              aria-hidden
              className="absolute inset-0 opacity-10 [background-image:radial-gradient(var(--peach-300)_1px,transparent_1px)] [background-size:28px_28px]"
            />
            <p className="relative text-[10px] font-semibold uppercase tracking-[0.26em] text-peach-200 mb-5">
              What this adds up to
            </p>
            <p className="relative font-display text-[26px] lg:text-[34px] leading-[1.2] tracking-[-0.015em] max-w-2xl">
              Not a louder tool. Not a bigger feature list. A tool designed
              to help you notice when you're done — and close the tab.
            </p>
          </div>
        </div>
      </section>

      {/* ─── SIGNATURE / PROVENANCE ─────────────────────────────────── */}
      <section className="py-16 lg:py-24">
        <div className="max-w-[820px] mx-auto px-6 lg:px-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-8 pb-12 border-b border-border">
            <div>
              <p className="font-display italic text-[28px] lg:text-[32px] text-ink leading-[1.15]">
                — the Aloha team
              </p>
              <p className="mt-2 text-[13px] text-ink/55 font-mono uppercase tracking-[0.18em]">
                Bengaluru, India
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:items-end">
              <Link
                href={routes.company.manifesto}
                className="pencil-link text-[14.5px] text-ink font-medium inline-flex items-center gap-2"
              >
                Read the longer manifesto
                <ArrowUpRight className="w-4 h-4" />
              </Link>
              <Link
                href={routes.company.about}
                className="pencil-link text-[14.5px] text-ink/70 inline-flex items-center gap-2"
              >
                About the team
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="mt-14 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <p className="font-display text-[22px] lg:text-[26px] leading-[1.25] tracking-[-0.005em] max-w-lg">
              If any of this resonates,
              <span className="italic text-primary"> try the tool.</span>
            </p>
            <Link
              href={routes.signin}
              className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
            >
              Start free — no card
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
