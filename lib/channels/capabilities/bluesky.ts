import type { PostMedia, StudioPayload } from "@/db/schema";
import { publishBlueskyThread, publishToBluesky } from "@/lib/publishers/bluesky";
import {
  makePostEditor,
  readPostPayload,
  type PostPayload,
} from "./editors/post-editor";
import {
  joinThreadParts,
  makeThreadEditor,
  readThreadPayload,
  splitIntoThreadParts,
  type ThreadPayload,
} from "./editors/thread-editor";
import { makePostPreview } from "./previews/post-preview";
import { makeThreadPreview } from "./previews/thread-preview";
import { mediaExportFiles } from "./export-helpers";
import type { ChannelCapability } from "./types";

const BlueskyPostEditor = makePostEditor({ maxChars: 300, label: "Post" });
const BlueskyThreadEditor = makeThreadEditor({
  maxChars: 300,
  maxMediaPerPart: 4,
});
const BlueskyPostPreview = makePostPreview("bluesky");
const BlueskyThreadPreview = makeThreadPreview("bluesky");

const bluesky: ChannelCapability = {
  channel: "bluesky",
  forms: [
    {
      id: "post",
      label: "Post",
      limits: { maxChars: 300, maxMedia: 4 },
      hydrate: ({ content, media }): StudioPayload => {
        const payload: PostPayload = { text: content, media };
        return payload as unknown as StudioPayload;
      },
      flatten: (payload): { text: string; media: PostMedia[] } => {
        const { text, media } = readPostPayload(payload);
        return { text, media };
      },
      publish: async ({ workspaceId, payload }) => {
        const { text, media } = readPostPayload(payload);
        return publishToBluesky({ workspaceId, text, media });
      },
      exportPayload: (payload) =>
        mediaExportFiles(readPostPayload(payload).media, "bluesky-post"),
      Editor: BlueskyPostEditor,
      Preview: BlueskyPostPreview,
    },
    {
      id: "thread",
      label: "Thread",
      limits: { maxChars: 300, maxMedia: 4 },
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
      publish: async ({ workspaceId, payload }) => {
        const { parts } = readThreadPayload(payload);
        const nonEmpty = parts.filter((p) => p.text.trim().length > 0);
        if (nonEmpty.length === 1) {
          return publishToBluesky({
            workspaceId,
            text: nonEmpty[0].text,
            media: nonEmpty[0].media,
          });
        }
        return publishBlueskyThread({ workspaceId, parts: nonEmpty });
      },
      exportPayload: (payload) => {
        const { parts } = readThreadPayload(payload);
        return parts.flatMap((p, i) =>
          mediaExportFiles(p.media, `bluesky-thread-part-${i + 1}`),
        );
      },
      Editor: BlueskyThreadEditor,
      Preview: BlueskyThreadPreview,
    },
  ],
};

export { bluesky };
