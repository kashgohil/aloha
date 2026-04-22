"use server";

import { del } from "@vercel/blob";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { assets } from "@/db/schema";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/current-user";

export type LibraryAsset = {
  id: string;
  url: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  alt: string | null;
  prompt: string | null;
  source: "upload" | "generated" | "imported";
  createdAt: string;
};

export async function listLibraryAssets(limit = 60): Promise<LibraryAsset[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const rows = await db
    .select({
      id: assets.id,
      url: assets.url,
      mimeType: assets.mimeType,
      width: assets.width,
      height: assets.height,
      alt: assets.alt,
      prompt: assets.prompt,
      source: assets.source,
      createdAt: assets.createdAt,
    })
    .from(assets)
    .where(eq(assets.userId, user.id))
    .orderBy(desc(assets.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));
}

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

  if (row.source === "generated" || row.source === "upload") {
    try {
      await del(row.url, { token: env.BLOB_READ_WRITE_TOKEN });
    } catch {
      // Blob may already be gone; DB row is the source of truth for the UI.
    }
  }

  revalidatePath("/app/library");
}
