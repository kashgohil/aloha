import type { PostMedia, StudioPayload } from "@/db/schema";
import {
  readDocumentPayload,
  type DocumentPayload,
} from "./editors/document-payload";
import { readPostPayload, type PostPayload } from "./editors/post-payload";
import { mediaExportFiles } from "./export-helpers";
import type { ChannelCapability } from "./types";

const linkedin: ChannelCapability = {
  channel: "linkedin",
  forms: [
    {
      id: "post",
      label: "Post",
      limits: { maxChars: 1300, maxMedia: 9 },
      hydrate: ({ content, media }): StudioPayload => {
        const payload: PostPayload = { text: content, media };
        return payload as unknown as StudioPayload;
      },
      flatten: (payload): { text: string; media: PostMedia[] } => {
        const { text, media } = readPostPayload(payload);
        return { text, media };
      },
      exportPayload: (payload) =>
        mediaExportFiles(readPostPayload(payload).media, "linkedin-post"),
    },
    {
      id: "longform",
      label: "Long-form",
      limits: { maxChars: 3000, maxMedia: 9 },
      hydrate: ({ content, media }): StudioPayload => {
        const payload: PostPayload = { text: content, media };
        return payload as unknown as StudioPayload;
      },
      flatten: (payload): { text: string; media: PostMedia[] } => {
        const { text, media } = readPostPayload(payload);
        return { text, media };
      },
      exportPayload: (payload) =>
        mediaExportFiles(readPostPayload(payload).media, "linkedin-longform"),
    },
    {
      id: "document",
      label: "Document",
      limits: { maxChars: 3000, maxMedia: 1, requiresMedia: true },
      hydrate: ({ content, media }): StudioPayload => {
        const payload: DocumentPayload = {
          title: "",
          caption: content,
          document: media.filter((m) => m.mimeType === "application/pdf"),
        };
        return payload as unknown as StudioPayload;
      },
      flatten: (payload): { text: string; media: PostMedia[] } => {
        const { caption, document } = readDocumentPayload(payload);
        return { text: caption, media: document };
      },
      exportPayload: (payload) => {
        const { title, document } = readDocumentPayload(payload);
        return mediaExportFiles(
          document,
          title ? `linkedin-${title}` : "linkedin-document",
        );
      },
    },
  ],
};

export { linkedin };
