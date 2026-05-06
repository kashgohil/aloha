"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export type RouteModalSize = "composer" | "studio";

export function RouteModal({
  size,
  children,
  onClose,
  onBeforeClose,
}: {
  size: RouteModalSize;
  children: React.ReactNode;
  // Called when the user dismisses the modal (X, Escape, backdrop click).
  // Defaults to router.back() so the modal works inside intercepting-route
  // setups; callers driven by query params should pass an explicit close
  // that strips their state instead.
  onClose?: () => void;
  // Optional gate fired before close. Return false (or a Promise resolving
  // to false) to abort the close — used for unsaved-changes prompts.
  onBeforeClose?: () => boolean | Promise<boolean>;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const dismiss = onClose ?? (() => router.back());
  const close = async () => {
    if (onBeforeClose) {
      const ok = await onBeforeClose();
      if (!ok) return;
    }
    dismiss();
  };

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") void close();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted) return null;

  const sizeClasses =
    size === "studio"
      ? "w-[88vw] h-[92vh] max-w-[1180px]"
      : "w-[92vw] max-w-[1180px] max-h-[90vh]";

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30 backdrop-blur-sm"
      onClick={() => void close()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative flex flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-2xl",
          sizeClasses,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={() => void close()}
          className="absolute top-4 right-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full text-ink/60 hover:text-ink hover:bg-muted/80 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <div
          className={cn(
            "flex-1 overflow-y-auto",
            // Composer-only: pad the page header (eyebrow + title +
            // subtitle) and strip the page-level pb-12 so the editor card
            // meets the dialog edge. Studio brings its own chrome.
            size === "composer" &&
              "[&_header:first-of-type]:px-6 lg:[&_header:first-of-type]:px-10 [&_header:first-of-type]:pt-8 lg:[&_header:first-of-type]:pt-10 [&>div]:!pb-0",
          )}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
