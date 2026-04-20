import { RELEASES } from "@/lib/releases";
import { routes } from "@/lib/routes";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";
export const revalidate = 3600;

function escapeXml(s: string) {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

function releaseToHtml(r: (typeof RELEASES)[number]) {
	const items = r.changes
		.map(
			(c) =>
				`<li><strong>${escapeXml(c.tag)}:</strong> ${escapeXml(c.t)}</li>`,
		)
		.join("");
	return `<p>${escapeXml(r.lead)}</p><ul>${items}</ul>`;
}

export function GET() {
	const feedUrl = `${SITE_URL}/feed.xml`;
	const channelUrl = `${SITE_URL}${routes.product.whatsNew}`;
	const updated = new Date(RELEASES[0].date).toISOString();

	const entries = RELEASES.map((r) => {
		const id = `${channelUrl}#v${r.version}`;
		const updatedAt = new Date(r.date).toISOString();
		return `  <entry>
    <id>${id}</id>
    <title>${escapeXml(`v${r.version} — ${r.title}`)}</title>
    <link href="${id}" />
    <updated>${updatedAt}</updated>
    <published>${updatedAt}</published>
    <summary>${escapeXml(r.lead)}</summary>
    <content type="html">${escapeXml(releaseToHtml(r))}</content>
  </entry>`;
	}).join("\n");

	const body = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${feedUrl}</id>
  <title>${escapeXml(`${SITE_NAME} — What's new`)}</title>
  <subtitle>${escapeXml("The Aloha changelog — every shipped feature, improvement, and fix.")}</subtitle>
  <link rel="self" href="${feedUrl}" type="application/atom+xml" />
  <link rel="alternate" href="${channelUrl}" type="text/html" />
  <updated>${updated}</updated>
  <author><name>${SITE_NAME}</name></author>
${entries}
</feed>
`;

	return new Response(body, {
		headers: {
			"Content-Type": "application/atom+xml; charset=utf-8",
			"Cache-Control": "public, max-age=3600, s-maxage=3600",
		},
	});
}
