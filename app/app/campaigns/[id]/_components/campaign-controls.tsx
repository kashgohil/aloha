"use client";

import {
  approveCampaignAction,
  deleteCampaignAction,
  pauseCampaignAction,
  resumeCampaignAction,
} from "@/app/actions/campaigns";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CalendarCheck, Loader2, Pause, Play, Trash2 } from "lucide-react";
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

type DialogKind = "pause" | "delete" | "approve" | null;

export function CampaignControls({
  campaignId,
  status,
  canManage,
  hasAcceptedBeats,
}: {
  campaignId: string;
  status: string;
  canManage: boolean;
  hasAcceptedBeats: boolean;
}) {
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [isPending, startTransition] = useTransition();

  const paused = status === "paused";
  const pauseable =
    status === "running" || status === "scheduled" || status === "ready";
  const approvable =
    (status === "draft" || status === "ready") && hasAcceptedBeats;

  if (!canManage) return null;

  const runAction = (
    action: (fd: FormData) => Promise<void> | void,
    labels: { loading: string; success: string },
  ) => {
    const fd = new FormData();
    fd.append("campaignId", campaignId);
    const toastId = toast.loading(labels.loading);
    startTransition(async () => {
      try {
        await action(fd);
        toast.success(labels.success, { id: toastId });
      } catch (err) {
        // Server actions that call `redirect` throw NEXT_REDIRECT — the
        // action still succeeded, so show success.
        if (isRedirectError(err)) {
          toast.success(labels.success, { id: toastId });
        } else {
          toast.error(
            err instanceof Error ? err.message : "Something went wrong.",
            { id: toastId },
          );
        }
      }
    });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {approvable ? (
        <button
          type="button"
          onClick={() => setDialog("approve")}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-ink text-background text-[12.5px] font-medium hover:bg-primary disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
        >
          <CalendarCheck className="w-3.5 h-3.5" />
          Approve & schedule
        </button>
      ) : null}

      {paused ? (
        <button
          type="button"
          onClick={() =>
            runAction(resumeCampaignAction, {
              loading: "Resuming campaign…",
              success: "Campaign resumed.",
            })
          }
          disabled={isPending}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-ink text-background text-[12.5px] font-medium hover:bg-primary disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-ink transition-colors"
        >
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          {isPending ? "Resuming…" : "Resume"}
        </button>
      ) : pauseable ? (
        <button
          type="button"
          onClick={() => setDialog("pause")}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-border-strong text-[12.5px] font-medium text-ink/75 hover:text-ink hover:border-ink transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <Pause className="w-3.5 h-3.5" />
          Pause
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => setDialog("delete")}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-border-strong text-[12.5px] font-medium text-ink/70 hover:text-ink hover:border-ink transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete
      </button>

      <ConfirmDialog
        isOpen={dialog === "approve"}
        onClose={() => setDialog(null)}
        onConfirm={() =>
          runAction(approveCampaignAction, {
            loading: "Scheduling campaign…",
            success: "Campaign approved.",
          })
        }
        title="Approve & schedule this campaign?"
        description={
          <span className="block space-y-2">
            <span className="block">
              Every drafted beat with a future time will be queued to publish
              at its planned moment.
            </span>
            <span className="block text-ink/55">
              You can still pause the campaign or move individual posts back
              to draft afterwards.
            </span>
          </span>
        }
        confirmText="Approve & schedule"
        cancelText="Not yet"
        variant="default"
      />

      <ConfirmDialog
        isOpen={dialog === "pause"}
        onClose={() => setDialog(null)}
        onConfirm={() =>
          runAction(pauseCampaignAction, {
            loading: "Pausing campaign…",
            success: "Campaign paused.",
          })
        }
        title="Pause this campaign?"
        description={
          <span className="block space-y-2">
            <span className="block">
              Every post scheduled from this campaign will be held back and
              moved to <span className="text-ink font-medium">Drafts</span>.
              Nothing else on your calendar is affected.
            </span>
            <span className="block text-ink/55">
              You can resume any time — Aloha will put the held posts back on
              their original times, skipping any that have already passed.
            </span>
          </span>
        }
        confirmText="Pause campaign"
        cancelText="Keep running"
        variant="default"
      />

      <ConfirmDialog
        isOpen={dialog === "delete"}
        onClose={() => setDialog(null)}
        onConfirm={() =>
          runAction(deleteCampaignAction, {
            loading: "Deleting campaign…",
            success: "Campaign deleted.",
          })
        }
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
    </div>
  );
}
