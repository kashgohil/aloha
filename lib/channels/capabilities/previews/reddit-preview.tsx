"use client";

import { ArrowBigUp, ExternalLink, MessageSquare } from "lucide-react";
import type { FormPreviewProps } from "@/lib/channels/capabilities/types";
import { readRedditMeta } from "../editors/reddit-fields";
import {
  readRedditLinkPayload,
  readRedditMediaPayload,
  readRedditTextPayload,
} from "../editors/reddit-editors";

export function makeRedditPreview(kind: "self" | "link" | "image" | "video") {
  return function RedditPreview({ payload, profile, author }: FormPreviewProps) {
    const meta = readRedditMeta(payload);
    const author1 = profile?.handle ?? author.name;
    const sub = meta.subreddit ? `r/${meta.subreddit}` : "r/your-subreddit";

    let title = "";
    let body: string | null = null;
    let link: string | null = null;
    let imageUrl: string | null = null;
    let videoUrl: string | null = null;
    if (kind === "self") {
      const p = readRedditTextPayload(payload);
      title = p.title;
      body = p.body;
    } else if (kind === "link") {
      const p = readRedditLinkPayload(payload);
      title = p.title;
      link = p.link;
    } else {
      const p = readRedditMediaPayload(payload);
      title = p.title;
      const m = p.media[0];
      if (m) {
        if (kind === "image") imageUrl = m.url;
        if (kind === "video") videoUrl = m.url;
      }
    }

    let linkDomain = "";
    if (link) {
      try {
        linkDomain = new URL(link).hostname.replace(/^www\./, "");
      } catch {
        linkDomain = "";
      }
    }

    return (
      <article className="w-full max-w-[560px] rounded-2xl border border-border bg-background-elev overflow-hidden">
        <header className="px-5 pt-4 flex items-center gap-2 text-[12px] text-ink/55">
          <span className="font-semibold text-ink">{sub}</span>
          <span>·</span>
          <span>posted by u/{author1}</span>
          {meta.flairText ? (
            <span className="ml-2 inline-flex items-center rounded-full bg-peach-100 px-2 py-0.5 text-[11px] font-medium text-ink">
              {meta.flairText}
            </span>
          ) : null}
          {meta.nsfw ? (
            <span className="ml-1 rounded-full bg-red-600 text-white px-2 py-0.5 text-[10px] font-semibold uppercase">
              NSFW
            </span>
          ) : null}
          {meta.spoiler ? (
            <span className="ml-1 rounded-full bg-ink text-background px-2 py-0.5 text-[10px] font-semibold uppercase">
              Spoiler
            </span>
          ) : null}
        </header>
        <div className="px-5 pt-2 pb-3 space-y-3">
          <h3 className="text-[18px] font-semibold leading-tight text-ink break-words">
            {title || "Your title appears here"}
          </h3>
          {body ? (
            <p className="text-[14px] leading-[1.55] text-ink whitespace-pre-wrap break-words">
              {body}
            </p>
          ) : null}
          {link ? (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-[13px] text-ink">
              <ExternalLink className="w-4 h-4 text-ink/55" />
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                className="flex-1 truncate hover:underline"
              >
                {linkDomain || link}
              </a>
            </div>
          ) : null}
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              className="w-full max-h-[480px] rounded-xl border border-border object-cover"
            />
          ) : null}
          {videoUrl ? (
            <video
              src={videoUrl}
              className="w-full max-h-[480px] rounded-xl border border-border object-cover"
              muted
              playsInline
              controls
            />
          ) : null}
        </div>
        <footer className="px-5 py-2 border-t border-border flex items-center gap-4 text-ink/55 text-[12px]">
          <span className="inline-flex items-center gap-1">
            <ArrowBigUp className="w-4 h-4" />1
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />0 comments
          </span>
        </footer>
      </article>
    );
  };
}
