"use client";

import { ArrowLeft, Download, Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  publishPostNow,
  reschedulePost,
  schedulePost,
} from "@/app/actions/posts";
import {
  exitStudio,
  saveStudioPayload,
  switchStudioForm,
} from "@/app/actions/studio";
import { SchedulePopover } from "@/components/schedule-popover";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getCapability } from "@/lib/channels/capabilities";
import { downloadExportFiles } from "@/lib/studio/download";
import type { StudioPayload } from "@/db/schema";
import type { PostStatus } from "@/lib/posts/transitions";
import { tzLocalInputToUtcDate, utcIsoToTzLocalInput } from "@/lib/tz";
import { cn } from "@/lib/utils";

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
  const Editor = form.Editor;
  const Preview = form.Preview;

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

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-background">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowExit(true)}
            disabled={isSaving || isPublishing}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-ink hover:bg-muted/60 transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Exit Studio
          </button>
          <div className="text-[13px] text-ink/70">
            <span className="font-semibold text-ink">{channel}</span>
            {profile?.handle ? (
              <span className="text-ink/55"> · {profile.handle}</span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={persist}
            disabled={isSaving || isReadOnly}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-ink hover:bg-muted/60 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : null}
            Save
          </button>
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
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-ink hover:bg-muted/60 transition-colors disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              Export
            </button>
          ) : null}
          {status === "draft" || status === "scheduled" ? (
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
            />
          ) : null}
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing || isReadOnly}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink text-background px-3 py-1.5 text-[12px] font-semibold hover:bg-ink/90 transition-colors disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            Publish
          </button>
        </div>
      </header>

      {availableForms.length > 1 ? (
        <nav className="flex items-center gap-1 px-6 py-2 border-b border-border">
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
        </nav>
      ) : null}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0">
        <section className="p-6 border-r border-border">
          <Editor
            payload={payload}
            onChange={setPayload}
            disabled={isReadOnly}
          />
        </section>
        <section className="p-6 bg-background/60">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-3">
            Preview
          </p>
          <Preview
            payload={payload}
            profile={profile}
            author={{ name: author.name, image: author.image }}
          />
        </section>
      </div>

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
