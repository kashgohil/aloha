import { getFreshToken, forceRefresh } from "@/lib/publishers/tokens";
import type { SyncResult, NormalizedMessage } from "./types";

const MAX_PAGES = 2;
const PAGE_SIZE = 50;

type FacebookConversation = {
	id: string;
	updated_time: string;
	from: { name: string; id: string; email?: string };
	to: { data: Array<{ name: string; id: string }> };
	comments?: { data: Array<{ id: string; message: string; created_time: string; from: { name: string; id: string } }> };
};

type FacebookConversationsResponse = {
	data?: FacebookConversation[];
	paging?: { cursors?: { before?: string; after?: string }; next?: string };
};

type FacebookPage = {
	id: string;
	name: string;
	access_token: string;
};

async function getUserPages(accessToken: string): Promise<FacebookPage[]> {
	const res = await fetch(
		`https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`,
	);
	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new Error(`Facebook get pages failed (${res.status}): ${detail.slice(0, 300)}`);
	}
	const json = (await res.json()) as { data?: FacebookPage[] };
	return json.data ?? [];
}

async function fetchConversationsPage(
	pageAccessToken: string,
	pageId: string,
	cursor?: string,
): Promise<FacebookConversationsResponse> {
	const params = new URLSearchParams({
		limit: String(PAGE_SIZE),
	});
	if (cursor) params.set("cursor", cursor);

	const res = await fetch(
		`https://graph.facebook.com/v19.0/${pageId}/conversations?${params}&access_token=${pageAccessToken}`,
	);

	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new Error(`Facebook conversations API ${res.status}: ${detail.slice(0, 300)}`);
	}

	return res.json() as Promise<FacebookConversationsResponse>;
}

async function fetchCommentsPage(
	pageAccessToken: string,
	conversationId: string,
	cursor?: string,
): Promise<{ data?: Array<{ id: string; message: string; created_time: string; from: { name: string; id: string } }>; paging?: { cursors?: { before?: string; after?: string } } }> {
	const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
	if (cursor) params.set("cursor", cursor);

	const res = await fetch(
		`https://graph.facebook.com/v19.0/${conversationId}/comments?${params}&access_token=${pageAccessToken}`,
	);

	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new Error(`Facebook comments API ${res.status}: ${detail.slice(0, 300)}`);
	}

	return res.json();
}

export async function fetchFacebookInbox(
	appUserId: string,
	cursor: string | null,
): Promise<SyncResult> {
	let account = await getFreshToken(appUserId, "facebook");

	let pages: FacebookPage[];
	try {
		pages = await getUserPages(account.accessToken);
	} catch (err) {
		if (String(err).includes("401")) {
			account = await forceRefresh(appUserId, "facebook");
			pages = await getUserPages(account.accessToken);
		} else {
			throw err;
		}
	}

	if (pages.length === 0) {
		return { messages: [], newCursor: null };
	}

	const page = pages[0];
	const messages: NormalizedMessage[] = [];
	let currentCursor = cursor ?? undefined;
	let pagesRead = 0;

	while (pagesRead < MAX_PAGES) {
		let res: FacebookConversationsResponse;
		try {
			res = await fetchConversationsPage(page.access_token, page.id, currentCursor);
		} catch (err) {
			if (pagesRead === 0 && String(err).includes("401")) {
				account = await forceRefresh(appUserId, "facebook");
				res = await fetchConversationsPage(page.access_token, page.id, currentCursor);
			} else {
				throw err;
			}
		}

		if (!res.data || res.data.length === 0) break;

		for (const conv of res.data) {
			if (!conv.comments?.data || conv.comments.data.length === 0) continue;

			for (const comment of conv.comments.data) {
				const isReply = comment.from.id !== page.id;

				messages.push({
					remoteId: comment.id,
					threadId: conv.id,
					parentId: null,
					reason: isReply ? "reply" : "mention",
					authorDid: comment.from.id,
					authorHandle: comment.from.id,
					authorDisplayName: comment.from.name,
					authorAvatarUrl: null,
					content: comment.message,
					platformData: {
						conversationId: conv.id,
						pageId: page.id,
					},
					platformCreatedAt: new Date(comment.created_time),
				});
			}
		}

		currentCursor = res.paging?.cursors?.after;
		pagesRead++;

		if (!currentCursor || res.data.length < PAGE_SIZE) break;
	}

	return {
		messages,
		newCursor: currentCursor ?? null,
	};
}