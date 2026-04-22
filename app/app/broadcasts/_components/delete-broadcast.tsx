"use client";

import { Trash2 } from "lucide-react";
import { deleteBroadcast } from "@/app/actions/broadcasts";
import { ConfirmDeleteForm } from "@/components/ui/confirm-dialog";

export function DeleteBroadcastButton({
  id,
  subject,
}: {
  id: string;
  subject: string;
}) {
  return (
    <ConfirmDeleteForm
      action={deleteBroadcast}
      id={id}
      title="Delete this draft?"
      description={
        <>
          <span className="font-medium text-ink">
            {subject || "Untitled broadcast"}
          </span>{" "}
          will be permanently removed. Sent broadcasts can't be deleted.
        </>
      }
      confirmText="Delete"
      toastMessages={{
        pending: "Deleting draft…",
        success: "Draft deleted.",
        error: "Couldn't delete draft.",
      }}
      className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-ink/60 hover:text-primary-deep hover:bg-peach-100/60 transition-colors text-[13px]"
    >
      <Trash2 className="w-3.5 h-3.5" />
      Delete draft
    </ConfirmDeleteForm>
  );
}
