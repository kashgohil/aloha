import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";

export type NotificationKind =
  | "post_published"
  | "post_partial"
  | "post_failed"
  | "inbox_sync_failed";

type CreateArgs = {
  userId: string;
  kind: NotificationKind;
  title: string;
  body?: string | null;
  url?: string | null;
  metadata?: Record<string, unknown>;
};

// Respects the per-user master switch. Callers should never need to check
// `notificationsEnabled` themselves — pass the event through and let this
// decide. Failures are swallowed: a notification write should never block
// the caller (publish, sync, etc.).
export async function createNotification(args: CreateArgs): Promise<void> {
  try {
    const [user] = await db
      .select({
        enabled: users.notificationsEnabled,
        notifyPostOutcomes: users.notifyPostOutcomes,
        notifyInboxSyncIssues: users.notifyInboxSyncIssues,
        workspaceId: users.activeWorkspaceId,
      })
      .from(users)
      .where(eq(users.id, args.userId))
      .limit(1);
    if (!user || !user.enabled) return;
    // Notifications require a workspace — skip the write if the user
    // hasn't been backfilled / onboarded yet. Callers never inspect the
    // return value; a missed notification is a non-event.
    if (!user.workspaceId) return;

    const postKinds: NotificationKind[] = [
      "post_published",
      "post_partial",
      "post_failed",
    ];
    if (postKinds.includes(args.kind) && !user.notifyPostOutcomes) return;
    if (args.kind === "inbox_sync_failed" && !user.notifyInboxSyncIssues) {
      return;
    }

    await db.insert(notifications).values({
      userId: args.userId,
      workspaceId: user.workspaceId,
      kind: args.kind,
      title: args.title,
      body: args.body ?? null,
      url: args.url ?? null,
      metadata: args.metadata ?? {},
    });
  } catch (err) {
    console.error("[notifications] failed to create:", err);
  }
}

export async function listNotifications(userId: string, limit = 20) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(
      and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
    );
  return row?.count ?? 0;
}

export async function markRead(userId: string, id: string): Promise<void> {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function markAllRead(userId: string): Promise<void> {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
    );
}
