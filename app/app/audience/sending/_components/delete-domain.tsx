"use client";

import { Trash2 } from "lucide-react";
import { deleteSendingDomain } from "@/app/actions/sending-domains";
import { ConfirmDeleteForm } from "@/components/ui/confirm-dialog";

export function DeleteDomainButton({
  id,
  domain,
}: {
  id: string;
  domain: string;
}) {
  return (
    <ConfirmDeleteForm
      action={deleteSendingDomain}
      id={id}
      title="Remove this sending domain?"
      description={
        <>
          <span className="font-medium text-ink">{domain}</span> will be
          removed from Resend and from your account. Broadcasts tied to it
          will lose their From domain.
        </>
      }
      confirmText="Remove"
      toastMessages={{
        pending: "Removing sending domain…",
        success: "Sending domain removed.",
        error: "Couldn't remove sending domain.",
      }}
      className="inline-flex items-center h-9 px-3 rounded-full text-ink/60 hover:text-primary-deep hover:bg-peach-100/60 transition-colors"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </ConfirmDeleteForm>
  );
}
