"use client";

// Single primary-action surface for the campaign canvas. Replaces both
// the buried "Approve & schedule" button in the top-right and the bottom
// "Create drafts" submit row. A small state machine picks one CTA based
// on (status, accepted, pending):
//
//   pending > 0 + draftable status   → "Create drafts (N)"  → accept action
//   pending = 0, accepted > 0,
//     status in {draft, ready}       → "Launch campaign"     → approve action
//   status in {scheduled, running}   → status pill + "Pause"
//   status = paused                  → status pill + "Resume"
//   status in {complete, archived}   → null (band hides)
//
// Pause/resume run inline with sonner toasts. Launch confirms first
// because it's a fan-out write (every drafted beat → scheduled post).
// Create drafts piggybacks the existing form#campaign-accept-form via
// the `form` attribute, since beat checkboxes live in that form sibling.

import {
  acceptCampaignBeatsAction,
  approveCampaignAction,
  pauseCampaignAction,
  resumeCampaignAction,
} from "@/app/actions/campaigns";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CalendarClock, Loader2, Pause, Play, Rocket, Sparkles } from "lucide-react";
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

export function CampaignActionBand({
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
  const [confirm, setConfirm] = useState<"launch" | "pause" | null>(null);
  const [busy, start] = useTransition();
  const [submitPending, setSubmitPending] = useState(false);

  // Drive Create-drafts via a manual action call rather than native form
  // submit, so the success path can fire a sonner toast instead of relying
  // on a query-param flash banner. We still let the BeatRow checkboxes
  // live inside the page-level form (they auto-attach via the `form` attr)
  // and just snapshot its FormData here.
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

  if (!canManage) return null;
  if (status === "complete" || status === "archived") return null;
  if (total === 0) return null;

  const draftable = status === "draft" || status === "ready";
  const showCreate = pending > 0 && draftable;
  const showLaunch = pending === 0 && accepted > 0 && draftable;
  const showPause = status === "scheduled" || status === "running";
  const showResume = status === "paused";

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
      <div className="rounded-3xl border border-border-strong bg-background-elev px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <span className="inline-grid place-items-center w-9 h-9 rounded-full bg-peach-100 border border-peach-300 shrink-0">
            {showCreate ? (
              <Sparkles className="w-4 h-4 text-ink" />
            ) : showLaunch ? (
              <Rocket className="w-4 h-4 text-ink" />
            ) : (
              <CalendarClock className="w-4 h-4 text-ink" />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-[13.5px] text-ink font-medium leading-[1.3]">
              {showCreate
                ? `${pending} beat${pending === 1 ? "" : "s"} to draft`
                : showLaunch
                  ? `${accepted} draft${accepted === 1 ? "" : "s"} ready to launch`
                  : showPause
                    ? "Campaign is live"
                    : showResume
                      ? "Campaign paused"
                      : "Campaign"}
            </p>
            <p className="mt-0.5 text-[12px] text-ink/55 leading-[1.4]">
              {showCreate
                ? "Tick the beats you want, then create drafts. Each becomes a draft post for noon on its day."
                : showLaunch
                  ? "Launch queues every drafted post at its planned time. Pause anytime."
                  : showPause
                    ? "Upcoming posts are scheduled. Pause to hold them as drafts."
                    : showResume
                      ? "Held posts return to their original times when resumed; past slots are skipped."
                      : null}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {showCreate ? (
            <button
              type="button"
              onClick={onCreateDrafts}
              disabled={submitPending}
              className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-ink transition-colors"
            >
              {submitPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {submitPending ? "Creating drafts…" : `Create drafts (${pending})`}
            </button>
          ) : null}

          {showLaunch ? (
            <button
              type="button"
              onClick={() => setConfirm("launch")}
              disabled={busy}
              className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-ink transition-colors"
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Rocket className="w-4 h-4" />
              )}
              {busy ? "Launching…" : "Launch campaign"}
            </button>
          ) : null}

          {showPause ? (
            <button
              type="button"
              onClick={() => setConfirm("pause")}
              disabled={busy}
              className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full border border-border-strong text-[13px] font-medium text-ink/80 hover:text-ink hover:border-ink transition-colors disabled:opacity-70"
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
              className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-ink transition-colors"
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Resume
            </button>
          ) : null}
        </div>
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
    </>
  );
}
