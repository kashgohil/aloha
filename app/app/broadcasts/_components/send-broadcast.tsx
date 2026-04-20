"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { sendBroadcastNow } from "@/app/actions/broadcasts";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function SendBroadcastButton({
  id,
  disabled,
}: {
  id: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setPending(true);
    setError(null);
    const toastId = toast.loading("Queueing broadcast…");
    try {
      const fd = new FormData();
      fd.append("id", id);
      await sendBroadcastNow(fd);
      toast.success("Broadcast queued.", { id: toastId });
      setOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      toast.error(msg, { id: toastId });
      setError(msg);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary disabled:opacity-40 disabled:hover:bg-ink transition-colors"
      >
        <Send className="w-4 h-4" />
        Send now
      </button>
      <ConfirmDialog
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        title="Send this broadcast?"
        description={
          <>
            {error ? (
              <span className="block text-red-600 mb-2">{error}</span>
            ) : null}
            Once queued, it can't be pulled back. Make sure you saved your
            most recent edits first.
          </>
        }
        confirmText={pending ? "Sending..." : "Send"}
        variant="default"
      />
    </>
  );
}
