import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Sparkle,
  Mail,
  Hash,
  Clock,
  FileText,
  Eraser,
} from "lucide-react";
import { makeMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { TOOLS } from "@/lib/tools";

export const metadata = makeMetadata({
  title: "Free tools — five micro-utilities, no sign-up",
  description:
    "Aloha's free tools. Five tiny utilities you can use without an account: bio generator, best-time finder, hashtag decoder, post critic, caption scrubber.",
  path: "/tools",
});

const ICON_FOR: Record<string, typeof Sparkle> = {
  "bio-generator": Mail,
  "best-time-finder": Clock,
  "hashtag-decoder": Hash,
  "post-critic": FileText,
  "caption-scrubber": Eraser,
};

export default function ToolsIndexPage() {
  return (
    <>
      {/* ─── HERO ────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden hero-bg pb-16 lg:pb-20">
        <span aria-hidden className="absolute top-[14%] left-[5%] font-display text-[28px] text-ink/25 rotate-[-8deg] select-none">✳</span>
        <span aria-hidden className="absolute top-[68%] right-[10%] font-display text-[22px] text-primary/55 rotate-[14deg] select-none">+</span>

        <div className="relative max-w-[1180px] mx-auto px-6 lg:px-10 pt-20 lg:pt-28">
          <div className="grid grid-cols-12 gap-8 lg:gap-12 items-end">
            <div className="col-span-12 lg:col-span-8">
              <div className="inline-flex items-center gap-3 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
                <span className="w-6 h-px bg-ink/40" />
                Free tools
                <span className="px-2 py-0.5 bg-background-elev border border-border rounded-full text-ink/65 text-[10px] font-mono normal-case tracking-normal inline-flex items-center gap-1.5">
                  <Sparkle className="w-3 h-3 text-primary" />
                  No sign-up
                </span>
              </div>
              <h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[96px]">
                Five tiny tools.
                <br />
                <span className="italic text-primary font-light">All free, all local.</span>
              </h1>
              <p className="mt-8 max-w-2xl text-[17px] lg:text-[18px] leading-[1.6] text-ink/75">
                Each one runs in your browser. Nothing is uploaded. We
                don't gate them behind an email; we just want them to be
                useful enough that you'll come back to the product when
                the small jobs become a workflow.
              </p>
            </div>
            <div className="col-span-12 lg:col-span-4">
              <div className="p-6 rounded-3xl bg-background-elev border border-border">
                <p className="text-[10.5px] font-mono uppercase tracking-[0.22em] text-ink/55 mb-3">
                  Why we make these
                </p>
                <p className="font-display text-[20px] leading-[1.2] tracking-[-0.005em]">
                  We use them
                  <br />
                  <span className="italic text-primary">ourselves.</span>
                </p>
                <p className="mt-4 text-[12.5px] text-ink/65 leading-[1.55]">
                  Internal scripts that we cleaned up enough to give
                  away. The product runs grown-up versions of all five.
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── TOOLS GRID ─────────────────────────────────────────────── */}
      <section className="py-20 lg:py-24">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {TOOLS.map((t, i) => {
              const Icon = ICON_FOR[t.slug] ?? Sparkle;
              const isFeature = i === 0;
              return (
                <Link
                  key={t.slug}
                  href={t.href}
                  className={`group ${t.accent} rounded-3xl p-7 lg:p-8 flex flex-col hover:-translate-y-1 transition-transform min-h-[240px] ${
                    isFeature ? "md:col-span-2 lg:col-span-2" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <Icon className="w-6 h-6 text-ink" />
                    <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink/55">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className={`mt-8 font-display ${isFeature ? "text-[36px] lg:text-[48px]" : "text-[24px]"} leading-[1.1] tracking-[-0.015em]`}>
                    {t.name}
                  </h3>
                  <p className={`mt-3 ${isFeature ? "text-[16px]" : "text-[14px]"} text-ink/75 leading-[1.6]`}>
                    {t.tagline}
                  </p>
                  <span className="mt-auto pt-6 inline-flex items-center gap-2 text-[13px] font-medium text-ink pencil-link">
                    Open the tool
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── HOW THESE WORK ─────────────────────────────────────────── */}
      <section className="py-20 lg:py-24 bg-background-elev">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-10 lg:gap-16 items-start">
          <div className="col-span-12 lg:col-span-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
              The rules we set ourselves
            </p>
            <h2 className="font-display text-[36px] lg:text-[48px] leading-[1.02] tracking-[-0.02em]">
              Free, local,
              <br />
              <span className="italic text-primary">honest about limits.</span>
            </h2>
          </div>
          <ol className="col-span-12 lg:col-span-7 space-y-5 text-[15.5px] leading-[1.7] text-ink/85">
            {[
              "No sign-up wall. Ever. If we ever change this, we'll deprecate the free tool first.",
              "Everything runs client-side. Nothing is uploaded; no analytics ping per use.",
              "When data isn't real (hashtag volumes, tag vibes), we say so plainly.",
              "Every tool cross-links the paid Aloha feature that does the same job better — but the cross-sell is below the result, never above it.",
            ].map((r, i) => (
              <li key={i} className="pl-5 border-l-2 border-border-strong/60 relative">
                <span className="absolute -left-[7px] top-2 w-3 h-3 rounded-full bg-ink" />
                {r}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─── FINAL CTA ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
          <div className="grid grid-cols-12 gap-10 items-end">
            <div className="col-span-12 lg:col-span-8">
              <h2 className="font-display text-[40px] sm:text-[52px] lg:text-[72px] leading-[0.98] tracking-[-0.025em]">
                When the small jobs
                <br />
                <span className="italic text-primary">become a workflow.</span>
              </h2>
              <p className="mt-6 text-[15.5px] text-ink/70 max-w-lg leading-[1.55]">
                The free tools are good. The product is what happens when
                you do these tasks every week. Free plan covers most of
                what a solo creator needs.
              </p>
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
                href="/"
                className="pencil-link inline-flex items-center gap-2 text-[14.5px] font-medium text-ink"
              >
                See the product
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
