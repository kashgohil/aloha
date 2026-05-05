"use client";

// Top-right meta menu for the campaign page. Primary actions (Create
// drafts / Launch / Pause / Resume) live in the CampaignActionBand so
// they're prominent above the canvas; this surface keeps only the
// destructive/maintenance affordance.

import { deleteCampaignAction } from "@/app/actions/campaigns";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

function isRedirectError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    typeof (err as { digest?: unknown }).digest === "string" &&
    (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export function CampaignControls({
  campaignId,
  canManage,
}: {
  campaignId: string;
  canManage: boolean;
}) {
  const [confirm, setConfirm] = useState(false);
  const [busy, start] = useTransition();

  if (!canManage) return null;

  const onConfirm = () => {
    const fd = new FormData();
    fd.append("campaignId", campaignId);
    const id = toast.loading("Deleting campaign…");
    start(async () => {
      try {
        await deleteCampaignAction(fd);
        toast.success("Campaign deleted.", { id });
      } catch (err) {
        if (isRedirectError(err)) {
          toast.success("Campaign deleted.", { id });
        } else {
          toast.error(
            err instanceof Error ? err.message : "Something went wrong.",
            { id },
          );
        }
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirm(true)}
        disabled={busy}
        className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-border-strong text-[12.5px] font-medium text-ink/70 hover:text-ink hover:border-ink transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete
      </button>

      <ConfirmDialog
        isOpen={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={onConfirm}
        title="Delete this campaign?"
        description={
          <span className="block space-y-2">
            <span className="block">
              This removes the campaign and deletes every{" "}
              <span className="text-ink font-medium">draft</span>,{" "}
              <span className="text-ink font-medium">scheduled</span>, and{" "}
              <span className="text-ink font-medium">failed</span> post tied to
              it. Scheduled posts will not publish.
            </span>
            <span className="block text-ink/55">
              Already-published posts stay — deleting a campaign doesn&apos;t
              touch what&apos;s already live. This can&apos;t be undone.
            </span>
          </span>
        }
        confirmText="Delete campaign"
        cancelText="Keep"
        variant="destructive"
      />
    </>
  );
}
