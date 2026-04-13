import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Bell,
  Wifi,
  Camera,
  MessageSquareQuote,
} from "lucide-react";
import { makeMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { ScreenshotPlaceholder } from "../_components/screenshot-placeholder";

export const metadata = makeMetadata({
  title: "Mobile — Aloha in your pocket, still quiet",
  description:
    "Aloha's iOS and Android apps are for catching drafts, approving sends, and reading the inbox on a walk. Same calm interface, now portable.",
  path: routes.product.mobile,
});

function PhoneFrame({
  children,
  tone = "bg-peach-100",
  rotate = "rotate-0",
  z = "z-10",
}: {
  children: React.ReactNode;
  tone?: string;
  rotate?: string;
  z?: string;
}) {
  return (
    <div className={`relative w-[260px] h-[520px] rounded-[40px] bg-ink p-2 shadow-[0_40px_80px_-30px_rgba(23,20,18,0.4)] ${rotate} ${z}`}>
      <div className="absolute top-5 left-1/2 -translate-x-1/2 w-20 h-5 rounded-full bg-ink z-10" />
      <div className={`w-full h-full rounded-[32px] ${tone} overflow-hidden relative`}>
        <svg aria-hidden viewBox="0 0 200 400" className="absolute inset-0 w-full h-full opacity-[0.1] mix-blend-multiply">
          <filter id={`phone-grain-${rotate}-${tone}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#phone-grain-${rotate}-${tone})`} />
        </svg>
        {children}
      </div>
    </div>
  );
}

export default function MobilePage() {
  return (
    <>
      {/* ─── HERO ────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden hero-bg pb-24 lg:pb-32">
        <span aria-hidden className="absolute top-[14%] left-[5%] font-display text-[28px] text-ink/25 rotate-[-8deg] select-none">✳</span>
        <span aria-hidden className="absolute top-[68%] left-[11%] font-display text-[22px] text-primary/55 rotate-[12deg] select-none">+</span>
        <span aria-hidden className="absolute top-[22%] right-[8%] font-display text-[38px] text-ink/15 rotate-[18deg] select-none">※</span>

        <div className="relative max-w-[1320px] mx-auto px-6 lg:px-10 pt-20 lg:pt-28">
          {/* headline centered, phones below */}
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
              <span className="w-6 h-px bg-ink/40" />
              On iOS &amp; Android
              <span className="w-6 h-px bg-ink/40" />
            </div>

            <h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[96px]">
              Aloha in your pocket,
              <br />
              <span className="italic text-primary font-light">still quiet.</span>
            </h1>

            <p className="mt-8 text-[17px] lg:text-[18px] leading-[1.55] text-ink/70 max-w-xl mx-auto">
              Catch a draft on the walk, approve a send from the couch,
              reply from the line at coffee. Same calm interface, now
              portable. No neon badge farming, no ragebait feed.
            </p>

            {/* store badges */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={routes.misc.appStore}
                className="h-14 px-6 inline-flex items-center gap-3 rounded-full bg-ink text-background hover:bg-primary transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                <div className="text-left leading-tight">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-background/60">Download on the</p>
                  <p className="text-[15px] font-medium">App Store</p>
                </div>
              </a>
              <a
                href={routes.misc.googlePlay}
                className="h-14 px-6 inline-flex items-center gap-3 rounded-full bg-background-elev text-ink border border-border-strong hover:bg-muted transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                  <path d="M3.61 1.81C3.24 2.2 3 2.79 3 3.56v16.88c0 .77.24 1.36.61 1.74l.06.06L13.19 13v-.1L3.67 1.75l-.06.06z" />
                  <path d="M17.14 15.56l-3.96-3.96v-.1l3.96-3.96.09.05 4.69 2.66c1.34.76 1.34 2 0 2.76l-4.69 2.66c-.03.01-.09.05-.09.05z" />
                  <path d="M17.23 15.51L13.19 11.5 3.61 21.06c.44.47 1.17.53 1.99.06l11.63-6.61" />
                  <path d="M17.23 7.49L5.6 0.88c-.82-.47-1.55-.41-1.99.06L13.19 10.5l4.04-3.01z" />
                </svg>
                <div className="text-left leading-tight">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-ink/55">Get it on</p>
                  <p className="text-[15px] font-medium">Google Play</p>
                </div>
              </a>
            </div>

            <p className="mt-6 text-[12.5px] text-ink/55">
              Requires iOS 16+ or Android 12+. Free for everyone on any plan.
            </p>
          </div>

          {/* phone diptych */}
          <div className="relative mt-16 lg:mt-24 flex justify-center">
            <div className="relative flex items-end gap-8 lg:gap-12">
              {/* phone 1 — composer */}
              <PhoneFrame tone="bg-background-elev" rotate="-rotate-[4deg]">
                <div className="absolute inset-0 pt-14 px-5 flex flex-col">
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink/55 mb-3">
                    Draft · auto-saved
                  </p>
                  <p className="text-[14px] leading-[1.55] text-ink mb-4">
                    monday note: the thing you're avoiding is usually the thing
                    worth writing about. the avoidance is the signal.
                  </p>
                  <div className="p-3 rounded-xl bg-peach-100 border border-peach-300/40 flex items-center gap-2 mb-4">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-[11px] font-medium text-ink">Voice match 94%</span>
                  </div>
                  <div className="flex gap-2 flex-wrap mb-auto">
                    {["LinkedIn", "X", "Instagram", "Threads"].map((c) => (
                      <span
                        key={c}
                        className="px-2.5 py-1 text-[10.5px] font-medium text-ink bg-muted rounded-full border border-border"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                  <button className="mb-6 py-3 rounded-full bg-ink text-background text-[12px] font-medium flex items-center justify-center gap-1.5">
                    Schedule all
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </PhoneFrame>

              {/* phone 2 — inbox */}
              <PhoneFrame tone="bg-peach-100" rotate="rotate-[3deg]" z="z-20">
                <div className="absolute inset-0 pt-14 px-4 flex flex-col">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <p className="font-display text-[18px] tracking-[-0.01em] text-ink">Inbox</p>
                    <span className="text-[10px] font-mono text-ink/50">3 worth replying</span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { n: "Ada K.", c: "Instagram", t: "just now", color: "bg-peach-200" },
                      { n: "Jun H.", c: "LinkedIn", t: "9m", color: "bg-primary-soft" },
                      { n: "Rosa M.", c: "X", t: "23m", color: "bg-background-elev" },
                    ].map((t) => (
                      <div key={t.n} className="p-3 rounded-xl bg-background-elev border border-border flex items-start gap-2.5">
                        <span className={`w-7 h-7 rounded-full ${t.color} flex items-center justify-center text-[11px] font-display text-ink shrink-0`}>
                          {t.n[0]}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[11.5px] font-medium text-ink">{t.n}</span>
                            <span className="text-[9px] font-mono text-ink/45">· {t.c}</span>
                            <span className="ml-auto text-[9px] font-mono text-ink/45">{t.t}</span>
                          </div>
                          <p className="text-[10.5px] text-ink/70 truncate">
                            This completely reframed how I think about…
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </PhoneFrame>
            </div>

            {/* floating notification */}
            <div className="hidden sm:flex absolute top-8 right-[8%] items-center gap-2.5 bg-ink text-background-elev rounded-2xl pl-3 pr-4 py-2.5 shadow-[0_14px_30px_-10px_rgba(23,20,18,0.5)] rotate-[-5deg] max-w-[260px]">
              <Bell className="w-4 h-4 text-peach-300 shrink-0" />
              <div className="text-[11px] leading-tight">
                <p className="font-medium">A draft from the studio is ready</p>
                <p className="text-background-elev/60 font-mono">Composer · approve to send</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── FEATURES ROW ────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10">
          <div className="max-w-2xl mb-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
              What it's for
            </p>
            <h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
              Quick things,
              <br />
              <span className="italic text-primary">done well.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                i: Bell,
                h: "Approvals on the go",
                p: "A draft needs your eyes before it ships? Approve it from the notification without opening the app.",
                tone: "bg-peach-200",
              },
              {
                i: Camera,
                h: "Capture on the walk",
                p: "Photo, voice memo, or a one-line note. The mobile composer saves it and the desktop composer turns it into posts.",
                tone: "bg-peach-100",
              },
              {
                i: Wifi,
                h: "Offline-first",
                p: "Writing on a plane is still writing. Drafts sync when you're back online, no lost words.",
                tone: "bg-primary-soft",
              },
            ].map((f) => (
              <article key={f.h} className={`p-8 lg:p-9 rounded-3xl ${f.tone}`}>
                <f.i className="w-6 h-6 text-ink" />
                <h3 className="mt-6 font-display text-[24px] leading-[1.2] tracking-[-0.01em]">
                  {f.h}
                </h3>
                <p className="mt-3 text-[14.5px] text-ink/75 leading-[1.55]">{f.p}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PREVIEW ROW ─────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32 bg-background-elev">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-12 gap-10 mb-14 items-end">
            <div className="col-span-12 lg:col-span-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
                Every surface, in your hand
              </p>
              <h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
                Composer. Calendar. Inbox.
                <br />
                <span className="italic text-primary">Analytics. Logic Matrix.</span>
              </h2>
            </div>
            <p className="col-span-12 lg:col-span-4 text-[15.5px] text-ink/70 leading-[1.55]">
              The full Aloha surface on mobile — not a stripped-down
              "quick-post" tab. Everything you do at the desk, you can do
              from the couch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            <ScreenshotPlaceholder
              id="mobile-calendar"
              label="Mobile Calendar — week view, vertically scrollable."
              notes="Needed: iOS screenshot of Calendar tab, week view. Shows 7 day rows with post chips, a floating 'today' pill at top-right, bottom tab bar. Crop to phone aspect (9:19.5)."
              aspect="aspect-[9/16]"
              tone="bg-peach-100"
            />
            <ScreenshotPlaceholder
              id="mobile-analytics"
              label="Mobile Analytics — this-week summary with the insight callout."
              notes="Needed: iOS screenshot of Analytics tab, overview. Big engagement number at top, a 12-bar mini chart below, and the same Friday-9am insight callout. Include tab bar. 9:19.5 crop."
              aspect="aspect-[9/16]"
              tone="bg-primary-soft"
            />
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIAL ──────────────────────────────────────────────── */}
      <section className="py-24 lg:py-28">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-10">
          <figure className="relative bg-peach-200 rounded-3xl p-10 lg:p-14">
            <MessageSquareQuote className="w-8 h-8 text-ink/40 mb-6" />
            <blockquote className="font-display text-[26px] lg:text-[34px] leading-[1.2] tracking-[-0.015em] max-w-3xl">
              "I stopped keeping a laptop open on weekends. That sounds
              small. It isn't."
            </blockquote>
            <figcaption className="mt-8 flex items-center gap-4">
              <span className="w-11 h-11 rounded-full bg-ink text-background-elev font-display flex items-center justify-center">
                N
              </span>
              <div>
                <p className="font-medium">Naledi O.</p>
                <p className="text-[13px] text-ink/60">Founder, Braid Studio · 84K followers</p>
              </div>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ─── FINAL CTA ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-24 lg:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-[44px] sm:text-[56px] lg:text-[80px] leading-[0.98] tracking-[-0.025em]">
              Aloha,
              <br />
              <span className="italic text-primary">wherever you are.</span>
            </h2>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={routes.misc.appStore}
                className="inline-flex items-center gap-2 h-14 px-7 rounded-full bg-ink text-background font-medium text-[15px] hover:bg-primary transition-colors"
              >
                Download for iOS
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href={routes.misc.googlePlay}
                className="pencil-link inline-flex items-center gap-2 text-[14.5px] font-medium text-ink"
              >
                Get it on Google Play
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
