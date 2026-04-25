import type { PostMedia, StudioPayload } from "@/db/schema";
import { publishToPinterest } from "@/lib/publishers/pinterest";
import { PinEditor, readPinPayload, type PinPayload } from "./editors/pin-editor";
import { PinPreview } from "./previews/pin-preview";
import { mediaExportFiles } from "./export-helpers";
import type { ChannelCapability } from "./types";

const pinterest: ChannelCapability = {
  channel: "pinterest",
  forms: [
    {
      id: "pin",
      label: "Pin",
      limits: { maxChars: 500, maxMedia: 1 },
      hydrate: ({ content, media }): StudioPayload => {
        const payload: PinPayload = {
          title: content.split("\n")[0]?.slice(0, 100) ?? "",
          description: content,
          link: "",
          media,
        };
        return payload as unknown as StudioPayload;
      },
      flatten: (payload): { text: string; media: PostMedia[] } => {
        const { title, description, media } = readPinPayload(payload);
        // Reconstitute a flat body that round-trips reasonably — title
        // on first line, description below. Destination URL is dropped
        // on exit since the flat body has nowhere to put it.
        const text = [title, description].filter(Boolean).join("\n\n");
        return { text, media };
      },
      publish: async ({ workspaceId, payload }) => {
        const { title, description, link, media } = readPinPayload(payload);
        if (media.length === 0) {
          throw new Error("Pins need a cover image.");
        }
        if (!title.trim()) {
          throw new Error("Give your pin a title.");
        }
        return publishToPinterest({
          workspaceId,
          text: description || title,
          title,
          description,
          media,
          link: link || null,
        });
      },
      exportPayload: (payload) => {
        const { title, media } = readPinPayload(payload);
        return mediaExportFiles(media, title ? `pin-${title}` : "pin");
      },
      Editor: PinEditor,
      Preview: PinPreview,
    },
  ],
};

export { pinterest };
