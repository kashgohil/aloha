import type { PostMedia, StudioPayload } from "@/db/schema";

export type PinPayload = {
  title: string;
  description: string;
  link: string;
  media: PostMedia[];
};

export function readPinPayload(payload: StudioPayload): PinPayload {
  const title = typeof payload.title === "string" ? payload.title : "";
  const description =
    typeof payload.description === "string" ? payload.description : "";
  const link = typeof payload.link === "string" ? payload.link : "";
  const media = Array.isArray(payload.media)
    ? (payload.media as PostMedia[])
    : [];
  return { title, description, link, media };
}
