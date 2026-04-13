import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Clock,
  MapPin,
  MessageSquareQuote,
  CalendarDays,
} from "lucide-react";
import { makeMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import {
  CASE_STUDIES,
  CASE_STUDY_SLUGS,
} from "@/lib/case-studies";
import { PERSONAS } from "@/lib/personas";
import { StockPhotoPlaceholder } from "../../_components/stock-photo-placeholder";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return CASE_STUDY_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const s = CASE_STUDIES[slug];
  if (!s) return {};
  return makeMetadata({
    title: `${s.customer.business} · ${s.pull.replace(/["']/g, "")}`,
    description: s.summary,
    path: `/customers/${s.slug}`,
  });
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const s = CASE_STUDIES[slug];
  if (!s) notFound();

  const persona = PERSONAS[s.personaSlug];
  const related = Object.values(CASE_STUDIES).filter((c) => c.slug !== s.slug);

  return (
    <>
      {/* ─── HERO ────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden hero-bg pb-16 lg:pb-20">
        <span aria-hidden className="absolute top-[14%] left-[5%] font-display text-[28px] text-ink/25 rotate-[-8deg] select-none">✳</span>
        <span aria-hidden className="absolute top-[68%] right-[10%] font-display text-[22px] text-primary/55 rotate-[14deg] select-none">+</span>

        <div className="relative max-w-[1180px] mx-auto px-6 lg:px-10 pt-20 lg:pt-28">
          <div className="grid grid-cols-12 gap-8 lg:gap-12 items-end">
            <div className="col-span-12 lg:col-span-7">
              <div className="flex flex-wrap items-center gap-3 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
                <Link href={routes.customers.caseStudies} className="pencil-link">
                  Customer stories
                </Link>
                <span className="text-ink/25">·</span>
                <span>{s.customer.business}</span>
                <span className="px-2 py-0.5 bg-background-elev border border-border rounded-full text-ink/65 text-[10px] font-mono normal-case tracking-normal inline-flex items-center gap-1.5">
                  <CalendarDays className="w-3 h-3" />
                  {s.publishedLabel}
                </span>
              </div>

              <h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.025em] text-[44px] sm:text-[56px] lg:text-[72px]">
                {s.pull}
              </h1>

              <p className="mt-8 max-w-2xl text-[17px] lg:text-[18px] leading-[1.6] text-ink/75">
                {s.summary}
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-ink/65">
                <span className="inline-flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" />
                  {s.customer.location}
                </span>
                <span className="text-ink/25">·</span>
                <span className="inline-flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  {s.readTime} read
                </span>
                {persona && (
                  <>
                    <span className="text-ink/25">·</span>
                    <Link href={`/for/${persona.slug}`} className="pencil-link">
                      For {persona.name.toLowerCase()}
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="col-span-12 lg:col-span-5">
              <StockPhotoPlaceholder
                id={`case-${s.slug}`}
                label={`Portrait of ${s.customer.name}, ${s.customer.role}, ${s.customer.business}.`}
                notes={s.heroPhotoNotes}
                aspect="aspect-[4/5]"
                tone={s.accent}
              />
            </div>
          </div>
        </div>
      </header>

      {/* ─── METRICS ─────────────────────────────────────────────────── */}
      <section className="py-16 lg:py-20">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            {s.metrics.map((m, i) => (
              <article
                key={m.label}
                className={`p-7 rounded-3xl ${i === 0 ? "bg-peach-200" : i === 1 ? "bg-primary-soft" : "bg-peach-100"}`}
              >
                <p className="font-display text-[56px] lg:text-[68px] leading-none tracking-[-0.02em] text-ink">
                  {m.value}
                </p>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
                  {m.label}
                </p>
                {m.note && (
                  <p className="mt-3 text-[12.5px] text-ink/60 leading-[1.5] max-w-xs">
                    {m.note}
                  </p>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PROBLEM ────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-24">
        <div className="max-w-[960px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-10 lg:gap-16">
          <div className="col-span-12 lg:col-span-3">
            <p className="sticky top-[96px] text-[10px] font-semibold uppercase tracking-[0.24em] text-ink/55">
              01 · The problem
            </p>
          </div>
          <div className="col-span-12 lg:col-span-9 space-y-5 text-[17px] leading-[1.75] text-ink/85">
            {s.problem.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      {/* ─── APPROACH ───────────────────────────────────────────────── */}
      <section className="py-20 lg:py-24 bg-background-elev">
        <div className="max-w-[960px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-10 lg:gap-16">
          <div className="col-span-12 lg:col-span-3">
            <p className="sticky top-[96px] text-[10px] font-semibold uppercase tracking-[0.24em] text-ink/55">
              02 · The approach
            </p>
          </div>
          <div className="col-span-12 lg:col-span-9 space-y-5 text-[16.5px] leading-[1.75] text-ink/85">
            {s.approach.map((p, i) => (
              <p key={i}>{p}</p>
            ))}

            <div className="pt-8 mt-4 border-t border-border">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
                Features used
              </p>
              <ul className="flex flex-wrap gap-2">
                {s.featuresUsed.map((f) => (
                  <li key={f.name}>
                    <Link
                      href={f.href}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-border-strong text-[12.5px] text-ink hover:bg-peach-100 transition-colors"
                    >
                      {f.name}
                      <ArrowUpRight className="w-3 h-3 text-ink/40" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── RESULT ─────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-24">
        <div className="max-w-[960px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-10 lg:gap-16">
          <div className="col-span-12 lg:col-span-3">
            <p className="sticky top-[96px] text-[10px] font-semibold uppercase tracking-[0.24em] text-ink/55">
              03 · The result
            </p>
          </div>
          <div className="col-span-12 lg:col-span-9 space-y-5 text-[17px] leading-[1.75] text-ink/85">
            {s.result.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HERO QUOTE ─────────────────────────────────────────────── */}
      <section className="py-20 lg:py-24">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-10">
          <figure className="relative bg-ink text-background-elev rounded-3xl p-10 lg:p-16 overflow-hidden">
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.1] [background-image:radial-gradient(var(--peach-300)_1px,transparent_1px)] [background-size:28px_28px]"
            />
            <MessageSquareQuote className="relative w-9 h-9 text-peach-300 mb-8" />
            <blockquote className="relative font-display text-[32px] lg:text-[48px] leading-[1.2] tracking-[-0.015em] max-w-4xl">
              {s.heroQuote}
            </blockquote>
            <figcaption className="relative mt-10 flex items-center gap-4">
              <span className="w-12 h-12 rounded-full bg-peach-200 text-ink font-display text-[20px] flex items-center justify-center">
                {s.customer.ini}
              </span>
              <div>
                <p className="font-medium text-[15px]">{s.customer.name}</p>
                <p className="text-[13px] text-background-elev/60">
                  {s.customer.role} · {s.customer.business}
                </p>
              </div>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ─── RELATED ────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-24 bg-background-elev">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
              Other stories
            </p>
            <h2 className="font-display text-[32px] lg:text-[44px] leading-[1.02] tracking-[-0.015em]">
              Different shapes,
              <span className="italic text-primary"> same tool.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/customers/${r.slug}`}
                className={`group block ${r.accent} rounded-3xl p-8 hover:-translate-y-1 transition-transform`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.2em] text-ink/55">
                  <span>{r.customer.business}</span>
                  <span>{r.readTime} read</span>
                </div>
                <p className="mt-6 font-display italic text-[22px] lg:text-[24px] leading-[1.2] tracking-[-0.005em] text-ink">
                  {r.pull}
                </p>
                <p className="mt-3 text-[13.5px] text-ink/70 leading-[1.55]">{r.summary}</p>
                <ArrowUpRight className="mt-5 w-4 h-4 text-ink/40 group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
          <div className="grid grid-cols-12 gap-10 items-end">
            <div className="col-span-12 lg:col-span-8">
              <h2 className="font-display text-[36px] sm:text-[48px] lg:text-[64px] leading-[1] tracking-[-0.02em]">
                See what it looks like
                <br />
                <span className="italic text-primary">in your workflow.</span>
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
              {persona && (
                <Link
                  href={`/for/${persona.slug}`}
                  className="pencil-link inline-flex items-center gap-2 text-[14.5px] font-medium text-ink"
                >
                  The page for {persona.name.toLowerCase()}
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
