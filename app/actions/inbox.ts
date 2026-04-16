"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { inboxMessages, blueskyCredentials, accounts } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { syncInbox } from "@/lib/inbox/sync";
import { replyOnBluesky, replyOnX } from "@/lib/inbox/reply";

export async function refreshInbox() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;
  let total = 0;

  const [bsky] = await db
    .select({ id: blueskyCredentials.id })
    .from(blueskyCredentials)
    .where(eq(blueskyCredentials.userId, userId))
    .limit(1);

  if (bsky) {
    const result = await syncInbox(userId, "bluesky");
    total += result.synced;
  }

  const [twitter] = await db
    .select({ provider: accounts.provider })
    .from(accounts)
    .where(
      and(eq(accounts.userId, userId), eq(accounts.provider, "twitter")),
    )
    .limit(1);

  if (twitter) {
    const result = await syncInbox(userId, "twitter");
    total += result.synced;
  }

  revalidatePath("/app/inbox");
  return { synced: total };
}

export async function markAsRead(messageId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .update(inboxMessages)
    .set({ isRead: true, updatedAt: new Date() })
    .where(
      and(
        eq(inboxMessages.id, messageId),
        eq(inboxMessages.userId, session.user.id),
      ),
    );

  revalidatePath("/app/inbox");
}

export async function markAllAsRead() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .update(inboxMessages)
    .set({ isRead: true, updatedAt: new Date() })
    .where(
      and(
        eq(inboxMessages.userId, session.user.id),
        eq(inboxMessages.isRead, false),
      ),
    );

  revalidatePath("/app/inbox");
}

export async function sendReply(messageId: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [message] = await db
    .select()
    .from(inboxMessages)
    .where(
      and(
        eq(inboxMessages.id, messageId),
        eq(inboxMessages.userId, session.user.id),
      ),
    )
    .limit(1);

  if (!message) throw new Error("Message not found");

  if (message.platform === "bluesky") {
    const platformData = message.platformData as Record<string, unknown>;
    const parentCid = platformData.cid as string;
    if (!parentCid) throw new Error("Missing CID for reply");
    const rootUri = message.threadId ?? message.remoteId;

    await replyOnBluesky(
      session.user.id,
      message.remoteId,
      parentCid,
      rootUri,
      content,
    );
  } else if (message.platform === "twitter") {
    await replyOnX(session.user.id, message.remoteId, content);
  }

  revalidatePath("/app/inbox");
  return { success: true };
}
