"use client";

import { Trash2 } from "lucide-react";
import { deleteLink } from "@/app/actions/audience";
import { ConfirmDeleteForm } from "@/components/ui/confirm-dialog";

export function DeleteLinkButton({ linkId, title }: { linkId: string; title: string }) {
  return (
    <ConfirmDeleteForm
      action={deleteLink}
      id={linkId}
      title="Remove this link?"
      description={
        <>
          <span className="font-medium text-ink">{title}</span> will be removed from your page.
        </>
      }
      confirmText="Remove"
      className="p-2 rounded-full text-ink/50 hover:text-primary-deep hover:bg-peach-100/60 transition-colors"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </ConfirmDeleteForm>
  );
}
