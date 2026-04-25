import type { PostMedia, StudioPayload } from "@/db/schema";
import { readPostPayload, type PostPayload } from "./editors/post-payload";
import {
  joinThreadParts,
  readThreadPayload,
  splitIntoThreadParts,
  type ThreadPayload,
} from "./editors/thread-payload";
import { mediaExportFiles } from "./export-helpers";
import type { ChannelCapability } from "./types";

const mastodon: ChannelCapability = {
  channel: "mastodon",
  forms: [
    {
      id: "post",
      label: "Post",
      limits: { maxChars: 500, maxMedia: 4 },
      hydrate: ({ content, media }): StudioPayload => {
        const payload: PostPayload = { text: content, media };
        return payload as unknown as StudioPayload;
      },
      flatten: (payload): { text: string; media: PostMedia[] } => {
        const { text, media } = readPostPayload(payload);
        return { text, media };
      },
      exportPayload: (payload) =>
        mediaExportFiles(readPostPayload(payload).media, "mastodon-post"),
    },
    {
      id: "thread",
      label: "Thread",
      limits: { maxChars: 500, maxMedia: 4 },
      hydrate: ({ content, media }): StudioPayload => {
        const parts = splitIntoThreadParts(content);
        if (parts[0] && media.length > 0) parts[0].media = media;
        const payload: ThreadPayload = { parts };
        return payload as unknown as StudioPayload;
      },
      flatten: (payload): { text: string; media: PostMedia[] } => {
        const { parts } = readThreadPayload(payload);
        return {
          text: joinThreadParts(parts),
          media: parts[0]?.media ?? [],
        };
      },
      exportPayload: (payload) => {
        const { parts } = readThreadPayload(payload);
        return parts.flatMap((p, i) =>
          mediaExportFiles(p.media, `mastodon-thread-part-${i + 1}`),
        );
      },
    },
  ],
};

export { mastodon };
