"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyPromptButton({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(prompt);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        } catch {
          // Clipboard API can fail in insecure contexts; silently no-op.
        }
      }}
      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-border-strong text-[12px] font-medium text-ink transition-colors"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5" />
          Copied
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          Copy prompt
        </>
      )}
    </button>
  );
}
