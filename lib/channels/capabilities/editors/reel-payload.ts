import type { PostMedia, StudioPayload } from "@/db/schema";

export type ReelPayload = {
  caption: string;
  video: PostMedia[];
  shareToFeed: boolean;
};

export function readReelPayload(payload: StudioPayload): ReelPayload {
  const caption = typeof payload.caption === "string" ? payload.caption : "";
  const video = Array.isArray(payload.video)
    ? (payload.video as PostMedia[])
    : [];
  const shareToFeed =
    typeof payload.shareToFeed === "boolean" ? payload.shareToFeed : true;
  return { caption, video, shareToFeed };
}
