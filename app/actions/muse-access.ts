"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { featureAccess } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { MUSE_FEATURE } from "@/lib/billing/muse";

// Records a user's interest in Muse while access is invite-only. Idempotent —
// re-clicking just updates `updatedAt`. Granting access is a manual op
// (admin flips grantedAt on the row).
export async function requestMuseAccessAction() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const now = new Date();
  await db
    .insert(featureAccess)
    .values({
      userId: user.id,
      feature: MUSE_FEATURE,
      requestedAt: now,
    })
    .onConflictDoUpdate({
      target: [featureAccess.userId, featureAccess.feature],
      set: { requestedAt: now, updatedAt: now },
    });

  revalidatePath("/app/settings/muse");
}
