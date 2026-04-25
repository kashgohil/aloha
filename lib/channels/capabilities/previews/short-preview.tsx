"use client";

import { Film } from "lucide-react";
import type { FormPreviewProps } from "@/lib/channels/capabilities/types";
import { readShortPayload } from "../editors/short-editor";

export function makeShortPreview(channel: string) {
  return function ShortPreview({ payload, profile, author }: FormPreviewProps) {
    const { title, description, video } = readShortPayload(payload);
    const clip = video[0];
    const displayName = profile?.displayName ?? author.name;
    const handle = profile?.handle ?? "@handle";
    return (
      <article className="w-full max-w-[300px] rounded-[28px] border border-border bg-ink/95 text-background overflow-hidden shadow-[0_14px_32px_-18px_rgba(26,22,18,0.35)]">
        <div className="relative aspect-[9/16] bg-ink">
          {clip ? (
            <video
              src={clip.url}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-background/40">
              <div className="text-center">
                <Film className="w-8 h-8 mx-auto" />
                <p className="mt-2 text-[12px]">Upload a video</p>
              </div>
            </div>
          )}
          <div className="absolute left-3 right-3 bottom-3 space-y-1">
            <p className="text-[11px] uppercase tracking-[0.22em] opacity-70">
              {channel}
            </p>
            <p className="text-[14px] font-semibold leading-tight line-clamp-2">
              {title || "Your title appears here"}
            </p>
            <p className="text-[12px] opacity-80 line-clamp-2">
              {description || "Description"}
            </p>
            <p className="text-[11px] opacity-60">
              {displayName} · {handle}
            </p>
          </div>
        </div>
      </article>
    );
  };
}
