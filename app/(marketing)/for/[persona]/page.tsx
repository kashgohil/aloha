import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Sparkle,
  MessageSquareQuote,
} from "lucide-react";
import { makeMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { PERSONAS, PERSONA_SLUGS } from "@/lib/personas";
import { CHANNELS } from "@/lib/channels";
import { StockPhotoPlaceholder } from "../../_components/stock-photo-placeholder";
import { SOCIAL_ICONS } from "../../_components/social-icons";

type Params = { persona: string };

export function generateStaticParams(): Params[] {
  return PERSONA_SLUGS.map((persona) => ({ persona }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { persona: slug } = await params;
  const p = PERSONAS[slug];
  if (!p) return {};
  return makeMetadata({
    title: `Aloha for ${p.name} — ${p.tagline}`,
    description: p.lead,
    path: `/for/${p.slug}`,
  });
}

function channelIcon(name: string) {
  return SOCIAL_ICONS.find((i) => i.n.toLowerCase() === name.toLowerCase());
}

export default async function PersonaPage({ params }: { params: Promise<Params> }) {
  const { persona: slug } = await params;
  const p = PERSONAS[slug];
  if (!p) notFound();

  const otherPersonas = Object.values(PERSONAS).filter((o) => o.slug !== p.slug);

  return (
    <>
      {/* ─── HERO ────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden hero-bg">
        <span aria-hidden className="absolute top-[14%] left-[5%] font-display text-[28px] text-ink/25 rotate-[-8deg] select-none">✳</span>
        <span aria-hidden className="absolute top-[68%] left-[11%] font-display text-[22px] text-primary/55 rotate-[12deg] select-none">+</span>
        <span aria-hidden className="absolute top-[22%] right-[8%] font-display text-[38px] text-ink/15 rotate-[18deg] select-none">※</span>

        <div className="relative max-w-[1320px] w-full mx-auto px-6 lg:px-10 pt-20 lg:pt-28 pb-24 lg:pb-32 grid grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="col-span-12 lg:col-span-7">
            <div className="inline-flex items-center gap-2 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
              <span className="w-6 h-px bg-ink/40" />
              {p.eyebrow}
            </div>

            <h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[92px]">
              {p.headline.line1}
              <br />
              <span className="italic text-primary font-light">{p.headline.line2}</span>
            </h1>

            <p className="mt-8 max-w-[560px] text-[17px] lg:text-[18px] leading-[1.55] text-ink/70">
              {p.lead}
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <Link
                href={routes.signin}
                className="inline-flex items-center gap-2 h-14 px-7 rounded-full bg-primary text-primary-foreground font-medium text-[15px] shadow-[0_8px_0_-2px_rgba(46,42,133,0.35)] hover:shadow-[0_10px_0_-2px_rgba(46,42,133,0.4)] hover:-translate-y-0.5 transition-all"
              >
                Start free — no card
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#day"
                className="pencil-link inline-flex items-center gap-2 text-[15px] font-medium text-ink"
              >
                A typical day
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-[12.5px] text-ink/60">
              <span className="inline-flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
                {p.recommendedPlan.name}
              </span>
              <span className="inline-flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
                {p.recommendedPlan.priceLabel}
              </span>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-5 relative">
            <div className="absolute -top-3 -left-2 z-20 rotate-[-5deg] pointer-events-none">
              <div className="inline-flex items-center gap-2 bg-ink text-peach-200 px-3 py-1.5 rounded-full shadow-[0_6px_16px_-6px_rgba(23,20,18,0.5)]">
                <span className="font-display text-[12px]">{p.name.toLowerCase()}</span>
              </div>
            </div>
            <div className="animate-[float-soft_9s_ease-in-out_infinite]">
              <StockPhotoPlaceholder
                id={`hero-${p.slug}`}
                label={p.tagline}
                notes={p.heroPhotoNotes}
                aspect="aspect-[4/5]"
                tone={p.accent}
              />
            </div>
          </div>
        </div>
      </header>

      {/* ─── PAINS → RESOLUTIONS ─────────────────────────────────────── */}
      <section className="py-24 lg:py-32">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-12 gap-10 mb-14 items-end">
            <div className="col-span-12 lg:col-span-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
                What actually changes
              </p>
              <h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
                Three things
                <br />
                <span className="italic text-primary">that stop being hard.</span>
              </h2>
            </div>
            <p className="col-span-12 lg:col-span-5 text-[15.5px] text-ink/70 leading-[1.55]">
              Not an exhaustive feature list. The three chronic annoyances
              we heard over and over from {p.name.toLowerCase()} — and what
              Aloha does about each.
            </p>
          </div>

          <ol className="space-y-6 lg:space-y-8">
            {p.pains.map((item, i) => (
              <li
                key={i}
                className="grid grid-cols-12 gap-4 lg:gap-8 rounded-3xl overflow-hidden border border-border bg-background"
              >
                <div className="col-span-12 md:col-span-5 p-8 lg:p-10 bg-ink text-background-elev flex flex-col justify-between min-h-[200px]">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-peach-200">
                      The pain
                    </span>
                    <span className="font-display italic text-[18px] text-peach-300">
                      0{i + 1}
                    </span>
                  </div>
                  <p className="font-display text-[22px] lg:text-[26px] leading-[1.2] tracking-[-0.005em]">
                    "{item.pain}"
                  </p>
                </div>
                <div className="col-span-12 md:col-span-7 p-8 lg:p-10 flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-primary mb-4">
                      <Sparkle className="w-3 h-3" />
                      What Aloha does
                    </div>
                    <p className="text-[16px] lg:text-[17px] text-ink/85 leading-[1.6]">
                      {item.resolution}
                    </p>
                  </div>
                  <Link
                    href={item.href}
                    className="mt-6 pencil-link inline-flex items-center gap-2 text-[13.5px] font-medium text-ink self-start"
                  >
                    See {item.feature}
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─── A DAY IN THE LIFE ───────────────────────────────────────── */}
      <section id="day" className="py-24 lg:py-32 bg-background-elev">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-10 lg:gap-16 items-start">
          <div className="col-span-12 lg:col-span-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
              A typical day
            </p>
            <h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
              Five beats.
              <br />
              <span className="italic text-primary">One calm day.</span>
            </h2>
            <p className="mt-6 text-[16px] text-ink/75 leading-[1.6] max-w-md">
              What a Tuesday actually looks like when Aloha is doing what
              it should. Deep-work blocks are silent; the tool only
              surfaces what wants your thumb.
            </p>

            <Link
              href={routes.product.calendar}
              className="mt-8 pencil-link inline-flex items-center gap-2 text-[14.5px] font-medium text-ink"
            >
              See the calendar in action
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="col-span-12 lg:col-span-7">
            <ol className="relative border-l-2 border-border-strong/60 pl-8 space-y-6">
              {p.day.map((d, i) => (
                <li key={i} className="relative">
                  <span className={`absolute -left-[39px] top-1 w-5 h-5 rounded-full ${d.tone} border border-ink/20`} />
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-5">
                    <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink/55 sm:w-16 shrink-0">
                      {d.time}
                    </span>
                    <span className="text-[15px] text-ink/85 leading-[1.55]">{d.label}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ─── TOP FEATURES ────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="mb-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
              The three things you'll reach for
            </p>
            <h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
              Not features.
              <br />
              <span className="italic text-primary">Muscle memory.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            {p.topFeatures.map((f, i) => (
              <Link
                key={f.name}
                href={f.href}
                className={`group p-8 lg:p-9 rounded-3xl ${
                  i === 0 ? p.accent : i === 1 ? "bg-peach-100" : "bg-primary-soft"
                } flex flex-col min-h-[220px] hover:-translate-y-1 transition-transform`}
              >
                <span className="font-display italic text-[28px] text-ink/35 leading-none">
                  0{i + 1}
                </span>
                <h3 className="mt-8 font-display text-[24px] leading-[1.2] tracking-[-0.01em]">
                  {f.name}
                </h3>
                <p className="mt-3 text-[13.5px] text-ink/75 leading-[1.55]">{f.why}</p>
                <ArrowUpRight className="mt-auto pt-5 w-5 h-5 text-ink/40 group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CHANNELS THEY LIVE ON ───────────────────────────────────── */}
      <section className="py-20 lg:py-24 bg-background-elev">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-12 gap-10 mb-10 items-end">
            <div className="col-span-12 lg:col-span-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
                Channels {p.name.toLowerCase()} live on
              </p>
              <h2 className="font-display text-[32px] lg:text-[44px] leading-[1.02] tracking-[-0.02em]">
                Where you already
                <span className="italic text-primary"> show up.</span>
              </h2>
            </div>
            <p className="col-span-12 lg:col-span-4 text-[15px] text-ink/70 leading-[1.55]">
              Tap any channel for platform-specific notes — what's native,
              what's honest, what the peak window looks like.
            </p>
          </div>

          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 border-t border-l border-border">
            {p.channels.map((slug) => {
              const ch = CHANNELS[slug];
              if (!ch) return null;
              const icon = channelIcon(ch.name);
              return (
                <li key={slug}>
                  <Link
                    href={`/channels/${ch.slug}`}
                    className="p-6 lg:p-7 flex items-start gap-4 group hover:bg-muted/40 transition-colors border-r border-b border-border block"
                  >
                    {icon && (
                      <span className="w-10 h-10 grid place-items-center rounded-full border border-border-strong text-ink group-hover:bg-ink group-hover:text-background-elev group-hover:border-ink transition-colors shrink-0">
                        <svg viewBox="0 0 24 24" className="w-[15px] h-[15px]" fill={icon.custom ? undefined : "currentColor"}>
                          {icon.custom ?? <path d={icon.path} />}
                        </svg>
                      </span>
                    )}
                    <div>
                      <p className="font-display text-[20px] leading-none tracking-[-0.015em]">
                        {ch.name}
                      </p>
                      <p className="mt-2 text-[12px] text-ink/55 max-w-[20ch]">
                        {ch.tagline}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ─── RECOMMENDED PLAN ────────────────────────────────────────── */}
      <section className="py-24 lg:py-32">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-12 gap-10 lg:gap-16 items-center">
            <div className="col-span-12 lg:col-span-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
                Our honest recommendation
              </p>
              <h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
                Start with the
                <br />
                <span className="italic text-primary">plan that fits.</span>
              </h2>
              <p className="mt-6 text-[16px] text-ink/75 leading-[1.6] max-w-md">
                Most {p.name.toLowerCase()} land here. If it's wrong for
                you, switching plans is two clicks — your content comes
                along.
              </p>

              <Link
                href={routes.home + "#pricing"}
                className="mt-8 pencil-link inline-flex items-center gap-2 text-[14.5px] font-medium text-ink"
              >
                Compare all plans
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="col-span-12 lg:col-span-7">
              <article className={`rounded-3xl ${p.accent} p-8 lg:p-10 relative`}>
                <span className="absolute top-6 right-6 inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink bg-background-elev px-2.5 py-1 rounded-full">
                  <Sparkle className="w-3 h-3 text-primary" />
                  Recommended for you
                </span>
                <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-ink/55 mb-3">
                  Plan
                </p>
                <h3 className="font-display text-[36px] lg:text-[44px] leading-[1] tracking-[-0.02em]">
                  {p.recommendedPlan.name}
                </h3>
                <p className="mt-2 font-mono text-[13px] text-ink/70">
                  {p.recommendedPlan.priceLabel}
                </p>
                <p className="mt-6 text-[15px] text-ink/80 leading-[1.6] max-w-xl">
                  {p.recommendedPlan.why}
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <Link
                    href={routes.signin}
                    className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
                  >
                    Start on this plan
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href={routes.home + "#pricing"}
                    className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-background-elev border border-border-strong text-ink text-[14px] font-medium hover:bg-muted transition-colors"
                  >
                    See every plan
                  </Link>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIAL ─────────────────────────────────────────────── */}
      <section className="py-20 lg:py-24 bg-background-elev">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-10">
          <figure className="relative bg-ink text-background-elev rounded-3xl p-10 lg:p-14 overflow-hidden">
            <div
              aria-hidden
              className="absolute inset-0 opacity-10 [background-image:radial-gradient(var(--peach-300)_1px,transparent_1px)] [background-size:28px_28px]"
            />
            <MessageSquareQuote className="relative w-8 h-8 text-peach-300 mb-6" />
            <blockquote className="relative font-display text-[26px] lg:text-[34px] leading-[1.2] tracking-[-0.015em] max-w-3xl">
              "{p.testimonial.q}"
            </blockquote>
            <figcaption className="relative mt-8 flex items-center gap-4">
              <span className="w-11 h-11 rounded-full bg-peach-200 text-ink font-display flex items-center justify-center">
                {p.testimonial.ini}
              </span>
              <div>
                <p className="font-medium">{p.testimonial.n}</p>
                <p className="text-[13px] text-background-elev/60">{p.testimonial.r}</p>
              </div>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ─── OTHER PERSONAS ─────────────────────────────────────────── */}
      <section className="py-20 lg:py-24">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-12 gap-10 mb-10 items-end">
            <div className="col-span-12 lg:col-span-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
                Other shapes of work
              </p>
              <h2 className="font-display text-[32px] lg:text-[44px] leading-[1.02] tracking-[-0.02em]">
                Five other ways
                <span className="italic text-primary"> people use Aloha.</span>
              </h2>
            </div>
            <p className="col-span-12 lg:col-span-4 text-[15.5px] text-ink/70 leading-[1.55]">
              Pick the shape closest to yours. The tool's the same; the
              examples on each page aren't.
            </p>
          </div>

          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border-t border-l border-border">
            {otherPersonas.map((o) => (
              <li key={o.slug}>
                <Link
                  href={`/for/${o.slug}`}
                  className="p-6 block group hover:bg-muted/40 transition-colors border-r border-b border-border h-full"
                >
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink/50 mb-3">
                    For
                  </p>
                  <p className="font-display text-[22px] leading-none tracking-[-0.015em] group-hover:text-primary transition-colors">
                    {o.name}
                  </p>
                  <p className="mt-3 text-[12px] text-ink/55 max-w-[20ch] leading-[1.5]">
                    {o.tagline}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── FINAL CTA ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10 py-24 lg:py-32">
          <div className="grid grid-cols-12 gap-10 items-end">
            <div className="col-span-12 lg:col-span-8">
              <h2 className="font-display text-[44px] sm:text-[56px] lg:text-[80px] leading-[0.98] tracking-[-0.025em]">
                {p.cta.line1}
                <br />
                <span className="italic text-primary">{p.cta.line2}</span>
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
                href={routes.compare.whyDifferent}
                className="pencil-link inline-flex items-center gap-2 text-[14.5px] font-medium text-ink"
              >
                Why we build it this way
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
