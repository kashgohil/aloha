import "server-only";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import { env } from "@/lib/env";

// Muse entitlement is currently allowlist-based in prod: pricing isn't
// live yet, so MUSE_ALLOWLIST (comma-separated emails) acts as an
// invite-only gate. When the Polar basic_muse SKU goes live, the Polar
// subscription check in getEntitlements takes over — this helper
// remains as an override for comped accounts.
export async function hasMuseAllowlistEntitlement(userId: string): Promise<boolean> {
  const allowlist = (env.MUSE_ALLOWLIST ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (allowlist.length === 0) return false;

  const [row] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row?.email) return false;

  return allowlist.includes(row.email.toLowerCase());
}
