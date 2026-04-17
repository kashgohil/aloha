import { and, desc, eq, inArray } from "drizzle-orm";
import {
  BookmarkCheck,
  BookmarkPlus,
  ExternalLink,
  Plus,
  RefreshCw,
  Rss,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { feedItems, feeds } from "@/db/schema";
import {
  markItemReadAction,
  refreshFeedAction,
  saveItemAsIdeaAction,
  subscribeToFeedAction,
  unsubscribeFeedAction,
} from "@/app/actions/feeds";
import {
  CURATED_CATEGORIES,
  CURATED_FEEDS,
  type CuratedCategory,
} from "@/lib/feeds/curated";
import { getCurrentUser } from "@/lib/current-user";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

const ITEMS_PER_FEED = 50;

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

  // Item fetch: either the active feed only, or every feed the user has
  // (for the default "all" view when no feed is selected via URL).
  const items = activeFeed
    ? await db
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
    : [];

  const subscribedUrls = new Set(
    (await db
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
      )).map((r) => r.url),
  );

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
        <form
          action={subscribeToFeedAction}
          className="flex items-center gap-2 w-full lg:w-auto"
        >
          <input
            name="url"
            type="url"
            required
            placeholder="Paste a feed or site URL"
            className="flex-1 lg:w-80 h-11 px-4 rounded-full border border-border-strong bg-background-elev text-[13.5px] text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[13.5px] font-medium hover:bg-primary transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </form>
      </header>

      {userFeeds.length === 0 ? (
        <EmptyState />
      ) : (
        <section className="grid grid-cols-12 gap-6">
          <aside className="col-span-12 lg:col-span-4 xl:col-span-3">
            <SourceList
              feeds={userFeeds}
              activeFeedId={activeFeed?.id ?? null}
            />
          </aside>
          <section className="col-span-12 lg:col-span-8 xl:col-span-9">
            {activeFeed ? (
              <FeedItems feed={activeFeed} items={items} />
            ) : null}
          </section>
        </section>
      )}

      <CuratedCatalog subscribedUrls={subscribedUrls} />
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
        Paste a URL above, or pick from the curated catalog below. We sync
        daily, dedupe items, and give you a one-click save into your swipe
        file.
      </p>
    </div>
  );
}

type FeedRow = {
  id: string;
  title: string;
  siteUrl: string | null;
  iconUrl: string | null;
  lastFetchedAt: Date | null;
  lastError: string | null;
};

function SourceList({
  feeds: userFeeds,
  activeFeedId,
}: {
  feeds: FeedRow[];
  activeFeedId: string | null;
}) {
  return (
    <ul className="rounded-3xl border border-border bg-background-elev overflow-hidden divide-y divide-border">
      {userFeeds.map((f) => {
        const active = f.id === activeFeedId;
        return (
          <li
            key={f.id}
            className={cn(
              "flex items-center gap-3 px-4 py-3 transition-colors",
              active ? "bg-peach-100/60" : "hover:bg-muted/30",
            )}
          >
            <Link
              href={`/app/feeds?feed=${f.id}`}
              className="flex-1 min-w-0 flex items-center gap-2.5"
            >
              <span className="w-6 h-6 rounded bg-background border border-border grid place-items-center overflow-hidden shrink-0">
                {f.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={f.iconUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Rss className="w-3 h-3 text-ink/50" />
                )}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] text-ink font-medium truncate">
                  {f.title}
                </span>
                {f.lastError ? (
                  <span className="block text-[11px] text-red-600 truncate">
                    {f.lastError}
                  </span>
                ) : f.lastFetchedAt ? (
                  <span className="block text-[11px] text-ink/45">
                    synced{" "}
                    {new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "numeric",
                    }).format(f.lastFetchedAt)}
                  </span>
                ) : null}
              </span>
            </Link>
            <form action={refreshFeedAction}>
              <input type="hidden" name="feedId" value={f.id} />
              <button
                type="submit"
                aria-label="Refresh"
                className="inline-flex items-center justify-center w-7 h-7 rounded-full text-ink/55 hover:text-ink hover:bg-muted/60 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </form>
            <form action={unsubscribeFeedAction}>
              <input type="hidden" name="feedId" value={f.id} />
              <button
                type="submit"
                aria-label="Unsubscribe"
                className="inline-flex items-center justify-center w-7 h-7 rounded-full text-ink/40 hover:text-primary-deep hover:bg-peach-100/60 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </form>
          </li>
        );
      })}
    </ul>
  );
}

type ItemRow = {
  id: string;
  feedId: string;
  title: string;
  summary: string | null;
  url: string | null;
  author: string | null;
  imageUrl: string | null;
  publishedAt: Date | null;
  isRead: boolean;
  savedAsIdeaId: string | null;
};

function FeedItems({ feed, items }: { feed: FeedRow; items: ItemRow[] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-[24px] leading-[1.1] text-ink">
            {feed.title}
          </h2>
          {feed.siteUrl ? (
            <a
              href={feed.siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 inline-flex items-center gap-1 text-[12px] text-ink/55 hover:text-ink transition-colors"
            >
              {hostnameOf(feed.siteUrl)}
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : null}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border-strong bg-background-elev px-5 py-8 text-[13px] text-ink/55 text-center">
          No items yet. The nightly sync will pull the latest — or hit refresh
          on the source.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ItemCard({ item }: { item: ItemRow }) {
  const saved = item.savedAsIdeaId !== null;
  return (
    <li
      className={cn(
        "rounded-2xl border bg-background-elev p-4 flex gap-4",
        item.isRead
          ? "border-border opacity-80"
          : "border-border-strong",
      )}
    >
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageUrl}
          alt=""
          className="w-28 h-28 rounded-xl object-cover border border-border shrink-0 hidden sm:block"
        />
      ) : null}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-[11px] text-ink/50 uppercase tracking-[0.16em]">
          {item.author ? <span>{item.author}</span> : null}
          {item.publishedAt ? (
            <span>
              {new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "numeric",
              }).format(item.publishedAt)}
            </span>
          ) : null}
        </div>
        <h3 className="mt-1.5 text-[15px] text-ink font-medium leading-[1.35]">
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {item.title}
            </a>
          ) : (
            item.title
          )}
        </h3>
        {item.summary ? (
          <p className="mt-2 text-[13px] text-ink/70 leading-[1.55] line-clamp-3">
            {item.summary}
          </p>
        ) : null}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <form action={saveItemAsIdeaAction}>
            <input type="hidden" name="itemId" value={item.id} />
            <button
              type="submit"
              disabled={saved}
              className={cn(
                "inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-medium transition-colors",
                saved
                  ? "bg-ink text-background"
                  : "border border-border-strong text-ink hover:border-ink",
              )}
            >
              {saved ? (
                <>
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  Saved
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  Save to ideas
                </>
              )}
            </button>
          </form>
          {!item.isRead ? (
            <form action={markItemReadAction}>
              <input type="hidden" name="itemId" value={item.id} />
              <input type="hidden" name="read" value="true" />
              <button
                type="submit"
                className="inline-flex items-center h-8 px-3 rounded-full text-[12px] text-ink/60 hover:text-ink transition-colors"
              >
                Mark read
              </button>
            </form>
          ) : null}
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 h-8 px-3 text-[12px] text-ink/60 hover:text-ink transition-colors"
            >
              Open
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function CuratedCatalog({ subscribedUrls }: { subscribedUrls: Set<string> }) {
  return (
    <section className="rounded-3xl border border-border bg-background-elev p-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            Discover
          </p>
          <h2 className="mt-1.5 font-display text-[22px] leading-[1.15] text-ink">
            Curated catalog
          </h2>
          <p className="mt-1.5 text-[13px] text-ink/65 max-w-xl leading-[1.55]">
            A starter set of feeds worth reading, grouped by category. One
            click to subscribe.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {CURATED_CATEGORIES.map((category) => (
          <CategoryBlock
            key={category}
            category={category}
            subscribedUrls={subscribedUrls}
          />
        ))}
      </div>
    </section>
  );
}

function CategoryBlock({
  category,
  subscribedUrls,
}: {
  category: CuratedCategory;
  subscribedUrls: Set<string>;
}) {
  const items = CURATED_FEEDS.filter((f) => f.category === category);
  if (items.length === 0) return null;
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-ink/55 mb-3">
        {category}
      </p>
      <ul className="space-y-2">
        {items.map((item) => {
          const subscribed = subscribedUrls.has(item.url);
          return (
            <li
              key={item.url}
              className="flex items-start justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-ink font-medium truncate">
                  {item.title}
                </p>
                <p className="text-[11.5px] text-ink/55 leading-[1.4] line-clamp-2">
                  {item.description}
                </p>
              </div>
              <form action={subscribeToFeedAction}>
                <input type="hidden" name="url" value={item.url} />
                <input type="hidden" name="category" value={item.category} />
                <button
                  type="submit"
                  disabled={subscribed}
                  className={cn(
                    "inline-flex items-center h-7 px-2.5 rounded-full text-[11.5px] font-medium transition-colors shrink-0",
                    subscribed
                      ? "bg-ink text-background"
                      : "border border-border-strong text-ink hover:border-ink",
                  )}
                >
                  {subscribed ? "Subscribed" : "Subscribe"}
                </button>
              </form>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
