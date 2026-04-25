import type { PostMedia } from "@/db/schema";
import { categorizeHttpStatus, PublishError } from "./errors";
import { forceRefresh, getFreshToken, type ProviderAccount } from "./tokens";

export type MediumPostResult = {
	remotePostId: string;
	remoteUrl: string;
};

function extractTitle(text: string): string {
	const firstLine = text.split("\n")[0].replace(/^#+\s*/, "").trim();
	if (firstLine.length > 0 && firstLine.length <= 100) return firstLine;
	return text.slice(0, 60).trim() + (text.length > 60 ? "…" : "");
}

function buildContent(text: string, media?: PostMedia[]): string {
	let content = text;
	if (media && media.length > 0) {
		const images = media
			.filter((m) => m.mimeType.startsWith("image/"))
			.map((m) => `![${m.alt ?? ""}](${m.url})`)
			.join("\n\n");
		if (images) content += `\n\n${images}`;
	}
	return content;
}

async function getMediumUserId(account: ProviderAccount): Promise<string> {
	const res = await fetch("https://api.medium.com/v1/me", {
		headers: {
			Authorization: `Bearer ${account.accessToken}`,
			"Content-Type": "application/json",
			Accept: "application/json",
		},
	});
	if (!res.ok) {
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`Medium /me failed (${res.status})`,
		);
	}
	const json = (await res.json()) as { data?: { id?: string } };
	const id = json?.data?.id;
	if (!id) throw new PublishError("transient", "Medium /me returned no user id");
	return id;
}

async function callCreatePost(
	account: ProviderAccount,
	mediumUserId: string,
	title: string,
	content: string,
): Promise<Response> {
	return fetch(
		`https://api.medium.com/v1/users/${mediumUserId}/posts`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${account.accessToken}`,
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({
				title,
				contentFormat: "markdown",
				content,
				publishStatus: "public",
			}),
		},
	);
}

export async function publishToMedium(args: {
	workspaceId: string;
	text: string;
	media?: PostMedia[];
	// Explicit title — used when the caller has a dedicated title field
	// (Studio Article form). Falls back to extracting from the first
	// line when omitted (legacy multi-channel fanout flow).
	title?: string;
}): Promise<MediumPostResult> {
	let account = await getFreshToken(args.workspaceId, "medium");

	const title = args.title?.trim() || extractTitle(args.text);
	const content = buildContent(args.text, args.media);

	let mediumUserId: string;
	try {
		mediumUserId = await getMediumUserId(account);
	} catch (err) {
		if (err instanceof PublishError && err.category === "needs_reauth") {
			account = await forceRefresh(args.workspaceId, "medium");
			mediumUserId = await getMediumUserId(account);
		} else {
			throw err;
		}
	}

	let res = await callCreatePost(account, mediumUserId, title, content);

	if (res.status === 401) {
		account = await forceRefresh(args.workspaceId, "medium");
		res = await callCreatePost(account, mediumUserId, title, content);
	}

	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`Medium publish failed (${res.status}): ${detail.slice(0, 400)}`,
		);
	}

	const json = (await res.json()) as {
		data?: { id?: string; url?: string };
	} | null;
	const id = json?.data?.id;
	const url = json?.data?.url;
	if (!id || !url) {
		throw new PublishError("transient", "Medium publish returned no post id");
	}

	return { remotePostId: id, remoteUrl: url };
}
