const COLORS = {
  bg: "#f6f1e4",
  elev: "#fffdf6",
  ink: "#1a1612",
  inkMuted: "rgba(26, 22, 18, 0.65)",
  inkSoft: "rgba(26, 22, 18, 0.55)",
  primary: "#4f46e5",
  peach100: "#fbe6cf",
  border: "#e2d8bf",
  borderStrong: "#cdc1a0",
} as const;

const DISPLAY_FONT = `'Fraunces', 'Iowan Old Style', 'Apple Garamond', Georgia, 'Times New Roman', serif`;
const BODY_FONT = `'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;

export function renderLayout({
  preheader,
  body,
}: {
  preheader: string;
  body: string;
}): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light" />
<title>Aloha</title>
<!--[if mso]>
<style type="text/css">table, td { font-family: Georgia, serif !important; }</style>
<![endif]-->
<style>
  @media (max-width: 600px) {
    .container { width: 100% !important; padding: 24px !important; }
    .h1 { font-size: 30px !important; line-height: 1.1 !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${COLORS.bg};color:${COLORS.ink};font-family:${BODY_FONT};-webkit-font-smoothing:antialiased;">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
  ${escape(preheader)}
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.bg};">
  <tr>
    <td align="center" style="padding:40px 16px;">
      <table role="presentation" class="container" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px;max-width:560px;background:${COLORS.elev};border:1px solid ${COLORS.border};border-radius:20px;padding:40px 44px;">
        <tr>
          <td>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding-bottom:28px;">
                  <span style="font-family:${DISPLAY_FONT};font-size:26px;line-height:1;letter-spacing:-0.03em;color:${COLORS.ink};font-weight:600;">Aloha</span><span style="font-family:${DISPLAY_FONT};color:${COLORS.primary};font-size:22px;">.</span>
                </td>
              </tr>
            </table>
            ${body}
          </td>
        </tr>
      </table>
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px;max-width:560px;margin-top:22px;">
        <tr>
          <td align="center" style="padding:0 24px;font-size:12px;line-height:1.55;color:${COLORS.inkSoft};">
            Aloha, Inc. · The calm social media OS<br />
            You're getting this because you started creating a workspace at usealoha.app.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export function displayHeading(html: string): string {
  return `<h1 class="h1" style="margin:0 0 18px 0;font-family:${DISPLAY_FONT};font-size:38px;line-height:1.05;letter-spacing:-0.03em;font-weight:400;color:${COLORS.ink};">${html}</h1>`;
}

export function paragraph(html: string, opts: { muted?: boolean } = {}): string {
  const color = opts.muted ? COLORS.inkMuted : COLORS.ink;
  return `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:${color};">${html}</p>`;
}

export function primaryButton(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:12px 0 8px 0;">
  <tr>
    <td style="border-radius:999px;background:${COLORS.ink};">
      <a href="${escapeAttr(href)}" target="_blank" rel="noopener" style="display:inline-block;padding:14px 28px;font-family:${BODY_FONT};font-size:15px;font-weight:500;color:${COLORS.bg};text-decoration:none;border-radius:999px;">${escape(label)}</a>
    </td>
  </tr>
</table>`;
}

export function rawLinkFallback(href: string): string {
  return `<p style="margin:16px 0 0 0;font-size:13px;line-height:1.6;color:${COLORS.inkMuted};">If the button doesn't work, paste this into your browser:<br /><span style="word-break:break-all;color:${COLORS.primary};">${escape(href)}</span></p>`;
}

export function divider(): string {
  return `<div style="height:1px;background:${COLORS.border};margin:28px 0;"></div>`;
}

export function bulletList(items: string[]): string {
  const rows = items
    .map(
      (t) => `<tr>
  <td valign="top" style="padding:0 10px 10px 0;width:14px;"><div style="width:6px;height:6px;border-radius:999px;background:${COLORS.primary};margin-top:9px;"></div></td>
  <td valign="top" style="padding:0 0 10px 0;font-size:14.5px;line-height:1.55;color:${COLORS.ink};">${t}</td>
</tr>`,
    )
    .join("\n");
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:12px 0 8px 0;">${rows}</table>`;
}

export function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function escapeAttr(value: string): string {
  return escape(value).replace(/"/g, "&quot;");
}

export { COLORS };
