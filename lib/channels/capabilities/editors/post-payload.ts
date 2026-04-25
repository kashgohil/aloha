import type { PostMedia, StudioPayload } from "@/db/schema";

export type PostPayload = {
  text: string;
  media: PostMedia[];
  // Optional content warning / spoiler text. Surfaced by channels that
  // support it (Mastodon CW). Empty string = no warning.
  spoilerText?: string;
};

export function readPostPayload(payload: StudioPayload): PostPayload {
  const text = typeof payload.text === "string" ? payload.text : "";
  const media = Array.isArray(payload.media)
    ? (payload.media as PostMedia[])
    : [];
  const spoilerText =
    typeof payload.spoilerText === "string" ? payload.spoilerText : undefined;
  return { text, media, spoilerText };
}
