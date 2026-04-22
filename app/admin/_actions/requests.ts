"use server";

import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { featureAccess, users } from "@/db/schema";
import { getCurrentAdmin } from "@/lib/admin/session";
import { logAdminAction } from "@/lib/admin/audit";

export type RequestActionResult =
  | { ok: true; feature: string; email: string }
  | { ok: false; error: string };

async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) notFound();
  return admin;
}

export async function approveRequest(id: string): Promise<RequestActionResult> {
  const admin = await requireAdmin();
  if (!id) return { ok: false, error: "Missing request id." };

  try {
    const [row] = await db
      .update(featureAccess)
      .set({ grantedAt: new Date(), grantedBy: admin.id, revokedAt: null })
      .where(eq(featureAccess.id, id))
      .returning();

    if (!row) return { ok: false, error: "Request not found." };

    const [target] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, row.userId))
      .limit(1);

    await logAdminAction({
      actorId: admin.id,
      action: "feature.grant",
      targetUserId: row.userId,
      metadata: { feature: row.feature },
    });

    revalidatePath("/admin/requests");
    revalidatePath("/admin");
    return { ok: true, feature: row.feature, email: target?.email ?? "user" };
  } catch (err) {
    console.error("[admin] approveRequest failed", err);
    return { ok: false, error: "Couldn't approve — try again." };
  }
}

export async function revokeRequest(id: string): Promise<RequestActionResult> {
  const admin = await requireAdmin();
  if (!id) return { ok: false, error: "Missing request id." };

  try {
    const [row] = await db
      .update(featureAccess)
      .set({ revokedAt: new Date() })
      .where(eq(featureAccess.id, id))
      .returning();

    if (!row) return { ok: false, error: "Request not found." };

    const [target] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, row.userId))
      .limit(1);

    await logAdminAction({
      actorId: admin.id,
      action: "feature.revoke",
      targetUserId: row.userId,
      metadata: { feature: row.feature },
    });

    revalidatePath("/admin/requests");
    revalidatePath("/admin");
    return { ok: true, feature: row.feature, email: target?.email ?? "user" };
  } catch (err) {
    console.error("[admin] revokeRequest failed", err);
    return { ok: false, error: "Couldn't dismiss — try again." };
  }
}
