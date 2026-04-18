"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { feedItems, feeds, ideas } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { subscribe, syncFeed, unsubscribe } from "@/lib/feeds";

export async function subscribeToFeedAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  const url = String(formData.get("url") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || null;
  if (!url) throw new Error("URL is required.");
  await subscribe(user.id, url, category);
  revalidatePath("/app/feeds");
}

export type SubscribeResult =
  | { ok: true; feedId: string; title: string; itemsAdded: number }
  | { ok: false; error: string };

export async function subscribeToFeed(
  url: string,
  category?: string | null,
): Promise<SubscribeResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not authenticated" };
  const trimmed = url.trim();
  if (!trimmed) return { ok: false, error: "URL is required." };
  try {
    const res = await subscribe(user.id, trimmed, category ?? null);
    revalidatePath("/app/feeds");
    return {
      ok: true,
      feedId: res.feedId,
      title: res.title,
      itemsAdded: res.itemsAdded,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not subscribe.",
    };
  }
}

export async function unsubscribeFeedAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  const feedId = String(formData.get("feedId") ?? "");
  if (!feedId) throw new Error("feedId required");
  await unsubscribe(user.id, feedId);
  revalidatePath("/app/feeds");
}

export async function refreshFeedAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  const feedId = String(formData.get("feedId") ?? "");
  if (!feedId) throw new Error("feedId required");
  // Ownership check: only sync the user's own feeds.
  const [row] = await db
    .select({ id: feeds.id })
    .from(feeds)
    .where(and(eq(feeds.id, feedId), eq(feeds.userId, user.id)))
    .limit(1);
  if (!row) throw new Error("Feed not found");
  await syncFeed(feedId);
  revalidatePath("/app/feeds");
}

export async function markItemReadAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  const itemId = String(formData.get("itemId") ?? "");
  const read = String(formData.get("read") ?? "true") === "true";
  if (!itemId) throw new Error("itemId required");

  // Ownership check before the update — the item belongs to the user only
  // if its feed belongs to the user.
  const [owned] = await db
    .select({ id: feedItems.id })
    .from(feedItems)
    .innerJoin(feeds, eq(feedItems.feedId, feeds.id))
    .where(and(eq(feedItems.id, itemId), eq(feeds.userId, user.id)))
    .limit(1);
  if (!owned) throw new Error("Item not found");

  await db
    .update(feedItems)
    .set({ isRead: read, updatedAt: new Date() })
    .where(eq(feedItems.id, itemId));
  revalidatePath("/app/feeds");
}

export async function saveItemAsIdeaAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  const itemId = String(formData.get("itemId") ?? "");
  if (!itemId) throw new Error("itemId required");

  // Load the item + verify ownership via join on feeds.userId.
  const [item] = await db
    .select({
      id: feedItems.id,
      title: feedItems.title,
      summary: feedItems.summary,
      url: feedItems.url,
      feedUserId: feeds.userId,
      savedAsIdeaId: feedItems.savedAsIdeaId,
    })
    .from(feedItems)
    .innerJoin(feeds, eq(feedItems.feedId, feeds.id))
    .where(eq(feedItems.id, itemId))
    .limit(1);
  if (!item || item.feedUserId !== user.id) throw new Error("Item not found");
  if (item.savedAsIdeaId) {
    revalidatePath("/app/feeds");
    return;
  }

  const [idea] = await db
    .insert(ideas)
    .values({
      userId: user.id,
      source: "feed",
      sourceId: item.id,
      sourceUrl: item.url,
      title: item.title,
      body: item.summary ?? item.title,
    })
    .returning({ id: ideas.id });

  await db
    .update(feedItems)
    .set({ savedAsIdeaId: idea.id, updatedAt: new Date() })
    .where(eq(feedItems.id, item.id));

  revalidatePath("/app/feeds");
}
