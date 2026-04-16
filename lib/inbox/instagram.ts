import { getFreshToken, forceRefresh } from "@/lib/publishers/tokens";
import type { SyncResult, NormalizedMessage } from "./types";

const MAX_PAGES = 2;
const PAGE_SIZE = 50;

type IgUser = {
	id: string;
	username: string;
};

type IgMedia = {
	id: string;
	username?: string;
	caption?: string;
	media_type?: string;
	permalink?: string;
	timestamp?: string;
};

type IgCommentsResponse = {
	data?: Array<{
		id: string;
		text: string;
		created_at: string;
		from: { id: string; username: string; full_name?: string; profile_picture_url?: string };
		media?: { id: string };
		replies?: { data?: Array<{ id: string; text: string; created_at: string; from: { id: string; username: string; full_name?: string; profile_picture_url?: string } }> };
	}>;
	paging?: { cursors?: { before?: string; after?: string }; next?: string };
};

type FacebookPage = {
	id: string;
	access_token: string;
};

async function getInstagramBusinessAccount(accessToken: string): Promise<IgUser | null> {
	const res = await fetch(
		`https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`,
	);
	if (!res.ok) return null;
	const pages = (await res.json()) as { data?: FacebookPage[] };
	const page = pages.data?.[0];
	if (!page) return null;

	const igRes = await fetch(
		`https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`,
	);
	if (!igRes.ok) return null;
	const igData = (await igRes.json()) as { instagram_business_account?: { id: string; username: string } };
	return igData.instagram_business_account ?? null;
}

async function fetchMediaComments(
	igUserId: string,
	pageAccessToken: string,
	cursor?: string,
): Promise<IgCommentsResponse> {
	const params = new URLSearchParams({
		fields: "id,text,created_at,from,media,replies",
		limit: String(PAGE_SIZE),
	});
	if (cursor) params.set("cursor", cursor);

	const res = await fetch(
		`https://graph.facebook.com/v19.0/${igUserId}/comments?${params}&access_token=${pageAccessToken}`,
	);

	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new Error(`Instagram comments API ${res.status}: ${detail.slice(0, 300)}`);
	}

	return res.json() as Promise<IgCommentsResponse>;
}

async function fetchMentions(
	igUserId: string,
	pageAccessToken: string,
	cursor?: string,
): Promise<IgCommentsResponse> {
	const params = new URLSearchParams({
		fields: "id,text,created_at,from,media",
		limit: String(PAGE_SIZE),
	});
	if (cursor) params.set("cursor", cursor);

	const res = await fetch(
		`https://graph.facebook.com/v19.0/${igUserId}/mentions?${params}&access_token=${pageAccessToken}`,
	);

	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new Error(`Instagram mentions API ${res.status}: ${detail.slice(0, 300)}`);
	}

	return res.json() as Promise<IgCommentsResponse>;
}

export async function fetchInstagramInbox(
	appUserId: string,
	cursor: string | null,
): Promise<SyncResult> {
	let account = await getFreshToken(appUserId, "instagram");

	let igUser: IgUser | null;
	let pageAccessToken: string;

	try {
		const res = await fetch(
			`https://graph.facebook.com/v19.0/me/accounts?access_token=${account.accessToken}`,
		);
		const pages = (await res.json()) as { data?: FacebookPage[] };
		const page = pages.data?.[0];
		if (!page) {
			return { messages: [], newCursor: null };
		}
		pageAccessToken = page.access_token;

		const igRes = await fetch(
			`https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`,
		);
		const igData = (await igRes.json()) as { instagram_business_account?: { id: string; username: string } };
		igUser = igData.instagram_business_account ?? null;
	} catch (err) {
		if (String(err).includes("401")) {
			account = await forceRefresh(appUserId, "instagram");
			const res = await fetch(
				`https://graph.facebook.com/v19.0/me/accounts?access_token=${account.accessToken}`,
			);
			const pages = (await res.json()) as { data?: FacebookPage[] };
			const page = pages.data?.[0];
			if (!page) {
				return { messages: [], newCursor: null };
			}
			pageAccessToken = page.access_token;

			const igRes = await fetch(
				`https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`,
			);
			const igData = (await igRes.json()) as { instagram_business_account?: { id: string; username: string } };
			igUser = igData.instagram_business_account ?? null;
		} else {
			throw err;
		}
	}

	if (!igUser) {
		return { messages: [], newCursor: null };
	}

	const messages: NormalizedMessage[] = [];
	let currentCursor = cursor ?? undefined;
	let pagesRead = 0;

	while (pagesRead < MAX_PAGES) {
		let res: IgCommentsResponse;
		try {
			res = await fetchMentions(igUser.id, pageAccessToken, currentCursor);
		} catch (err) {
			if (pagesRead === 0 && String(err).includes("401")) {
				account = await forceRefresh(appUserId, "instagram");
				res = await fetchMentions(igUser.id, pageAccessToken, currentCursor);
			} else {
				throw err;
			}
		}

		if (!res.data || res.data.length === 0) break;

		for (const comment of res.data) {
			messages.push({
				remoteId: comment.id,
				threadId: comment.media?.id ?? null,
				parentId: null,
				reason: "mention",
				authorDid: comment.from.id,
				authorHandle: comment.from.username,
				authorDisplayName: comment.from.full_name ?? null,
				authorAvatarUrl: comment.from.profile_picture_url ?? null,
				content: comment.text,
				platformData: {
					mediaId: comment.media?.id,
				},
				platformCreatedAt: new Date(comment.created_at),
			});

			if (comment.replies?.data) {
				for (const reply of comment.replies.data) {
					messages.push({
						remoteId: reply.id,
						threadId: comment.media?.id ?? null,
						parentId: comment.id,
						reason: "reply",
						authorDid: reply.from.id,
						authorHandle: reply.from.username,
						authorDisplayName: reply.from.full_name ?? null,
						authorAvatarUrl: reply.from.profile_picture_url ?? null,
						content: reply.text,
						platformData: {
							mediaId: comment.media?.id,
							parentCommentId: comment.id,
						},
						platformCreatedAt: new Date(reply.created_at),
					});
				}
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