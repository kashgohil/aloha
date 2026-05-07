"use client";

// Library picker panel. Lists the user's existing assets (uploads + generated)
// so they can attach one or many to the current draft. Selection is capped to
// the remaining media slots; already-attached assets are disabled.

import { Check, Images, Loader2, X as XIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  type LibraryAsset,
  listLibraryAssets,
} from "@/app/actions/assets";
import type { PostMedia } from "@/db/schema";
import { cn } from "@/lib/utils";

export function LibraryPanel({
  attachedUrls,
  remainingSlots,
  onAttach,
  onClose,
}: {
  attachedUrls: string[];
  remainingSlots: number;
  onAttach: (media: PostMedia[]) => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState<LibraryAsset[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const attached = useMemo(() => new Set(attachedUrls), [attachedUrls]);

  useEffect(() => {
    let cancelled = false;
    listLibraryAssets()
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Couldn't load library.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= remainingSlots) return prev;
      return [...prev, id];
    });
  };

  const handleAttach = () => {
    if (!items || selected.length === 0) return;
    const chosen = items.filter((a) => selected.includes(a.id));
    onAttach(
      chosen.map((a) => ({
        url: a.url,
        mimeType: a.mimeType,
        width: a.width ?? undefined,
        height: a.height ?? undefined,
        alt: a.alt ?? undefined,
      })),
    );
  };

  return (
    <>
      <div className="flex items-center gap-2 px-5 pt-4 pb-3 text-[12px] text-ink/65">
        <Images className="w-3.5 h-3.5 text-primary" />
        <span>
          Pick from your uploads and generated images.
          {remainingSlots > 0
            ? ` ${remainingSlots} slot${remainingSlots === 1 ? "" : "s"} left.`
            : " No slots left — remove an image first."}
        </span>
      </div>

      <div className="max-h-[320px] overflow-y-auto">
        {items === null && !error ? (
          <div className="px-5 py-10 flex items-center justify-center text-[13px] text-ink/55">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Loading library…
          </div>
        ) : error ? (
          <p className="px-5 py-3 text-[12.5px] text-red-700 bg-red-50">
            {error}
          </p>
        ) : items && items.length === 0 ? (
          <div className="px-5 py-10 text-center text-[13px] text-ink/55">
            Nothing in your library yet. Upload or generate an image and it&apos;ll show up here.
          </div>
        ) : (
          <ul className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 p-3">
            {items?.map((a) => {
              const isAttached = attached.has(a.url);
              const isSelected = selected.includes(a.id);
              const slotsFull =
                !isSelected && selected.length >= remainingSlots;
              const disabled = isAttached || slotsFull || remainingSlots === 0;
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => !disabled && toggle(a.id)}
                    disabled={disabled}
                    aria-pressed={isSelected}
                    title={
                      isAttached
                        ? "Already attached"
                        : slotsFull
                          ? "No slots left"
                          : a.prompt ?? a.alt ?? "Library asset"
                    }
                    className={cn(
                      "group relative aspect-square w-full rounded-xl overflow-hidden border transition-colors",
                      isSelected
                        ? "border-ink ring-2 ring-ink"
                        : "border-border hover:border-ink",
                      disabled && "opacity-40 cursor-not-allowed hover:border-border",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.url}
                      alt={a.alt ?? ""}
                      className="w-full h-full object-cover"
                    />
                    {isSelected ? (
                      <span className="absolute top-1 right-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-ink text-background">
                        <Check className="w-3 h-3" />
                      </span>
                    ) : null}
                    {isAttached ? (
                      <span className="absolute bottom-1 left-1 inline-flex items-center h-5 px-1.5 rounded-full bg-ink/80 text-background text-[10px]">
                        Attached
                      </span>
                    ) : (
                      <span className="absolute bottom-1 left-1 inline-flex items-center h-4 px-1.5 rounded-full bg-background/85 text-ink/65 text-[9.5px] uppercase tracking-wider">
                        {a.source === "generated" ? "AI" : a.source}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <footer className="px-5 py-3 border-t border-border flex items-center justify-between gap-2">
        <span className="text-[12.5px] text-ink/60">
          {selected.length > 0
            ? `${selected.length} selected`
            : "Tap a thumbnail to select"}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center h-9 px-3 rounded-full text-[12.5px] text-ink/65 hover:text-ink transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAttach}
            disabled={selected.length === 0}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-ink text-background text-[12.5px] font-medium hover:bg-primary disabled:opacity-40 disabled:hover:bg-ink transition-colors"
          >
            Attach{selected.length > 0 ? ` ${selected.length}` : ""}
          </button>
        </div>
      </footer>
    </>
  );
}
