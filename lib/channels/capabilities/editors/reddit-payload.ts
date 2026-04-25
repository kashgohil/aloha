import type { PostMedia, StudioPayload } from "@/db/schema";
import { readRedditMeta, type RedditPostingMeta } from "./reddit-meta";

export type RedditTextPayload = RedditPostingMeta & {
  title: string;
  body: string;
};

export type RedditLinkPayload = RedditPostingMeta & {
  title: string;
  link: string;
};

export type RedditMediaPayload = RedditPostingMeta & {
  title: string;
  media: PostMedia[];
};

export function readRedditTextPayload(p: StudioPayload): RedditTextPayload {
  return {
    ...readRedditMeta(p),
    title: typeof p.title === "string" ? p.title : "",
    body: typeof p.body === "string" ? p.body : "",
  };
}

export function readRedditLinkPayload(p: StudioPayload): RedditLinkPayload {
  return {
    ...readRedditMeta(p),
    title: typeof p.title === "string" ? p.title : "",
    link: typeof p.link === "string" ? p.link : "",
  };
}

export function readRedditMediaPayload(p: StudioPayload): RedditMediaPayload {
  return {
    ...readRedditMeta(p),
    title: typeof p.title === "string" ? p.title : "",
    media: Array.isArray(p.media) ? (p.media as PostMedia[]) : [],
  };
}
