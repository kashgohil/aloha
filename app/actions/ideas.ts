"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { ideas } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";

const VALID_STATUSES = ["new", "drafted", "archived"] as const;
type IdeaStatus = (typeof VALID_STATUSES)[number];
const isStatus = (v: unknown): v is IdeaStatus =>
  typeof v === "string" && (VALID_STATUSES as readonly string[]).includes(v);

function parseTags(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((t) => t.trim().toLowerCase().replace(/^#/, ""))
    .filter(Boolean)
    .slice(0, 8);
}

export async function createIdeaAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const body = String(formData.get("body") ?? "").trim();
  if (!body) throw new Error("Idea body is required.");
  const title = String(formData.get("title") ?? "").trim() || null;
  const url = String(formData.get("url") ?? "").trim() || null;
  const tags = parseTags(String(formData.get("tags") ?? ""));

  await db.insert(ideas).values({
    userId: user.id,
    source: url ? "url_clip" : "manual",
    sourceUrl: url,
    title,
    body,
    tags,
  });
  revalidatePath("/app/ideas");
}

export async function updateIdeaStatusAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  const id = String(formData.get("id") ?? "");
  const statusRaw = formData.get("status");
  if (!id || !isStatus(statusRaw)) throw new Error("Invalid params");
  await db
    .update(ideas)
    .set({ status: statusRaw, updatedAt: new Date() })
    .where(and(eq(ideas.id, id), eq(ideas.userId, user.id)));
  revalidatePath("/app/ideas");
}

export async function deleteIdeaAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("id required");
  await db.delete(ideas).where(and(eq(ideas.id, id), eq(ideas.userId, user.id)));
  revalidatePath("/app/ideas");
}
