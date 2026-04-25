import type { PostMedia, StudioPayload } from "@/db/schema";
import {
  publishLinkedInDocument,
  publishToLinkedIn,
} from "@/lib/publishers/linkedin";
import {
  DocumentEditor,
  readDocumentPayload,
  type DocumentPayload,
} from "./editors/document-editor";
import {
  makePostEditor,
  readPostPayload,
  type PostPayload,
} from "./editors/post-editor";
import { DocumentPreview } from "./previews/document-preview";
import { makePostPreview } from "./previews/post-preview";
import { mediaExportFiles } from "./export-helpers";
import type { ChannelCapability } from "./types";

// LinkedIn UGC posts accept up to 3000 chars. The 1300-char "Post" form
// matches LinkedIn's own composer default cutoff where the feed shows a
// "…see more" fold — content under 1300 renders inline, content over
// it gets truncated. We use it as a soft target, not a hard limit, so
// authors see their effective visible length but aren't blocked.
const LinkedInPostEditor = makePostEditor({
  maxChars: 1300,
  label: "Post",
  placeholder: "Share a post…",
});
const LinkedInLongEditor = makePostEditor({
  maxChars: 3000,
  label: "Long-form",
  placeholder: "What do you want to talk about?",
});
const LinkedInPreview = makePostPreview("linkedin");

// Both forms ride the same UGC publish endpoint — LinkedIn doesn't
// distinguish at the API level. The only difference is UX (editor size
// + counter target).
const publishPayload = async (args: {
  workspaceId: string;
  payload: StudioPayload;
}) => {
  const { text, media } = readPostPayload(args.payload);
  return publishToLinkedIn({ workspaceId: args.workspaceId, text, media });
};

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
      publish: publishPayload,
      exportPayload: (payload) =>
        mediaExportFiles(readPostPayload(payload).media, "linkedin-post"),
      Editor: LinkedInPostEditor,
      Preview: LinkedInPreview,
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
      publish: publishPayload,
      exportPayload: (payload) =>
        mediaExportFiles(readPostPayload(payload).media, "linkedin-longform"),
      Editor: LinkedInLongEditor,
      Preview: LinkedInPreview,
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
      publish: async ({ workspaceId, payload }) => {
        const { title, caption, document } = readDocumentPayload(payload);
        if (document.length === 0) {
          throw new Error("Upload a PDF before publishing.");
        }
        if (!title.trim()) {
          throw new Error("Give your document a title.");
        }
        return publishLinkedInDocument({
          workspaceId,
          text: caption,
          title,
          document: document[0],
        });
      },
      exportPayload: (payload) => {
        const { title, document } = readDocumentPayload(payload);
        return mediaExportFiles(
          document,
          title ? `linkedin-${title}` : "linkedin-document",
        );
      },
      Editor: DocumentEditor,
      Preview: DocumentPreview,
    },
  ],
};

export { linkedin };
