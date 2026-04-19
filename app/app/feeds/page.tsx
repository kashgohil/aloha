import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { Rss } from "lucide-react";
import { db } from "@/db";
import { feedItems, feeds } from "@/db/schema";
import { CURATED_FEEDS } from "@/lib/feeds/curated";
import { AddFeedDialog } from "./_components/add-feed-dialog";
import { FeedSidebar } from "./_components/feed-sidebar";
import { FeedStream } from "./_components/feed-stream";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

const ITEMS_PER_FEED = 150;

export default async function FeedsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = (await getCurrentUser())!;
  const params = await searchParams;
  const selectedFeedId = first(params.feed) ?? null;

  const userFeeds = await db
    .select({
      id: feeds.id,
      title: feeds.title,
      siteUrl: feeds.siteUrl,
      iconUrl: feeds.iconUrl,
      lastFetchedAt: feeds.lastFetchedAt,
      lastError: feeds.lastError,
    })
    .from(feeds)
    .where(eq(feeds.userId, user.id))
    .orderBy(feeds.title);

  const activeFeed =
    userFeeds.find((f) => f.id === selectedFeedId) ?? userFeeds[0] ?? null;

  const [items, unreadRows, subscribedUrlRows] = await Promise.all([
    activeFeed
      ? db
          .select({
            id: feedItems.id,
            feedId: feedItems.feedId,
            title: feedItems.title,
            summary: feedItems.summary,
            url: feedItems.url,
            author: feedItems.author,
            imageUrl: feedItems.imageUrl,
            publishedAt: feedItems.publishedAt,
            isRead: feedItems.isRead,
            savedAsIdeaId: feedItems.savedAsIdeaId,
          })
          .from(feedItems)
          .where(eq(feedItems.feedId, activeFeed.id))
          .orderBy(desc(feedItems.publishedAt))
          .limit(ITEMS_PER_FEED)
      : Promise.resolve([]),

    // Per-feed unread counts, scoped to this user's feeds.
    db
      .select({
        feedId: feedItems.feedId,
        unread: sql<number>`count(*) filter (where ${feedItems.isRead} = false)`,
      })
      .from(feedItems)
      .innerJoin(feeds, eq(feedItems.feedId, feeds.id))
      .where(eq(feeds.userId, user.id))
      .groupBy(feedItems.feedId),

    db
      .select({ url: feeds.url })
      .from(feeds)
      .where(
        and(
          eq(feeds.userId, user.id),
          inArray(
            feeds.url,
            CURATED_FEEDS.map((c) => c.url),
          ),
        ),
      ),
  ]);

  const unreadByFeed: Record<string, number> = {};
  for (const r of unreadRows) {
    unreadByFeed[r.feedId] = Number(r.unread ?? 0);
  }
  const subscribedUrls = subscribedUrlRows.map((r) => r.url);

  return (
    <div className="space-y-10">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            {user.workspaceName ?? "Your workspace"}
          </p>
          <h1 className="mt-3 font-display text-[44px] lg:text-[52px] leading-[1.02] tracking-[-0.03em] text-ink font-normal">
            Feeds<span className="text-primary font-light">.</span>
          </h1>
          <p className="mt-3 text-[14px] text-ink/65 max-w-xl leading-[1.55]">
            The quieter half of the workflow — where the ideas come from. Add
            feeds or pick from the curated catalog. Save anything worth
            coming back to.
          </p>
        </div>
        <AddFeedDialog subscribedUrls={subscribedUrls} />
      </header>

      {userFeeds.length === 0 ? (
        <EmptyState />
      ) : (
        <section className="grid grid-cols-12 gap-6">
          <aside className="col-span-12 lg:col-span-4 xl:col-span-3">
            <div className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] flex flex-col">
              <FeedSidebar
                feeds={userFeeds}
                activeFeedId={activeFeed?.id ?? null}
                unreadByFeed={unreadByFeed}
              />
            </div>
          </aside>
          <section className="col-span-12 lg:col-span-8 xl:col-span-9">
            {activeFeed ? (
              <FeedStream feed={activeFeed} items={items} />
            ) : null}
          </section>
        </section>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-border-strong bg-background-elev px-8 py-16 text-center">
      <span className="inline-grid place-items-center w-12 h-12 rounded-full bg-peach-100 border border-border">
        <Rss className="w-5 h-5 text-ink" />
      </span>
      <p className="mt-5 font-display text-[24px] leading-[1.15] tracking-[-0.01em] text-ink">
        Start with one feed.
      </p>
      <p className="mt-2 text-[13.5px] text-ink/60 max-w-md mx-auto leading-[1.55]">
        Hit <span className="text-ink font-medium">Add feed</span> up top — pick
        from the catalog, or paste any RSS / Atom URL. We sync daily, dedupe
        items, and give you a one-click save into your swipe file.
      </p>
    </div>
  );
}
