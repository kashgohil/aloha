import type { PostMedia, StudioPayload } from "@/db/schema";
import {
  readTikTokPayload,
  type TikTokPayload,
} from "./editors/tiktok-payload";
import { mediaExportFiles } from "./export-helpers";
import type { ChannelCapability } from "./types";

const tiktok: ChannelCapability = {
  channel: "tiktok",
  forms: [
    {
      id: "video",
      label: "Video",
      requiredScopes: ["video.upload", "video.publish"],
      limits: { maxChars: 2200, maxMedia: 1, requiresMedia: true },
      hydrate: ({ content, media }): StudioPayload => {
        const payload: TikTokPayload = {
          title: content,
          video: media.filter((m) => m.mimeType.startsWith("video/")),
          privacyLevel: "PUBLIC_TO_EVERYONE",
          disableComment: false,
          disableDuet: false,
          disableStitch: false,
          brandContentToggle: false,
          brandOrganicToggle: false,
        };
        return payload as unknown as StudioPayload;
      },
      flatten: (payload): { text: string; media: PostMedia[] } => {
        const { title, video } = readTikTokPayload(payload);
        return { text: title, media: video };
      },
      exportPayload: (payload) =>
        mediaExportFiles(readTikTokPayload(payload).video, "tiktok"),
    },
  ],
};

export { tiktok };
