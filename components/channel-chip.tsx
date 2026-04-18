import {
  BlueskyIcon,
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  MastodonIcon,
  MediumIcon,
  PinterestIcon,
  RedditIcon,
  ThreadsIcon,
  TikTokIcon,
  XIcon,
} from "@/app/auth/_components/provider-icons";
import { cn } from "@/lib/utils";

export const CHANNEL_LABELS: Record<string, string> = {
  twitter: "X",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  threads: "Threads",
  bluesky: "Bluesky",
  medium: "Medium",
  reddit: "Reddit",
  pinterest: "Pinterest",
  mastodon: "Mastodon",
};

export const CHANNEL_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  twitter: XIcon,
  linkedin: LinkedInIcon,
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
  threads: ThreadsIcon,
  bluesky: BlueskyIcon,
  medium: MediumIcon,
  reddit: RedditIcon,
  pinterest: PinterestIcon,
  mastodon: MastodonIcon,
};

export function channelLabel(channel: string) {
  return CHANNEL_LABELS[channel] ?? channel;
}

/** Read-only display chip: icon + label. */
export function ChannelChip({
  channel,
  className,
}: {
  channel: string;
  className?: string;
}) {
  const Icon = CHANNEL_ICONS[channel];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 h-5 px-2 rounded-full border border-border text-[10.5px] font-medium tracking-wide text-ink/70",
        className,
      )}
    >
      {Icon ? <Icon className="w-3 h-3" /> : null}
      {channelLabel(channel)}
    </span>
  );
}

/** Toggleable channel chip wrapping a checkbox — selected state flips to ink. */
export function ChannelToggle({
  channel,
  name = "channels",
  defaultChecked = true,
}: {
  channel: string;
  name?: string;
  defaultChecked?: boolean;
}) {
  const Icon = CHANNEL_ICONS[channel];
  return (
    <label className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-border bg-background text-[13px] text-ink cursor-pointer has-[:checked]:bg-ink has-[:checked]:text-background has-[:checked]:border-ink">
      <input
        type="checkbox"
        name={name}
        value={channel}
        defaultChecked={defaultChecked}
        className="sr-only"
      />
      {Icon ? <Icon className="w-3.5 h-3.5" /> : null}
      {channelLabel(channel)}
    </label>
  );
}
