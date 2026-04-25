import type { PostMedia, StudioPayload } from "@/db/schema";
import {
  publishInstagramReel,
  publishInstagramStory,
  publishToInstagram,
} from "@/lib/publishers/instagram";
import {
  makePostEditor,
  readPostPayload,
  type PostPayload,
} from "./editors/post-editor";
import { ReelEditor, readReelPayload, type ReelPayload } from "./editors/reel-editor";
import {
  readStoryPayload,
  StoryEditor,
  type StoryPayload,
} from "./editors/story-editor";
import { makePostPreview } from "./previews/post-preview";
import { ReelPreview } from "./previews/reel-preview";
import { StoryPreview } from "./previews/story-preview";
import { mediaExportFiles } from "./export-helpers";
import type { ChannelCapability } from "./types";

// Feed posts: up to 10 image/video items. Same publisher as today; the
// existing `publishToInstagram` routes between single + carousel based
// on count.
const InstagramFeedEditor = makePostEditor({
  maxChars: 2200,
  label: "Caption",
  placeholder: "Write a caption…",
  maxMedia: 10,
  acceptMedia: "image/*,video/*",
});
const InstagramFeedPreview = makePostPreview("instagram");

const instagram: ChannelCapability = {
  channel: "instagram",
  forms: [
    {
      id: "feed",
      label: "Feed",
      limits: { maxChars: 2200, maxMedia: 10, requiresMedia: true },
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
        if (media.length === 0) {
          throw new Error("Instagram posts need at least one image or video.");
        }
        return publishToInstagram({ workspaceId, text, media });
      },
      exportPayload: (payload) =>
        mediaExportFiles(readPostPayload(payload).media, "instagram-feed"),
      Editor: InstagramFeedEditor,
      Preview: InstagramFeedPreview,
    },
    {
      id: "reel",
      label: "Reel",
      limits: { maxChars: 2200, maxMedia: 1, requiresMedia: true },
      hydrate: ({ content, media }): StudioPayload => {
        const video = media.filter((m) => m.mimeType.startsWith("video/"));
        const payload: ReelPayload = {
          caption: content,
          video,
          shareToFeed: true,
        };
        return payload as unknown as StudioPayload;
      },
      flatten: (payload): { text: string; media: PostMedia[] } => {
        const { caption, video } = readReelPayload(payload);
        return { text: caption, media: video };
      },
      publish: async ({ workspaceId, payload }) => {
        const { caption, video, shareToFeed } = readReelPayload(payload);
        if (video.length === 0) {
          throw new Error("Reels need a video.");
        }
        return publishInstagramReel({
          workspaceId,
          caption,
          video: video[0],
          shareToFeed,
        });
      },
      exportPayload: (payload) =>
        mediaExportFiles(readReelPayload(payload).video, "instagram-reel"),
      Editor: ReelEditor,
      Preview: ReelPreview,
    },
    {
      id: "story",
      label: "Story",
      limits: { maxMedia: 1, requiresMedia: true },
      hydrate: ({ media }): StudioPayload => {
        const payload: StoryPayload = { media: media.slice(0, 1) };
        return payload as unknown as StudioPayload;
      },
      flatten: (payload): { text: string; media: PostMedia[] } => {
        const { media } = readStoryPayload(payload);
        return { text: "", media };
      },
      publish: async ({ workspaceId, payload }) => {
        const { media } = readStoryPayload(payload);
        if (media.length === 0) {
          throw new Error("Stories need an image or video.");
        }
        return publishInstagramStory({ workspaceId, media: media[0] });
      },
      exportPayload: (payload) =>
        mediaExportFiles(readStoryPayload(payload).media, "instagram-story"),
      Editor: StoryEditor,
      Preview: StoryPreview,
    },
  ],
};

export { instagram };
