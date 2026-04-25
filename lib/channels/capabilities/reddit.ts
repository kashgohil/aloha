import type { PostMedia, StudioPayload } from "@/db/schema";
import {
  readRedditLinkPayload,
  readRedditMediaPayload,
  readRedditTextPayload,
  type RedditLinkPayload,
  type RedditMediaPayload,
  type RedditTextPayload,
} from "./editors/reddit-payload";
import { mediaExportFiles } from "./export-helpers";
import type { ChannelCapability } from "./types";

const baseMeta = {
  subreddit: "",
  flairId: "",
  flairText: "",
  nsfw: false,
  spoiler: false,
};

const reddit: ChannelCapability = {
  channel: "reddit",
  forms: [
    {
      id: "text",
      label: "Text",
      limits: { maxChars: 40000 },
      hydrate: ({ content }): StudioPayload => {
        const lines = content.split("\n");
        const first = lines[0]?.trim() ?? "";
        const hasTitle = first.length > 0 && first.length <= 300;
        const title = hasTitle ? first : "";
        const body = hasTitle ? lines.slice(1).join("\n").trimStart() : content;
        const payload: RedditTextPayload = { ...baseMeta, title, body };
        return payload as unknown as StudioPayload;
      },
      flatten: (payload): { text: string; media: PostMedia[] } => {
        const { title, body } = readRedditTextPayload(payload);
        return {
          text: [title, body].filter(Boolean).join("\n\n"),
          media: [],
        };
      },
    },
    {
      id: "link",
      label: "Link",
      limits: { maxChars: 300 },
      hydrate: ({ content }): StudioPayload => {
        const trimmed = content.trim();
        const isUrl = /^https?:\/\//i.test(trimmed) && !/\s/.test(trimmed);
        const payload: RedditLinkPayload = {
          ...baseMeta,
          title: isUrl ? "" : content.split("\n")[0]?.slice(0, 300) ?? "",
          link: isUrl ? trimmed : "",
        };
        return payload as unknown as StudioPayload;
      },
      flatten: (payload): { text: string; media: PostMedia[] } => {
        const { title, link } = readRedditLinkPayload(payload);
        return {
          text: [title, link].filter(Boolean).join("\n\n"),
          media: [],
        };
      },
    },
    {
      id: "image",
      label: "Image",
      limits: { maxMedia: 1, requiresMedia: true },
      hydrate: ({ content, media }): StudioPayload => {
        const payload: RedditMediaPayload = {
          ...baseMeta,
          title: content.split("\n")[0]?.slice(0, 300) ?? "",
          media: media
            .filter((m) => m.mimeType.startsWith("image/"))
            .slice(0, 1),
        };
        return payload as unknown as StudioPayload;
      },
      flatten: (payload): { text: string; media: PostMedia[] } => {
        const { title, media } = readRedditMediaPayload(payload);
        return { text: title, media };
      },
      exportPayload: (payload) => {
        const { title, media } = readRedditMediaPayload(payload);
        return mediaExportFiles(media, title ? `reddit-${title}` : "reddit-image");
      },
    },
    {
      id: "video",
      label: "Video",
      limits: { maxMedia: 1, requiresMedia: true },
      hydrate: ({ content, media }): StudioPayload => {
        const payload: RedditMediaPayload = {
          ...baseMeta,
          title: content.split("\n")[0]?.slice(0, 300) ?? "",
          media: media
            .filter((m) => m.mimeType.startsWith("video/"))
            .slice(0, 1),
        };
        return payload as unknown as StudioPayload;
      },
      flatten: (payload): { text: string; media: PostMedia[] } => {
        const { title, media } = readRedditMediaPayload(payload);
        return { text: title, media };
      },
      exportPayload: (payload) => {
        const { title, media } = readRedditMediaPayload(payload);
        return mediaExportFiles(media, title ? `reddit-${title}` : "reddit-video");
      },
    },
  ],
};

export { reddit };
