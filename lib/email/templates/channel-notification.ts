import {
  displayHeading,
  paragraph,
  primaryButton,
  renderLayout,
} from "../layout";
import { env } from "@/lib/env";

export function channelNotificationEmail({
  name,
  channelLabel,
}: {
  name?: string | null;
  channelLabel: string;
}) {
  const firstName = name?.split(" ")[0] ?? null;
  const greeting = firstName ? `Hey ${firstName},` : "Hey,";
  const workspaceUrl = `${env.APP_URL.replace(/\/$/, "")}/app/dashboard`;

  const body = `
    ${displayHeading(`We'll tell you when ${channelLabel} is ready.`)}
    ${paragraph(greeting)}
    ${paragraph(
      `You asked us to ping you when <strong style="font-weight:500;">${channelLabel}</strong> opens up on Aloha. We've got you on the list — you'll get one email from this inbox the moment it's connectable, with a direct link to wire it up.`,
    )}
    ${paragraph(
      `In the meantime you can still draft and schedule posts for ${channelLabel} — Muse writes them in your voice, and we'll hold them until publishing goes live.`,
    )}
    ${paragraph(
      `Nothing to do now. If you change your mind, just reply — this inbox goes to a human.`,
      { muted: true },
    )}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center">${primaryButton("Back to your workspace", workspaceUrl)}</td></tr></table>
  `;

  const html = renderLayout({
    preheader: `We'll email you the moment ${channelLabel} is ready to connect.`,
    body,
  });

  const text = `${greeting}

You asked us to ping you when ${channelLabel} opens up on Aloha. We've got you on the list — you'll get one email the moment it's connectable.

In the meantime you can still draft and schedule posts for ${channelLabel}. Muse writes them in your voice, and we hold them until publishing goes live.

If you change your mind, just reply — this inbox goes to a human.

Back to your workspace: ${workspaceUrl}

— Aloha`;

  const subject = firstName
    ? `${firstName}, we'll ping you when ${channelLabel} is ready`
    : `We'll ping you when ${channelLabel} is ready`;

  return {
    subject,
    html,
    text,
  };
}
