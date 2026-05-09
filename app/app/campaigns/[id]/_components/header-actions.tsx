"use client";

// Lifecycle + delete buttons for the campaign header. Replaces the old
// CampaignActionBand + CampaignControls split: we now surface the single
// applicable lifecycle CTA (Create drafts / Launch / Pause / Resume) and
// the destructive Delete action together in the title row, so everything
// the user can do to a campaign lives in one place.
//
// State machine for the lifecycle CTA mirrors the previous action band:
//   pending > 0 + draftable status   -> Create drafts (N)
//   pending = 0 + accepted > 0 +
//     draftable status               -> Launch
//   status in {scheduled, running}   -> Pause
//   status = paused                  -> Resume
//   status in {complete, archived}   -> no CTA, only Delete

import {
  acceptCampaignBeatsAction,
  approveCampaignAction,
  deleteCampaignAction,
  pauseCampaignAction,
  resumeCampaignAction,
} from "@/app/actions/campaigns";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Loader2,
  Pause,
  Play,
  Rocket,
  Sparkles,
  Trash2,
} from "lucide-react";
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

export function CampaignHeaderActions({
  campaignId,
  status,
  total,
  accepted,
  pending,
  formId,
  canManage,
}: {
  campaignId: string;
  status: string;
  total: number;
  accepted: number;
  pending: number;
  formId: string;
  canManage: boolean;
}) {
  const [confirm, setConfirm] = useState<"launch" | "pause" | "delete" | null>(
    null,
  );
  const [busy, start] = useTransition();
  const [submitPending, setSubmitPending] = useState(false);

  if (!canManage) return null;

  const draftable = status === "draft" || status === "ready";
  const terminal = status === "complete" || status === "archived";
  const showCreate = !terminal && total > 0 && pending > 0 && draftable;
  const showLaunch =
    !terminal && total > 0 && pending === 0 && accepted > 0 && draftable;
  const showPause = status === "scheduled" || status === "running";
  const showResume = status === "paused";

  const onCreateDrafts = () => {
    const form = document.getElementById(formId);
    if (!(form instanceof HTMLFormElement)) {
      toast.error("Couldn't find the beat selection. Refresh and try again.");
      return;
    }
    const fd = new FormData(form);
    const picked = fd.getAll("beatIds").filter(Boolean);
    if (picked.length === 0) {
      toast.error("Tick at least one beat to draft.");
      return;
    }
    setSubmitPending(true);
    const id = toast.loading(
      `Creating ${picked.length} draft${picked.length === 1 ? "" : "s"}…`,
    );
    start(async () => {
      try {
        await acceptCampaignBeatsAction(fd);
        toast.success("Drafts created.", { id });
      } catch (err) {
        if (isRedirectError(err)) {
          toast.success("Drafts created.", { id });
        } else {
          toast.error(
            err instanceof Error ? err.message : "Couldn't create drafts.",
            { id },
          );
        }
      } finally {
        setSubmitPending(false);
      }
    });
  };

  const runAction = (
    action: (fd: FormData) => Promise<void> | void,
    labels: { loading: string; success: string },
  ) => {
    const fd = new FormData();
    fd.append("campaignId", campaignId);
    const id = toast.loading(labels.loading);
    start(async () => {
      try {
        await action(fd);
        toast.success(labels.success, { id });
      } catch (err) {
        if (isRedirectError(err)) {
          toast.success(labels.success, { id });
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
      <div className="flex items-center gap-2 shrink-0">
        {showCreate ? (
          <button
            type="button"
            onClick={onCreateDrafts}
            disabled={submitPending}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-ink text-background text-[12.5px] font-medium hover:bg-primary disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-ink transition-colors"
          >
            {submitPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {submitPending ? "Creating…" : `Create drafts (${pending})`}
          </button>
        ) : null}

        {showLaunch ? (
          <button
            type="button"
            onClick={() => setConfirm("launch")}
            disabled={busy}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-ink text-background text-[12.5px] font-medium hover:bg-primary disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-ink transition-colors"
          >
            {busy ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Rocket className="w-3.5 h-3.5" />
            )}
            {busy ? "Launching…" : "Launch"}
          </button>
        ) : null}

        {showPause ? (
          <button
            type="button"
            onClick={() => setConfirm("pause")}
            disabled={busy}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-border-strong text-[12.5px] font-medium text-ink/80 hover:text-ink hover:border-ink transition-colors disabled:opacity-70"
          >
            <Pause className="w-3.5 h-3.5" />
            Pause
          </button>
        ) : null}

        {showResume ? (
          <button
            type="button"
            onClick={() =>
              runAction(resumeCampaignAction, {
                loading: "Resuming campaign…",
                success: "Campaign resumed.",
              })
            }
            disabled={busy}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-ink text-background text-[12.5px] font-medium hover:bg-primary disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-ink transition-colors"
          >
            {busy ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            Resume
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => setConfirm("delete")}
          disabled={busy}
          aria-label="Delete campaign"
          className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-border-strong text-ink/65 hover:text-ink hover:border-ink transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <ConfirmDialog
        isOpen={confirm === "launch"}
        onClose={() => setConfirm(null)}
        onConfirm={() =>
          runAction(approveCampaignAction, {
            loading: "Launching campaign…",
            success: "Campaign launched.",
          })
        }
        title="Launch this campaign?"
        description={
          <span className="block space-y-2">
            <span className="block">
              Every drafted beat with a future time will be queued to publish at
              its planned moment.
            </span>
            <span className="block text-ink/55">
              You can pause the campaign or move individual posts back to draft
              afterwards.
            </span>
          </span>
        }
        confirmText="Launch campaign"
        cancelText="Not yet"
        variant="default"
      />

      <ConfirmDialog
        isOpen={confirm === "pause"}
        onClose={() => setConfirm(null)}
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
        isOpen={confirm === "delete"}
        onClose={() => setConfirm(null)}
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
    </>
  );
}
