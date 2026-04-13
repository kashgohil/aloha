"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { Client } from "@upstash/qstash";
import { env } from "@/lib/env";

const qstashClient = new Client({
  token: env.QSTASH_TOKEN,
});

export async function saveDraft(content: string, platforms: string[]) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    await db.insert(posts).values({
      userId: session.user.id,
      content,
      platforms,
      status: "draft",
    });

    revalidatePath("/app/dashboard");
    revalidatePath("/app/calendar");
    
    return { success: true };
  } catch (error) {
    console.error("Save Draft Error:", error);
    throw new Error("Failed to save draft");
  }
}

export async function schedulePost(content: string, platforms: string[], scheduledAt: Date) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    const results = await db.insert(posts).values({
      userId: session.user.id,
      content,
      platforms,
      status: "scheduled",
      scheduledAt,
    }).returning();
    
    const newPost = results[0];

    // Calculate delay in seconds
    const delay = Math.max(0, Math.floor((scheduledAt.getTime() - Date.now()) / 1000));

    await qstashClient.publishJSON({
      url: `${env.APP_URL}/api/qstash`,
      body: {
        postId: newPost.id,
      },
      delay,
    });

    revalidatePath("/app/dashboard");
    revalidatePath("/app/calendar");
    
    return { success: true, postId: newPost.id };
  } catch (error) {
    console.error("Schedule Post Error:", error);
    throw new Error("Failed to schedule post");
  }
}
