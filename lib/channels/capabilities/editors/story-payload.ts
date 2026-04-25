import type { PostMedia, StudioPayload } from "@/db/schema";

export type StoryPayload = {
  media: PostMedia[];
};

export function readStoryPayload(payload: StudioPayload): StoryPayload {
  const media = Array.isArray(payload.media)
    ? (payload.media as PostMedia[])
    : [];
  return { media };
}
