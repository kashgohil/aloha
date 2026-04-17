import { and, desc, eq } from "drizzle-orm";
import {
  Archive,
  ArchiveRestore,
  BookOpen,
  ExternalLink,
  Lightbulb,
  Link2,
  PenSquare,
  Plus,
  Rss,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { ideas } from "@/db/schema";
import {
  createIdeaAction,
  deleteIdeaAction,
  updateIdeaStatusAction,
} from "@/app/actions/ideas";
import { getCurrentUser } from "@/lib/current-user";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

type Filter = "new" | "drafted" | "archived" | "all";
const isFilter = (v: string | null | undefined): v is Filter =>
  v === "new" || v === "drafted" || v === "archived" || v === "all";

export default async function IdeasPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = (await getCurrentUser())!;
  const params = await searchParams;
  const filterParam = first(params.filter);
  const filter: Filter = isFilter(filterParam) ? filterParam : "new";

  const rows = await db
    .select({
      id: ideas.id,
      source: ideas.source,
      sourceUrl: ideas.sourceUrl,
      title: ideas.title,
      body: ideas.body,
      tags: ideas.tags,
      status: ideas.status,
      createdAt: ideas.createdAt,
    })
    .from(ideas)
    .where(
      filter === "all"
        ? eq(ideas.userId, user.id)
        : and(eq(ideas.userId, user.id), eq(ideas.status, filter)),
    )
    .orderBy(desc(ideas.createdAt));

  const counts = await db
    .select({ status: ideas.status })
    .from(ideas)
    .where(eq(ideas.userId, user.id));
  const countBy = (s: string) => counts.filter((c) => c.status === s).length;

  return (
    <div className="space-y-10">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            {user.workspaceName ?? "Your workspace"}
          </p>
          <h1 className="mt-3 font-display text-[44px] lg:text-[52px] leading-[1.02] tracking-[-0.03em] text-ink font-normal">
            Ideas<span className="text-primary font-light">.</span>
          </h1>
          <p className="mt-3 text-[14px] text-ink/65 max-w-xl leading-[1.55]">
            Swipe file. Half-thoughts. Hooks you want to come back to. Drop
            anything here; pull into a draft when it&apos;s time to write.
          </p>
        </div>
      </header>

      <CaptureForm />

      <FilterTabs
        filter={filter}
        counts={{
          new: countBy("new"),
          drafted: countBy("drafted"),
          archived: countBy("archived"),
          all: counts.length,
        }}
      />

      {rows.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {rows.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </ul>
      )}
    </div>
  );
}

function CaptureForm() {
  return (
    <form
      action={createIdeaAction}
      className="rounded-3xl border border-border bg-background-elev p-5 space-y-3"
    >
      <div className="flex items-start gap-3">
        <span className="mt-[2px] w-9 h-9 rounded-full bg-peach-100 border border-peach-300 grid place-items-center shrink-0">
          <Lightbulb className="w-4 h-4 text-ink" />
        </span>
        <div className="flex-1">
          <p className="text-[14px] text-ink font-medium">Capture an idea</p>
          <p className="mt-0.5 text-[12.5px] text-ink/60 leading-[1.5]">
            Anything worth coming back to — a hook, a story, a link, an
            observation.
          </p>
        </div>
      </div>

      <textarea
        name="body"
        required
        placeholder="The thought. Keep it rough — you can polish in the composer."
        className="w-full min-h-[90px] rounded-2xl border border-border bg-background px-4 py-3 text-[13.5px] text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink resize-y"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          name="title"
          type="text"
          placeholder="Title (optional)"
          className="h-10 px-3.5 rounded-full border border-border bg-background text-[13px] text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink"
        />
        <input
          name="tags"
          type="text"
          placeholder="Tags, comma-separated (optional)"
          className="h-10 px-3.5 rounded-full border border-border bg-background text-[13px] text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink"
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <input
          name="url"
          type="url"
          placeholder="Related URL (optional)"
          className="flex-1 h-10 px-3.5 rounded-full border border-border bg-background text-[13px] text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-ink text-background text-[13.5px] font-medium hover:bg-primary transition-colors"
        >
          <Plus className="w-4 h-4" />
          Save idea
        </button>
      </div>
    </form>
  );
}

function FilterTabs({
  filter,
  counts,
}: {
  filter: Filter;
  counts: { new: number; drafted: number; archived: number; all: number };
}) {
  const tabs: Array<{ key: Filter; label: string; count: number }> = [
    { key: "new", label: "New", count: counts.new },
    { key: "drafted", label: "Drafted", count: counts.drafted },
    { key: "archived", label: "Archived", count: counts.archived },
    { key: "all", label: "All", count: counts.all },
  ];
  return (
    <nav className="flex items-center gap-1 flex-wrap">
      {tabs.map((t) => {
        const active = t.key === filter;
        return (
          <Link
            key={t.key}
            href={`/app/ideas?filter=${t.key}`}
            className={cn(
              "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[12.5px] font-medium transition-colors",
              active
                ? "bg-ink text-background"
                : "text-ink/70 hover:text-ink hover:bg-muted/60",
            )}
          >
            {t.label}
            <span
              className={cn(
                "inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full text-[10.5px] tabular-nums",
                active
                  ? "bg-background/20 text-background"
                  : "bg-peach-100 text-ink/70",
              )}
            >
              {t.count}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function EmptyState({ filter }: { filter: Filter }) {
  const copy =
    filter === "new"
      ? {
          title: "No fresh ideas yet.",
          body: "Capture something above, save items from the feed reader, or sync from Notion. This is your swipe file — it gets more useful the more you throw in it.",
        }
      : filter === "drafted"
        ? {
            title: "Nothing in draft yet.",
            body: "When you turn an idea into a post, it'll move here so you know which ones you've already worked on.",
          }
        : filter === "archived"
          ? {
              title: "Nothing archived.",
              body: "Ideas you've put down stay here — out of the way, still searchable.",
            }
          : {
              title: "No ideas yet.",
              body: "Capture above, save from feeds, or sync from Notion to get started.",
            };
  return (
    <div className="rounded-3xl border border-dashed border-border-strong bg-background-elev px-8 py-14 text-center">
      <span className="inline-grid place-items-center w-12 h-12 rounded-full bg-peach-100 border border-border">
        <Sparkles className="w-5 h-5 text-ink" />
      </span>
      <p className="mt-5 font-display text-[22px] leading-[1.15] tracking-[-0.01em] text-ink">
        {copy.title}
      </p>
      <p className="mt-2 text-[13.5px] text-ink/60 max-w-md mx-auto leading-[1.55]">
        {copy.body}
      </p>
    </div>
  );
}

type IdeaRow = {
  id: string;
  source: string;
  sourceUrl: string | null;
  title: string | null;
  body: string;
  tags: string[];
  status: string;
  createdAt: Date;
};

const SOURCE_META: Record<
  string,
  { label: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  manual: { label: "Captured", Icon: Lightbulb },
  url_clip: { label: "URL clip", Icon: Link2 },
  feed: { label: "From feed", Icon: Rss },
  notion: { label: "From Notion", Icon: BookOpen },
  inbox: { label: "From inbox", Icon: Sparkles },
};

function IdeaCard({ idea }: { idea: IdeaRow }) {
  const meta = SOURCE_META[idea.source] ?? SOURCE_META.manual;
  const isArchived = idea.status === "archived";
  const isDrafted = idea.status === "drafted";
  return (
    <li
      className={cn(
        "rounded-2xl border bg-background-elev p-5 flex flex-col gap-3",
        isArchived
          ? "border-border opacity-75"
          : "border-border-strong",
      )}
    >
      <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.16em] text-ink/50">
        <span className="inline-flex items-center gap-1.5">
          <meta.Icon className="w-3 h-3" />
          {meta.label}
        </span>
        <span>
          {new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
          }).format(idea.createdAt)}
        </span>
      </div>

      {idea.title ? (
        <p className="text-[14.5px] text-ink font-medium leading-[1.35]">
          {idea.title}
        </p>
      ) : null}

      <p
        className={cn(
          "text-[13.5px] text-ink/80 leading-[1.55] whitespace-pre-wrap",
          idea.title ? "" : "font-medium text-ink",
        )}
      >
        {idea.body}
      </p>

      {idea.tags.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {idea.tags.map((t) => (
            <li
              key={t}
              className="inline-flex items-center h-5 px-2 rounded-full bg-peach-100 border border-border text-[11px] text-ink/70"
            >
              #{t}
            </li>
          ))}
        </ul>
      ) : null}

      {idea.sourceUrl ? (
        <a
          href={idea.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[12px] text-ink/55 hover:text-ink transition-colors truncate"
        >
          <ExternalLink className="w-3 h-3 shrink-0" />
          <span className="truncate">{hostnameOf(idea.sourceUrl)}</span>
        </a>
      ) : null}

      <div className="mt-1 flex items-center gap-1 flex-wrap">
        {!isArchived ? (
          <Link
            href={`/app/composer?idea=${idea.id}`}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-ink text-background text-[12px] font-medium hover:bg-primary transition-colors"
          >
            <PenSquare className="w-3.5 h-3.5" />
            {isDrafted ? "Open draft" : "Use as draft"}
          </Link>
        ) : null}

        {!isArchived ? (
          <form action={updateIdeaStatusAction}>
            <input type="hidden" name="id" value={idea.id} />
            <input type="hidden" name="status" value="archived" />
            <button
              type="submit"
              aria-label="Archive"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] text-ink/65 hover:text-ink transition-colors"
            >
              <Archive className="w-3.5 h-3.5" />
              Archive
            </button>
          </form>
        ) : (
          <form action={updateIdeaStatusAction}>
            <input type="hidden" name="id" value={idea.id} />
            <input type="hidden" name="status" value="new" />
            <button
              type="submit"
              aria-label="Restore"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-border-strong text-[12px] text-ink hover:border-ink transition-colors"
            >
              <ArchiveRestore className="w-3.5 h-3.5" />
              Restore
            </button>
          </form>
        )}

        <form action={deleteIdeaAction} className="ml-auto">
          <input type="hidden" name="id" value={idea.id} />
          <button
            type="submit"
            aria-label="Delete"
            className="inline-flex items-center justify-center w-8 h-8 rounded-full text-ink/40 hover:text-primary-deep hover:bg-peach-100/60 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </li>
  );
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
