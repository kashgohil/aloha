"use client";

// Reschedule control for a scheduled post. Renders the shared
// SchedulePopover so the UX matches the composer's Schedule button
// pixel-for-pixel — same trigger pill, same calendar, same time picker.

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { reschedulePost } from "@/app/actions/posts";
import { SchedulePopover } from "@/components/schedule-popover";
import { tzLocalInputToUtcDate, utcIsoToTzLocalInput } from "@/lib/tz";

export function RescheduleButton({
  postId,
  scheduledAtIso,
  timezone,
}: {
  postId: string;
  scheduledAtIso: string;
  timezone: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(() =>
    utcIsoToTzLocalInput(scheduledAtIso, timezone),
  );
  const [pending, startTransition] = useTransition();

  const onConfirm = () => {
    if (pending || !scheduledAt) return;
    const next = tzLocalInputToUtcDate(scheduledAt, timezone);
    if (!next || Number.isNaN(next.getTime())) {
      toast.error("Pick a valid date and time.");
      return;
    }
    if (next.getTime() <= Date.now()) {
      toast.error("Pick a time in the future.");
      return;
    }
    const toastId = toast.loading("Rescheduling…");
    startTransition(async () => {
      try {
        await reschedulePost(postId, next);
        toast.success("Post rescheduled.", { id: toastId });
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Couldn't reschedule.",
          { id: toastId },
        );
      }
    });
  };

  return (
    <SchedulePopover
      scheduledAt={scheduledAt}
      setScheduledAt={setScheduledAt}
      open={open}
      setOpen={setOpen}
      onConfirm={onConfirm}
      busy={pending}
      disabled={pending}
      timezone={timezone}
      confirmLabel="Save"
      allowClear={false}
    />
  );
}
