import {
  displayHeading,
  paragraph,
  primaryButton,
  rawLinkFallback,
  renderLayout,
} from "../layout";

export function verifyEmail({
  verifyUrl,
  name,
}: {
  verifyUrl: string;
  name?: string | null;
}) {
  const greeting = name ? `Hi ${name.split(" ")[0]},` : "Hi,";

  const body = `
    ${displayHeading(`Verify your email.`)}
    ${paragraph(greeting)}
    ${paragraph(
      `Tap the button below to confirm your email and open your Aloha workspace. The link works once and expires in 24 hours.`,
    )}
    ${primaryButton("Verify email", verifyUrl)}
    ${rawLinkFallback(verifyUrl)}
    ${paragraph(
      `If you didn't start creating an Aloha workspace, you can safely ignore this email.`,
      { muted: true },
    )}
  `;

  const html = renderLayout({
    preheader: "Confirm your email to finish creating your Aloha workspace.",
    body,
  });

  const text = `${greeting}

Confirm your email and open your Aloha workspace:
${verifyUrl}

The link works once and expires in 24 hours. If you didn't start creating an Aloha workspace, you can ignore this email.

— Aloha`;

  return {
    subject: "Verify your email for Aloha",
    html,
    text,
  };
}
