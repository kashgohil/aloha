import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Download,
  Upload,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { makeMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { COMPETITORS } from "@/lib/competitors";
import { ScreenshotPlaceholder } from "../_components/screenshot-placeholder";

export const metadata = makeMetadata({
  title: "Migration guide — switch in an afternoon",
  description:
    "How to move to Aloha from any other social tool. Scheduled posts, history, assets, and teammates — nothing gets left behind.",
  path: routes.compare.migrationGuide,
});

export default function MigrationGuidePage() {
  const competitors = Object.values(COMPETITORS);

  return (
    <>
      {/* ─── HERO ────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden bg-peach-200 pb-20">
        <span aria-hidden className="absolute top-[14%] left-[5%] font-display text-[28px] text-ink/25 rotate-[-8deg] select-none">✳</span>
        <span aria-hidden className="absolute top-[68%] right-[8%] font-display text-[22px] text-primary/55 rotate-[14deg] select-none">+</span>

        <div className="relative max-w-[1100px] mx-auto px-6 lg:px-10 pt-20 lg:pt-28">
          <div className="inline-flex items-center gap-2 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
            <span className="w-6 h-px bg-ink/40" />
            Migration guide
          </div>

          <h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[96px] max-w-4xl">
            Switch in
            <br />
            <span className="italic text-primary font-light">an afternoon.</span>
          </h1>

          <p className="mt-8 max-w-2xl text-[17px] lg:text-[18px] leading-[1.6] text-ink/75">
            We've helped creators move from every major scheduling tool.
            Your scheduled posts, your history, your team, your voice —
            nothing is held hostage. Here's exactly how it works.
          </p>

          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl">
            {[
              { v: "~45m", l: "avg migration time" },
              { v: "6", l: "importers built" },
              { v: "0", l: "posts lost to date" },
              { v: "24mo", l: "of history preserved" },
            ].map((s) => (
              <div key={s.l} className="p-4 rounded-2xl bg-background-elev border border-border">
                <p className="font-display text-[28px] leading-none tracking-[-0.015em]">{s.v}</p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-ink/55">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ─── 3-STEP OVERVIEW ─────────────────────────────────────────── */}
      <section className="py-20 lg:py-24">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 mb-14 items-end">
            <div className="col-span-12 lg:col-span-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
                How it works
              </p>
              <h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
                Three steps.
                <br />
                <span className="italic text-primary">No meetings.</span>
              </h2>
            </div>
            <p className="col-span-12 lg:col-span-5 text-[15.5px] text-ink/70 leading-[1.6]">
              Export, import, verify. Coffee doesn't even go cold.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            {[
              {
                icon: Download,
                num: "01",
                h: "Export",
                p: "Pull your scheduled content, history and brand assets out of your current tool. We document the exact export path for every platform in the tables below.",
                tone: "bg-peach-100",
              },
              {
                icon: Upload,
                num: "02",
                h: "Import",
                p: "Drop the export into Aloha's Settings → Import. We map channels, preserve scheduled dates, and flag anything that needs human eyes.",
                tone: "bg-peach-200",
              },
              {
                icon: ShieldCheck,
                num: "03",
                h: "Verify",
                p: "Side-by-side view: your old schedule vs. the new Aloha queue. Reconnect each social account, confirm, you're live.",
                tone: "bg-primary-soft",
              },
            ].map((s) => (
              <article key={s.h} className={`p-8 rounded-3xl ${s.tone} flex flex-col min-h-[280px]`}>
                <div className="flex items-center justify-between">
                  <s.icon className="w-6 h-6 text-ink" />
                  <span className="font-display italic text-[28px] text-ink/40 leading-none">
                    {s.num}
                  </span>
                </div>
                <h3 className="mt-8 font-display text-[26px] leading-[1.15] tracking-[-0.01em]">
                  {s.h}
                </h3>
                <p className="mt-3 text-[14px] text-ink/75 leading-[1.55]">{s.p}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VISUAL — IMPORT PANEL ──────────────────────────────────── */}
      <section className="py-20 lg:py-24 bg-background-elev">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 items-center">
          <div className="col-span-12 lg:col-span-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
              What the import looks like
            </p>
            <h2 className="font-display text-[32px] lg:text-[44px] leading-[1.05] tracking-[-0.015em]">
              A side-by-side,
              <br />
              <span className="italic text-primary">not a black box.</span>
            </h2>
            <p className="mt-6 text-[15.5px] text-ink/75 leading-[1.6] max-w-lg">
              The importer shows every post it's about to create, next to
              the source row from your export. You approve in bulk, or
              tweak individually. Nothing lands without your thumb.
            </p>

            <ul className="mt-8 space-y-3 text-[14.5px] text-ink/85">
              {[
                "Every post previewed before import.",
                "Schedule conflicts flagged — two LinkedIns in an hour, a post scheduled in the past.",
                "Recurring templates and queues preserved where source tool supports them.",
                "Media library re-uploaded automatically to Aloha's storage.",
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
              id="import-panel"
              label="Import preview — Buffer rows on the left, Aloha draft previews on the right."
              notes="Coming soon. Bulk importer UI isn't shipped yet; single-post import lives inside the composer. Placeholder stays illustrative until the migration tool lands."
              aspect="aspect-[16/10]"
              tone="bg-peach-100"
              comingSoon
            />
          </div>
        </div>
      </section>

      {/* ─── PER-TOOL TABLE ──────────────────────────────────────────── */}
      <section className="py-20 lg:py-24">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-10">
          <div className="mb-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
              Per-tool instructions
            </p>
            <h2 className="font-display text-[32px] lg:text-[44px] leading-[1.05] tracking-[-0.015em]">
              Pick your tool.
              <br />
              <span className="italic text-primary">We'll take it from there.</span>
            </h2>
          </div>

          <div className="rounded-3xl border border-border overflow-hidden bg-background">
            {competitors.map((c, i) => (
              <details
                key={c.slug}
                className={`group border-b border-border last:border-b-0 ${
                  i % 2 === 1 ? "bg-muted/10" : ""
                }`}
              >
                <summary className="px-6 lg:px-8 py-5 flex items-center justify-between gap-6 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <div className="flex items-center gap-4 min-w-0">
                    <span className={`w-10 h-10 rounded-full ${c.accent} flex items-center justify-center font-display text-ink text-[14px] shrink-0`}>
                      {c.name[0]}
                    </span>
                    <div className="min-w-0">
                      <p className="font-display text-[19px] tracking-[-0.005em] text-ink">
                        From {c.name}
                      </p>
                      <p className="text-[12.5px] text-ink/55 font-mono truncate">
                        {c.migration.steps.length} steps
                        {c.migration.caveat && " · worth-knowing note"}
                        {" · "}
                        verified {c.verifiedLabel}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <Link
                      href={`/compare/${c.slug}`}
                      className="hidden sm:inline-flex pencil-link text-[12.5px] text-ink/70"
                    >
                      Read the full vs page
                    </Link>
                    <span className="w-7 h-7 rounded-full border border-border-strong text-ink flex items-center justify-center transition-transform group-open:rotate-45">
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                  </div>
                </summary>

                <div className="px-6 lg:px-8 pb-7 pt-2 grid grid-cols-12 gap-x-0 gap-y-6 lg:gap-6">
                  <ol className="col-span-12 lg:col-span-8 space-y-4 relative border-l-2 border-border-strong/60 pl-6">
                    {c.migration.steps.map((s, k) => (
                      <li key={k} className="relative">
                        <span className="absolute -left-[31px] top-0.5 w-5 h-5 rounded-full bg-ink text-background-elev font-display text-[10px] flex items-center justify-center">
                          {k + 1}
                        </span>
                        <p className="text-[14px] text-ink/85 leading-[1.55]">{s}</p>
                      </li>
                    ))}
                  </ol>
                  {c.migration.caveat && (
                    <div className="col-span-12 lg:col-span-4 p-4 rounded-2xl bg-peach-100 border border-peach-300/40">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-2">
                        Worth knowing
                      </p>
                      <p className="text-[13px] text-ink/75 leading-[1.55]">
                        {c.migration.caveat}
                      </p>
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── GUARANTEES ──────────────────────────────────────────────── */}
      <section className="py-20 lg:py-24 bg-background-elev">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-10">
          <div className="mb-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
              Things we promise
            </p>
            <h2 className="font-display text-[32px] lg:text-[44px] leading-[1.05] tracking-[-0.015em]">
              Not marketing.
              <br />
              <span className="italic text-primary">Actual commitments.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                h: "White-glove migration on every paid plan",
                p: "A real person walks your first import with you. If anything breaks, we fix it and ship the fix to everyone. Free if you pay for anything.",
              },
              {
                h: "No lock-in, ever",
                p: "Every field is exportable — CSV, JSON, or our full backup zip. Leave whenever; take everything. We hate lock-in.",
              },
              {
                h: "90-day grace period",
                p: "If you migrate and it's not working, we refund the plan and help you back to your old tool. First three months, no questions.",
              },
              {
                h: "History is preserved",
                p: "Your last 24 months of analytics come with you. We pre-import published posts so the trendline doesn't start at zero.",
              },
            ].map((g) => (
              <div key={g.h} className="p-8 rounded-3xl bg-background border border-border">
                <h3 className="font-display text-[22px] leading-[1.2] tracking-[-0.01em]">{g.h}</h3>
                <p className="mt-3 text-[14px] text-ink/75 leading-[1.55]">{g.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-24 lg:py-32">
          <div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 items-end">
            <div className="col-span-12 lg:col-span-8">
              <h2 className="font-display text-[40px] sm:text-[52px] lg:text-[72px] leading-[0.98] tracking-[-0.025em]">
                Your content comes
                <br />
                <span className="italic text-primary">with you.</span>
              </h2>
              <p className="mt-6 text-[15.5px] text-ink/70 max-w-lg leading-[1.55]">
                Set up an import in ten minutes. Our team picks it up from
                there — usually within the hour.
              </p>
            </div>
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 lg:items-end">
              <Link
                href={routes.signin}
                className="inline-flex items-center gap-2 h-14 px-7 rounded-full bg-ink text-background font-medium text-[15px] hover:bg-primary transition-colors"
              >
                Start the migration
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={routes.company.contact}
                className="pencil-link inline-flex items-center gap-2 text-[14.5px] font-medium text-ink"
              >
                <Clock className="w-4 h-4" />
                Talk to migration support
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
