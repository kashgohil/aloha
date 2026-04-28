// Weekly Insights — read-only web view of the same data the Monday
// digest email surfaces. Lives at /app/insights so users who turn the
// email off (or just prefer browsing) can still see the retro and
// suggestions.

import { ArrowUpRight, LineChart, Sparkle } from "lucide-react";
import Link from "next/link";
import { computeWeeklyInsights } from "@/lib/analytics/insights";
import { getCurrentContext } from "@/lib/current-context";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function previewLine(content: string, max = 200): string {
  const trimmed = content.trim();
  if (!trimmed) return "(empty post)";
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

function platformLabel(platform: string): string {
  if (!platform) return "Other";
  return platform === "twitter" ? "X" : platform[0].toUpperCase() + platform.slice(1);
}

export default async function InsightsPage() {
  const ctx = await getCurrentContext();
  if (!ctx) redirect("/auth/sign-in");

  const insights = await computeWeeklyInsights(ctx.workspace.id);
  const hasContent =
    insights.topPosts.length > 0 || insights.suggestions.length > 0;

  return (
    <div className="max-w-3xl space-y-10">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          Weekly insights
        </p>
        <h1 className="mt-2 font-display text-[28px] leading-[1.1] tracking-[-0.02em] text-ink">
          What worked, and what to try next.
        </h1>
        <p className="mt-2 text-[13.5px] text-ink/65 leading-[1.55] max-w-2xl">
          A short retro on{" "}
          <strong className="text-ink/80 font-medium">{ctx.workspace.name}</strong>
          . The same picture you&apos;d get in the Monday email — three best
          posts, two or three concrete next moves. Skips suggestions when
          there isn&apos;t enough signal yet.
        </p>
      </header>

      {!hasContent ? (
        <section className="rounded-2xl border border-dashed border-border bg-background-elev p-8 text-center">
          <p className="text-[14px] text-ink leading-[1.55]">
            Not enough data yet.
          </p>
          <p className="mt-1.5 text-[12.5px] text-ink/60 leading-[1.55] max-w-md mx-auto">
            Once you&apos;ve published a few posts and we&apos;ve pulled
            their numbers back, this page (and the weekly digest email) will
            start surfacing your top performers and patterns to lean into.
          </p>
          <Link
            href="/app/composer"
            className="mt-5 inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors"
          >
            Open composer
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </section>
      ) : null}

      {insights.topPosts.length > 0 ? (
        <section>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
            <LineChart className="w-3.5 h-3.5" />
            Three to learn from
          </div>
          <ol className="space-y-3">
            {insights.topPosts.map((p, idx) => (
              <li
                key={p.postId}
                className="rounded-2xl border border-border bg-background-elev p-5"
              >
                <div className="flex items-start gap-4">
                  <span className="text-[13px] text-ink/40 font-medium w-6 shrink-0">
                    {idx + 1}.
                  </span>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap text-[10.5px] uppercase tracking-[0.18em] text-ink/55">
                      <span className="inline-flex items-center h-5 px-2 rounded-full bg-peach-100 border border-peach-300 text-ink font-medium">
                        {platformLabel(p.platform)}
                      </span>
                      <span>{p.impressions.toLocaleString()} impressions</span>
                      <span aria-hidden>·</span>
                      <span>{p.engagement.toLocaleString()} interactions</span>
                    </div>
                    <p className="text-[14px] text-ink leading-[1.55] whitespace-pre-wrap">
                      {previewLine(p.content)}
                    </p>
                    <Link
                      href={`/app/posts/${p.postId}`}
                      className="inline-flex items-center gap-1 text-[12.5px] text-ink/65 hover:text-ink transition-colors underline underline-offset-4 decoration-dotted"
                    >
                      Open post
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {insights.suggestions.length > 0 ? (
        <section>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
            <Sparkle className="w-3.5 h-3.5" />
            What to do more of
          </div>
          <ul className="space-y-3">
            {insights.suggestions.map((s) => (
              <li
                key={s.kind}
                className="rounded-2xl border border-peach-300 bg-peach-100/40 p-5 space-y-2"
              >
                <p className="text-[14px] text-ink font-medium leading-[1.45]">
                  {s.headline}
                </p>
                <p className="text-[12.5px] text-ink/65 leading-[1.55]">
                  {s.rationale}
                </p>
                {s.href ? (
                  <Link
                    href={s.href}
                    className="inline-flex items-center gap-1 text-[12.5px] text-primary hover:text-primary-deep transition-colors underline underline-offset-4 decoration-dotted"
                  >
                    Try it
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
