import { and, desc, eq } from "drizzle-orm";
import {
  Archive,
  ArchiveRestore,
  BookOpen,
  ExternalLink,
  Lightbulb,
  Link2,
  Pencil,
  PenSquare,
  Rss,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { ideas, type PostMedia } from "@/db/schema";
import { updateIdeaStatusAction } from "@/app/actions/ideas";
import { DeleteIdeaButton } from "./_components/delete-confirm";
import { IdeaPanel } from "./_components/idea-panel";
import { MarkdownView } from "@/components/ui/markdown-view";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { PendingSubmitButton } from "@/components/ui/pending-submit";
import { getCurrentUser } from "@/lib/current-user";
import { getCurrentContext } from "@/lib/current-context";
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

  const ctx = (await getCurrentContext())!;

  const { workspace } = ctx;
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
      media: ideas.media,
      tags: ideas.tags,
      status: ideas.status,
      createdAt: ideas.createdAt,
    })
    .from(ideas)
    .where(
      filter === "all"
        ? eq(ideas.workspaceId, workspace.id)
        : and(eq(ideas.workspaceId, workspace.id), eq(ideas.status, filter)),
    )
    .orderBy(desc(ideas.createdAt));

  const counts = await db
    .select({ status: ideas.status })
    .from(ideas)
    .where(eq(ideas.workspaceId, workspace.id));
  const countBy = (s: string) => counts.filter((c) => c.status === s).length;

  return (
    <div className="space-y-10">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            Ideas
          </p>
          <h1 className="mt-3 font-display text-[44px] lg:text-[52px] leading-[1.02] tracking-[-0.03em] text-ink font-normal">
            Ideas<span className="text-primary font-light">.</span>
          </h1>
          <p className="mt-3 text-[14px] text-ink/65 max-w-xl leading-[1.55]">
            Swipe file. Half-thoughts. Hooks you want to come back to. Drop
            anything here; pull into a draft when it&apos;s time to write.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/app/ideas/clip-tools"
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-border bg-background text-[13px] font-medium text-ink hover:border-ink transition-colors"
          >
            <Link2 className="w-3.5 h-3.5" />
            Capture from anywhere
          </Link>
          <IdeaPanel />
        </div>
      </header>

      <FilterTabs
        activeKey={filter}
        items={[
          {
            key: "new",
            label: "New",
            href: "/app/ideas?filter=new",
            count: countBy("new"),
          },
          {
            key: "drafted",
            label: "Drafted",
            href: "/app/ideas?filter=drafted",
            count: countBy("drafted"),
          },
          {
            key: "archived",
            label: "Archived",
            href: "/app/ideas?filter=archived",
            count: countBy("archived"),
          },
          {
            key: "all",
            label: "All",
            href: "/app/ideas?filter=all",
            count: counts.length,
          },
        ]}
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
      {filter === "new" || filter === "all" ? (
        <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
          <Link
            href="/app/feeds"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-border-strong text-[12.5px] font-medium text-ink hover:border-ink transition-colors"
          >
            <Rss className="w-3.5 h-3.5" />
            Browse feeds
          </Link>
          <Link
            href="/app/settings/muse"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-border-strong text-[12.5px] font-medium text-ink hover:border-ink transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Sync from Notion
          </Link>
        </div>
      ) : null}
    </div>
  );
}

type IdeaRow = {
  id: string;
  source: string;
  sourceUrl: string | null;
  title: string | null;
  body: string;
  media: PostMedia[] | null;
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

      <MarkdownView
        compact
        clamp={idea.title ? 6 : 8}
        className={cn(
          "text-ink/80",
          idea.title ? "" : "font-medium text-ink",
        )}
      >
        {idea.body}
      </MarkdownView>

      {idea.media && idea.media.length > 0 ? (
        <ul
          className={cn(
            "grid gap-1.5",
            idea.media.length === 1
              ? "grid-cols-1"
              : idea.media.length === 2
                ? "grid-cols-2"
                : "grid-cols-3",
          )}
        >
          {idea.media.slice(0, 3).map((m, i) => (
            <li
              key={m.url}
              className="relative aspect-square rounded-xl overflow-hidden border border-border bg-background"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.url}
                alt={m.alt ?? ""}
                className="w-full h-full object-cover"
              />
              {i === 2 && idea.media!.length > 3 ? (
                <span className="absolute inset-0 grid place-items-center bg-ink/55 text-background text-[13px] font-medium">
                  +{idea.media!.length - 3}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

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

      <div className="mt-auto pt-1 flex items-center gap-1 flex-wrap">
        {!isArchived ? (
          <Link
            href={`?compose=new&idea=${idea.id}`}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-ink text-background text-[12px] font-medium hover:bg-primary transition-colors"
          >
            <PenSquare className="w-3.5 h-3.5" />
            {isDrafted ? "Open draft" : "Use as draft"}
          </Link>
        ) : null}

        {!isArchived ? (
          <IdeaPanel
            idea={{
              id: idea.id,
              body: idea.body,
              title: idea.title,
              tags: idea.tags,
              sourceUrl: idea.sourceUrl,
              media: idea.media,
            }}
          >
            <span
              aria-label="Edit"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] text-ink/65 hover:text-ink transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </span>
          </IdeaPanel>
        ) : null}

        {!isArchived ? (
          <form action={updateIdeaStatusAction}>
            <input type="hidden" name="id" value={idea.id} />
            <input type="hidden" name="status" value="archived" />
            <PendingSubmitButton
              aria-label="Archive"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] text-ink/65 hover:text-ink transition-colors"
              pendingLabel="Archiving…"
            >
              <Archive className="w-3.5 h-3.5" />
              Archive
            </PendingSubmitButton>
          </form>
        ) : (
          <form action={updateIdeaStatusAction}>
            <input type="hidden" name="id" value={idea.id} />
            <input type="hidden" name="status" value="new" />
            <PendingSubmitButton
              aria-label="Restore"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-border-strong text-[12px] text-ink hover:border-ink transition-colors"
              pendingLabel="Restoring…"
            >
              <ArchiveRestore className="w-3.5 h-3.5" />
              Restore
            </PendingSubmitButton>
          </form>
        )}

        <DeleteIdeaButton ideaId={idea.id} />
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
