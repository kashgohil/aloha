"use client";

import { refreshPost } from "@/app/actions/post-comments";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    <TooltipProvider delay={250}>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              onClick={onClick}
              disabled={pending}
              aria-label="Refresh"
              className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-border-strong bg-background-elev text-ink hover:border-ink transition-colors disabled:opacity-40 disabled:hover:border-border-strong"
            >
              <RefreshCw className={pending ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
            </button>
          }
        />
        <TooltipContent>Refresh replies & metrics</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
