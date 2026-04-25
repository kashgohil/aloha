"use client";

import { Film, Music2 } from "lucide-react";
import type { FormPreviewProps } from "@/lib/channels/capabilities/types";
import { readTikTokPayload } from "../editors/tiktok-editor";

export function TikTokPreview({ payload, profile, author }: FormPreviewProps) {
  const { title, video } = readTikTokPayload(payload);
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
        <div className="absolute left-3 right-12 bottom-3 space-y-1">
          <p className="text-[13px] font-semibold">{handle}</p>
          <p className="text-[12px] opacity-90 line-clamp-3">
            {title || "Your caption will appear here"}
          </p>
          <p className="text-[11px] opacity-70 inline-flex items-center gap-1">
            <Music2 className="w-3 h-3" />
            {displayName} · original sound
          </p>
        </div>
      </div>
    </article>
  );
}
