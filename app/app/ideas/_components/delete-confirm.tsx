"use client";

import { Trash2 } from "lucide-react";
import { deleteIdeaAction } from "@/app/actions/ideas";
import { ConfirmDeleteForm } from "@/components/ui/confirm-dialog";

export function DeleteIdeaButton({ ideaId }: { ideaId: string }) {
  return (
    <ConfirmDeleteForm
      action={deleteIdeaAction}
      id={ideaId}
      title="Delete this idea?"
      description="This can't be undone."
      confirmText="Delete"
      toastMessages={{
        pending: "Deleting idea…",
        success: "Idea deleted.",
        error: "Couldn't delete idea.",
      }}
      className="ml-auto inline-flex items-center justify-center w-8 h-8 rounded-full text-ink/40 hover:text-primary-deep hover:bg-peach-100/60 transition-colors"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </ConfirmDeleteForm>
  );
}
