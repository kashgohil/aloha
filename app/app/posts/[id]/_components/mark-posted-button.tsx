"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { markDeliveryPosted } from "@/app/actions/posts";

// Manual override for the assisted-publish flow. Shown next to a
// delivery that's stuck in `manual_assist` — when the user has
// posted on the platform themselves but the extension didn't catch
// the submit (or they posted from a different surface entirely).
//
// Calls the same `markDeliveryAsManuallyPublished` helper the
// extension uses; metadata distinguishes the source so analytics
// can tell us which path is more reliable.

export function MarkPostedButton({
  postId,
  platform,
  channelLabel,
}: {
  postId: string;
  platform: string;
  channelLabel: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const onClick = () => {
    const tid = toast.loading(`Marking ${channelLabel} as posted…`);
    start(async () => {
      try {
        const res = await markDeliveryPosted(postId, platform);
        if (res.alreadyPublished) {
          toast.success("Already marked posted.", { id: tid });
        } else {
          toast.success(
            res.postStatusFlipped
              ? `${channelLabel} marked as posted. The post is now live.`
              : `${channelLabel} marked as posted.`,
            { id: tid },
          );
        }
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Couldn't update.",
          { id: tid },
        );
      }
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      title={`If you've already posted on ${channelLabel}, click to mark this delivery as published.`}
      className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-border bg-background text-[12.5px] font-medium text-ink hover:border-ink transition-colors disabled:opacity-40"
    >
      {pending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <CheckCircle2 className="w-3.5 h-3.5" />
      )}
      I posted this
    </button>
  );
}
