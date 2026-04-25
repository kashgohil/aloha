"use client";

import { ExternalLink } from "lucide-react";
import type { FormPreviewProps } from "@/lib/channels/capabilities/types";
import { readPinPayload } from "../editors/pin-editor";

export function PinPreview({ payload }: FormPreviewProps) {
  const { title, description, link, media } = readPinPayload(payload);
  const image = media.find((m) => m.mimeType.startsWith("image/"));
  let domain = "";
  try {
    domain = link ? new URL(link).hostname.replace(/^www\./, "") : "";
  } catch {
    // invalid URL — just leave empty
  }
  return (
    <article className="w-full max-w-[300px] rounded-2xl border border-border bg-background-elev overflow-hidden shadow-[0_14px_32px_-18px_rgba(26,22,18,0.28)]">
      <div className="relative w-full aspect-[2/3] bg-background">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url}
            alt={image.alt ?? title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-[12px] text-ink/35 italic">
            No image yet
          </div>
        )}
        {domain ? (
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-background/95 px-2 py-1 text-[11px] font-medium text-ink">
            <ExternalLink className="w-3 h-3" />
            {domain}
          </span>
        ) : null}
      </div>
      <div className="px-4 py-3">
        <h3 className="text-[15px] font-semibold text-ink leading-tight">
          {title || "Untitled pin"}
        </h3>
        {description ? (
          <p className="mt-1 text-[12.5px] text-ink/70 leading-[1.45] line-clamp-3">
            {description}
          </p>
        ) : null}
      </div>
    </article>
  );
}
