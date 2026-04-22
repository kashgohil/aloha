import {
  AtSign,
  AudioLines,
  BookOpen,
  Cloud,
  Globe,
  Link as LinkIcon,
  Mail,
  MessagesSquare,
  Music,
  Music2,
  Rss,
  Send,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

// Minimal inline brand marks. Lucide dropped its brand icon set, so we keep
// one-path SVGs here for the common platforms. Each respects currentColor +
// incoming className so templates control size/tint.
const brand = (path: string): IconComponent =>
  function BrandIcon(props: SVGProps<SVGSVGElement>) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        {...props}
      >
        <path d={path} />
      </svg>
    );
  };

const XIcon = brand(
  "M18.244 2H21.5l-7.55 8.62L22.75 22h-6.77l-5.3-6.93L4.6 22H1.34l8.08-9.22L1.25 2h6.94l4.8 6.34L18.244 2Zm-1.19 18h1.88L7.04 4h-2L17.055 20Z",
);
const YoutubeIcon = brand(
  "M23.5 6.2s-.23-1.63-.94-2.35c-.9-.94-1.9-.95-2.36-1C17.1 2.5 12 2.5 12 2.5s-5.1 0-8.2.35c-.46.05-1.46.06-2.36 1C.73 4.57.5 6.2.5 6.2S.25 8.1.25 10v1.9c0 1.9.25 3.8.25 3.8s.23 1.63.94 2.35c.9.94 2.08.91 2.61 1.01C5.9 19.5 12 19.55 12 19.55s5.1-.01 8.2-.35c.46-.05 1.46-.06 2.36-1 .71-.72.94-2.35.94-2.35s.25-1.9.25-3.8V10c0-1.9-.25-3.8-.25-3.8ZM9.75 14.5v-6l5.5 3-5.5 3Z",
);
const GithubIcon = brand(
  "M12 .5a11.5 11.5 0 0 0-3.64 22.42c.58.1.79-.25.79-.56v-2.18c-3.2.7-3.87-1.37-3.87-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.04 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.27-5.23-5.67 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a10.98 10.98 0 0 1 5.78 0c2.2-1.49 3.18-1.18 3.18-1.18.62 1.59.23 2.76.11 3.05.74.8 1.18 1.83 1.18 3.08 0 4.41-2.69 5.38-5.25 5.66.41.36.78 1.06.78 2.13v3.16c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z",
);
const InstagramIcon = brand(
  "M12 2.2c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.22.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.22.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07ZM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.9 5.9 0 0 0-2.13 1.39A5.9 5.9 0 0 0 .63 4.14c-.3.76-.5 1.64-.56 2.91C.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.48 1.39 2.13.65.67 1.34 1.08 2.13 1.39.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.9 5.9 0 0 0 2.13-1.39 5.9 5.9 0 0 0 1.39-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.9 5.9 0 0 0-1.39-2.13A5.9 5.9 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0Zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32Zm0 10.16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.41-10.41a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0Z",
);
const LinkedinIcon = brand(
  "M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13Zm1.78 13.02H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .78 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45C23.21 24 24 23.22 24 22.27V1.73C24 .78 23.21 0 22.22 0Z",
);
const TwitchIcon = brand(
  "M11.64 5.93h1.43v4.28h-1.43m3.93-4.28H17v4.28h-1.43M7 2 3.43 5.57v12.86h4.28V22l3.58-3.57h2.85L20.57 12V2m-1.43 9.29-2.85 2.85h-2.86l-2.5 2.5v-2.5H7.71V3.43h11.43Z",
);

export type IconPreset = {
  id: string;
  name: string;
  Icon: IconComponent;
  // Hostnames that auto-map to this preset. Match is suffix-based so
  // subdomains (m.youtube.com) resolve correctly.
  hosts: string[];
  // Case-insensitive label substrings that resolve to this preset when the
  // URL alone doesn't match.
  keywords: string[];
};

export const ICON_PRESETS: Record<string, IconPreset> = {
  x: {
    id: "x",
    name: "X / Twitter",
    Icon: XIcon,
    hosts: ["x.com", "twitter.com"],
    keywords: ["twitter"],
  },
  youtube: {
    id: "youtube",
    name: "YouTube",
    Icon: YoutubeIcon,
    hosts: ["youtube.com", "youtu.be"],
    keywords: ["youtube"],
  },
  github: {
    id: "github",
    name: "GitHub",
    Icon: GithubIcon,
    hosts: ["github.com"],
    keywords: ["github"],
  },
  instagram: {
    id: "instagram",
    name: "Instagram",
    Icon: InstagramIcon,
    hosts: ["instagram.com"],
    keywords: ["instagram"],
  },
  tiktok: {
    id: "tiktok",
    name: "TikTok",
    Icon: Music2,
    hosts: ["tiktok.com"],
    keywords: ["tiktok"],
  },
  linkedin: {
    id: "linkedin",
    name: "LinkedIn",
    Icon: LinkedinIcon,
    hosts: ["linkedin.com"],
    keywords: ["linkedin"],
  },
  bluesky: {
    id: "bluesky",
    name: "Bluesky",
    Icon: Cloud,
    hosts: ["bsky.app", "bsky.social"],
    keywords: ["bluesky", "bsky"],
  },
  mastodon: {
    id: "mastodon",
    name: "Mastodon",
    Icon: AtSign,
    hosts: ["mastodon.social", "mastodon.online"],
    keywords: ["mastodon"],
  },
  threads: {
    id: "threads",
    name: "Threads",
    Icon: AtSign,
    hosts: ["threads.net"],
    keywords: ["threads"],
  },
  substack: {
    id: "substack",
    name: "Substack",
    Icon: Mail,
    hosts: ["substack.com"],
    keywords: ["newsletter", "substack"],
  },
  medium: {
    id: "medium",
    name: "Medium",
    Icon: BookOpen,
    hosts: ["medium.com"],
    keywords: ["medium", "blog"],
  },
  spotify: {
    id: "spotify",
    name: "Spotify",
    Icon: Music,
    hosts: ["spotify.com", "open.spotify.com"],
    keywords: ["spotify", "podcast"],
  },
  soundcloud: {
    id: "soundcloud",
    name: "SoundCloud",
    Icon: AudioLines,
    hosts: ["soundcloud.com"],
    keywords: ["soundcloud"],
  },
  twitch: {
    id: "twitch",
    name: "Twitch",
    Icon: TwitchIcon,
    hosts: ["twitch.tv"],
    keywords: ["twitch", "stream"],
  },
  discord: {
    id: "discord",
    name: "Discord",
    Icon: MessagesSquare,
    hosts: ["discord.gg", "discord.com"],
    keywords: ["discord"],
  },
  telegram: {
    id: "telegram",
    name: "Telegram",
    Icon: Send,
    hosts: ["t.me", "telegram.me"],
    keywords: ["telegram"],
  },
  email: {
    id: "email",
    name: "Email",
    Icon: Mail,
    hosts: [],
    keywords: ["email", "contact", "mail"],
  },
  rss: {
    id: "rss",
    name: "RSS",
    Icon: Rss,
    hosts: [],
    keywords: ["rss", "feed"],
  },
  globe: {
    id: "globe",
    name: "Website",
    Icon: Globe,
    hosts: [],
    keywords: ["website", "site", "homepage"],
  },
  link: {
    id: "link",
    name: "Link",
    Icon: LinkIcon,
    hosts: [],
    keywords: [],
  },
};

export const ICON_NONE = "none" as const;
export const ICON_FALLBACK_ID = "globe";

function parseHost(url: string): string | null {
  try {
    const u = new URL(url);
    return u.hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function detectIcon(url: string, label: string | null): string {
  if (url.startsWith("mailto:")) return "email";

  const host = parseHost(url);
  if (host) {
    for (const preset of Object.values(ICON_PRESETS)) {
      if (preset.hosts.some((h) => host === h || host.endsWith(`.${h}`))) {
        return preset.id;
      }
    }
  }

  if (label) {
    const lc = label.toLowerCase();
    for (const preset of Object.values(ICON_PRESETS)) {
      if (preset.keywords.some((k) => lc.includes(k))) {
        return preset.id;
      }
    }
  }

  return ICON_FALLBACK_ID;
}

export function resolveIcon(
  iconPresetId: string | null,
  url: string,
  label: string | null,
): IconPreset | null {
  if (iconPresetId === ICON_NONE) return null;
  const id = iconPresetId ?? detectIcon(url, label);
  return ICON_PRESETS[id] ?? ICON_PRESETS[ICON_FALLBACK_ID];
}
