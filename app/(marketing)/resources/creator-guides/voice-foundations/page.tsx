import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Mic,
  Clock,
  CheckCircle2,
  Sparkle,
  ChevronRight,
} from "lucide-react";
import { makeMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";

export const metadata = makeMetadata({
  title: "Voice foundations — train and tune the voice model",
  description:
    "A six-lesson learning path for the Aloha voice model. Goes from 'what is it' to 'I trust it with Wednesday's post' in roughly 45 minutes.",
  path: "/resources/creator-guides/voice-foundations",
});

const LESSONS = [
  {
    n: 1,
    title: "What the voice model actually does",
    minutes: "4 min",
    summary:
      "Why we trained on 12 of your best posts instead of 1,200. The 'sounds like me' loop, in simple terms.",
    points: [
      "How the training set is chosen (and why size isn't the win you'd think)",
      "What 'voice match' percentages actually measure",
      "Where the model is good — and where it isn't",
    ],
    cta: "Start lesson 1",
    href: routes.signin,
  },
  {
    n: 2,
    title: "Picking your 12 voice posts",
    minutes: "8 min",
    summary:
      "The single highest-leverage thing you'll do for the model. We'll walk you through choosing the right twelve.",
    points: [
      "Why high-engagement posts are not the same as voice posts",
      "Three rules for spotting your own voice",
      "How to reset and re-train if your style shifts",
    ],
    cta: "Start lesson 2",
    href: routes.signin,
  },
  {
    n: 3,
    title: "Reading the diff",
    minutes: "5 min",
    summary:
      "Composer rewrites are diffs you can redline. How to read what changed and why — without becoming a copy editor.",
    points: [
      "The three kinds of edit (length, hook, cadence) and how Composer signals each",
      "The 'reject and retrain' loop for stubborn patterns",
      "When to override the model's confidence score",
    ],
    cta: "Start lesson 3",
    href: routes.signin,
  },
  {
    n: 4,
    title: "Per-channel tuning",
    minutes: "7 min",
    summary:
      "Same voice, four channels, four shapes. How the model adapts your cadence to LinkedIn vs X vs Threads vs Instagram.",
    points: [
      "How channel rules layer on top of your base voice",
      "The 'tightness' slider per channel",
      "What to do when LinkedIn rewrites feel too long (the answer isn't 'shorter')",
    ],
    cta: "Start lesson 4",
    href: routes.signin,
  },
  {
    n: 5,
    title: "Trust on Wednesday",
    minutes: "10 min",
    summary:
      "The hardest part: letting the model draft a real post for a real audience. We'll walk through your first 'just hit schedule' moment.",
    points: [
      "How to pick a low-stakes first post",
      "Setting an approval guardrail you actually use",
      "What to do if the first attempt feels off (it usually does)",
    ],
    cta: "Start lesson 5",
    href: routes.signin,
  },
  {
    n: 6,
    title: "Voice across a team",
    minutes: "11 min",
    summary:
      "For two-plus people sharing a voice. Per-brand voices, approval flows, and the etiquette of redlining a teammate's draft.",
    points: [
      "Per-brand voices on the Working Team plan",
      "Approval flows that don't slow you down",
      "How to crit a teammate's draft kindly (and the Composer feature that helps)",
    ],
    cta: "Start lesson 6",
    href: routes.signin,
  },
];

const TOTAL_MINUTES = "45 min total";

export default function VoiceFoundationsGuidePage() {
  return (
    <>
      {/* ─── HERO ────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden bg-peach-200 pb-16 lg:pb-20">
        <span aria-hidden className="absolute top-[14%] left-[5%] font-display text-[28px] text-ink/25 rotate-[-8deg] select-none">✳</span>
        <span aria-hidden className="absolute top-[68%] right-[10%] font-display text-[22px] text-ink/15 rotate-[14deg] select-none">+</span>

        <div className="relative max-w-[1180px] mx-auto px-6 lg:px-10 pt-20 lg:pt-28">
          <div className="grid grid-cols-12 gap-8 lg:gap-12 items-end">
            <div className="col-span-12 lg:col-span-8">
              <div className="flex flex-wrap items-center gap-3 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
                <Link href={routes.resources.creatorGuides} className="pencil-link">
                  Creator guides
                </Link>
                <span className="text-ink/25">·</span>
                <span>Voice foundations</span>
                <span className="px-2 py-0.5 bg-background-elev/70 border border-ink/10 rounded-full text-ink/65 text-[10px] font-mono normal-case tracking-normal inline-flex items-center gap-1.5">
                  <Mic className="w-3 h-3" />
                  6 lessons · {TOTAL_MINUTES}
                </span>
              </div>
              <h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[88px]">
                Train the model.
                <br />
                <span className="italic text-primary font-light">Trust it by Wednesday.</span>
              </h1>
              <p className="mt-8 max-w-2xl text-[17px] lg:text-[18px] leading-[1.6] text-ink/75">
                Six lessons, roughly 45 minutes total. By the end the
                Composer drafts in your cadence reliably enough that you'll
                hit Schedule on a real post without rereading three times.
              </p>
            </div>
            <div className="col-span-12 lg:col-span-4">
              <Link
                href={routes.signin}
                className="inline-flex items-center gap-2 h-14 px-7 rounded-full bg-ink text-background font-medium text-[15px] hover:bg-primary transition-colors"
              >
                Start lesson 1
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="mt-3 text-[12.5px] text-ink/60">
                Free plan covers everything in this path.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ─── PROGRESS / OUTLINE ─────────────────────────────────────── */}
      <section className="py-12 lg:py-16">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="rounded-3xl bg-background-elev border border-border p-7 lg:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/55">
                What you'll cover
              </p>
              <span className="text-[12.5px] text-ink/60 font-mono">
                {LESSONS.length} lessons · {TOTAL_MINUTES}
              </span>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {LESSONS.map((l) => (
                <li key={l.n}>
                  <a
                    href={`#lesson-${l.n}`}
                    className="group flex items-start gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors"
                  >
                    <span className="font-mono text-[11px] text-ink/55 mt-[2px] shrink-0">
                      0{l.n}
                    </span>
                    <span className="text-[13.5px] text-ink leading-[1.4] group-hover:text-primary transition-colors">
                      {l.title}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── LESSONS ────────────────────────────────────────────────── */}
      <section className="py-12 lg:py-16">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10 space-y-8">
          {LESSONS.map((l, idx) => (
            <article
              key={l.n}
              id={`lesson-${l.n}`}
              className="grid grid-cols-12 gap-0 rounded-3xl overflow-hidden bg-background-elev border border-border scroll-mt-24"
            >
              {/* sidebar */}
              <div className="col-span-12 md:col-span-3 p-7 lg:p-8 bg-muted/20 md:border-r border-border flex flex-col justify-between gap-6">
                <div>
                  <span className="font-display italic text-[40px] lg:text-[48px] text-primary leading-none">
                    0{l.n}
                  </span>
                  <p className="mt-3 text-[10.5px] font-mono uppercase tracking-[0.2em] text-ink/60 inline-flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {l.minutes}
                  </p>
                </div>
                <span className={`text-[10px] font-mono uppercase tracking-[0.18em] inline-flex items-center gap-1.5 ${idx === 0 ? "text-primary" : "text-ink/45"}`}>
                  <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
                  {idx === 0 ? "Start here" : "Locked until previous"}
                </span>
              </div>

              {/* body */}
              <div className="col-span-12 md:col-span-9 p-7 lg:p-9">
                <h2 className="font-display text-[26px] lg:text-[32px] leading-[1.15] tracking-[-0.01em]">
                  {l.title}
                </h2>
                <p className="mt-3 text-[15px] text-ink/75 leading-[1.6]">{l.summary}</p>

                <ul className="mt-6 space-y-2.5 text-[14px] text-ink/85">
                  {l.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5">
                      <ChevronRight className="w-3.5 h-3.5 mt-[5px] text-primary shrink-0" strokeWidth={2.5} />
                      {p}
                    </li>
                  ))}
                </ul>

                <Link
                  href={l.href}
                  className="mt-6 inline-flex items-center gap-2 h-11 px-5 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors"
                >
                  {l.cta}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ─── COMPLETION CTA ─────────────────────────────────────────── */}
      <section className="py-20 lg:py-24 bg-background-elev">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="p-10 lg:p-14 rounded-3xl bg-ink text-background-elev overflow-hidden relative">
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(var(--peach-300)_1px,transparent_1px)] [background-size:28px_28px]"
            />
            <div className="relative grid grid-cols-12 gap-8 items-center">
              <div className="col-span-12 lg:col-span-8">
                <Sparkle className="w-7 h-7 text-peach-300 mb-5" />
                <h2 className="font-display text-[28px] lg:text-[40px] leading-[1.15] tracking-[-0.015em]">
                  Finished the path?
                  <br />
                  <span className="italic text-peach-300">Pick the next one.</span>
                </h2>
                <p className="mt-5 text-[14px] text-background-elev/75 leading-[1.6] max-w-xl">
                  Calendar &amp; cadence picks up where this leaves off —
                  how to put your now-trusted voice on a posting rhythm
                  you can keep.
                </p>
              </div>
              <div className="col-span-12 lg:col-span-4 flex flex-col gap-3 lg:items-end">
                <Link
                  href={routes.resources.creatorGuides}
                  className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-peach-300 text-ink text-[14px] font-medium hover:bg-peach-400 transition-colors"
                >
                  See all paths
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href={routes.product.composer}
                  className="pencil-link inline-flex items-center gap-2 text-[13.5px] text-peach-200"
                >
                  Or jump to the Composer
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
