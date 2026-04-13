"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { pages, links, subscribers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updatePage(data: { slug: string, title?: string, bio?: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  try {
    const existingPage = await db.query.pages.findFirst({
      where: eq(pages.userId, session.user.id),
    });

    if (existingPage) {
      await db.update(pages)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(pages.id, existingPage.id));
    } else {
      await db.insert(pages).values({
        userId: session.user.id,
        ...data,
      });
    }

    revalidatePath("/app/audience");
    return { success: true };
  } catch (error) {
    console.error("Update Page Error:", error);
    throw new Error("Failed to update page");
  }
}

export async function addLink(data: { title: string, url: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  try {
    const page = await db.query.pages.findFirst({
      where: eq(pages.userId, session.user.id),
    });

    if (!page) throw new Error("Please create a profile first");

    await db.insert(links).values({
      pageId: page.id,
      title: data.title,
      url: data.url,
    });

    revalidatePath("/app/audience");
    return { success: true };
  } catch (error) {
    console.error("Add Link Error:", error);
    throw new Error("Failed to add link");
  }
}

export async function subscribe(data: { email: string, userId: string }) {
  try {
    await db.insert(subscribers).values({
      userId: data.userId,
      email: data.email,
      tags: ["lead", "public-page"],
    });

    return { success: true };
  } catch (error) {
    console.error("Subscription Error:", error);
    return { error: "Failed to join mission control" };
  }
}
