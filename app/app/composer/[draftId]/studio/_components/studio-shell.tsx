"use client";

import {
  Download,
  FileText,
  Loader2,
  LogOut,
  RotateCcw,
  Save,
  Send,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  approvePost,
  backToDraft,
  publishPostNow,
  reschedulePost,
  schedulePost,
  submitForReview,
} from "@/app/actions/posts";
import {
  exitStudio,
  saveStudioPayload,
  switchStudioForm,
} from "@/app/actions/studio";
import {
  availableActions,
  type ComposerAction,
} from "@/lib/posts/actions-available";
import type { WorkspaceRole } from "@/lib/current-context";
import { CHANNEL_ICONS, channelLabel } from "@/components/channel-chip";
import { CHANNEL_ACCENT } from "@/components/post-preview-card";
import { SchedulePopover } from "@/components/schedule-popover";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getCapability } from "@/lib/channels/capabilities";
import { getFormView } from "@/lib/channels/capabilities/views";
import { readPostPayload } from "@/lib/channels/capabilities/editors/post-payload";
import { downloadExportFiles } from "@/lib/studio/download";
import type { PostMedia, StudioPayload } from "@/db/schema";
import type { PostStatus } from "@/lib/posts/transitions";
import { tzLocalInputToUtcDate, utcIsoToTzLocalInput } from "@/lib/tz";
import { cn } from "@/lib/utils";
import { StudioAssistFooter } from "./studio-assist-footer";
import { StudioEditorFooter } from "./studio-editor-footer";

type ProfileView = {
  displayName: string | null;
  handle: string | null;
  avatarUrl: string | null;
} | null;

export function StudioShell({
  postId,
  channel,
  formId,
  availableForms,
  initialPayload,
  status,
  scheduledAt,
  timezone,
  profile,
  author,
  museAccess,
  workspaceRole,
}: {
  postId: string;
  channel: string;
  formId: string;
  availableForms: { id: string; label: string }[];
  initialPayload: StudioPayload;
  status: PostStatus;
  scheduledAt: string | null;
  timezone: string;
  profile: ProfileView;
  author: { name: string; image: string | null };
  museAccess: boolean;
  workspaceRole: WorkspaceRole;
}) {
  const router = useRouter();
  const [payload, setPayload] = useState<StudioPayload>(initialPayload);
  const [currentForm, setCurrentForm] = useState(formId);
  const [isSaving, startSaving] = useTransition();
  const [isPublishing, startPublishing] = useTransition();
  const [showExit, setShowExit] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleInput, setScheduleInput] = useState(
    scheduledAt ? utcIsoToTzLocalInput(scheduledAt, timezone) : "",
  );

  const cap = getCapability(channel);
  if (!cap) {
    return (
      <div className="p-8 text-[14px] text-ink/70">
        Studio capability for <b>{channel}</b> is not registered.
      </div>
    );
  }
  const form = cap.forms.find((f) => f.id === currentForm) ?? cap.forms[0];
  const view = getFormView(channel, form.id);
  if (!view) {
    return (
      <div className="p-8 text-[14px] text-ink/70">
        Studio view for <b>{channel}/{form.id}</b> is not registered.
      </div>
    );
  }
  const Editor = view.Editor;
  const Preview = view.Preview;

  const persist = () =>
    startSaving(async () => {
      try {
        await saveStudioPayload(postId, payload);
      } catch {
        toast.error("Couldn't save changes.");
      }
    });

  const handleSwitchForm = (nextId: string) => {
    if (nextId === currentForm) return;
    // Persist current payload first so the server-side form switch flattens
    // from the latest content, not stale DB state.
    startSaving(async () => {
      try {
        await saveStudioPayload(postId, payload);
        const res = await switchStudioForm(postId, nextId);
        if (res.success) {
          setCurrentForm(nextId);
          // The server action re-hydrates the payload for the new form;
          // easiest reliable way to get the fresh payload into local state
          // is to re-fetch via a router refresh.
          router.refresh();
        }
      } catch {
        toast.error("Couldn't switch form.");
      }
    });
  };

  const allowedActions = new Set<ComposerAction>(
    availableActions(status, workspaceRole),
  );
  const canAct = (action: ComposerAction) => allowedActions.has(action);

  const handleSubmitForReview = () => {
    if (!canAct("submitForReview")) return;
    const toastId = toast.loading("Submitting for review…");
    startSaving(async () => {
      try {
        await saveStudioPayload(postId, payload);
        await submitForReview(postId);
        toast.success("Submitted for review.", { id: toastId });
        router.push(`/app/posts/${postId}`);
      } catch {
        toast.error("Couldn't submit for review.", { id: toastId });
      }
    });
  };

  const handleApprove = () => {
    if (!canAct("approve")) return;
    const toastId = toast.loading("Approving…");
    startSaving(async () => {
      try {
        await approvePost(postId);
        toast.success("Approved.", { id: toastId });
        router.refresh();
      } catch {
        toast.error("Couldn't approve.", { id: toastId });
      }
    });
  };

  const handleBackToDraft = () => {
    if (!canAct("backToDraft")) return;
    const toastId = toast.loading("Moving back to draft…");
    startSaving(async () => {
      try {
        await backToDraft(postId);
        toast.success("Moved back to draft.", { id: toastId });
        router.refresh();
      } catch {
        toast.error("Couldn't move back to draft.", { id: toastId });
      }
    });
  };

  const handlePublish = () => {
    startPublishing(async () => {
      const toastId = toast.loading("Publishing…");
      try {
        await saveStudioPayload(postId, payload);
        const result = await publishPostNow(postId);
        if (result.summary?.anyOk) {
          toast.success("Posted.", { id: toastId });
          router.push(`/app/posts/${postId}`);
        } else {
          toast.error("Publish failed.", { id: toastId });
        }
      } catch {
        toast.error("Publish failed.", { id: toastId });
      }
    });
  };

  const exportFiles = form.exportPayload?.(payload) ?? [];
  const canExport = exportFiles.length > 0;
  const [isExporting, setIsExporting] = useState(false);
  const handleExport = async () => {
    if (!canExport) return;
    setIsExporting(true);
    try {
      await downloadExportFiles(exportFiles);
      toast.success(
        exportFiles.length === 1
          ? "Downloaded."
          : `Downloaded ${exportFiles.length} files.`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't export.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSchedule = () => {
    if (!scheduleInput) return;
    const toastId = toast.loading("Scheduling…");
    startPublishing(async () => {
      try {
        await saveStudioPayload(postId, payload);
        const when = tzLocalInputToUtcDate(scheduleInput, timezone);
        if (status === "scheduled") {
          await reschedulePost(postId, when);
        } else {
          await schedulePost(postId, when);
        }
        toast.success("Scheduled.", { id: toastId });
        router.push(`/app/posts/${postId}`);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Couldn't schedule.",
          { id: toastId },
        );
      }
    });
  };

  const handleExit = () => {
    startSaving(async () => {
      const toastId = toast.loading("Exiting Studio…");
      try {
        await saveStudioPayload(postId, payload);
        await exitStudio(postId);
        toast.success("Back to Compose.", { id: toastId });
        router.push(`/app/composer?post=${postId}`);
      } catch {
        toast.error("Couldn't exit Studio.", { id: toastId });
      }
    });
  };

  const isReadOnly = status !== "draft";

  const ChannelIcon = CHANNEL_ICONS[channel];
  const headerAccent = CHANNEL_ACCENT[channel] ?? "bg-ink text-background";
  // Action chip in the header — translucent over the channel color, fixed
  // height so every button (incl. the SchedulePopover trigger) reads as one
  // size.
  const headerBtn =
    "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-[12.5px] font-medium transition-colors disabled:opacity-50 border border-white/15";
  const primaryBtn =
    "inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-white text-ink text-[12.5px] font-semibold hover:bg-white/90 transition-colors disabled:opacity-50";

  return (
    <div className="absolute inset-0 flex flex-col bg-background overflow-y-auto">
      <header className={cn("w-full", headerAccent)}>
        <div className="max-w-[1320px] mx-auto flex items-center justify-between gap-4 px-6 lg:px-10 py-3">
        <div className="flex items-center gap-3 min-w-0">
          {ChannelIcon ? (
            <ChannelIcon className="w-5 h-5 shrink-0" />
          ) : null}
          <div className="text-[13.5px] min-w-0 truncate">
            <span className="font-semibold">{channelLabel(channel)}</span>
            {profile?.handle ? (
              <span className="opacity-75"> · {profile.handle}</span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canAct("saveContent") ? (
            <button
              type="button"
              onClick={persist}
              disabled={isSaving}
              className={headerBtn}
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Save
            </button>
          ) : null}
          {form.exportPayload ? (
            <button
              type="button"
              onClick={handleExport}
              disabled={!canExport || isExporting}
              title={
                canExport
                  ? "Download media / content for manual upload"
                  : "Nothing to export yet"
              }
              className={headerBtn}
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              Export
            </button>
          ) : null}
          {canAct("backToDraft") ? (
            <button
              type="button"
              onClick={handleBackToDraft}
              disabled={isSaving || isPublishing}
              className={headerBtn}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Back to draft
            </button>
          ) : null}
          {canAct("submitForReview") ? (
            <button
              type="button"
              onClick={handleSubmitForReview}
              disabled={isSaving || isPublishing}
              className={primaryBtn}
            >
              <FileText className="w-3.5 h-3.5" />
              Submit for review
            </button>
          ) : null}
          {canAct("approve") ? (
            <button
              type="button"
              onClick={handleApprove}
              disabled={isSaving || isPublishing}
              className={primaryBtn}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Approve
            </button>
          ) : null}
          {canAct("schedule") || status === "scheduled" ? (
            <SchedulePopover
              scheduledAt={scheduleInput}
              setScheduledAt={setScheduleInput}
              open={showSchedule}
              setOpen={setShowSchedule}
              onConfirm={handleSchedule}
              disabled={isPublishing}
              busy={isPublishing && scheduleInput !== ""}
              timezone={timezone}
              confirmLabel={status === "scheduled" ? "Reschedule" : "Schedule"}
              idleLabel={status === "scheduled" ? "Reschedule" : "Schedule"}
              allowClear={status !== "scheduled"}
              triggerClassName={headerBtn}
              triggerActiveClassName="bg-white/30 text-white"
              triggerIdleClassName="bg-white/15 hover:bg-white/25 text-white"
            />
          ) : null}
          {canAct("publish") ? (
            <button
              type="button"
              onClick={handlePublish}
              disabled={isPublishing}
              className={primaryBtn}
            >
              <Send className="w-3.5 h-3.5" />
              Publish
            </button>
          ) : null}
          <span className="h-6 w-px bg-white/20 mx-1" aria-hidden />
          <button
            type="button"
            onClick={() => setShowExit(true)}
            disabled={isSaving || isPublishing || isReadOnly}
            title={
              isReadOnly
                ? "Move back to draft to exit Studio"
                : "Exit Studio and return to Compose"
            }
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-red-500/90 hover:bg-red-500 text-white text-[12.5px] font-medium border border-white/15 transition-colors disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            Exit
          </button>
        </div>
        </div>
      </header>

      {availableForms.length > 1 ? (
        <nav className="border-b border-border">
          <div className="max-w-[1320px] mx-auto flex items-center gap-1 px-6 lg:px-10 py-2">
            {availableForms.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => handleSwitchForm(f.id)}
                disabled={isSaving || isReadOnly}
                className={cn(
                  "rounded-full px-3 py-1 text-[12px] font-medium transition-colors",
                  f.id === currentForm
                    ? "bg-ink text-background"
                    : "text-ink/70 hover:bg-muted/60",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </nav>
      ) : null}

      <div className="flex-1 w-full max-w-[1320px] mx-auto px-6 lg:px-10 py-6 flex flex-col lg:flex-row gap-6 lg:gap-0">
        <section className="flex-1 lg:basis-2/3 min-w-0 flex flex-col lg:pr-6">
          <Editor
            payload={payload}
            onChange={setPayload}
            disabled={isReadOnly}
          />
        </section>
        <div
          aria-hidden
          className="hidden lg:block w-px bg-border self-stretch"
        />
        <section className="flex-1 lg:basis-1/3 min-w-0 flex flex-col lg:pl-6 lg:sticky lg:top-6 self-start w-full">
          <Preview
            payload={payload}
            profile={profile}
            author={{ name: author.name, image: author.image }}
          />
        </section>
      </div>

      {(() => {
        // Both footers operate on the standard PostPayload shape
        // (text + media). Forms with a different payload shape — article
        // body, document URL, etc. — opt out entirely.
        const { text, media } = readPostPayload(payload);
        const hasTextField = "text" in (payload as object);
        if (!hasTextField) return null;
        const maxChars = form.limits?.maxChars ?? Infinity;
        const maxMedia = form.limits?.maxMedia ?? 0;
        const setText = (t: string) =>
          setPayload({ ...payload, text: t, media } as StudioPayload);
        const setMedia = (m: PostMedia[]) =>
          setPayload({ ...payload, text, media: m } as StudioPayload);
        return (
          <>
            <StudioEditorFooter
              channel={channel}
              channelName={channelLabel(channel)}
              text={text}
              media={media}
              maxChars={maxChars}
              maxMedia={maxMedia}
              disabled={isReadOnly}
              onTextChange={setText}
              onMediaChange={setMedia}
            />
            <StudioAssistFooter
              channel={channel}
              museAccess={museAccess}
              text={text}
              media={media}
              maxMedia={maxMedia}
              disabled={isReadOnly}
              onTextChange={setText}
              onMediaChange={setMedia}
            />
          </>
        );
      })()}

      <ConfirmDialog
        isOpen={showExit}
        onClose={() => setShowExit(false)}
        onConfirm={handleExit}
        variant="destructive"
        confirmText="Exit Studio"
        cancelText="Stay"
        title="Exit Studio?"
        description={
          <p>
            Channel-specific formatting will be flattened to plain text in
            Compose. You can return to Studio later, but the thread /
            article structure here will be lost.
          </p>
        }
      />
    </div>
  );
}
