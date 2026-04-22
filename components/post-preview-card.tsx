// Post preview card — what the post looks like rendered on the chosen
// channel. Same surface used in the composer's live preview pane and on the
// post detail page, so the two surfaces show an identical card.

import {
  Bookmark,
  Globe2,
  Heart,
  MessageSquare,
  MoreHorizontal,
  Repeat2,
  Reply,
  Share,
  Star,
} from "lucide-react";
import { CHANNEL_ICONS, channelLabel } from "@/components/channel-chip";
import { cn } from "@/lib/utils";
import type { PostMedia } from "@/db/schema";

// Platform-specific visual accent for the small channel chip on the card
// header. Unknown channels fall back to the ink chip.
const CHANNEL_ACCENT: Record<string, string> = {
  twitter: "bg-ink text-background",
  x: "bg-ink text-background",
  linkedin: "bg-[#0a66c2] text-white",
  instagram:
    "bg-gradient-to-tr from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white",
  facebook: "bg-[#1877f2] text-white",
  tiktok: "bg-ink text-background",
  threads: "bg-ink text-background",
  bluesky: "bg-[#0085ff] text-white",
  mastodon: "bg-[#6364ff] text-white",
  telegram: "bg-[#229ED9] text-white",
  youtube: "bg-[#ff0000] text-white",
  medium: "bg-ink text-background",
  reddit: "bg-[#ff4500] text-white",
};

// Default "@handle" placeholder per channel, used when we don't have a real
// one from channelProfiles. Mirrors the composer's PLATFORMS table.
const CHANNEL_HANDLE: Record<string, string> = {
  twitter: "@handle",
  x: "@handle",
  linkedin: "in/handle",
  instagram: "@handle",
  facebook: "/handle",
  tiktok: "@handle",
  threads: "@handle",
  bluesky: "@handle",
  mastodon: "@handle",
  telegram: "@handle",
  youtube: "@handle",
  medium: "@username",
  reddit: "u/username",
};

export type PostPreviewAuthor = {
  name: string;
  image: string | null;
};

export type PostPreviewProfile = {
  displayName: string | null;
  handle: string | null;
  avatarUrl: string | null;
};

export function PostPreviewCard({
  channel,
  author,
  profile,
  handle,
  content,
  media,
  timestampLabel = "just now",
  articleClassName,
}: {
  channel: string;
  // Fallback identity (the Aloha account holder) used when we don't have a
  // connected-channel profile on file yet.
  author: PostPreviewAuthor;
  // Preferred — the connected channel's own profile (avatar + display name
  // + handle). When provided, drives the card header so the preview looks
  // like what subscribers will actually see on that channel.
  profile?: PostPreviewProfile | null;
  handle?: string | null;
  content: string;
  media?: PostMedia[];
  // Shown in the subheader line (e.g. "just now" in composer, "2d" on the
  // post page, or a formatted date).
  timestampLabel?: string;
  // Extra classes merged onto the outer article — use to override the
  // built-in max-width cap when the card needs to fill its container.
  articleClassName?: string;
}) {
  const Icon = CHANNEL_ICONS[channel];
  const accent = CHANNEL_ACCENT[channel] ?? "bg-ink text-background";

  const displayName = profile?.displayName ?? author.name;
  const avatarUrl = profile?.avatarUrl ?? author.image;
  const resolvedHandle =
    profile?.handle ?? handle ?? CHANNEL_HANDLE[channel] ?? "@handle";

  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("") || "A";

  const text = content.trim().length > 0 ? content : null;

  if (channel === "mastodon") {
    return (
      <MastodonPreview
        displayName={displayName}
        handle={resolvedHandle}
        avatarUrl={avatarUrl}
        initials={initials}
        text={text}
        media={media}
        timestampLabel={timestampLabel}
        articleClassName={articleClassName}
      />
    );
  }

  if (channel === "bluesky") {
    return (
      <BlueskyPreview
        displayName={displayName}
        handle={resolvedHandle}
        avatarUrl={avatarUrl}
        initials={initials}
        text={text}
        media={media}
        timestampLabel={timestampLabel}
        articleClassName={articleClassName}
      />
    );
  }

  return (
    <article className={cn("w-full max-w-[560px] rounded-2xl border border-border bg-background-elev overflow-hidden", articleClassName)}>
      <header className="px-5 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-full overflow-hidden border border-border bg-peach-100 grid place-items-center text-[12px] font-semibold text-ink">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              initials
            )}
          </span>
          <div className="min-w-0">
            <p className="text-[14px] font-medium text-ink leading-tight truncate">
              {displayName}
            </p>
            <p className="text-[12px] text-ink/55 leading-tight truncate">
              {resolvedHandle} · {timestampLabel}
            </p>
          </div>
        </div>
        <span
          aria-label={channelLabel(channel)}
          className={cn(
            "inline-flex items-center justify-center w-6 h-6 rounded-full",
            accent,
          )}
        >
          {Icon ? <Icon className="w-3 h-3" /> : null}
        </span>
      </header>

      <div className="px-5 py-4 space-y-3">
        {text ? (
          <p className="text-[14.5px] leading-[1.55] text-ink whitespace-pre-wrap break-words">
            {text}
          </p>
        ) : (
          <p className="text-[14px] text-ink/35 italic">
            Your post will appear here as you type.
          </p>
        )}
        {media && media.length > 0 ? (
          <div
            className={cn(
              "grid gap-1.5 overflow-hidden rounded-xl border border-border",
              media.length === 1 && "grid-cols-1",
              media.length === 2 && "grid-cols-2",
              media.length >= 3 && "grid-cols-2",
            )}
          >
            {media.slice(0, 4).map((m, i) => (
              <div
                key={`${m.url}-${i}`}
                className={cn(
                  "relative bg-background",
                  media.length === 1 ? "aspect-[16/10]" : "aspect-square",
                  media.length === 3 && i === 0 && "row-span-2 aspect-auto",
                )}
              >
                {m.mimeType.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.url}
                    alt={m.alt ?? ""}
                    className="w-full h-full object-cover"
                  />
                ) : m.mimeType.startsWith("video/") ? (
                  <video
                    src={m.url}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-[11px] text-ink/50">
                    {m.mimeType}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <footer className="px-5 py-3 border-t border-border flex items-center justify-between text-ink/45">
        <div className="flex items-center gap-5">
          <IconAction Icon={Heart} />
          <IconAction Icon={MessageSquare} />
          <IconAction Icon={Repeat2} />
          <IconAction Icon={Share} />
        </div>
        <IconAction Icon={Bookmark} />
      </footer>
    </article>
  );
}

function IconAction({
  Icon,
}: {
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-hidden
      className="inline-flex items-center justify-center w-7 h-7 rounded-full hover:bg-muted/60 transition-colors"
    >
      <Icon className="w-[15px] h-[15px]" />
    </button>
  );
}

// Bluesky-specific layout: dark navy surface, avatar on the left rail,
// header (name · handle · time) inline above wrapped text, image inset
// with rounded corners, and a spread footer row of action glyphs — to
// mimic how a post actually renders in the Bluesky app dark theme.
function BlueskyPreview({
  displayName,
  handle,
  avatarUrl,
  initials,
  text,
  media,
  timestampLabel,
  articleClassName,
}: {
  displayName: string;
  handle: string;
  avatarUrl: string | null;
  initials: string;
  text: string | null;
  media?: PostMedia[];
  timestampLabel: string;
  articleClassName?: string;
}) {
  return (
    <article className={cn("w-full max-w-[560px] rounded-2xl border border-border bg-background-elev overflow-hidden", articleClassName)}>
      <div className="flex gap-3 px-4 pt-4">
        <span className="shrink-0 w-10 h-10 rounded-full overflow-hidden border border-border bg-peach-100 grid place-items-center text-[12px] font-semibold text-ink">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            initials
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[14px] leading-tight flex-wrap">
            <span className="font-semibold text-ink truncate">
              {displayName}
            </span>
            <span className="text-ink/55 truncate">{handle}</span>
            <span className="text-ink/55">·</span>
            <span className="text-ink/55">{timestampLabel}</span>
          </div>
          {text ? (
            <p className="mt-0.5 text-[14.5px] leading-[1.4] text-ink whitespace-pre-wrap break-words">
              {text}
            </p>
          ) : (
            <p className="mt-0.5 text-[14px] italic text-ink/35">
              Your post will appear here as you type.
            </p>
          )}
        </div>
      </div>

      {media && media.length > 0 ? (
        <div className="px-4 pt-3">
          <div
            className={cn(
              "grid gap-1 overflow-hidden rounded-xl border border-border",
              media.length === 1 && "grid-cols-1",
              media.length === 2 && "grid-cols-2",
              media.length >= 3 && "grid-cols-2",
            )}
          >
            {media.slice(0, 4).map((m, i) => (
              <div
                key={`${m.url}-${i}`}
                className={cn(
                  "relative bg-background",
                  media.length === 1 ? "aspect-[4/5]" : "aspect-square",
                  media.length === 3 && i === 0 && "row-span-2 aspect-auto",
                )}
              >
                {m.mimeType.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.url}
                    alt={m.alt ?? ""}
                    className="w-full h-full object-cover"
                  />
                ) : m.mimeType.startsWith("video/") ? (
                  <video
                    src={m.url}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-[11px] text-ink/50">
                    {m.mimeType}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <footer className="px-4 py-3 mt-1 flex items-center justify-between text-ink/50">
        <div className="flex items-center gap-6">
          <BskyAction Icon={MessageSquare} />
          <BskyAction Icon={Repeat2} />
          <BskyAction Icon={Heart} />
        </div>
        <div className="flex items-center gap-4">
          <BskyAction Icon={Bookmark} />
          <BskyAction Icon={Share} />
          <BskyAction Icon={MoreHorizontal} />
        </div>
      </footer>
    </article>
  );
}

function BskyAction({
  Icon,
}: {
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <span className="inline-flex items-center justify-center w-6 h-6">
      <Icon className="w-[16px] h-[16px]" />
    </span>
  );
}

// Mastodon-specific layout: square (rounded) avatar + two-line header on
// the left, visibility + timestamp on the right, text spans full card
// width below the header, image is full-bleed, and the footer is an
// evenly-spaced row of reply / boost / favorite / bookmark + more.
function MastodonPreview({
  displayName,
  handle,
  avatarUrl,
  initials,
  text,
  media,
  timestampLabel,
  articleClassName,
}: {
  displayName: string;
  handle: string;
  avatarUrl: string | null;
  initials: string;
  text: string | null;
  media?: PostMedia[];
  timestampLabel: string;
  articleClassName?: string;
}) {
  return (
    <article className={cn("w-full max-w-[560px] rounded-2xl border border-border bg-background-elev overflow-hidden", articleClassName)}>
      <div className="px-4 pt-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="shrink-0 w-10 h-10 rounded-md overflow-hidden border border-border bg-peach-100 grid place-items-center text-[13px] font-semibold text-ink">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              initials
            )}
          </span>
          <div className="min-w-0 leading-tight">
            <p className="text-[14px] font-semibold text-ink truncate">
              {displayName}
            </p>
            <p className="text-[13px] text-ink/55 truncate">{handle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[12px] text-ink/55 shrink-0">
          <Globe2 className="w-3.5 h-3.5" />
          <span>{timestampLabel}</span>
        </div>
      </div>

      <div className="px-4 pt-3">
        {text ? (
          <p className="text-[14.5px] leading-[1.5] text-ink whitespace-pre-wrap break-words">
            {text}
          </p>
        ) : (
          <p className="text-[14px] text-ink/35 italic">
            Your post will appear here as you type.
          </p>
        )}
      </div>

      {media && media.length > 0 ? (
        <div className="px-4 pt-3">
          <div
            className={cn(
              "grid gap-1 overflow-hidden rounded-xl border border-border",
              media.length === 1 && "grid-cols-1",
              media.length === 2 && "grid-cols-2",
              media.length >= 3 && "grid-cols-2",
            )}
          >
            {media.slice(0, 4).map((m, i) => (
              <div
                key={`${m.url}-${i}`}
                className={cn(
                  "relative bg-background",
                  media.length === 1 ? "aspect-[4/5]" : "aspect-square",
                  media.length === 3 && i === 0 && "row-span-2 aspect-auto",
                )}
              >
                {m.mimeType.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.url}
                    alt={m.alt ?? ""}
                    className="w-full h-full object-cover"
                  />
                ) : m.mimeType.startsWith("video/") ? (
                  <video
                    src={m.url}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-[11px] text-ink/50">
                    {m.mimeType}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <footer className="px-4 py-3 mt-2 flex items-center justify-between text-ink/50">
        <MastoAction Icon={Reply} count={0} />
        <MastoAction Icon={Repeat2} count={0} />
        <MastoAction Icon={Star} count={0} />
        <MastoAction Icon={Bookmark} />
        <MastoAction Icon={MoreHorizontal} />
      </footer>
    </article>
  );
}

function MastoAction({
  Icon,
  count,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  count?: number;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px]">
      <Icon className="w-[16px] h-[16px]" />
      {typeof count === "number" ? <span>{count}</span> : null}
    </span>
  );
}
