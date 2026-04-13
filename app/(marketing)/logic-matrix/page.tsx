import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Zap,
  GitBranch,
  Shield,
  MessageSquareQuote,
} from "lucide-react";
import { makeMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { ScreenshotPlaceholder } from "../_components/screenshot-placeholder";

export const metadata = makeMetadata({
  title: "Logic Matrix — automation that feels human",
  description:
    "Aloha's Logic Matrix lets you wire triggers, conditions, and actions across channels without code. Cross-posts, replies, and the quiet first-move that used to be manual.",
  path: routes.product.logicMatrix,
});

export default function LogicMatrixPage() {
  return (
    <>
      {/* ─── HERO ────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden hero-bg">
        <span aria-hidden className="absolute top-[14%] left-[6%] font-display text-[28px] text-ink/25 rotate-[-8deg] select-none">✳</span>
        <span aria-hidden className="absolute top-[68%] left-[11%] font-display text-[22px] text-primary/55 rotate-[12deg] select-none">+</span>
        <span aria-hidden className="absolute top-[22%] right-[8%] font-display text-[38px] text-ink/15 rotate-[18deg] select-none">※</span>

        <div className="relative max-w-[1320px] w-full mx-auto px-6 lg:px-10 pt-20 lg:pt-28 pb-24 lg:pb-32 grid grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="col-span-12 lg:col-span-7">
            <div className="inline-flex items-center gap-2 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
              <span className="w-6 h-px bg-ink/40" />
              Logic Matrix
            </div>

            <h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[92px]">
              Automation
              <br />
              that still
              <br />
              <span className="italic text-primary font-light">feels like you.</span>
            </h1>

            <p className="mt-8 max-w-[520px] text-[17px] lg:text-[18px] leading-[1.55] text-ink/70">
              Cross-posts, reply nudges, the quiet "thanks for following"
              that used to be manual. Wire triggers to actions on a visual
              canvas, preview the run before you ship, and keep a human
              approve-step wherever you want one.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <Link
                href={routes.signin}
                className="inline-flex items-center gap-2 h-14 px-7 rounded-full bg-primary text-primary-foreground font-medium text-[15px] shadow-[0_8px_0_-2px_rgba(46,42,133,0.35)] hover:shadow-[0_10px_0_-2px_rgba(46,42,133,0.4)] hover:-translate-y-0.5 transition-all"
              >
                Build a matrix
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#flow" className="pencil-link inline-flex items-center gap-2 text-[15px] font-medium text-ink">
                See a matrix in motion
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-[12.5px] text-ink/60">
              <span className="inline-flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
                No code, no Zap-tax
              </span>
              <span className="inline-flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
                Dry-run preview before live
              </span>
              <span className="inline-flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
                Human approval at any step
              </span>
            </div>
          </div>

          {/* Hero visual — simplified matrix flow card */}
          <div className="col-span-12 lg:col-span-5 relative">
            <div className="absolute -top-3 -right-2 z-20 rotate-[4deg] pointer-events-none">
              <div className="inline-flex items-center gap-2 bg-ink text-peach-200 px-3 py-1.5 rounded-full shadow-[0_6px_16px_-6px_rgba(23,20,18,0.5)]">
                <Zap className="w-3.5 h-3.5" />
                <span className="font-display text-[12px]">3 steps · live</span>
              </div>
            </div>

            <div className="relative animate-[float-soft_9s_ease-in-out_infinite]">
              <div className="rounded-3xl bg-background-elev border border-border-strong shadow-[0_30px_60px_-20px_rgba(23,20,18,0.25)] overflow-hidden">
                <div className="px-5 py-3 flex items-center justify-between border-b border-border bg-muted/40">
                  <div className="flex items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.18em] text-ink/60">
                    <GitBranch className="w-3 h-3" />
                    matrix · new follower welcome
                  </div>
                  <span className="text-[10.5px] text-ink/50 font-mono">live · 84 runs</span>
                </div>

                {/* flow */}
                <div className="p-6 space-y-4 bg-gradient-to-b from-background-elev to-peach-100/30">
                  {/* node 1 — trigger */}
                  <div className="rounded-2xl border border-primary/30 bg-primary-soft px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-primary">
                        Trigger
                      </span>
                      <span className="text-[10px] font-mono text-ink/50">Instagram</span>
                    </div>
                    <p className="text-[13.5px] font-medium text-ink">
                      New follower on <span className="text-primary">@ainslee.design</span>
                    </p>
                  </div>

                  {/* arrow */}
                  <div className="flex justify-center">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 text-ink/30">
                      <path d="M12 4v16m-5-5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                  </div>

                  {/* node 2 — condition */}
                  <div className="rounded-2xl border border-border bg-background px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink/55">
                        Only if
                      </span>
                      <span className="text-[10px] font-mono text-ink/50">engaged within 24h</span>
                    </div>
                    <p className="text-[13.5px] text-ink">
                      Follower <span className="font-medium">liked or commented</span> on a recent post
                    </p>
                  </div>

                  {/* arrow */}
                  <div className="flex justify-center">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 text-ink/30">
                      <path d="M12 4v16m-5-5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                  </div>

                  {/* node 3 — action */}
                  <div className="rounded-2xl border border-peach-300/40 bg-peach-200 px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink/60">
                        Action
                      </span>
                      <span className="text-[10px] font-mono text-ink/50">approve first</span>
                    </div>
                    <p className="text-[13.5px] font-medium text-ink">
                      Send DM draft: "thanks for the follow — which piece
                      pulled you in?"
                    </p>
                  </div>
                </div>

                <div className="px-5 py-3 border-t border-border bg-muted/40 flex items-center justify-between">
                  <span className="text-[11px] text-ink/55">no code · no Zap</span>
                  <button className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-ink text-background text-[11.5px] font-medium">
                    Dry-run
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="hidden sm:flex absolute -bottom-5 -left-6 lg:-left-10 items-center gap-2.5 bg-background-elev text-ink border border-border-strong rounded-full pl-3 pr-4 py-2 shadow-[0_14px_30px_-16px_rgba(23,20,18,0.35)] -rotate-[3deg]">
                <Shield className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11.5px] font-medium">Never auto-sends DMs</span>
                <span className="text-[11px] text-ink/50 font-mono">· safety on</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── FEATURE 1 · VISUAL CANVAS ───────────────────────────────── */}
      <section id="flow" className="py-24 lg:py-32">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-10 lg:gap-16 items-center">
          <div className="col-span-12 lg:col-span-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
              Visual canvas
            </p>
            <h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
              Drag, wire,
              <br />
              <span className="italic text-primary">run.</span>
            </h2>
            <p className="mt-6 text-[16px] lg:text-[17px] text-ink/75 leading-[1.6] max-w-lg">
              A canvas of triggers, conditions, and actions you can see at
              a glance. No code, no brittle Zap-chains, no "oh the free
              plan doesn't include this branch". Branch freely, loop where
              it earns, and hand-off to a human whenever the matrix feels
              unsure.
            </p>

            <ul className="mt-8 space-y-3 text-[14.5px] text-ink/85">
              {[
                "Triggers from every channel — posts, comments, DMs, follows.",
                "Conditions across text content, metrics, sender history.",
                "Actions inside Aloha or out (webhook, email, Slack).",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <Check className="w-4 h-4 mt-[3px] text-primary shrink-0" strokeWidth={2.5} />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-12 lg:col-span-6">
            <ScreenshotPlaceholder
              id="matrix-canvas"
              label="Reactflow canvas with three chained matrices and a paused branch."
              notes="Needed: screenshot of /app/automations canvas view. Include three nodes minimum, one dashed/paused edge, a mini-map in the corner, and at least one 'approve first' chip visible on an action node. 16:10 crop."
              aspect="aspect-[16/10]"
              tone="bg-primary-soft"
            />
          </div>
        </div>
      </section>

      {/* ─── FEATURE 2 · TEMPLATES (bento) ───────────────────────────── */}
      <section className="py-24 lg:py-32 bg-background-elev">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-12 gap-10 mb-14">
            <div className="col-span-12 lg:col-span-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
                Templates
              </p>
              <h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
                Start from a
                <br />
                <span className="italic text-primary">known-good shape.</span>
              </h2>
            </div>
            <p className="col-span-12 lg:col-span-5 lg:col-start-8 text-[16px] text-ink/70 leading-[1.6] self-end">
              We've shipped the matrices creators use every day. Clone one,
              rename the trigger, customise the copy, go. Or remix — all
              templates are open and editable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {[
              {
                h: "First-reply welcome",
                p: "When a new follower engages within 24h, draft a warm first DM. Approve before it sends.",
                tone: "bg-peach-200",
                nodes: "3 nodes",
              },
              {
                h: "Cross-post IG → Threads",
                p: "Mirror a reel caption to Threads 15 minutes later with native formatting.",
                tone: "bg-peach-100",
                nodes: "2 nodes",
              },
              {
                h: "Launch-week nudge",
                p: "On launch day, trigger a 7-post campaign across LinkedIn, X, Instagram. Pause on CFO approve.",
                tone: "bg-primary-soft",
                nodes: "9 nodes",
              },
              {
                h: "Reply triage",
                p: "Route comments mentioning 'price' or 'demo' to the inbox owner. Auto-like the rest.",
                tone: "bg-peach-300",
                nodes: "5 nodes",
              },
              {
                h: "Best-of recycler",
                p: "Every 90 days, resurface posts in the top 5% of engagement, with a soft rewrite.",
                tone: "bg-peach-100",
                nodes: "4 nodes",
              },
              {
                h: "Out-of-office",
                p: "When OOO is toggled, respond with a warm auto-reply and queue a real follow-up for return.",
                tone: "bg-primary-soft",
                nodes: "3 nodes",
              },
            ].map((t) => (
              <article key={t.h} className={`relative rounded-3xl p-6 lg:p-7 ${t.tone} flex flex-col min-h-[200px]`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink/55">
                    Matrix · template
                  </span>
                  <span className="text-[10.5px] font-medium text-ink/60">{t.nodes}</span>
                </div>
                <h3 className="mt-10 font-display text-[22px] leading-[1.2] tracking-[-0.01em]">
                  {t.h}
                </h3>
                <p className="mt-3 text-[13.5px] text-ink/75 leading-[1.5]">{t.p}</p>
                <Link
                  href={routes.resources.templates}
                  className="mt-auto pt-5 self-start pencil-link text-[13px] font-medium text-ink inline-flex items-center gap-1.5"
                >
                  Clone this matrix
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURE 3 · SAFETY ──────────────────────────────────────── */}
      <section className="py-24 lg:py-32">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-10 lg:gap-16 items-center">
          <div className="col-span-12 lg:col-span-6 order-2 lg:order-1">
            <ScreenshotPlaceholder
              id="safety"
              label="Safety panel — rate limits, allowlist, and the human-approve toggle."
              notes="Needed: screenshot of Matrix > Safety. Shows per-hour rate limit slider, recipient allowlist/blocklist, quiet-hours window, 'approve before send' default toggle (on). 4:3 crop."
              aspect="aspect-[4/3]"
              tone="bg-peach-100"
            />
          </div>

          <div className="col-span-12 lg:col-span-6 order-1 lg:order-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
              Safety rails
            </p>
            <h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
              Nothing ships
              <br />
              <span className="italic text-primary">without permission.</span>
            </h2>
            <p className="mt-6 text-[16px] lg:text-[17px] text-ink/75 leading-[1.6] max-w-lg">
              Automation has a reputation for spamming in your name. We
              gave the Matrix the opposite default: every DM, every reply,
              every comment waits for a human thumb unless you explicitly
              unlatch it. Rate limits, quiet hours, and per-recipient
              history all enforce calm.
            </p>

            <ul className="mt-8 space-y-3 text-[14.5px] text-ink/85">
              {[
                "Human-approve default on every outbound action.",
                "Rate-limit per channel, per matrix, per user.",
                "Audit log of every run — trigger, condition, action, outcome.",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <Check className="w-4 h-4 mt-[3px] text-primary shrink-0" strokeWidth={2.5} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIAL ──────────────────────────────────────────────── */}
      <section className="py-24 lg:py-28">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-10">
          <figure className="relative bg-peach-200 rounded-3xl p-10 lg:p-14">
            <MessageSquareQuote className="w-8 h-8 text-ink/40 mb-6" />
            <blockquote className="font-display text-[26px] lg:text-[34px] leading-[1.2] tracking-[-0.015em] max-w-3xl">
              "The automation matrix saved me 11 hours last month.
              I checked."
            </blockquote>
            <figcaption className="mt-8 flex items-center gap-4">
              <span className="w-11 h-11 rounded-full bg-ink text-background-elev font-display flex items-center justify-center">
                L
              </span>
              <div>
                <p className="font-medium">Leah S.</p>
                <p className="text-[13px] text-ink/60">Agency owner · 6 clients</p>
              </div>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ─── FINAL CTA ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-24 lg:py-32">
          <div className="grid grid-cols-12 gap-10 items-end">
            <div className="col-span-12 lg:col-span-8">
              <h2 className="font-display text-[44px] sm:text-[56px] lg:text-[80px] leading-[0.98] tracking-[-0.025em]">
                Wire up the quiet
                <br />
                <span className="italic text-primary">operator.</span>
              </h2>
            </div>
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 lg:items-end">
              <Link
                href={routes.signin}
                className="inline-flex items-center gap-2 h-14 px-7 rounded-full bg-ink text-background font-medium text-[15px] hover:bg-primary transition-colors"
              >
                Start free — no card
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={routes.resources.templates}
                className="pencil-link inline-flex items-center gap-2 text-[14.5px] font-medium text-ink"
              >
                Browse matrix templates
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
