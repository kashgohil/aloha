import { Receiver } from "@upstash/qstash";
import { and, eq, isNull, notInArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import {
  broadcastSends,
  broadcasts,
  subscribers,
} from "@/db/schema";
import { env } from "@/lib/env";
import { qstashClient } from "@/lib/qstash";

async function verify(req: NextRequest, body: string) {
  const signature = req.headers.get("upstash-signature");
  if (!signature) return false;
  const receiver = new Receiver({
    currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
    nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
  });
  return receiver.verify({ signature, body });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  if (!(await verify(req, body))) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  const { broadcastId } = JSON.parse(body) as { broadcastId?: string };
  if (!broadcastId) {
    return new NextResponse("Missing broadcastId", { status: 400 });
  }

  const broadcast = await db.query.broadcasts.findFirst({
    where: eq(broadcasts.id, broadcastId),
  });
  if (!broadcast) return new NextResponse("Not found", { status: 404 });
  if (broadcast.status !== "sending") {
    // Idempotency: if a retry fires after fan-out completed (or the
    // broadcast was canceled), no-op rather than re-fan.
    return NextResponse.json({ skipped: `status=${broadcast.status}` });
  }

  // Skip subscribers who already have a row for this broadcast so a retry
  // after partial fan-out doesn't double up. Using notInArray against a
  // prior-runs set keeps this simple and correct even without a savepoint.
  const existing = await db
    .select({ subscriberId: broadcastSends.subscriberId })
    .from(broadcastSends)
    .where(eq(broadcastSends.broadcastId, broadcastId));
  const alreadyIds = existing.map((r) => r.subscriberId);

  const whereActive = and(
    eq(subscribers.workspaceId, broadcast.createdByUserId),
    isNull(subscribers.unsubscribedAt),
  );

  const recipients = await db
    .select({
      id: subscribers.id,
      email: subscribers.email,
    })
    .from(subscribers)
    .where(
      alreadyIds.length
        ? and(whereActive, notInArray(subscribers.id, alreadyIds))
        : whereActive,
    );

  if (recipients.length > 0) {
    // Batch insert so 10k subscribers don't issue 10k round-trips. Drizzle
    // accepts a single insert with an array of values.
    await db.insert(broadcastSends).values(
      recipients.map((r) => ({
        broadcastId,
        subscriberId: r.id,
        email: r.email,
      })),
    );
  }

  // Read the full set (including any pre-existing rows still pending) so
  // retries re-enqueue anything stuck. `pending` status filter keeps us
  // from re-sending to rows already completed on a prior pass.
  const toSend = await db
    .select({ id: broadcastSends.id })
    .from(broadcastSends)
    .where(
      and(
        eq(broadcastSends.broadcastId, broadcastId),
        eq(broadcastSends.status, "pending"),
      ),
    );

  // Stamp the recipient count once we know it. Prior retries may have set
  // a smaller value; take the max to stay monotonic.
  const finalCount = Math.max(broadcast.recipientCount, toSend.length + alreadyIds.length);
  await db
    .update(broadcasts)
    .set({ recipientCount: finalCount, updatedAt: new Date() })
    .where(eq(broadcasts.id, broadcastId));

  // Enqueue per-send jobs. QStash handles parallelism + retries per job.
  // We don't batch the publishJSON calls because each needs its own message
  // id for per-recipient retry isolation.
  for (const send of toSend) {
    await qstashClient.publishJSON({
      url: `${env.APP_URL}/api/qstash/broadcast-send`,
      body: { sendId: send.id },
    });
  }

  // If fan-out produced zero recipients (everyone unsubscribed between
  // queue and fan-out) flip to sent immediately.
  if (toSend.length === 0 && alreadyIds.length === 0) {
    await db
      .update(broadcasts)
      .set({ status: "sent", sentAt: new Date(), updatedAt: new Date() })
      .where(eq(broadcasts.id, broadcastId));
  }

  return NextResponse.json({ enqueued: toSend.length });
}
