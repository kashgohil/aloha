import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Leaf,
  Shield,
  HandCoins,
  Users,
  Wind,
  MapPin,
} from "lucide-react";
import { makeMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";

export const metadata = makeMetadata({
  title: "Careers — we hire for taste and patience",
  description:
    "Aloha is a small team in Lisbon, Oakland and Jakarta. We hire slowly and well. See open roles, or write us even when none fit.",
  path: routes.company.careers,
});

const VALUES = [
  {
    icon: Wind,
    h: "Calm is the work",
    p: "We build tools that reduce noise — our own process should too. No 3am Slack, no weekend deploys, no heroics narrative. If it feels urgent, it's usually a bug in the planning.",
    tone: "bg-peach-200",
  },
  {
    icon: Shield,
    h: "Defaults are political",
    p: "The choice of what happens if the user does nothing is where we tell the truth about what we care about. We argue about defaults more than features.",
    tone: "bg-primary-soft",
  },
  {
    icon: Leaf,
    h: "Slow enough to listen",
    p: "We'd rather ship two things a quarter that matter than ten that shipped. We read every support reply — every person on the team is on the rotation.",
    tone: "bg-peach-100",
  },
];

const ROLES = [
  {
    title: "Senior backend engineer",
    team: "Platform",
    location: "Lisbon or remote (EU)",
    type: "Full-time",
    href: "mailto:hiring@aloha.social?subject=Senior backend engineer",
  },
  {
    title: "Design engineer",
    team: "Product",
    location: "Lisbon, Oakland, or remote",
    type: "Full-time",
    href: "mailto:hiring@aloha.social?subject=Design engineer",
  },
  {
    title: "Support lead",
    team: "Community",
    location: "Jakarta or remote (APAC)",
    type: "Full-time",
    href: "mailto:hiring@aloha.social?subject=Support lead",
  },
];

const BENEFITS = [
  { h: "Salary bands published internally", p: "Calibrated every 12 months against the Lisbon + SF + Jakarta markets." },
  { h: "Equity from day one", p: "Standard 4-year vest, 1-year cliff. No price-setting gymnastics." },
  { h: "Health cover wherever you are", p: "Premium coverage for you and dependents via SafetyWing or a local equivalent." },
  { h: "Six weeks leave, taken", p: "Four of vacation + one at year-end + one floating. We monitor taken, not accrued." },
  { h: "Thirty days learning budget", p: "Classes, books, events, subscriptions. You pick what counts; the policy is one page." },
  { h: "Quarterly meet-ups", p: "Three-day working sessions in Lisbon, Oakland, or a third city each quarter." },
];

export default function CareersPage() {
  return (
    <>
      {/* ─── HERO ────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden hero-bg pb-16 lg:pb-20">
        <span aria-hidden className="absolute top-[14%] left-[5%] font-display text-[28px] text-ink/25 rotate-[-8deg] select-none">✳</span>
        <span aria-hidden className="absolute top-[68%] right-[8%] font-display text-[22px] text-primary/55 rotate-[14deg] select-none">+</span>

        <div className="relative max-w-[1180px] mx-auto px-6 lg:px-10 pt-20 lg:pt-28">
          <div className="grid grid-cols-12 gap-8 lg:gap-12 items-end">
            <div className="col-span-12 lg:col-span-8">
              <div className="inline-flex items-center gap-2 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
                <span className="w-6 h-px bg-ink/40" />
                Careers
              </div>
              <h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[92px]">
                We hire
                <br />
                <span className="italic text-primary font-light">for taste and patience.</span>
              </h1>
              <p className="mt-8 max-w-2xl text-[17px] lg:text-[18px] leading-[1.6] text-ink/75">
                Six of us today. Two or three more this year. We hire
                slowly, pay honestly, and take the work — and the rest —
                seriously. Here's what working here actually looks like.
              </p>
            </div>
            <div className="col-span-12 lg:col-span-4">
              <div className="p-6 rounded-3xl bg-primary-soft border border-primary/15">
                <div className="text-[10.5px] font-mono uppercase tracking-[0.22em] text-primary mb-3">
                  Currently open
                </div>
                <p className="font-display text-[42px] leading-none tracking-[-0.02em] text-ink">
                  {ROLES.length}
                </p>
                <p className="mt-1 text-[13px] text-ink/65">roles across three teams</p>
                <a
                  href="#open-roles"
                  className="mt-5 inline-flex items-center gap-2 text-[13.5px] pencil-link font-medium text-ink"
                >
                  Jump to the list
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── VALUES ──────────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-12 gap-10 mb-14">
            <div className="col-span-12 lg:col-span-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
                What we hire for
              </p>
              <h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
                Three beliefs
                <br />
                <span className="italic text-primary">we don't flex on.</span>
              </h2>
            </div>
            <p className="col-span-12 lg:col-span-5 text-[15.5px] text-ink/70 leading-[1.55]">
              The <Link href={routes.company.manifesto} className="pencil-link text-ink">manifesto</Link> is
              the longer version; these three are the ones we most often
              lose candidates to. Fair warning, both ways.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            {VALUES.map((v, i) => (
              <article key={v.h} className={`p-8 lg:p-9 rounded-3xl ${v.tone} flex flex-col`}>
                <v.icon className="w-6 h-6 text-ink" />
                <p className="mt-8 font-display italic text-[28px] text-ink/35 leading-none">
                  0{i + 1}
                </p>
                <h3 className="mt-5 font-display text-[26px] leading-[1.15] tracking-[-0.01em]">
                  {v.h}
                </h3>
                <p className="mt-4 text-[14.5px] text-ink/80 leading-[1.6]">{v.p}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW WE WORK ────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32 bg-background-elev">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-10 lg:gap-16 items-start">
          <div className="col-span-12 lg:col-span-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
              How we actually work
            </p>
            <h2 className="font-display text-[36px] lg:text-[48px] leading-[1.02] tracking-[-0.02em]">
              Distributed, but
              <br />
              <span className="italic text-primary">not asynchronous for its own sake.</span>
            </h2>
          </div>

          <div className="col-span-12 lg:col-span-7 space-y-6 text-[15.5px] leading-[1.7] text-ink/80">
            <p>
              Three cities, three timezones. We intentionally chose a
              pattern that lets the day pass between Jakarta, Lisbon, and
              Oakland — someone on the team is online during most working
              hours, but nobody is online during <em>all</em> of them.
              The hand-off is the feature.
            </p>
            <p>
              We try to keep one meeting-day per week and let the other
              four be make-days. We write more than we talk — if it's
              not in a doc, we probably haven't decided it. We ship from
              main, review carefully, and roll forward when things break.
            </p>
            <p>
              Most hires work mostly-remote, with quarterly in-person
              meet-ups — three days, one city, shared hotel, room to
              make things together. Two roles are Lisbon-anchored (HR
              and finance); the rest can be anywhere covered by our
              employment infrastructure.
            </p>
          </div>
        </div>
      </section>

      {/* ─── OPEN ROLES ─────────────────────────────────────────────── */}
      <section id="open-roles" className="py-24 lg:py-32">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="mb-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
              Open roles
            </p>
            <h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
              Three seats
              <span className="italic text-primary"> we're serious about.</span>
            </h2>
          </div>

          <div className="rounded-3xl border border-border overflow-hidden bg-background">
            <div className="hidden md:grid md:grid-cols-12 px-6 py-4 border-b border-border bg-muted/40 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/55">
              <div className="md:col-span-5">Role</div>
              <div className="md:col-span-2">Team</div>
              <div className="md:col-span-3">Location</div>
              <div className="md:col-span-2">Type</div>
            </div>
            {ROLES.map((r, i) => (
              <a
                key={r.title}
                href={r.href}
                className={`group block md:grid md:grid-cols-12 px-6 py-6 md:py-5 gap-4 items-center border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors ${
                  i % 2 === 1 ? "bg-muted/10" : ""
                }`}
              >
                <div className="md:col-span-5">
                  <p className="font-display text-[20px] leading-[1.15] tracking-[-0.005em] group-hover:text-primary transition-colors">
                    {r.title}
                  </p>
                </div>
                <div className="mt-2 md:mt-0 md:col-span-2">
                  <p className="text-[13px] text-ink/65 font-mono uppercase tracking-[0.12em]">
                    {r.team}
                  </p>
                </div>
                <div className="mt-2 md:mt-0 md:col-span-3">
                  <p className="text-[13.5px] text-ink/70 inline-flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" />
                    {r.location}
                  </p>
                </div>
                <div className="mt-2 md:mt-0 md:col-span-2 flex md:justify-end items-center gap-2">
                  <span className="text-[12px] font-mono uppercase tracking-[0.14em] text-ink/55">
                    {r.type}
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-ink/40 group-hover:text-primary transition-colors" />
                </div>
              </a>
            ))}
          </div>

          {/* no role fits */}
          <div className="mt-10 p-8 lg:p-10 rounded-3xl bg-peach-100 border border-peach-300/40 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-2">
                No role fits?
              </p>
              <p className="font-display text-[22px] lg:text-[26px] leading-[1.2] tracking-[-0.005em] max-w-xl">
                Write us anyway. We've made hires from cold emails twice.
                Tell us what you're good at and where you'd go if we
                didn't have a listing for you.
              </p>
            </div>
            <a
              href="mailto:hiring@aloha.social"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors self-start shrink-0"
            >
              hiring@aloha.social
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ─── BENEFITS ───────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32 bg-background-elev">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="mb-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
              What comes with the job
            </p>
            <h2 className="font-display text-[36px] lg:text-[48px] leading-[1.02] tracking-[-0.02em]">
              Standard, stated.
              <br />
              <span className="italic text-primary">Nothing buried.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {BENEFITS.map((b, i) => (
              <article
                key={b.h}
                className={`p-7 rounded-3xl ${i % 2 === 0 ? "bg-background" : "bg-peach-100"} border border-border`}
              >
                <p className="font-display text-[20px] leading-[1.2] tracking-[-0.005em] text-ink">
                  {b.h}
                </p>
                <p className="mt-3 text-[13.5px] text-ink/70 leading-[1.55]">{b.p}</p>
              </article>
            ))}
          </div>

          <p className="mt-10 text-[13px] text-ink/60 max-w-2xl">
            Salary bands, equity formula, and the full benefits doc are
            in the candidate packet we send after a first conversation.
            We don't hide numbers behind offer letters.
          </p>
        </div>
      </section>

      {/* ─── PROCESS ─────────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-12 gap-10 items-start">
            <div className="col-span-12 lg:col-span-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
                Hiring process
              </p>
              <h2 className="font-display text-[36px] lg:text-[48px] leading-[1.02] tracking-[-0.02em]">
                Four steps.
                <br />
                <span className="italic text-primary">Two weeks, typically.</span>
              </h2>
              <p className="mt-6 text-[15.5px] text-ink/70 leading-[1.6] max-w-lg">
                We pay for every step from the paid project onward. If a
                step falls through our fault, we'll tell you within 48
                hours with a reason.
              </p>
            </div>
            <div className="col-span-12 lg:col-span-7">
              <ol className="relative border-l-2 border-border-strong/60 pl-8 space-y-8">
                {[
                  { t: "30-min intro", p: "With someone from the team. Mostly us listening. No take-home at this stage." },
                  { t: "Paid project", p: "$800, four hours of your time, realistic scope. We evaluate it blindly against a rubric." },
                  { t: "Working session", p: "90 minutes with two team members — we solve something together, not a pop quiz." },
                  { t: "References + offer", p: "Two references you choose, paid decision, full comp transparency." },
                ].map((s, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[38px] top-1 w-6 h-6 rounded-full bg-ink text-background-elev font-display text-[11px] flex items-center justify-center">
                      {i + 1}
                    </span>
                    <p className="font-display text-[19px] leading-[1.2] text-ink">{s.t}</p>
                    <p className="mt-1 text-[14px] text-ink/70 leading-[1.55]">{s.p}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
          <div className="grid grid-cols-12 gap-10 items-end">
            <div className="col-span-12 lg:col-span-8">
              <h2 className="font-display text-[40px] sm:text-[52px] lg:text-[72px] leading-[0.98] tracking-[-0.025em]">
                Taste and patience.
                <br />
                <span className="italic text-primary">In that order.</span>
              </h2>
            </div>
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 lg:items-end">
              <a
                href="#open-roles"
                className="inline-flex items-center gap-2 h-14 px-7 rounded-full bg-ink text-background font-medium text-[15px] hover:bg-primary transition-colors"
              >
                See open roles
                <ArrowRight className="w-4 h-4" />
              </a>
              <Link
                href={routes.company.manifesto}
                className="pencil-link inline-flex items-center gap-2 text-[14.5px] font-medium text-ink"
              >
                <Users className="w-4 h-4" />
                Read what we actually believe
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
