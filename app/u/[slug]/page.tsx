import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { ArrowUpRight } from "lucide-react";
import { db } from "@/db";
import { pages, links } from "@/db/schema";
import { notFound } from "next/navigation";
import SubscribeForm from "./subscribe-form";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const page = await db.query.pages.findFirst({
    where: eq(pages.slug, slug),
  });
  if (!page) notFound();

  const pageLinks = await db
    .select()
    .from(links)
    .where(eq(links.pageId, page.id))
    .orderBy(asc(links.order));

  const initials = (page.title ?? slug)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="relative min-h-screen bg-background text-foreground font-sans flex flex-col">
      {/* soft peach wash + sparse hero-style marks */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(900px 500px at 80% -10%, var(--peach-200) 0%, transparent 55%), radial-gradient(700px 400px at -10% 60%, var(--peach-100) 0%, transparent 60%)",
        }}
      />
      <span
        aria-hidden
        className="absolute top-[10%] left-[8%] font-display text-[28px] text-ink/25 rotate-[-8deg] select-none pointer-events-none"
      >
        ✳
      </span>
      <span
        aria-hidden
        className="absolute top-[18%] right-[10%] font-display text-[32px] text-ink/15 rotate-[12deg] select-none pointer-events-none"
      >
        ✳
      </span>
      <span
        aria-hidden
        className="absolute bottom-[18%] left-[12%] font-display text-[22px] text-primary/50 rotate-12 select-none pointer-events-none"
      >
        +
      </span>

      <main className="flex-1 flex items-start sm:items-center justify-center px-4 py-16 lg:py-24">
        <article className="w-full max-w-[460px] rounded-[32px] border border-border bg-background-elev overflow-hidden shadow-[0_24px_60px_-30px_rgba(26,22,18,0.2)]">
          {/* Header */}
          <header className="px-8 pt-10 pb-6 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full overflow-hidden bg-peach-100 border border-border mx-auto">
              {page.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={page.avatarUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-display text-[26px] tracking-[-0.02em] text-ink">
                  {initials || "A"}
                </span>
              )}
            </div>

            <h1 className="mt-5 font-display text-[32px] leading-[1.1] tracking-[-0.025em] text-ink font-normal">
              {page.title ?? page.slug}
            </h1>
            <p className="mt-1 text-[12.5px] uppercase tracking-[0.22em] text-ink/55">
              @{page.slug}
            </p>
            {page.bio ? (
              <p className="mt-4 text-[14.5px] text-ink/75 leading-[1.55] max-w-[360px] mx-auto">
                {page.bio}
              </p>
            ) : null}
          </header>

          {/* Links */}
          {pageLinks.length > 0 ? (
            <section className="px-6 pb-2">
              <ul className="space-y-2">
                {pageLinks.map((l) => (
                  <li key={l.id}>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between gap-3 h-12 px-4 rounded-full bg-background border border-border-strong text-[14px] font-medium text-ink hover:border-ink transition-colors"
                    >
                      <span className="truncate">{l.title}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-ink/40 group-hover:text-ink transition-colors shrink-0" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Subscribe */}
          <section className="px-8 pt-6 pb-8 border-t border-border mt-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 text-center">
              Quiet updates, when there&apos;s something worth saying
            </p>
            <div className="mt-4">
              <SubscribeForm userId={page.userId} />
            </div>
          </section>

          {/* Footer */}
          <footer className="px-8 py-4 border-t border-border text-center">
            <Link
              href="/"
              className="inline-flex items-baseline gap-1 text-ink/55 hover:text-ink transition-colors"
            >
              <span className="text-[11px] uppercase tracking-[0.22em]">
                Made with
              </span>
              <span className="font-display text-[15px] leading-none font-semibold tracking-[-0.03em]">
                Aloha
              </span>
              <span className="font-display text-primary text-[13px] leading-none">
                .
              </span>
            </Link>
          </footer>
        </article>
      </main>
    </div>
  );
}
