import { getMastodonCredentials } from "@/lib/publishers/mastodon";
import type { SyncResult, NormalizedMessage } from "./types";

const MAX_PAGES = 2;
const PAGE_SIZE = 40;

type MastodonNotification = {
	id: string;
	type: string;
	created_at: string;
	account: {
		id: string;
		username: string;
		acct: string;
		display_name: string;
		avatar: string;
	};
	status?: {
		id: string;
		uri: string;
		url: string;
		created_at: string;
		content: string;
		visibility: string;
		in_reply_to_id: string | null;
		in_reply_to_account_id: string | null;
		application?: { name: string };
	};
};

type NotificationsResponse = {
	notifications: MastodonNotification[];
	max_cursor?: string;
};

async function fetchNotificationsPage(
	instanceUrl: string,
	accessToken: string,
	maxId?: string,
): Promise<NotificationsResponse> {
	const params = new URLSearchParams({
		limit: String(PAGE_SIZE),
		types: "mention,status",
	});

	if (maxId) {
		params.set("max_id", maxId);
	}

	const res = await fetch(
		`${instanceUrl}/api/v1/notifications?${params}`,
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: "application/json",
			},
		},
	);

	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new Error(
			`Mastodon notifications API ${res.status}: ${detail.slice(0, 300)}`,
		);
	}

	return res.json() as Promise<NotificationsResponse>;
}

function stripHtml(html: string): string {
	return html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim();
}

export async function fetchMastodonNotifications(
	userId: string,
	cursor: string | null,
): Promise<SyncResult> {
	const credentials = await getMastodonCredentials(userId);

	const messages: NormalizedMessage[] = [];
	let currentCursor = cursor ?? undefined;
	let pagesRead = 0;

	while (pagesRead < MAX_PAGES) {
		const res = await fetchNotificationsPage(
			credentials.instanceUrl,
			credentials.accessToken,
			currentCursor,
		);

		for (const n of res.notifications) {
			if (n.type !== "mention" && n.type !== "status") continue;
			if (!n.status) continue;

			const status = n.status;
			const isReply = status.in_reply_to_id !== null;

			messages.push({
				remoteId: status.id,
				threadId: null,
				parentId: status.in_reply_to_id ?? null,
				reason: isReply ? "reply" : "mention",
				authorDid: n.account.id,
				authorHandle: n.account.username,
				authorDisplayName: n.account.display_name || n.account.username,
				authorAvatarUrl: n.account.avatar,
				content: stripHtml(status.content),
				platformData: {
					uri: status.uri,
					url: status.url,
					createdAt: status.created_at,
					visibility: status.visibility,
					application: status.application,
					notificationId: n.id,
					notificationType: n.type,
				},
				platformCreatedAt: new Date(status.created_at),
			});
		}

		currentCursor = res.max_cursor;
		pagesRead++;

		if (!res.max_cursor || res.notifications.length < PAGE_SIZE) break;
	}

	return {
		messages,
		newCursor: currentCursor ?? null,
	};
}