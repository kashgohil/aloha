"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, Loader2, X } from "lucide-react";
import { approveRequest, revokeRequest } from "../_actions/requests";
import { cn } from "@/lib/utils";

type Outcome = "idle" | "approved" | "dismissed";

export function RequestRowActions({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<"approve" | "revoke" | null>(null);
  const [outcome, setOutcome] = useState<Outcome>("idle");

  if (outcome === "approved") {
    return (
      <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-peach-100/70 text-[12px] text-ink">
        <Check className="w-3.5 h-3.5 text-primary" />
        Approved
      </span>
    );
  }
  if (outcome === "dismissed") {
    return (
      <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-muted/70 text-[12px] text-ink/65">
        <X className="w-3.5 h-3.5" />
        Dismissed
      </span>
    );
  }

  const run = (kind: "approve" | "revoke") => {
    setBusy(kind);
    startTransition(async () => {
      const action = kind === "approve" ? approveRequest : revokeRequest;
      const result = await action(id);
      setBusy(null);
      if (result.ok) {
        if (kind === "approve") {
          toast.success(`Granted ${result.feature} to ${result.email}`);
          setOutcome("approved");
        } else {
          toast("Request dismissed", {
            description: `${result.feature} · ${result.email}`,
          });
          setOutcome("dismissed");
        }
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="inline-flex gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => run("approve")}
        className={cn(
          "inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-ink text-background text-[12px] font-medium hover:bg-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed",
        )}
      >
        {busy === "approve" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Check className="w-3.5 h-3.5" />
        )}
        Approve
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => run("revoke")}
        className={cn(
          "inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-border-strong text-[12px] text-ink hover:border-ink transition-colors disabled:opacity-60 disabled:cursor-not-allowed",
        )}
      >
        {busy === "revoke" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <X className="w-3.5 h-3.5" />
        )}
        Dismiss
      </button>
    </div>
  );
}
