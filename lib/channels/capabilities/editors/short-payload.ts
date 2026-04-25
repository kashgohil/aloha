import type { PostMedia, StudioPayload } from "@/db/schema";

export type ShortPayload = {
  title: string;
  description: string;
  video: PostMedia[];
};

export function readShortPayload(payload: StudioPayload): ShortPayload {
  const title = typeof payload.title === "string" ? payload.title : "";
  const description =
    typeof payload.description === "string" ? payload.description : "";
  const video = Array.isArray(payload.video)
    ? (payload.video as PostMedia[])
    : [];
  return { title, description, video };
}
