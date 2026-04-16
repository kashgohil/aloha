import { getFreshToken, forceRefresh } from "@/lib/publishers/tokens";
import type { SyncResult, NormalizedMessage } from "./types";

const MAX_PAGES = 2;
const PAGE_SIZE = 50;

type ThreadsUser = {
	id: string;
	username: string;
};

type FacebookPage = {
	id: string;
	access_token: string;
};

type ThreadsPost = {
	id: string;
	text?: string;
	username?: string;
	timestamp?: string;
};

type ThreadsPostsResponse = {
	data?: ThreadsPost[];
};

async function getThreadsUser(accessToken: string): Promise<ThreadsUser | null> {
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
	if (!igData.instagram_business_account) return null;

	const threadsRes = await fetch(
		`https://graph.facebook.com/v19.0/${igData.instagram_business_account.id}?fields=threads_profile&access_token=${page.access_token}`,
	);
	if (!threadsRes.ok) return null;
	const threadsData = (await threadsRes.json()) as { threads_profile?: { id: string; username: string } };
	return threadsData.threads_profile ?? null;
}

async function fetchUserPosts(
	threadsUserId: string,
	pageAccessToken: string,
): Promise<ThreadsPostsResponse> {
	const res = await fetch(
		`https://graph.facebook.com/v19.0/${threadsUserId}/threads?access_token=${pageAccessToken}`,
	);
	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new Error(`Threads posts API ${res.status}: ${detail.slice(0, 300)}`);
	}
	return res.json() as Promise<ThreadsPostsResponse>;
}

export async function fetchThreadsInbox(
	appUserId: string,
	cursor: string | null,
): Promise<SyncResult> {
	let account = await getFreshToken(appUserId, "threads");

	let threadsUser: ThreadsUser | null;
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
		if (!igData.instagram_business_account) {
			return { messages: [], newCursor: null };
		}

		const threadsRes = await fetch(
			`https://graph.facebook.com/v19.0/${igData.instagram_business_account.id}?fields=threads_profile&access_token=${page.access_token}`,
		);
		const threadsData = (await threadsRes.json()) as { threads_profile?: { id: string; username: string } };
		threadsUser = threadsData.threads_profile ?? null;
	} catch (err) {
		if (String(err).includes("401")) {
			account = await forceRefresh(appUserId, "threads");
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
			if (!igData.instagram_business_account) {
				return { messages: [], newCursor: null };
			}

			const threadsRes = await fetch(
				`https://graph.facebook.com/v19.0/${igData.instagram_business_account.id}?fields=threads_profile&access_token=${page.access_token}`,
			);
			const threadsData = (await threadsRes.json()) as { threads_profile?: { id: string; username: string } };
			threadsUser = threadsData.threads_profile ?? null;
		} else {
			throw err;
		}
	}

	if (!threadsUser) {
		return { messages: [], newCursor: null };
	}

	const messages: NormalizedMessage[] = [];

	try {
		const res = await fetchUserPosts(threadsUser.id, pageAccessToken);
		if (res.data) {
			for (const post of res.data) {
				if (post.text) {
					messages.push({
						remoteId: post.id,
						threadId: null,
						parentId: null,
						reason: "mention",
						authorDid: threadsUser.id,
						authorHandle: threadsUser.username,
						authorDisplayName: threadsUser.username,
						authorAvatarUrl: null,
						content: post.text,
						platformData: {},
						platformCreatedAt: post.timestamp ? new Date(post.timestamp) : new Date(),
					});
				}
			}
		}
	} catch {
		return { messages: [], newCursor: null };
	}

	return {
		messages,
		newCursor: null,
	};
}