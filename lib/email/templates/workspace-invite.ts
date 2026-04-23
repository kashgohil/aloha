import {
  displayHeading,
  paragraph,
  primaryButton,
  renderLayout,
} from "../layout";
import { env } from "@/lib/env";

export function workspaceInviteEmail({
  inviterName,
  workspaceName,
  role,
  token,
}: {
  inviterName: string | null;
  workspaceName: string;
  role: string;
  token: string;
}) {
  const acceptUrl = `${env.APP_URL.replace(/\/$/, "")}/app/invite/${token}`;
  const inviter = inviterName ?? "A teammate";

  const body = `
    ${displayHeading(`You've been invited to ${workspaceName}.`)}
    ${paragraph(
      `${inviter} added you as a <strong style="font-weight:500;">${role}</strong> on <strong style="font-weight:500;">${workspaceName}</strong> on Aloha.`,
    )}
    ${paragraph(
      `Click below to accept. If you don't have an Aloha account yet, you'll be asked to create one with this email.`,
    )}
    ${primaryButton("Accept invite", acceptUrl)}
    ${paragraph(
      `This invite expires in 7 days. Not you? Ignore the email — it won't work for anyone else.`,
    )}
  `;

  const text = `You've been invited to ${workspaceName} on Aloha as ${role}.

${inviter} sent the invite. Accept at:
${acceptUrl}

Expires in 7 days.`;

  return {
    subject: `${inviter} invited you to ${workspaceName} on Aloha`,
    html: renderLayout({
      preheader: `${inviter} added you as a ${role} on ${workspaceName}.`,
      body,
    }),
    text,
  };
}
