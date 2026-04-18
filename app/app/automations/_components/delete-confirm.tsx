"use client";

import { Trash2 } from "lucide-react";
import { deleteAutomation } from "../actions";
import { ConfirmDeleteForm } from "@/components/ui/confirm-dialog";

export function DeleteAutomationButton({ automationId, name }: { automationId: string; name?: string }) {
  return (
    <ConfirmDeleteForm
      action={deleteAutomation}
      id={automationId}
      title="Delete automation?"
      description={
        name ? (
          <>
            <span className="font-medium text-ink">{name}</span> will be permanently removed.
          </>
        ) : (
          "This automation will be permanently removed."
        )
      }
      confirmText="Delete"
      className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-[13px] text-ink/60 hover:text-primary-deep hover:bg-peach-100/60 transition-colors"
    >
      <Trash2 className="w-3.5 h-3.5" />
      Delete
    </ConfirmDeleteForm>
  );
}
