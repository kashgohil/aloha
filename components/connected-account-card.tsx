import { ArrowUpRight, Users } from "lucide-react";
import {
  ChannelAvatar,
  type ChannelProfileView,
} from "@/components/channel-identity";

// Card-shaped readout for a connected channel's profile. Shown on the
// settings/channels list in place of the compact ChannelIdentity pill.
// Larger avatar, clearer hierarchy (display name → @handle → followers),
// and an explicit "Visit profile" affordance when a profile URL exists.

function compactCount(n: number): string {
  if (n < 1_000) return String(n);
  if (n < 10_000)
    return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  if (n < 1_000_000) return `${Math.round(n / 1_000)}K`;
  if (n < 10_000_000)
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  return `${Math.round(n / 1_000_000)}M`;
}

export function ConnectedAccountCard({
  profile,
  channel,
}: {
  profile: ChannelProfileView;
  channel: string;
}) {
  const displayName = profile.displayName ?? profile.handle ?? "Connected";
  const handle = profile.handle;
  const followers = profile.followerCount;
  const Wrapper = profile.profileUrl ? "a" : "div";

  return (
    <Wrapper
      {...(profile.profileUrl
        ? {
            href: profile.profileUrl,
            target: "_blank",
            rel: "noreferrer",
          }
        : {})}
      className="group relative inline-flex items-center gap-3 rounded-xl bg-peach-100/40 border border-peach-200/60 pl-3.5 pr-8 py-2.5 hover:bg-peach-100/60 transition-colors max-w-full align-top"
    >
      <ChannelAvatar
        channel={channel}
        avatarUrl={profile.avatarUrl ?? null}
        size={36}
      />
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-medium text-ink truncate leading-[1.25]">
          {displayName}
        </p>
        <div className="mt-0.5 flex items-center gap-2 text-[11.5px] text-ink/60">
          {handle ? (
            <span className="truncate max-w-[180px]">{handle}</span>
          ) : null}
          {handle && followers != null ? (
            <span aria-hidden className="text-ink/25">
              ·
            </span>
          ) : null}
          {followers != null ? (
            <span className="shrink-0 inline-flex items-center gap-1 tabular-nums">
              <Users className="w-3 h-3 text-ink/40" />
              {compactCount(followers)}
            </span>
          ) : null}
        </div>
      </div>
      {profile.profileUrl ? (
        <ArrowUpRight className="absolute top-2 right-2 w-3.5 h-3.5 text-ink/35 group-hover:text-ink transition-colors" />
      ) : null}
    </Wrapper>
  );
}
