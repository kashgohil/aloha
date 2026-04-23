import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { eq } from "drizzle-orm";
import type { PostMedia } from "@/db/schema";
import { db } from "@/db";
import { telegramCredentials } from "@/db/schema";
import { PublishError } from "./errors";
import { requireActiveWorkspaceId } from "@/lib/workspaces/resolve";

export type TelegramPostResult = {
	remotePostId: string;
	remoteUrl: string;
};

// API credentials from environment (your app credentials from my.telegram.org)
const API_ID = process.env.TELEGRAM_API_ID ? parseInt(process.env.TELEGRAM_API_ID, 10) : null;
const API_HASH = process.env.TELEGRAM_API_HASH || null;

if (!API_ID || !API_HASH) {
	console.warn("[telegram] TELEGRAM_API_ID or TELEGRAM_API_HASH not set in environment");
}

type TelegramCredentials = {
	phoneNumber: string;
	sessionData: Record<string, unknown> | null;
	chatId: string;
	username: string | null;
};

// Store clients in memory (in production, use Redis or similar for multi-instance)
const clientCache = new Map<string, TelegramClient>();

function getClient(sessionString: string | null): TelegramClient | null {
	if (!API_ID || !API_HASH) return null;
	const session = new StringSession(sessionString || "");
	const client = new TelegramClient(session, API_ID, API_HASH, {
		connectionRetries: 5,
	});
	return client;
}

export async function getTelegramCredentials(userId: string): Promise<TelegramCredentials & { authState: string }> {
	const [row] = await db
		.select({
			phoneNumber: telegramCredentials.phoneNumber,
			sessionData: telegramCredentials.sessionData,
			chatId: telegramCredentials.chatId,
			username: telegramCredentials.username,
			authState: telegramCredentials.authState,
			reauthRequired: telegramCredentials.reauthRequired,
		})
		.from(telegramCredentials)
		.where(eq(telegramCredentials.userId, userId))
		.limit(1);

	if (!row) {
		throw new PublishError(
			"needs_reauth",
			"Telegram not connected. Please connect your Telegram account.",
		);
	}

	if (row.reauthRequired || row.authState !== "authenticated") {
		throw new PublishError(
			"needs_reauth",
			"Telegram session is invalid or expired. Please reconnect.",
		);
	}

	return {
		phoneNumber: row.phoneNumber,
		sessionData: row.sessionData,
		chatId: row.chatId,
		username: row.username,
		authState: row.authState,
	};
}

async function getOrCreateClient(userId: string, credentials: TelegramCredentials): Promise<TelegramClient> {
	// Check cache first
	const cached = clientCache.get(userId);
	if (cached && cached.connected) {
		return cached;
	}

	// Create new client
	const sessionString = credentials.sessionData?.sessionString as string | undefined;
	const client = getClient(sessionString || null);
	if (!client) {
		throw new PublishError("needs_reauth", "Telegram API credentials not configured");
	}

	// Connect if not already connected
	if (!client.connected) {
		await client.connect();
	}

	// Check if authorized
	const isAuthorized = await client.isUserAuthorized();
	if (!isAuthorized) {
		// Mark as needing reauth
		await db
			.update(telegramCredentials)
			.set({ reauthRequired: true, authState: "failed" })
			.where(eq(telegramCredentials.userId, userId));
		throw new PublishError("needs_reauth", "Telegram session expired. Please reconnect.");
	}

	// Cache the client
	clientCache.set(userId, client);
	return client;
}

async function resolveChat(client: TelegramClient, chatId: string) {
	// Try to resolve as username first
	if (chatId.startsWith("@")) {
		try {
			const entity = await client.getEntity(chatId);
			return entity;
		} catch {
			throw new PublishError("transient", `Could not resolve channel ${chatId}`);
		}
	}

	// Try as numeric ID - use parseInt for telegram's API
	try {
		const numericId = parseInt(chatId, 10);
		const entity = await client.getEntity(numericId);
		return entity;
	} catch {
		throw new PublishError("transient", `Could not resolve chat ID ${chatId}`);
	}
}

export async function publishToTelegram(args: {
	userId: string;
	text: string;
	media?: PostMedia[];
}): Promise<TelegramPostResult> {
	const credentials = await getTelegramCredentials(args.userId);

	let client: TelegramClient;
	try {
		client = await getOrCreateClient(args.userId, credentials);
	} catch (err) {
		if (err instanceof PublishError) throw err;
		throw new PublishError("transient", `Failed to connect to Telegram: ${err}`);
	}

	try {
		// Resolve the target chat/channel
		const chat = await resolveChat(client, credentials.chatId);

		let messageId: number;

		if (args.media && args.media.length > 0) {
			// For simplicity, send text with media link
			const firstMedia = args.media[0];
			const mediaLink = `\n\n📎 Media: ${firstMedia.url}`;
			const result = await client.sendMessage(chat, {
				message: args.text + mediaLink,
			});
			messageId = result.id as number;
		} else {
			const result = await client.sendMessage(chat, {
				message: args.text,
			});
			messageId = result.id as number;
		}

		// Build URL
		const remoteUrl = credentials.username
			? `https://t.me/${credentials.username}/${messageId}`
			: `https://t.me/c/${credentials.chatId.replace(/^-100/, "")}/${messageId}`;

		return {
			remotePostId: String(messageId),
			remoteUrl,
		};
	} catch (err) {
		if (err instanceof PublishError) {
			throw err;
		}

		// Handle specific MTProto errors
		const errorMessage = err instanceof Error ? err.message : String(err);
		
		if (errorMessage.includes("AUTH_KEY_UNREGISTERED") || 
		    errorMessage.includes("SESSION_REVOKED") ||
		    errorMessage.includes("USER_DEACTIVATED")) {
			// Mark session as invalid
			await db
				.update(telegramCredentials)
				.set({ reauthRequired: true, authState: "failed" })
				.where(eq(telegramCredentials.userId, args.userId));
			throw new PublishError("needs_reauth", `Telegram auth failed: ${errorMessage}`);
		}

		if (errorMessage.includes("FLOOD_WAIT")) {
			throw new PublishError("rate_limited", `Telegram rate limit: ${errorMessage}`);
		}

		throw new PublishError("transient", `Telegram publish failed: ${errorMessage}`);
	}
}

// Helper for multi-step authentication
export async function startTelegramAuth(
	userId: string,
	phoneNumber: string,
	chatId: string,
	username?: string,
): Promise<{ success: boolean; needsCode: boolean; error?: string }> {
	if (!API_ID || !API_HASH) {
		return { success: false, needsCode: false, error: "Telegram API credentials not configured" };
	}

	try {
		const client = getClient(null);
		if (!client) {
			return { success: false, needsCode: false, error: "Failed to initialize Telegram client" };
		}
		await client.connect();

		// Start phone authentication
		await client.sendCode(
			{
				apiId: API_ID,
				apiHash: API_HASH,
			},
			phoneNumber,
		);

		// Store initial credentials (pending code)
		const workspaceId = await requireActiveWorkspaceId(userId);
		await db
			.insert(telegramCredentials)
			.values({
				userId,
				workspaceId,
				phoneNumber,
				chatId,
				username: username || null,
				authState: "pending_code",
				sessionData: { tempClient: true },
			})
			.onConflictDoUpdate({
				target: telegramCredentials.userId,
				set: {
					phoneNumber,
					chatId,
					username: username || null,
					authState: "pending_code",
					updatedAt: new Date(),
				},
			});

		return { success: true, needsCode: true };
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		return { success: false, needsCode: false, error: errorMessage };
	}
}

// Complete authentication with code
export async function completeTelegramAuth(
	userId: string,
	phoneCode: string,
	password?: string,
): Promise<{ success: boolean; error?: string; needsPassword?: boolean }> {
	if (!API_ID || !API_HASH) {
		return { success: false, error: "Telegram API credentials not configured" };
	}

	const [row] = await db
		.select({
			phoneNumber: telegramCredentials.phoneNumber,
			authState: telegramCredentials.authState,
		})
		.from(telegramCredentials)
		.where(eq(telegramCredentials.userId, userId))
		.limit(1);

	if (!row || row.authState !== "pending_code") {
		return { success: false, error: "Invalid auth state" };
	}

	try {
		const client = getClient(null);
		if (!client) {
			return { success: false, error: "Failed to initialize Telegram client" };
		}
		await client.connect();

		// Try to sign in with code
		try {
			await client.start({
				phoneNumber: row.phoneNumber,
				phoneCode: () => Promise.resolve(phoneCode),
				onError: (err: Error) => {
					// Check if we need password (2FA)
					if (err.message.includes("SESSION_PASSWORD_NEEDED")) {
						throw new Error("NEEDS_PASSWORD");
					}
					throw err;
				},
			});
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : String(err);
			if (errorMessage === "NEEDS_PASSWORD" || errorMessage.includes("SESSION_PASSWORD_NEEDED")) {
				await db
					.update(telegramCredentials)
					.set({ authState: "pending_2fa" })
					.where(eq(telegramCredentials.userId, userId));
				return { success: false, needsPassword: true };
			}
			throw err;
		}

		// If we have a password and need to complete 2FA
		if (password) {
			await client.signInWithPassword(
				{
					apiId: API_ID,
					apiHash: API_HASH,
				},
				{
					password: () => Promise.resolve(password),
					onError: (err: Error) => {
						throw err;
					},
				},
			);
		}

		// Get session string for future use
		const sessionString = (client.session.save() as unknown as string) || "";

		// Update credentials with authenticated session
		await db
			.update(telegramCredentials)
			.set({
				authState: "authenticated",
				sessionData: { sessionString },
				reauthRequired: false,
				updatedAt: new Date(),
			})
			.where(eq(telegramCredentials.userId, userId));

		// Cache the client
		clientCache.set(userId, client);

		return { success: true };
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		await db
			.update(telegramCredentials)
			.set({ authState: "failed" })
			.where(eq(telegramCredentials.userId, userId));
		return { success: false, error: errorMessage };
	}
}

// Get session for inbox operations
export async function getTelegramSession(userId: string): Promise<{ client: TelegramClient; chatId: string } | null> {
	const credentials = await getTelegramCredentials(userId).catch(() => null);
	if (!credentials) return null;

	try {
		const client = await getOrCreateClient(userId, credentials);
		return { client, chatId: credentials.chatId };
	} catch {
		return null;
	}
}
