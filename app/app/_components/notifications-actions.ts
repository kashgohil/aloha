"use server";

import { auth } from "@/auth";
import {
  getUnreadCount,
  listNotifications,
  markAllRead,
  markRead,
} from "@/lib/notifications";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function fetchNotifications() {
  const userId = await requireUserId();
  const [items, unread] = await Promise.all([
    listNotifications(userId, 20),
    getUnreadCount(userId),
  ]);
  return { items, unread };
}

export async function markNotificationRead(id: string) {
  const userId = await requireUserId();
  await markRead(userId, id);
}

export async function markAllNotificationsRead() {
  const userId = await requireUserId();
  await markAllRead(userId);
}
