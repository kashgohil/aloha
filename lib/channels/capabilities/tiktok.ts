import type { PostMedia, StudioPayload } from "@/db/schema";
import { publishToTikTok } from "@/lib/publishers/tiktok";
import {
  readTikTokPayload,
  TikTokEditor,
  type TikTokPayload,
} from "./editors/tiktok-editor";
import { TikTokPreview } from "./previews/tiktok-preview";
import { mediaExportFiles } from "./export-helpers";
import type { ChannelCapability } from "./types";

const tiktok: ChannelCapability = {
  channel: "tiktok",
  forms: [
    {
      id: "video",
      label: "Video",
      // Required scopes for the Content Posting API. Connections without
      // these will hit a 401/403 at publish time and surface as
      // needs_reauth — the UI nudges the user to reconnect.
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
      publish: async ({ workspaceId, payload }) => {
        const t = readTikTokPayload(payload);
        if (t.video.length === 0) {
          throw new Error("TikTok posts need a video.");
        }
        return publishToTikTok({
          workspaceId,
          title: t.title,
          video: t.video[0],
          privacyLevel: t.privacyLevel,
          disableComment: t.disableComment,
          disableDuet: t.disableDuet,
          disableStitch: t.disableStitch,
          brandContentToggle: t.brandContentToggle,
          brandOrganicToggle: t.brandOrganicToggle,
        });
      },
      exportPayload: (payload) =>
        mediaExportFiles(readTikTokPayload(payload).video, "tiktok"),
      Editor: TikTokEditor,
      Preview: TikTokPreview,
    },
  ],
};

export { tiktok };
