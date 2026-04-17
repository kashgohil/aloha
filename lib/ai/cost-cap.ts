// Per-user monthly AI cost ceiling enforced at the router. Every upstream
// call checks the running total in `generations` for the current calendar
// month; if it's over the cap, the call throws `CostCapExceededError`
// before spending a single token.
//
// The cap is deliberately simple: one number per plan tier, measured in
// USD micros (= 1e-6 USD). The plan's credit accounting (§9.6) is more
// nuanced — this is the floor. Refine later when real-usage data justifies.
//
// IMPORTANT: the cap here is a hard *stop*, not a soft alert. The product's
// fair-use messaging, overage top-up, and "2× bill" safety cap from §9.6
// all live above this layer — this one just keeps the worst case bounded.

import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { generations } from "@/db/schema";
import { getLogicalSubscription } from "@/lib/billing/service";

// 1 USD = 1_000_000 micros. Keep the numbers integers so arithmetic is exact.
const USD = 1_000_000;

// Hard monthly ceilings, in micros. Free stays aggressive because the
// companion is the abuse lever; paid is generous enough that normal use
// never trips it. Revisit against `generations` cost data at Phase 1 close.
const CAPS = {
  free: 0.5 * USD, //    $0.50 / user / month
  paid: 50 * USD, //     $50   / user / month
};

export type Plan = "free" | "paid";

export type CostCapStatus = {
  usedMicros: number;
  capMicros: number;
  remainingMicros: number;
  allowed: boolean;
};

export class CostCapExceededError extends Error {
  readonly status: CostCapStatus;
  constructor(status: CostCapStatus) {
    super(
      `AI usage cap reached for this billing period ($${(status.usedMicros / USD).toFixed(2)} / $${(status.capMicros / USD).toFixed(2)}).`,
    );
    this.name = "CostCapExceededError";
    this.status = status;
  }
}

export async function resolvePlan(userId: string): Promise<Plan> {
  const sub = await getLogicalSubscription(userId).catch(() => null);
  return sub && sub.plan !== "free" ? "paid" : "free";
}

export async function getCostCapStatus(
  userId: string,
  plan?: Plan,
): Promise<CostCapStatus> {
  const resolvedPlan = plan ?? (await resolvePlan(userId));
  const monthStart = startOfCurrentMonth();

  const [row] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${generations.costMicros}), 0)`,
    })
    .from(generations)
    .where(
      and(
        eq(generations.userId, userId),
        gte(generations.createdAt, monthStart),
      ),
    );

  const usedMicros = Number(row?.total ?? 0);
  const capMicros = CAPS[resolvedPlan];
  return {
    usedMicros,
    capMicros,
    remainingMicros: Math.max(0, capMicros - usedMicros),
    allowed: usedMicros < capMicros,
  };
}

// Thin gate the router calls. Throws if the cap is already tripped. Doesn't
// try to reason about "will THIS call put us over" — that needs a price
// estimate we don't have pre-call, and the router logs the overshoot which
// is better than rejecting safe calls on bad estimates.
export async function assertCostCap(
  userId: string,
  plan?: Plan,
): Promise<void> {
  const status = await getCostCapStatus(userId, plan);
  if (!status.allowed) {
    throw new CostCapExceededError(status);
  }
}

function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}
