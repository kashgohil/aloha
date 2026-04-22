"use client";

import { Dialog } from "@base-ui/react/dialog";
import { ArrowUpRight, Lock, Sparkles, X } from "lucide-react";
import Link from "next/link";

export function UpgradeThemeModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm data-starting-style:opacity-0 transition-opacity duration-200" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(440px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-background-elev shadow-xl outline-none data-starting-style:opacity-0 data-starting-style:scale-95 transition-[opacity,transform] duration-200">
          <Dialog.Close className="absolute top-4 right-4 p-1.5 rounded-full text-ink/55 hover:text-ink hover:bg-muted/60 transition-colors">
            <X className="w-4 h-4" />
          </Dialog.Close>

          <div className="p-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-peach-100 border border-peach-300 text-ink mb-5">
              <Sparkles className="w-5 h-5" />
            </div>
            <Dialog.Title className="font-display text-[26px] leading-[1.1] tracking-[-0.02em] text-ink">
              Make your page yours.
            </Dialog.Title>
            <Dialog.Description className="mt-3 text-[14px] text-ink/70 leading-[1.55]">
              Pick from six templates, swap fonts and accents, and set a custom
              background — all on Basic.
            </Dialog.Description>

            <ul className="mt-5 space-y-2 text-[13.5px] text-ink/75">
              <li className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-ink/40" />
                Five more templates beyond Peach
              </li>
              <li className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-ink/40" />
                Curated fonts + accent colors
              </li>
              <li className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-ink/40" />
                Custom background images
              </li>
            </ul>

            <div className="mt-7 flex items-center gap-3">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[13.5px] font-medium hover:bg-primary transition-colors"
              >
                See Basic
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
              <Dialog.Close className="text-[13px] text-ink/60 hover:text-ink transition-colors">
                Not now
              </Dialog.Close>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
