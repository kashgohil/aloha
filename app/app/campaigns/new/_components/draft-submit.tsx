"use client";

import { Loader2, Wand2 } from "lucide-react";
import { useFormStatus } from "react-dom";

export function DraftBeatSheetSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-ink transition-colors"
    >
      {pending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Wand2 className="w-4 h-4" />
      )}
      {pending ? "Muse is drafting…" : "Draft the beat sheet"}
    </button>
  );
}
