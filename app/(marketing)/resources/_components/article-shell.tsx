import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Clock,
  CalendarDays,
} from "lucide-react";
import { routes } from "@/lib/routes";
import { JsonLd } from "@/lib/json-ld";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo";

type Author = {
  name: string;
  role: string;
  ini: string;
  tone?: string;
};

type Related = {
  title: string;
  href: string;
  read: string;
};

type Props = {
  // Eyebrow that slots above the title (e.g. "Field notes" or "Playbook").
  collection: { name: string; href: string };
  title: string;
  // 1-2 sentence kicker under the title.
  lead: string;
  date: string; // ISO
  dateLabel: string;
  readTime: string;
  author: Author;
  // Canonical path of this article — drives Article + Breadcrumb schema.
  path: string;
  // Optional category surfaced in Article schema.
  articleSection?: string;
  // Hero accent for the colour stripe.
  accent?: "bg-peach-100" | "bg-peach-200" | "bg-peach-300" | "bg-primary-soft";
  children: ReactNode; // MDX content
  related?: Related[];
  // Suggest reading the related collection at the bottom.
  collectionPitch?: string;
};

export function ArticleShell({
  collection,
  title,
  lead,
  date,
  dateLabel,
  readTime,
  author,
  path,
  articleSection,
  accent = "bg-peach-200",
  children,
  related = [],
  collectionPitch,
}: Props) {
  return (
    <>
      <JsonLd
        data={[
          articleJsonLd({
            headline: title,
            description: lead,
            path,
            datePublished: date,
            authorName: author.name,
            authorRole: author.role,
            articleSection: articleSection ?? collection.name,
          }),
          breadcrumbJsonLd([
            { name: "Home", path: routes.home },
            { name: "Resources", path: routes.resources.index },
            { name: collection.name, path: collection.href },
            { name: title, path },
          ]),
        ]}
      />
      {/* ─── HERO ────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden bg-peach-200 pb-16 lg:pb-20">
        <span aria-hidden className="absolute top-[18%] left-[5%] font-display text-[28px] text-ink/20 rotate-[-8deg] select-none">✳</span>
        <span aria-hidden className="absolute top-[68%] right-[10%] font-display text-[22px] text-ink/15 rotate-[14deg] select-none">+</span>

        <div className="relative max-w-[820px] mx-auto px-6 lg:px-10 pt-20 lg:pt-28">
          <div className="flex flex-wrap items-center gap-3 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
            <Link href={collection.href} className="pencil-link">
              {collection.name}
            </Link>
            <span className="text-ink/25">·</span>
            <span className="inline-flex items-center gap-1.5 text-ink/65 normal-case tracking-normal text-[11px] font-mono">
              <CalendarDays className="w-3 h-3" />
              {dateLabel}
            </span>
            <span className="text-ink/25">·</span>
            <span className="inline-flex items-center gap-1.5 text-ink/65 normal-case tracking-normal text-[11px] font-mono">
              <Clock className="w-3 h-3" />
              {readTime} read
            </span>
          </div>

          <h1 className="font-display font-normal text-ink leading-[1] tracking-[-0.025em] text-[44px] sm:text-[56px] lg:text-[72px]">
            {title}
          </h1>

          <p className="mt-8 max-w-[60ch] text-[18px] lg:text-[20px] leading-[1.55] text-ink/75">
            {lead}
          </p>

          {/* author row */}
          <div className="mt-12 flex items-center gap-4">
            <span className={`w-12 h-12 rounded-full ${author.tone ?? "bg-ink"} text-background-elev font-display text-[18px] flex items-center justify-center`}>
              {author.ini}
            </span>
            <div>
              <p className="font-medium text-[15px] text-ink">{author.name}</p>
              <p className="text-[12.5px] text-ink/60 font-mono uppercase tracking-[0.14em]">
                {author.role}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ─── BODY ───────────────────────────────────────────────────── */}
      <article className="py-16 lg:py-24" data-article-prose>
        <div className="max-w-[720px] mx-auto px-6 lg:px-10 article-prose">
          {children}
        </div>
      </article>

      {/* ─── PUBLISHED + SHARE LINE ─────────────────────────────────── */}
      <section className="py-8 lg:py-10 border-t border-border">
        <div className="max-w-[720px] mx-auto px-6 lg:px-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-[12.5px] text-ink/60 font-mono uppercase tracking-[0.14em]">
          <p>
            Published{" "}
            <time dateTime={date} className="text-ink/80">
              {dateLabel}
            </time>
          </p>
          <p>
            <a
              href={`mailto:${"hello"}@usealoha.app?subject=Re: ${encodeURIComponent(title)}`}
              className="pencil-link text-ink"
            >
              Reply by email
            </a>
          </p>
        </div>
      </section>

      {/* ─── RELATED ───────────────────────────────────────────────── */}
      {related.length > 0 && (
        <section className="py-20 lg:py-24 bg-background-elev">
          <div className="max-w-[1100px] mx-auto px-6 lg:px-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
              Read more like this
            </p>
            <h2 className="font-display text-[28px] lg:text-[36px] leading-[1.05] tracking-[-0.015em] mb-10">
              From the same{" "}
              <Link href={collection.href} className="italic text-primary pencil-link">
                {collection.name.toLowerCase()}
              </Link>
              .
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
              {related.map((r) => (
                <Link
                  key={r.href}
                  href={r.href}
                  className="group p-7 rounded-3xl bg-background border border-border flex flex-col hover:bg-muted/30 transition-colors min-h-[180px]"
                >
                  <p className="font-display text-[20px] leading-[1.2] tracking-[-0.005em] text-ink group-hover:text-primary transition-colors">
                    {r.title}
                  </p>
                  <span className="mt-auto pt-5 inline-flex items-center gap-1.5 text-[12px] font-mono text-ink/55 uppercase tracking-[0.14em]">
                    <Clock className="w-3 h-3" />
                    {r.read} read
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── FINAL CTA ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
          <div className="p-10 lg:p-14 rounded-3xl bg-ink text-background-elev">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-peach-200 mb-5">
              Like this thinking?
            </p>
            <p className="font-display text-[28px] lg:text-[40px] leading-[1.15] tracking-[-0.015em] max-w-2xl">
              {collectionPitch ??
                "Get one of these in your inbox every Friday. No drip sequence, one unsubscribe link."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={routes.connect.newsletter}
                className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-peach-300 text-ink text-[14px] font-medium hover:bg-peach-400 transition-colors"
              >
                Join the newsletter
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={collection.href}
                className="inline-flex items-center gap-2 h-12 px-6 rounded-full border border-peach-200/25 text-peach-200 text-[14px] font-medium hover:bg-background-elev/10 transition-colors"
              >
                Browse {collection.name.toLowerCase()}
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
