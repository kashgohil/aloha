"use client";

import { Loader2, Pause, Play } from "lucide-react";
import { useFormStatus } from "react-dom";

export function ToggleAutomationButton({ status }: { status: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-border-strong text-[13px] font-medium text-ink hover:border-ink disabled:opacity-60 transition-colors"
    >
      {pending ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          {status === "active" ? "Pausing…" : "Activating…"}
        </>
      ) : status === "active" ? (
        <>
          <Pause className="w-3.5 h-3.5" />
          Pause
        </>
      ) : (
        <>
          <Play className="w-3.5 h-3.5" />
          Activate
        </>
      )}
    </button>
  );
}
