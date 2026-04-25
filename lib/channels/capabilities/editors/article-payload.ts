import type { PostMedia, StudioPayload } from "@/db/schema";

export type ArticlePayload = {
  title: string;
  body: string;
  media: PostMedia[];
};

export function readArticlePayload(payload: StudioPayload): ArticlePayload {
  const title = typeof payload.title === "string" ? payload.title : "";
  const body = typeof payload.body === "string" ? payload.body : "";
  const media = Array.isArray(payload.media)
    ? (payload.media as PostMedia[])
    : [];
  return { title, body, media };
}
