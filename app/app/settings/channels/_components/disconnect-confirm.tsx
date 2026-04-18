"use client";

import { Trash2 } from "lucide-react";
import { disconnectChannel } from "../../actions";
import { ConfirmDeleteForm } from "@/components/ui/confirm-dialog";

export function DisconnectChannelButton({ provider, label = "Disconnect" }: { provider: string; label?: string }) {
  return (
    <ConfirmDeleteForm
      action={disconnectChannel}
      id={provider}
      title="Disconnect channel?"
      description="This will remove the connection to this channel. You can reconnect it later."
      confirmText="Disconnect"
      className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-[13px] text-ink/65 hover:text-primary-deep hover:bg-peach-100/60 transition-colors"
    >
      <Trash2 className="w-3.5 h-3.5" />
      {label}
    </ConfirmDeleteForm>
  );
}
