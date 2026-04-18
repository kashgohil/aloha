"use client";

import { Trash2 } from "lucide-react";
import { disconnectNotionAction } from "@/app/actions/corpus";
import { ConfirmDeleteForm } from "@/components/ui/confirm-dialog";

export function DisconnectNotionButton() {
  return (
    <ConfirmDeleteForm
      action={disconnectNotionAction}
      title="Disconnect Notion?"
      description="This will remove the connection to Notion and delete all synced documents from your corpus. You can reconnect it later."
      confirmText="Disconnect"
      className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-[13px] text-ink/65 hover:text-ink transition-colors"
    >
      <Trash2 className="w-3.5 h-3.5" />
      Disconnect
    </ConfirmDeleteForm>
  );
}
