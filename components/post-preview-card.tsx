// Post preview card — what the post looks like rendered on the chosen
// channel. Same surface used in the composer's live preview pane and on the
// post detail page, so the two surfaces show an identical card.

import { Bookmark, Heart, MessageSquare, Repeat2, Share } from "lucide-react";
import { CHANNEL_ICONS, channelLabel } from "@/components/channel-chip";
import { cn } from "@/lib/utils";

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

export function PostPreviewCard({
  channel,
  author,
  handle,
  content,
  timestampLabel = "just now",
}: {
  channel: string;
  author: PostPreviewAuthor;
  handle?: string | null;
  content: string;
  // Shown in the subheader line (e.g. "just now" in composer, "2d" on the
  // post page, or a formatted date).
  timestampLabel?: string;
}) {
  const Icon = CHANNEL_ICONS[channel];
  const accent = CHANNEL_ACCENT[channel] ?? "bg-ink text-background";
  const displayHandle = handle ?? CHANNEL_HANDLE[channel] ?? "@handle";

  const initials =
    author.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("") || "A";

  const text = content.trim().length > 0 ? content : null;

  return (
    <article className="rounded-2xl border border-border bg-background-elev overflow-hidden">
      <header className="px-5 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-full overflow-hidden border border-border bg-peach-100 grid place-items-center text-[12px] font-semibold text-ink">
            {author.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={author.image}
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
              {author.name}
            </p>
            <p className="text-[12px] text-ink/55 leading-tight truncate">
              {displayHandle} · {timestampLabel}
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

      <div className="px-5 py-4">
        {text ? (
          <p className="text-[14.5px] leading-[1.55] text-ink whitespace-pre-wrap break-words">
            {text}
          </p>
        ) : (
          <p className="text-[14px] text-ink/35 italic">
            Your post will appear here as you type.
          </p>
        )}
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
