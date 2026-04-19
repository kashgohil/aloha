"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { pages, links, subscribers } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { dispatchEvent } from "@/lib/automations/dispatch";

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function updatePage(formData: FormData) {
  const userId = await requireUserId();

  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();
  const title = String(formData.get("title") ?? "").trim() || null;
  const bio = String(formData.get("bio") ?? "").trim() || null;

  if (!SLUG_RE.test(slug)) {
    throw new Error(
      "Slug must be 3–40 characters, lowercase letters, digits, or hyphens.",
    );
  }

  const existing = await db.query.pages.findFirst({
    where: eq(pages.userId, userId),
  });

  if (existing) {
    await db
      .update(pages)
      .set({ slug, title, bio, updatedAt: new Date() })
      .where(eq(pages.id, existing.id));
  } else {
    await db.insert(pages).values({ userId, slug, title, bio });
  }

  revalidatePath("/app/audience");
  revalidatePath(`/u/${slug}`);
}

export async function addLink(formData: FormData) {
  const userId = await requireUserId();

  const title = String(formData.get("title") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();

  if (!title) throw new Error("Link needs a title.");
  try {
    new URL(url);
  } catch {
    throw new Error("That URL doesn't look right. Include https://");
  }

  const page = await db.query.pages.findFirst({
    where: eq(pages.userId, userId),
  });
  if (!page) {
    throw new Error("Set up your public page first, then add links.");
  }

  const existing = await db
    .select({ order: links.order })
    .from(links)
    .where(eq(links.pageId, page.id));
  const nextOrder =
    existing.length > 0 ? Math.max(...existing.map((l) => l.order)) + 1 : 0;

  await db.insert(links).values({
    pageId: page.id,
    title,
    url,
    order: nextOrder,
  });

  revalidatePath("/app/audience");
  revalidatePath(`/u/${page.slug}`);
}

export async function deleteLink(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const page = await db.query.pages.findFirst({
    where: eq(pages.userId, userId),
  });
  if (!page) return;

  await db
    .delete(links)
    .where(and(eq(links.id, id), eq(links.pageId, page.id)));

  revalidatePath("/app/audience");
  revalidatePath(`/u/${page.slug}`);
}

export async function subscribe(data: { email: string; userId: string }) {
  try {
    const [row] = await db
      .insert(subscribers)
      .values({
        userId: data.userId,
        email: data.email,
        tags: ["lead", "public-page"],
      })
      .returning({ id: subscribers.id, email: subscribers.email });

    // Fire-and-forget: failed dispatch should not fail the subscribe action.
    dispatchEvent({
      triggerKind: "subscriber_joined",
      userId: data.userId,
      payload: { subscriberId: row.id, email: row.email },
    }).catch((err) =>
      console.error("[automations] subscribe dispatch failed", err),
    );

    return { success: true };
  } catch (error) {
    console.error("Subscription Error:", error);
    return { error: "Couldn't join the list. Try again." };
  }
}
