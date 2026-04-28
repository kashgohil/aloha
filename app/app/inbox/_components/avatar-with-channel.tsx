import { CHANNEL_ICONS } from "@/components/channel-chip";
import { cn } from "@/lib/utils";

const SIZE_MAP = {
  sm: {
    avatar: "w-9 h-9 text-[13px]",
    badge: "w-[18px] h-[18px] -bottom-0.5 -right-0.5",
    icon: "w-[10px] h-[10px]",
  },
  md: {
    avatar: "w-10 h-10 text-[14px]",
    badge: "w-[20px] h-[20px] -bottom-0.5 -right-0.5",
    icon: "w-[11px] h-[11px]",
  },
  lg: {
    avatar: "w-11 h-11 text-[15px]",
    badge: "w-[22px] h-[22px] -bottom-1 -right-1",
    icon: "w-[12px] h-[12px]",
  },
} as const;

export function AvatarWithChannel({
  avatarUrl,
  fallbackChar,
  platform,
  size = "md",
  className,
}: {
  avatarUrl: string | null;
  fallbackChar: string;
  platform: string;
  size?: keyof typeof SIZE_MAP;
  className?: string;
}) {
  const dims = SIZE_MAP[size];
  const Icon = CHANNEL_ICONS[platform];
  return (
    <div className={cn("relative shrink-0", className)}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className={cn(
            "rounded-full object-cover",
            dims.avatar,
          )}
        />
      ) : (
        <div
          className={cn(
            "rounded-full bg-muted grid place-items-center font-medium text-ink/60",
            dims.avatar,
          )}
        >
          {fallbackChar.toUpperCase()}
        </div>
      )}
      {Icon ? (
        <span
          className={cn(
            "absolute rounded-full bg-background border border-border-strong grid place-items-center text-ink",
            dims.badge,
          )}
          aria-hidden
        >
          <Icon className={dims.icon} />
        </span>
      ) : null}
    </div>
  );
}
