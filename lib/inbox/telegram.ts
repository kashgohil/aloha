import bigInt from "big-integer";
import type { SyncResult, NormalizedMessage } from "./types";
import { getTelegramSession } from "@/lib/publishers/telegram";

const MAX_MESSAGES = 100;

export async function fetchTelegramMessages(
	userId: string,
	cursor: string | null,
): Promise<SyncResult> {
	const session = await getTelegramSession(userId);
	if (!session) {
		return { messages: [], newCursor: null };
	}

	const { client, chatId } = session;

	try {
		// Resolve the chat entity
		let entity;
		if (chatId.startsWith("@")) {
			entity = await client.getEntity(chatId);
		} else {
			entity = await client.getEntity(bigInt(chatId));
		}

		// Get messages from the chat
		const messages: NormalizedMessage[] = [];
		const offsetId = cursor ? parseInt(cursor, 10) : 0;

		const history = await client.getMessages(entity, {
			limit: MAX_MESSAGES,
			offsetId: offsetId || undefined,
		});

		let maxId = offsetId;

		for (const msg of history) {
			if (!msg.message) continue; // Skip non-text messages (service, etc.)

			if (msg.id > maxId) {
				maxId = msg.id;
			}

			// Skip messages sent by the user themselves (we only want incoming)
			const sender = await msg.getSender();
			const isOutgoing = msg.out;

			if (isOutgoing) continue; // Skip our own messages

			const senderId = sender ? String(sender.id) : "unknown";
			const senderName = sender 
				? (sender as { firstName?: string; lastName?: string; username?: string }).firstName || 
				  (sender as { username?: string }).username || 
				  "Unknown"
				: "Unknown";

			messages.push({
				remoteId: String(msg.id),
				threadId: String(entity.id),
				parentId: msg.replyTo ? String(msg.replyTo.replyToMsgId) : null,
				reason: msg.replyTo ? "reply" : "mention",
				authorDid: senderId,
				authorHandle: (sender as { username?: string }).username || senderId,
				authorDisplayName: senderName,
				authorAvatarUrl: null,
				content: msg.message,
				platformData: {
					chatId: String(entity.id),
					date: msg.date,
					hasMedia: msg.media !== undefined && msg.media !== null,
				},
				platformCreatedAt: new Date(msg.date * 1000),
			});
		}

		// Return the next offset (max message ID)
		const newCursor = maxId > offsetId ? String(maxId) : null;

		return {
			messages,
			newCursor,
		};
	} catch (err) {
		console.error("[telegram] fetch messages failed", err);
		return { messages: [], newCursor: cursor };
	}
}
