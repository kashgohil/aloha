"use client";

import {
  CheckCircle2,
  FileText,
  Leaf,
  Loader2,
  Pencil,
  RotateCcw,
  Send,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  approvePost,
  backToDraft,
  publishPostNow,
  schedulePost,
  setEvergreen,
  submitForReview,
} from "@/app/actions/posts";
import { SchedulePopover } from "@/components/schedule-popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  availableActions,
  type ComposerAction,
} from "@/lib/posts/actions-available";
import type { PostStatus } from "@/lib/posts/transitions";
import type { WorkspaceRole } from "@/lib/current-context";
import { hasRole, ROLES } from "@/lib/workspaces/roles";
import { cn } from "@/lib/utils";
import { tzLocalInputToUtcDate } from "@/lib/tz";
import { ShareLinkButton } from "./share-link-button";

const iconBtn =
  "inline-flex items-center justify-center w-10 h-10 rounded-full transition-colors disabled:opacity-40";
const ghostIconBtn = `${iconBtn} border border-border-strong bg-background-elev text-ink hover:border-ink disabled:hover:border-border-strong`;
const primaryIconBtn = `${iconBtn} bg-ink text-background hover:bg-primary disabled:hover:bg-ink`;

export function PostHeaderActions({
  postId,
  status,
  workspaceRole,
  timezone,
  evergreenMarkedAt,
}: {
  postId: string;
  status: PostStatus;
  workspaceRole: WorkspaceRole;
  timezone: string;
  evergreenMarkedAt: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [scheduleInput, setScheduleInput] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);

  const allowed = new Set<ComposerAction>(
    availableActions(status, workspaceRole),
  );
  const canAct = (a: ComposerAction) => allowed.has(a);

  const wrap = (
    loading: string,
    success: string,
    fallbackError: string,
    run: () => Promise<unknown>,
  ) => () => {
    const toastId = toast.loading(loading);
    startTransition(async () => {
      try {
        await run();
        toast.success(success, { id: toastId });
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : fallbackError, {
          id: toastId,
        });
      }
    });
  };

  const onSubmit = wrap(
    "Submitting for review…",
    "Submitted for review.",
    "Couldn't submit for review.",
    () => submitForReview(postId),
  );
  const onBack = wrap(
    "Moving back to draft…",
    "Moved back to draft.",
    "Couldn't move back to draft.",
    () => backToDraft(postId),
  );
  const onApprove = wrap(
    "Approving…",
    "Approved.",
    "Couldn't approve.",
    () => approvePost(postId),
  );
  const onPublish = wrap(
    "Publishing…",
    "Published.",
    "Couldn't publish.",
    () => publishPostNow(postId),
  );
  const onToggleEvergreen = () => {
    const isOn = evergreenMarkedAt !== null;
    return wrap(
      isOn ? "Removing from evergreen…" : "Marking as evergreen…",
      isOn
        ? "No longer resurfacing this one."
        : "Saved for resurfacing on the recycle schedule.",
      "Couldn't update evergreen flag.",
      () => setEvergreen(postId, !isOn),
    )();
  };

  const onSchedule = () => {
    if (!scheduleInput) return;
    const when = tzLocalInputToUtcDate(scheduleInput, timezone);
    if (!when || Number.isNaN(when.getTime())) {
      toast.error("Pick a valid date and time.");
      return;
    }
    if (when.getTime() <= Date.now()) {
      toast.error("Pick a time in the future.");
      return;
    }
    const toastId = toast.loading("Scheduling…");
    startTransition(async () => {
      try {
        await schedulePost(postId, when);
        toast.success("Post scheduled.", { id: toastId });
        setShowSchedule(false);
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Couldn't schedule.",
          { id: toastId },
        );
      }
    });
  };

  const canEdit =
    status !== "published" && status !== "failed" && status !== "deleted";
  const canShare =
    hasRole(workspaceRole, ROLES.REVIEWER) &&
    status !== "published" &&
    status !== "failed" &&
    status !== "deleted";
  const canEvergreen =
    hasRole(workspaceRole, ROLES.REVIEWER) && status === "published";
  const isEvergreen = evergreenMarkedAt !== null;

  const hasLeftAction =
    canAct("backToDraft") ||
    canAct("submitForReview") ||
    canAct("schedule") ||
    canAct("publish") ||
    canEdit;

  return (
    <TooltipProvider delay={250}>
      <div className="flex items-center gap-2 self-start">
        {canAct("backToDraft") ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={onBack}
                  disabled={pending}
                  aria-label="Back to draft"
                  className={ghostIconBtn}
                >
                  {pending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4" />
                  )}
                </button>
              }
            />
            <TooltipContent>Back to draft</TooltipContent>
          </Tooltip>
        ) : null}

        {canAct("submitForReview") ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={pending}
                  aria-label="Submit for review"
                  className={primaryIconBtn}
                >
                  {pending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                </button>
              }
            />
            <TooltipContent>Submit for review</TooltipContent>
          </Tooltip>
        ) : null}

        {canAct("schedule") ? (
          <SchedulePopover
            scheduledAt={scheduleInput}
            setScheduledAt={setScheduleInput}
            open={showSchedule}
            setOpen={setShowSchedule}
            onConfirm={onSchedule}
            disabled={pending}
            busy={pending && scheduleInput !== ""}
            timezone={timezone}
            iconOnly
          />
        ) : null}

        {canAct("publish") ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={onPublish}
                  disabled={pending}
                  aria-label="Publish"
                  className={primaryIconBtn}
                >
                  {pending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              }
            />
            <TooltipContent>Publish</TooltipContent>
          </Tooltip>
        ) : null}

        {canEdit ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Link
                  href={`/app/composer?post=${postId}`}
                  aria-label={status === "draft" ? "Edit" : "Open"}
                  className={ghostIconBtn}
                >
                  <Pencil className="w-4 h-4" />
                </Link>
              }
            />
            <TooltipContent>
              {status === "draft" ? "Edit" : "Open"}
            </TooltipContent>
          </Tooltip>
        ) : null}

        {canShare ? <ShareLinkButton postId={postId} /> : null}

        {canEvergreen ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={onToggleEvergreen}
                  disabled={pending}
                  aria-pressed={isEvergreen}
                  aria-label={isEvergreen ? "Evergreen" : "Mark evergreen"}
                  className={cn(
                    ghostIconBtn,
                    isEvergreen && "border-primary/50 bg-primary-soft/40 text-ink",
                  )}
                >
                  {pending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Leaf className="w-4 h-4" />
                  )}
                </button>
              }
            />
            <TooltipContent>
              {isEvergreen
                ? "Queued to resurface on the recycle schedule. Click to stop."
                : "Mark as evergreen — recycle schedule will resurface a fresh draft."}
            </TooltipContent>
          </Tooltip>
        ) : null}

        {canAct("approve") ? (
          <>
            {hasLeftAction ? (
              <span className="h-6 w-px bg-border mx-1" aria-hidden />
            ) : null}
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={onApprove}
                    disabled={pending}
                    aria-label="Approve"
                    className={cn(
                      primaryIconBtn,
                      "bg-emerald-600 hover:bg-emerald-600/90 disabled:hover:bg-emerald-600",
                    )}
                  >
                    {pending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                  </button>
                }
              />
              <TooltipContent>Approve</TooltipContent>
            </Tooltip>
          </>
        ) : null}
      </div>
    </TooltipProvider>
  );
}
