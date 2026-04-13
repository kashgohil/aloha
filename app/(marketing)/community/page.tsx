import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  MessageSquare,
  Mail,
  Mic,
  CalendarDays,
  Users,
  Sparkle,
  Star,
} from "lucide-react";
import { makeMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";

export const metadata = makeMetadata({
  title: "Community — where Aloha customers, readers and listeners meet",
  description:
    "One hub for the community: Slack, newsletter, podcast, events. Four rooms, one tone: honest, kind, slow to pile on.",
  path: routes.customers.community,
});

const ROOMS = [
  {
    icon: MessageSquare,
    h: "Slack",
    meta: "4,128 members · invite on request",
    p: "The daily room. #whats-working, #voice-lab, #product-feedback. Moderated by three named humans; nobody sells anything here.",
    cta: "Request an invite",
    href: routes.connect.slack,
    tone: "bg-peach-200",
  },
  {
    icon: Mail,
    h: "Newsletter",
    meta: "Weekly · Friday 9am Lisbon",
    p: "An essay, what shipped, a handful of good links. 28K readers, most of them quiet. One unsubscribe link, one click.",
    cta: "Subscribe",
    href: routes.connect.newsletter,
    tone: "bg-peach-100",
  },
  {
    icon: Mic,
    h: "Podcast",
    meta: "Biweekly · 12 episodes",
    p: "Long-form conversations with creators, editors and operators. Thirty minutes, no ads, transcripts on every episode.",
    cta: "Listen",
    href: routes.connect.podcast,
    tone: "bg-primary-soft",
  },
  {
    icon: CalendarDays,
    h: "Events",
    meta: "AMAs, field-note readings, meet-ups",
    p: "Virtual every month, in-person quarterly. Members of any of the other rooms get first invites.",
    cta: "Browse events",
    href: routes.customers.events,
    tone: "bg-peach-300",
  },
];

const VALUES = [
  {
    h: "Kind and specific",
    p: "Crit the post, not the poster. We warn drive-by dunks once and remove on the second.",
  },
  {
    h: "Never performative",
    p: "Take-homes are better than takes. Share what actually worked, including what didn't.",
  },
  {
    h: "Low-pitch, all rooms",
    p: "No recruiting threads, no affiliate funnels, no course launches in DMs. Members signed up for the conversation, not the sell.",
  },
  {
    h: "Real humans moderate",
    p: "Three people named on the rules page. If you're unsure, message them — they respond quickly.",
  },
];

const STORIES = [
  {
    q: "Best product-feedback loop I've ever been in. Posted a bug Tuesday, fixed Friday.",
    who: "Deniz · #product-feedback",
    tone: "bg-peach-100",
  },
  {
    q: "Nobody's selling anything. I didn't realise how rare that is.",
    who: "Naledi · #off-topic",
    tone: "bg-primary-soft",
  },
  {
    q: "Got better at hooks because of the voice-lab crit. Stole a rhythm last week and it worked.",
    who: "Priya · #voice-lab",
    tone: "bg-peach-200",
  },
  {
    q: "Met my co-founder at an Aloha meet-up in Lisbon. Genuinely.",
    who: "Jonas · #meetups",
    tone: "bg-peach-300",
  },
];

export default function CommunityHubPage() {
  return (
    <>
      {/* ─── HERO ────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden hero-bg pb-16 lg:pb-20">
        <span aria-hidden className="absolute top-[14%] left-[5%] font-display text-[28px] text-ink/25 rotate-[-8deg] select-none">✳</span>
        <span aria-hidden className="absolute top-[68%] right-[10%] font-display text-[22px] text-primary/55 rotate-[14deg] select-none">+</span>
        <span aria-hidden className="absolute top-[28%] right-[6%] font-display text-[38px] text-ink/15 rotate-[18deg] select-none">※</span>

        <div className="relative max-w-[1180px] mx-auto px-6 lg:px-10 pt-20 lg:pt-28">
          <div className="grid grid-cols-12 gap-8 lg:gap-12 items-end">
            <div className="col-span-12 lg:col-span-8">
              <div className="inline-flex items-center gap-2 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
                <span className="w-6 h-px bg-ink/40" />
                Community
              </div>
              <h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[96px]">
                Four rooms.
                <br />
                <span className="italic text-primary font-light">One tone.</span>
              </h1>
              <p className="mt-8 max-w-2xl text-[17px] lg:text-[18px] leading-[1.6] text-ink/75">
                A community doesn't happen because a company says so. It
                happens when the rooms are kept quiet, the defaults are
                honest, and nobody sells anything. Ours is four rooms —
                pick the one that matches your attention.
              </p>
            </div>
            <div className="col-span-12 lg:col-span-4">
              <div className="p-6 rounded-3xl bg-background-elev border border-border">
                <div className="flex items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.22em] text-ink/55 mb-3">
                  <Users className="w-3 h-3" />
                  The big numbers
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { v: "4.1K", l: "Slack members" },
                    { v: "28K", l: "Newsletter subs" },
                    { v: "12", l: "Podcast episodes" },
                    { v: "6/yr", l: "Meet-ups" },
                  ].map((x) => (
                    <div key={x.l}>
                      <p className="font-display text-[26px] leading-none tracking-[-0.015em]">
                        {x.v}
                      </p>
                      <p className="mt-1 text-[10.5px] uppercase tracking-[0.16em] text-ink/55">
                        {x.l}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── FOUR ROOMS ─────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="mb-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
              The four rooms
            </p>
            <h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
              Pick the shape
              <br />
              <span className="italic text-primary">of your attention.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
            {ROOMS.map((r) => (
              <Link
                key={r.h}
                href={r.href}
                className={`group ${r.tone} rounded-3xl p-8 lg:p-10 flex flex-col hover:-translate-y-1 transition-transform min-h-[280px]`}
              >
                <div className="flex items-start justify-between">
                  <r.icon className="w-6 h-6 text-ink" />
                  <span className="text-[10.5px] font-mono uppercase tracking-[0.18em] text-ink/55 text-right max-w-[40%]">
                    {r.meta}
                  </span>
                </div>
                <h3 className="mt-8 font-display text-[30px] leading-[1.1] tracking-[-0.015em]">
                  {r.h}
                </h3>
                <p className="mt-3 text-[14.5px] text-ink/75 leading-[1.6] max-w-md">{r.p}</p>
                <span className="mt-auto pt-6 pencil-link text-[13px] font-medium text-ink inline-flex items-center gap-2">
                  {r.cta}
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VALUES ─────────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32 bg-background-elev">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-12 gap-10 mb-14 items-end">
            <div className="col-span-12 lg:col-span-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
                How we keep it calm
              </p>
              <h2 className="font-display text-[36px] lg:text-[48px] leading-[1.02] tracking-[-0.02em]">
                Four values.
                <br />
                <span className="italic text-primary">Moderated by humans.</span>
              </h2>
            </div>
            <p className="col-span-12 lg:col-span-5 text-[15.5px] text-ink/70 leading-[1.55]">
              The <Link href={routes.connect.slack + "#rules"} className="pencil-link text-ink">Slack rules page</Link> has the enforcement
              details. These are the underlying values that shape them.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
            {VALUES.map((v, i) => (
              <article
                key={v.h}
                className={`p-8 rounded-3xl ${i % 2 === 0 ? "bg-background" : "bg-peach-100"} border border-border`}
              >
                <p className="font-display italic text-[28px] text-ink/30 leading-none">
                  0{i + 1}
                </p>
                <h3 className="mt-5 font-display text-[22px] leading-[1.15] tracking-[-0.005em]">
                  {v.h}
                </h3>
                <p className="mt-3 text-[14px] text-ink/75 leading-[1.6]">{v.p}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MEMBER STORIES ─────────────────────────────────────────── */}
      <section className="py-20 lg:py-24">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="mb-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
              Members, in their words
            </p>
            <h2 className="font-display text-[36px] lg:text-[48px] leading-[1.02] tracking-[-0.02em]">
              Flavour of the rooms.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {STORIES.map((s, i) => (
              <figure key={i} className={`p-6 rounded-3xl ${s.tone} flex flex-col min-h-[200px]`}>
                <Star className="w-3.5 h-3.5 text-primary mb-4" />
                <blockquote className="font-display italic text-[17px] lg:text-[18px] leading-[1.3] tracking-[-0.005em] text-ink flex-1">
                  "{s.q}"
                </blockquote>
                <figcaption className="mt-5 pt-4 border-t border-ink/8 text-[11.5px] text-ink/60 font-mono">
                  {s.who}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ─── READ LONGER STORIES ─────────────────────────────────────── */}
      <section className="py-20 lg:py-24 bg-background-elev">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-12 gap-10 items-end mb-10">
            <div className="col-span-12 lg:col-span-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
                Longer stories
              </p>
              <h2 className="font-display text-[32px] lg:text-[44px] leading-[1.02] tracking-[-0.02em]">
                When the Slack thread
                <br />
                <span className="italic text-primary">wants to become a case study.</span>
              </h2>
            </div>
            <p className="col-span-12 lg:col-span-4 text-[15.5px] text-ink/70 leading-[1.55]">
              When a member's workflow is good enough to write up
              properly, we offer. They always say no-pressure-yes or
              not-right-now. Either is fine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
            {[
              {
                h: "Customer case studies",
                p: "Editorial long-form — problem, approach, result. Three published, more in progress.",
                href: routes.customers.caseStudies,
                cta: "Read case studies",
              },
              {
                h: "Creator spotlights",
                p: "Three-question Q&As with creators whose voice moves us. Lighter than a case study.",
                href: routes.customers.creatorSpotlight,
                cta: "Read spotlights",
              },
            ].map((x) => (
              <Link
                key={x.href}
                href={x.href}
                className="group p-8 rounded-3xl bg-background border border-border flex flex-col hover:bg-muted/30 transition-colors min-h-[200px]"
              >
                <h3 className="font-display text-[24px] leading-[1.15] tracking-[-0.005em]">
                  {x.h}
                </h3>
                <p className="mt-3 text-[14px] text-ink/75 leading-[1.55]">{x.p}</p>
                <span className="mt-auto pt-5 pencil-link text-[13px] font-medium text-ink inline-flex items-center gap-2">
                  {x.cta}
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
          <div className="p-10 lg:p-14 rounded-3xl bg-ink text-background-elev">
            <div className="grid grid-cols-12 gap-8 items-end">
              <div className="col-span-12 lg:col-span-8">
                <Sparkle className="w-7 h-7 text-peach-300 mb-5" />
                <p className="font-display text-[32px] lg:text-[42px] leading-[1.1] tracking-[-0.015em] max-w-2xl">
                  Four rooms, open doors.
                  <br />
                  <span className="italic text-peach-300">Come through whichever one suits you.</span>
                </p>
              </div>
              <div className="col-span-12 lg:col-span-4 flex flex-col gap-3 lg:items-end">
                <Link
                  href={routes.connect.slack}
                  className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-peach-300 text-ink text-[14px] font-medium hover:bg-peach-400 transition-colors"
                >
                  Start with Slack
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href={routes.connect.newsletter}
                  className="pencil-link inline-flex items-center gap-2 text-[13.5px] text-peach-200"
                >
                  Or just the newsletter
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
