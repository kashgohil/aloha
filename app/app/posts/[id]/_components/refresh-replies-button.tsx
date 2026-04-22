"use client";

import { refreshPost } from "@/app/actions/post-comments";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

export function RefreshRepliesButton({ postId }: { postId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const onClick = () => {
    if (pending) return;
    const toastId = toast.loading("Refreshing…");
    start(async () => {
      try {
        const result = await refreshPost(postId);
        const parts: string[] = [];
        if (result.commentsSynced > 0) {
          parts.push(
            `${result.commentsSynced} new repl${result.commentsSynced === 1 ? "y" : "ies"}`,
          );
        }
        if (result.snapshotsCaptured > 0) {
          parts.push(
            `${result.snapshotsCaptured} metric${result.snapshotsCaptured === 1 ? "" : "s"} updated`,
          );
        }
        const summary = parts.length > 0 ? parts.join(" · ") : "No changes";

        if (result.failed > 0) {
          toast.error(
            `${summary} · ${result.failed} call${result.failed === 1 ? "" : "s"} failed`,
            { id: toastId },
          );
        } else {
          toast.success(summary, { id: toastId });
        }
        router.refresh();
      } catch {
        toast.error("Couldn't refresh.", { id: toastId });
      }
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-border bg-background text-[13px] font-medium text-ink hover:border-ink/40 transition-colors disabled:opacity-60"
    >
      <RefreshCw className={pending ? "w-3.5 h-3.5 animate-spin" : "w-3.5 h-3.5"} />
      Refresh
    </button>
  );
}
