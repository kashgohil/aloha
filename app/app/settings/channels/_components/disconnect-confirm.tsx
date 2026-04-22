"use client";

import { Trash2 } from "lucide-react";
import { disconnectChannel } from "../../actions";
import { ConfirmDeleteForm } from "@/components/ui/confirm-dialog";
import { channelLabel } from "@/components/channel-chip";

export function DisconnectChannelButton({
  provider,
  label = "Disconnect",
}: {
  provider: string;
  label?: string;
}) {
  const name = channelLabel(provider);
  return (
    <ConfirmDeleteForm
      action={disconnectChannel}
      id={provider}
      title={`Disconnect ${name}?`}
      description={<DisconnectConsequences name={name} />}
      confirmText={`Disconnect ${name}`}
      toastMessages={{
        pending: `Disconnecting ${name}…`,
        success: `${name} disconnected.`,
        error: `Couldn't disconnect ${name}.`,
      }}
      className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-[13px] text-ink/65 hover:text-primary-deep hover:bg-peach-100/60 transition-colors"
    >
      <Trash2 className="w-3.5 h-3.5" />
      {label}
    </ConfirmDeleteForm>
  );
}

function DisconnectConsequences({ name }: { name: string }) {
  return (
    <div className="space-y-3">
      <p>
        {`You can reconnect ${name} later, but these effects land immediately and won't roll back on reconnect:`}
      </p>
      <ul className="list-disc pl-5 space-y-1.5 text-ink/75">
        <li>
          <span className="text-ink">Scheduled posts</span>
          {` for ${name} stop publishing. Posts scheduled for other channels stay on track.`}
        </li>
        <li>
          <span className="text-ink">Per-channel drafts & overrides</span>
          {` you wrote for ${name} remain on the post but won't go anywhere until you re-add the channel.`}
        </li>
        <li>
          <span className="text-ink">Stored tokens and profile details</span>
          {` (avatar, handle, follower count) are deleted. We re-fetch them on reconnect.`}
        </li>
        <li>
          <span className="text-ink">Billing seat count</span>
          {` updates right away if you're on a paid plan — your next invoice reflects the new channel count.`}
        </li>
        <li>
          <span className="text-ink">Past publish history and analytics</span>
          {` stay put. If you reconnect with a different ${name} account, that history won't merge with the new one.`}
        </li>
      </ul>
    </div>
  );
}
