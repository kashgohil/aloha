import "server-only";
import { cache } from "react";
import { and, eq, isNotNull, isNull } from "drizzle-orm";

import { db } from "@/db";
import { featureAccess } from "@/db/schema";

export const MUSE_FEATURE = "muse";

// Invite-gated while the basic_muse SKU isn't live. Access is granted by
// flipping grantedAt on feature_access; Polar subscription bundles take
// over in getEntitlements once pricing is active, and this helper remains
// as the override for comped accounts.
//
// Wrapped in React `cache()` so that pages calling this from multiple RSCs
// in the same request only hit the DB once. Per-request only — does not
// leak across requests, so admins toggling access still see fresh state on
// the next navigation.
export const hasMuseInviteEntitlement = cache(
  async (userId: string): Promise<boolean> => {
    const [row] = await db
      .select({ id: featureAccess.id })
      .from(featureAccess)
      .where(
        and(
          eq(featureAccess.userId, userId),
          eq(featureAccess.feature, MUSE_FEATURE),
          isNotNull(featureAccess.grantedAt),
          isNull(featureAccess.revokedAt),
        ),
      )
      .limit(1);
    return Boolean(row);
  },
);

export async function getMuseAccessState(userId: string): Promise<{
  granted: boolean;
  requestedAt: Date | null;
}> {
  const [row] = await db
    .select({
      grantedAt: featureAccess.grantedAt,
      revokedAt: featureAccess.revokedAt,
      requestedAt: featureAccess.requestedAt,
    })
    .from(featureAccess)
    .where(
      and(
        eq(featureAccess.userId, userId),
        eq(featureAccess.feature, MUSE_FEATURE),
      ),
    )
    .limit(1);

  if (!row) return { granted: false, requestedAt: null };
  const granted = Boolean(row.grantedAt && !row.revokedAt);
  return { granted, requestedAt: row.requestedAt };
}

export class MuseAccessRequiredError extends Error {
  constructor() {
    super("Muse access required");
    this.name = "MuseAccessRequiredError";
  }
}

// Throws when the caller doesn't have Muse access. Server actions and
// protected routes use this as a single-line guard; catch it at the UI
// boundary if you want to redirect to the request-access page.
export async function requireMuseAccess(userId: string): Promise<void> {
  const ok = await hasMuseInviteEntitlement(userId);
  if (!ok) throw new MuseAccessRequiredError();
}
