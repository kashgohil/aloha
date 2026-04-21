// Display block for a connected channel: avatar (or icon fallback) +
// display name + @handle + optional follower count. Used in the settings
// channel list, composer channel picker, and anywhere else we show a
// connected account. Keeps one source of truth for "what does a connected
// channel look like in the UI?" — so when we add a platform, only this
// component needs to learn about it.

import Image from "next/image";
import { CHANNEL_ICONS, channelLabel } from "@/components/channel-chip";
import { cn } from "@/lib/utils";

export type ChannelProfileView = {
  channel: string;
  displayName: string | null;
  handle: string | null;
  avatarUrl: string | null;
  profileUrl: string | null;
  followerCount: number | null;
};

function compactCount(n: number): string {
  if (n < 1_000) return String(n);
  if (n < 10_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  if (n < 1_000_000) return `${Math.round(n / 1_000)}K`;
  if (n < 10_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  return `${Math.round(n / 1_000_000)}M`;
}

export function ChannelAvatar({
  channel,
  avatarUrl,
  size = 36,
  className,
}: {
  channel: string;
  avatarUrl: string | null;
  size?: number;
  className?: string;
}) {
  const Icon = CHANNEL_ICONS[channel];
  return (
    <span
      className={cn(
        "relative inline-block rounded-full overflow-hidden bg-background border border-border grid place-items-center shrink-0",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt=""
          width={size}
          height={size}
          unoptimized
          className="w-full h-full object-cover"
        />
      ) : Icon ? (
        <Icon className="w-1/2 h-1/2 text-ink" />
      ) : null}
    </span>
  );
}

export function ChannelIdentity({
  profile,
  fallbackName,
  size = "md",
  showFollowers = true,
}: {
  profile: ChannelProfileView | null;
  // Shown when no profile row exists yet — usually the channel's label.
  fallbackName?: string;
  size?: "sm" | "md";
  showFollowers?: boolean;
}) {
  const channel = profile?.channel ?? "";
  const avatarSize = size === "sm" ? 24 : 36;
  const nameCls =
    size === "sm"
      ? "text-[12.5px] text-ink font-medium"
      : "text-[14px] text-ink font-medium";
  const subCls =
    size === "sm"
      ? "text-[11px] text-ink/55"
      : "text-[12px] text-ink/60";
  const displayName =
    profile?.displayName ?? fallbackName ?? (channel ? channelLabel(channel) : "");
  const handle = profile?.handle ?? null;
  return (
    <span className="inline-flex items-center gap-2 min-w-0">
      <ChannelAvatar
        channel={channel}
        avatarUrl={profile?.avatarUrl ?? null}
        size={avatarSize}
      />
      <span className="flex flex-col min-w-0">
        <span className={cn("truncate", nameCls)}>{displayName}</span>
        {handle || (showFollowers && profile?.followerCount != null) ? (
          <span className={cn("truncate flex items-center gap-1.5", subCls)}>
            {handle ? <span className="truncate">{handle}</span> : null}
            {handle && showFollowers && profile?.followerCount != null ? (
              <span aria-hidden className="text-ink/30">·</span>
            ) : null}
            {showFollowers && profile?.followerCount != null ? (
              <span className="shrink-0">
                {compactCount(profile.followerCount)} followers
              </span>
            ) : null}
          </span>
        ) : null}
      </span>
    </span>
  );
}
