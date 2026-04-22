import { db } from "@/db";
import { posts, postDeliveries, type ChannelOverride, type PostMedia } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  ExternalLink,
  Pencil,
} from "lucide-react";
import { CHANNEL_ICONS, CHANNEL_LABELS, channelLabel } from "@/components/channel-chip";
import { cn } from "@/lib/utils";
import { PostAnalytics } from "./_components/post-analytics";
import { PostReplies } from "./_components/post-replies";
import { RefreshRepliesButton } from "./_components/refresh-replies-button";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type RouteParams = Promise<{ id: string }>;

const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

const STATUS_META: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  draft: { label: "Draft", icon: FileText, className: "bg-muted text-ink/70" },
  scheduled: { label: "Scheduled", icon: Clock, className: "bg-primary-soft text-primary" },
  published: { label: "Published", icon: CheckCircle2, className: "bg-peach-100 text-ink/80" },
  failed: { label: "Failed", icon: AlertCircle, className: "bg-destructive/10 text-destructive" },
  pending: { label: "Pending", icon: Clock, className: "bg-muted text-ink/70" },
  needs_reauth: {
    label: "Needs reauth",
    icon: AlertCircle,
    className: "bg-amber-100 text-amber-900",
  },
  pending_review: {
    label: "Pending review",
    icon: Clock,
    className: "bg-muted text-ink/70",
  },
  manual_assist: {
    label: "Manual assist",
    icon: Clock,
    className: "bg-muted text-ink/70",
  },
  deleted: { label: "Deleted", icon: AlertCircle, className: "bg-ink/10 text-ink/60" },
};

function formatDateTime(date: Date | null, tz: string) {
  if (!date) return null;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: tz,
  }).format(date);
}

export default async function PostDetailPage({
  params,
  searchParams,
}: {
  params: RouteParams;
  searchParams: SearchParams;
}) {
  const user = (await getCurrentUser())!;
  const tz = user.timezone ?? "UTC";

  const { id } = await params;
  const sp = await searchParams;

  const [post] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.id, id), eq(posts.userId, user.id)))
    .limit(1);

  if (!post) notFound();

  const deliveries = await db
    .select()
    .from(postDeliveries)
    .where(eq(postDeliveries.postId, post.id))
    .orderBy(postDeliveries.platform);

  // Channel chips come from post_deliveries when present (post has been
  // scheduled/published) and fall back to posts.platforms for drafts that
  // haven't created deliveries yet.
  const channelList: string[] =
    deliveries.length > 0
      ? deliveries.map((d) => d.platform)
      : post.platforms;

  const selectedChannel =
    first(sp.channel) && channelList.includes(first(sp.channel)!)
      ? first(sp.channel)!
      : channelList[0] ?? null;

  const selectedDelivery =
    selectedChannel != null
      ? deliveries.find((d) => d.platform === selectedChannel) ?? null
      : null;

  // Resolve per-channel content: channelContent override wins if defined,
  // otherwise inherit the base post content/media.
  const overrides = (post.channelContent ?? {}) as Record<
    string,
    ChannelOverride
  >;
  const override = selectedChannel ? overrides[selectedChannel] : undefined;
  const resolvedContent = override?.content ?? post.content;
  const resolvedMedia: PostMedia[] =
    override?.media ?? post.media ?? [];

  const statusMeta = STATUS_META[post.status] ?? STATUS_META.draft;
  const StatusIcon = statusMeta.icon;

  const scheduledLabel = formatDateTime(post.scheduledAt, tz);
  const publishedLabel = formatDateTime(post.publishedAt, tz);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/app/posts"
          className="inline-flex items-center gap-1.5 text-[12px] text-ink/60 hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All posts
        </Link>
      </div>

      <header className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-medium",
                statusMeta.className,
              )}
            >
              <StatusIcon className="w-3 h-3" />
              {statusMeta.label}
            </span>
            {scheduledLabel && post.status === "scheduled" && (
              <span className="inline-flex items-center gap-1.5 text-[12px] text-ink/65">
                <CalendarClock className="w-3.5 h-3.5" />
                {scheduledLabel}
              </span>
            )}
            {publishedLabel && post.status === "published" && (
              <span className="inline-flex items-center gap-1.5 text-[12px] text-ink/65">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {publishedLabel}
              </span>
            )}
          </div>
          <h1 className="font-display text-[32px] lg:text-[40px] leading-[1.05] tracking-[-0.02em] text-ink font-normal">
            Post<span className="text-primary font-light">.</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 self-start">
          {post.status === "published" && (
            <RefreshRepliesButton postId={post.id} />
          )}
          {(post.status === "draft" || post.status === "scheduled") && (
            <Link
              href={`/app/composer?post=${post.id}`}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-border bg-background text-[13px] font-medium text-ink hover:border-ink/40 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </Link>
          )}
        </div>
      </header>

      {/* Channel chips */}
      {channelList.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {channelList.map((channel) => {
            const Icon = CHANNEL_ICONS[channel];
            const isSelected = channel === selectedChannel;
            const delivery = deliveries.find((d) => d.platform === channel);
            const chipStatus = delivery?.status ?? post.status;
            const chipMeta = STATUS_META[chipStatus] ?? statusMeta;
            return (
              <Link
                key={channel}
                href={`/app/posts/${post.id}?channel=${channel}`}
                scroll={false}
                className={cn(
                  "inline-flex items-center gap-2 h-10 px-4 rounded-full border text-[13px] font-medium transition-colors",
                  isSelected
                    ? "bg-ink text-background border-ink"
                    : "bg-background text-ink/70 border-border hover:border-ink/30 hover:text-ink",
                )}
              >
                {Icon ? <Icon className="w-3.5 h-3.5" /> : null}
                {CHANNEL_LABELS[channel] ?? channel}
                <span
                  className={cn(
                    "inline-block w-1.5 h-1.5 rounded-full",
                    chipMeta.className.includes("destructive")
                      ? "bg-destructive"
                      : chipStatus === "published"
                        ? "bg-emerald-500"
                        : "bg-ink/30",
                  )}
                />
              </Link>
            );
          })}
        </div>
      )}

      {/* Selected channel view */}
      {selectedChannel && (
        <section className="space-y-6">
          <div className="rounded-2xl border border-border bg-background-elev p-6 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/55">
                {channelLabel(selectedChannel)} · Content
              </p>
              {selectedDelivery?.remoteUrl && (
                <a
                  href={selectedDelivery.remoteUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 text-[12px] text-ink/60 hover:text-ink transition-colors"
                >
                  View on {channelLabel(selectedChannel)}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <p className="text-[15px] text-ink leading-[1.6] whitespace-pre-wrap">
              {resolvedContent}
            </p>
            {resolvedMedia.length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {resolvedMedia.map((m, i) => (
                  <div
                    key={`${m.url}-${i}`}
                    className="relative aspect-square rounded-xl overflow-hidden border border-border bg-background"
                  >
                    {m.mimeType.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.url}
                        alt={m.alt ?? ""}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-[12px] text-ink/50">
                        {m.mimeType}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {selectedDelivery?.status === "failed" &&
              selectedDelivery.errorMessage && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13px] text-destructive">
                  <span className="font-medium">Failed:</span>{" "}
                  {selectedDelivery.errorMessage}
                </div>
              )}
          </div>

          <PostAnalytics
            deliveryId={selectedDelivery?.id ?? null}
            platform={selectedChannel}
          />

          <PostReplies
            userId={user.id}
            platform={selectedChannel}
            rootRemoteId={selectedDelivery?.remotePostId ?? null}
            tz={tz}
          />
        </section>
      )}
    </div>
  );
}
