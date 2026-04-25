import type { PostMedia, StudioPayload } from "@/db/schema";

export type DocumentPayload = {
  title: string;
  caption: string;
  document: PostMedia[];
};

export function readDocumentPayload(payload: StudioPayload): DocumentPayload {
  const title = typeof payload.title === "string" ? payload.title : "";
  const caption = typeof payload.caption === "string" ? payload.caption : "";
  const document = Array.isArray(payload.document)
    ? (payload.document as PostMedia[])
    : [];
  return { title, caption, document };
}
