"use server";

import { del } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { assets } from "@/db/schema";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/current-user";

export async function deleteGeneratedAssetAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("id required");

  const [row] = await db
    .select({ url: assets.url, source: assets.source })
    .from(assets)
    .where(and(eq(assets.id, id), eq(assets.userId, user.id)))
    .limit(1);
  if (!row) return;

  await db
    .delete(assets)
    .where(and(eq(assets.id, id), eq(assets.userId, user.id)));

  if (row.source === "generated") {
    try {
      await del(row.url, { token: env.BLOB_READ_WRITE_TOKEN });
    } catch {
      // Blob may already be gone; DB row is the source of truth for the UI.
    }
  }

  revalidatePath("/app/library");
}
