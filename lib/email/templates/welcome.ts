import {
  bulletList,
  displayHeading,
  divider,
  paragraph,
  primaryButton,
  renderLayout,
} from "../layout";

export function welcomeEmail({
  name,
  appUrl,
}: {
  name?: string | null;
  appUrl: string;
}) {
  const firstName = name?.split(" ")[0] ?? null;
  const greeting = firstName ? `Hey ${firstName},` : "Hey,";
  const dashboardUrl = `${appUrl.replace(/\/$/, "")}/app/dashboard`;

  const body = `
    ${displayHeading(`Welcome to Aloha.`)}
    ${paragraph(greeting)}
    ${paragraph(
      `You're in. Aloha is built for people who'd rather be making the work than managing the posting of it — one composer, many networks, and a calendar that breathes.`,
    )}
    ${primaryButton("Open your workspace", dashboardUrl)}
    ${divider()}
    ${paragraph(
      `<strong style="font-weight:500;">A few good first moves:</strong>`,
    )}
    ${bulletList([
      "Connect a channel so you can schedule your first post",
      "Set your timezone in Settings — your calendar starts working in hours you actually post",
      "Write one draft in the composer, let it sit, and see how the week plans itself",
    ])}
    ${paragraph(
      `If anything feels off, hit reply — this inbox goes to a human.`,
      { muted: true },
    )}
  `;

  const html = renderLayout({
    preheader: "Your Aloha workspace is ready. Here's how to get started.",
    body,
  });

  const text = `${greeting}

Welcome to Aloha. Your workspace is ready:
${dashboardUrl}

A few good first moves:
  • Connect a channel so you can schedule your first post
  • Set your timezone in Settings
  • Write one draft in the composer and see how the week plans itself

If anything feels off, hit reply — this inbox goes to a human.

— Aloha`;

  return {
    subject: "Welcome to Aloha",
    html,
    text,
  };
}
