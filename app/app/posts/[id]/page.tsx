import { db } from "@/db";
import {
  channelProfiles,
  posts,
  postDeliveries,
  type ChannelOverride,
  type PostMedia,
} from "@/db/schema";
import { getCurrentContext } from "@/lib/current-context";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  ExternalLink,
} from "lucide-react";
import { CHANNEL_ICONS, CHANNEL_LABELS, channelLabel } from "@/components/channel-chip";
import type { PostStatus } from "@/lib/posts/transitions";
import { PostHeaderActions } from "./_components/post-header-actions";
import { MarkPostedButton } from "./_components/mark-posted-button";
import { formatTzDateOrdinal } from "@/lib/tz";
import { cn } from "@/lib/utils";
import { PostAnalytics } from "./_components/post-analytics";
import { PostReplies } from "./_components/post-replies";
import { RefreshRepliesButton } from "./_components/refresh-replies-button";
import { RescheduleButton } from "./_components/reschedule-button";
import { PostPreviewCard } from "@/components/post-preview-card";
import { PostNotes } from "@/components/post-notes";
import { listMentionableMembers, listNotes } from "@/app/actions/post-notes";
import { listReviewerOptions } from "@/app/actions/posts";
import { ReviewerPicker } from "./_components/reviewer-picker";
import { hasRole, ROLES } from "@/lib/workspaces/roles";

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

function statusDotClass(status: string, selected: boolean): string {
  switch (status) {
    case "published":
      return "bg-emerald-500";
    case "approved":
      return "bg-emerald-400";
    case "scheduled":
      return "bg-primary";
    case "in_review":
      return "bg-amber-500";
    case "failed":
    case "needs_reauth":
      return "bg-destructive";
    case "draft":
    default:
      return selected ? "bg-background/60" : "bg-ink/30";
  }
}

function formatDateTime(date: Date | null, tz: string) {
  if (!date) return null;
  return formatTzDateOrdinal(date, tz, { time: true });
}

// Subheader label on the preview card ("Jan 12 · 2:30 PM" / "Scheduled for …" /
// "Draft"). Published posts use publishedAt; scheduled uses scheduledAt with
// a "Scheduled for" prefix so it doesn't look like the post has already
// happened.
function previewTimestampLabel(
  post: { status: string; scheduledAt: Date | null; publishedAt: Date | null },
  tz: string,
): string {
  if (post.status === "published" && post.publishedAt) {
    return formatDateTime(post.publishedAt, tz) ?? "Published";
  }
  if (post.status === "scheduled" && post.scheduledAt) {
    const t = formatDateTime(post.scheduledAt, tz);
    return t ? `Scheduled · ${t}` : "Scheduled";
  }
  if (post.status === "failed") return "Failed";
  return "Draft";
}

export default async function PostDetailPage({
  params,
  searchParams,
}: {
  params: RouteParams;
  searchParams: SearchParams;
}) {
  const ctx = (await getCurrentContext())!;
  const { user, workspace } = ctx;
  const tz = workspace.timezone ?? user.timezone ?? "UTC";

  const { id } = await params;
  const sp = await searchParams;

  const [post] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.id, id), eq(posts.workspaceId, workspace.id)))
    .limit(1);

  if (!post) notFound();

  const deliveries = await db
    .select()
    .from(postDeliveries)
    .where(eq(postDeliveries.postId, post.id))
    .orderBy(postDeliveries.platform);

  // Pull each channel's connected-account profile (avatar + display name +
  // handle) so the preview card shows the real identity followers see on
  // that channel instead of the generic Aloha account holder.
  const profileRows = await db
    .select({
      channel: channelProfiles.channel,
      displayName: channelProfiles.displayName,
      handle: channelProfiles.handle,
      avatarUrl: channelProfiles.avatarUrl,
    })
    .from(channelProfiles)
    .where(eq(channelProfiles.workspaceId, workspace.id));
  const profileByChannel = new Map(
    profileRows.map((p) => [
      p.channel,
      {
        displayName: p.displayName,
        handle: p.handle,
        avatarUrl: p.avatarUrl,
      },
    ]),
  );

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

  const publishedLabel = formatDateTime(post.publishedAt, tz);

  const [notes, reviewerOptions, mentionableMembers, children, parent] =
    await Promise.all([
      listNotes(post.id),
      listReviewerOptions(),
      listMentionableMembers(),
      // Resurfaces of THIS post — drafts the recycle automation cloned
      // (or that may exist in the future via a manual "spin off" action).
      db
        .select({
          id: posts.id,
          status: posts.status,
          createdAt: posts.createdAt,
          publishedAt: posts.publishedAt,
        })
        .from(posts)
        .where(
          and(
            eq(posts.parentPostId, post.id),
            eq(posts.workspaceId, workspace.id),
          ),
        )
        .orderBy(asc(posts.createdAt)),
      // If THIS post is itself a resurface, fetch its origin so the UI
      // can link back. Two-step lookup to keep the join minimal.
      post.parentPostId
        ? db
            .select({
              id: posts.id,
              status: posts.status,
              publishedAt: posts.publishedAt,
            })
            .from(posts)
            .where(
              and(
                eq(posts.id, post.parentPostId),
                eq(posts.workspaceId, workspace.id),
              ),
            )
            .limit(1)
            .then((rows) => rows[0] ?? null)
        : Promise.resolve(null),
    ]);

  // Reviewer picker shows when the post is in an assignable stage. Server
  // action re-validates permission on click; UI just decides visibility.
  const showReviewerPicker =
    post.status === "in_review" ||
    post.status === "approved" ||
    post.status === "draft";
  const canAssignReviewer =
    showReviewerPicker &&
    (hasRole(ctx.role, ROLES.ADMIN) ||
      ctx.user.id === post.submittedBy ||
      ctx.user.id === post.assignedReviewerId);

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
            {post.status === "scheduled" && post.scheduledAt && (
              <RescheduleButton
                postId={post.id}
                scheduledAtIso={post.scheduledAt.toISOString()}
                timezone={tz}
              />
            )}
            {publishedLabel && post.status === "published" && (
              <span className="inline-flex items-center gap-1.5 text-[12px] text-ink/65">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {publishedLabel}
              </span>
            )}
            {showReviewerPicker ? (
              <ReviewerPicker
                postId={post.id}
                reviewers={reviewerOptions}
                assignedUserId={post.assignedReviewerId ?? null}
                viewerUserId={ctx.user.id}
                canAssign={canAssignReviewer}
              />
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2 self-start">
          {post.status === "published" && (
            <RefreshRepliesButton postId={post.id} />
          )}
          <PostHeaderActions
            postId={post.id}
            status={post.status as PostStatus}
            workspaceRole={ctx.role}
            timezone={tz}
            evergreenMarkedAt={post.evergreenMarkedAt?.toISOString() ?? null}
          />
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
                    statusDotClass(chipStatus, isSelected),
                  )}
                />
              </Link>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        <div className="lg:col-span-7 space-y-8 min-w-0">
      {/* Selected channel details (left column) */}
      {selectedChannel && (
        <section className="space-y-6">
          {(selectedDelivery?.remoteUrl ||
            (selectedDelivery?.status === "failed" &&
              selectedDelivery.errorMessage)) && (
            <div className="space-y-3">
              {selectedDelivery?.remoteUrl && (
                <div className="flex justify-end">
                  <a
                    href={selectedDelivery.remoteUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1.5 text-[12px] text-ink/60 hover:text-ink transition-colors"
                  >
                    View on {channelLabel(selectedChannel)}
                    <ExternalLink className="w-3 h-3" />
                  </a>
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
          )}

          {/*
            Manual override for stuck `manual_assist` deliveries. Shown
            when the channel is in reminder-only mode and the user
            posted themselves but the extension didn't catch it (or
            they posted from mobile / a different surface). REVIEWER+
            only — same gate as schedule/publish.
          */}
          {selectedDelivery?.status === "manual_assist" &&
          hasRole(ctx.role, ROLES.REVIEWER) ? (
            <div className="rounded-xl border border-peach-300 bg-peach-100/40 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-[12.5px] text-ink leading-[1.5]">
                Already posted on {channelLabel(selectedChannel)}? Mark
                this delivery as done so analytics catch up.
              </p>
              <MarkPostedButton
                postId={post.id}
                platform={selectedChannel}
                channelLabel={channelLabel(selectedChannel)}
              />
            </div>
          ) : null}

          <PostAnalytics
            deliveryId={selectedDelivery?.id ?? null}
            platform={selectedChannel}
          />

          <PostReplies
            userId={user.id}
            workspaceId={workspace.id}
            platform={selectedChannel}
            rootRemoteId={selectedDelivery?.remotePostId ?? null}
            tz={tz}
          />
        </section>
      )}

      <ResurfaceLineage
        parent={parent}
        children={children}
        lastResurfacedAt={post.lastResurfacedAt}
        evergreenMarkedAt={post.evergreenMarkedAt}
        tz={tz}
      />

      <PostNotes
        postId={post.id}
        initialNotes={notes}
        members={mentionableMembers}
      />
        </div>

        {/* Right column — sticky preview */}
        {selectedChannel && (
          <aside className="lg:col-span-5 lg:sticky lg:top-8 self-start">
            <div className="rounded-2xl w-full shadow-[0_14px_32px_-18px_rgba(26,22,18,0.2)]">
              <PostPreviewCard
                channel={selectedChannel}
                author={{
                  name: user.name ?? "You",
                  image: user.image ?? null,
                }}
                profile={profileByChannel.get(selectedChannel) ?? null}
                content={resolvedContent}
                media={resolvedMedia}
                timestampLabel={previewTimestampLabel(post, tz)}
                articleClassName="max-w-none"
              />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

// Surfaces resurface lineage on a post's detail page. On an origin post,
// lists every child draft the recycle automation (or future "spin off"
// action) cloned from it. On a child post, links back to the origin.
// Returns null when neither side has anything to show, so we don't add
// blank space to vanilla posts.
function ResurfaceLineage({
  parent,
  children,
  lastResurfacedAt,
  evergreenMarkedAt,
  tz,
}: {
  parent: { id: string; status: string; publishedAt: Date | null } | null;
  children: { id: string; status: string; createdAt: Date; publishedAt: Date | null }[];
  lastResurfacedAt: Date | null;
  evergreenMarkedAt: Date | null;
  tz: string;
}) {
  if (!parent && children.length === 0 && !evergreenMarkedAt) return null;

  return (
    <section className="rounded-2xl border border-border bg-background-elev p-5 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          Lineage
        </p>
        {evergreenMarkedAt ? (
          <span className="inline-flex items-center h-5 px-2 rounded-full bg-primary-soft border border-primary/40 text-[10.5px] font-medium tracking-wide text-primary-deep">
            Marked evergreen
          </span>
        ) : null}
      </div>

      {parent ? (
        <div className="text-[13px] text-ink/75 leading-[1.55]">
          Resurfaced from{" "}
          <Link
            href={`/app/posts/${parent.id}`}
            className="text-ink font-medium underline underline-offset-4 decoration-dotted hover:decoration-solid"
          >
            an earlier post
          </Link>
          {parent.publishedAt
            ? ` originally published ${formatDateTime(parent.publishedAt, tz)}`
            : ""}
          .
        </div>
      ) : null}

      {children.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[12px] text-ink/65">
            {children.length === 1
              ? "Resurfaced once:"
              : `Resurfaced ${children.length} times:`}
            {lastResurfacedAt
              ? ` last on ${formatDateTime(lastResurfacedAt, tz)}.`
              : ""}
          </p>
          <ul className="space-y-1.5">
            {children.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-2 text-[12.5px] text-ink/75"
              >
                <span className="inline-flex items-center h-5 px-2 rounded-full bg-background border border-border text-[10.5px] tracking-wide text-ink/65">
                  {c.status}
                </span>
                <Link
                  href={`/app/posts/${c.id}`}
                  className="text-ink hover:underline underline-offset-4 decoration-dotted"
                >
                  Draft from {formatDateTime(c.createdAt, tz)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : evergreenMarkedAt && !parent ? (
        <p className="text-[12.5px] text-ink/55">
          Hasn&apos;t been resurfaced yet — the recycle automation will
          pick it up on its next run, respecting a 90-day cool-off
          between resurfaces of the same post.
        </p>
      ) : null}
    </section>
  );
}
