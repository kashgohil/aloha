import { Receiver } from "@upstash/qstash";
import { and, eq, sql } from "drizzle-orm";
import { captureException } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

import { db } from "@/db";
import {
  broadcastSends,
  broadcasts,
  subscribers,
  users,
} from "@/db/schema";
import { renderBroadcast } from "@/lib/email/broadcast";
import { env } from "@/lib/env";

const resend = new Resend(env.RESEND_API_KEY);

async function verify(req: NextRequest, body: string) {
  const signature = req.headers.get("upstash-signature");
  if (!signature) return false;
  const receiver = new Receiver({
    currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
    nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
  });
  return receiver.verify({ signature, body });
}

function fromHeader(name: string | null, address: string): string {
  return name ? `${name} <${address}>` : address;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  if (!(await verify(req, body))) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  const { sendId } = JSON.parse(body) as { sendId?: string };
  if (!sendId) return new NextResponse("Missing sendId", { status: 400 });

  const send = await db.query.broadcastSends.findFirst({
    where: eq(broadcastSends.id, sendId),
  });
  if (!send) return new NextResponse("Not found", { status: 404 });
  if (send.status !== "pending") {
    // Idempotent retry — a prior attempt already advanced the row.
    return NextResponse.json({ skipped: `status=${send.status}` });
  }

  const broadcast = await db.query.broadcasts.findFirst({
    where: eq(broadcasts.id, send.broadcastId),
  });
  if (!broadcast) return new NextResponse("Broadcast missing", { status: 404 });

  // Re-check unsubscribe status at send time, not fan-out time. A
  // subscriber who unsubscribed between fan-out and send should not get
  // the email. Flip the row to a terminal state so aggregate counters add
  // up cleanly.
  const subscriber = await db.query.subscribers.findFirst({
    where: eq(subscribers.id, send.subscriberId),
  });
  if (!subscriber || subscriber.unsubscribedAt) {
    await db
      .update(broadcastSends)
      .set({
        status: "failed",
        errorMessage: "unsubscribed",
        updatedAt: new Date(),
      })
      .where(eq(broadcastSends.id, sendId));
    await finalizeBroadcastIfDone(send.broadcastId);
    return NextResponse.json({ skipped: "unsubscribed" });
  }

  const owner = await db.query.users.findFirst({
    where: eq(users.id, broadcast.userId),
  });
  const senderLabel =
    broadcast.fromName ?? owner?.workspaceName ?? owner?.name ?? "this list";

  const { html, text, unsubUrl } = renderBroadcast({
    subject: broadcast.subject,
    preheader: broadcast.preheader,
    body: broadcast.body,
    senderLabel,
    subscriberId: subscriber.id,
    subscriberEmail: subscriber.email,
  });

  try {
    const { data, error } = await resend.emails.send({
      from: fromHeader(broadcast.fromName, broadcast.fromAddress),
      to: send.email,
      subject: broadcast.subject,
      html,
      text,
      replyTo: broadcast.replyTo ?? undefined,
      headers: {
        // One-click unsubscribe. Mail clients (Gmail, iCloud) surface this
        // as a native "Unsubscribe" button next to the sender name.
        "List-Unsubscribe": `<${unsubUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });

    if (error || !data) {
      throw new Error(error?.message ?? "Unknown Resend error");
    }

    await db
      .update(broadcastSends)
      .set({
        status: "sent",
        sentAt: new Date(),
        resendMessageId: data.id,
        updatedAt: new Date(),
      })
      .where(eq(broadcastSends.id, sendId));
  } catch (err) {
    await captureException(err, {
      tags: { source: "qstash.broadcast-send" },
      extra: { sendId, broadcastId: send.broadcastId },
    });
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(broadcastSends)
      .set({
        status: "failed",
        errorMessage: message.slice(0, 500),
        updatedAt: new Date(),
      })
      .where(eq(broadcastSends.id, sendId));
    await finalizeBroadcastIfDone(send.broadcastId);
    // 5xx so QStash retries. Terminal failures would ideally return 200
    // but distinguishing transient vs. terminal from Resend's error shape
    // isn't reliable here — QStash caps retries, so the row stays `failed`
    // if retries exhaust.
    return new NextResponse(message, { status: 503 });
  }

  await finalizeBroadcastIfDone(send.broadcastId);
  return NextResponse.json({ ok: true });
}

// When every broadcast_sends row has advanced out of `pending`, flip the
// broadcast to `sent` (or `failed` if every attempt failed). Aggregate
// counters get rolled up from the sends table here too.
async function finalizeBroadcastIfDone(broadcastId: string) {
  const [row] = await db
    .select({
      total: sql<number>`count(*)`,
      pending: sql<number>`count(*) filter (where ${broadcastSends.status} = 'pending')`,
      sent: sql<number>`count(*) filter (where ${broadcastSends.status} in ('sent','delivered','complained','bounced'))`,
      delivered: sql<number>`count(*) filter (where ${broadcastSends.status} = 'delivered')`,
      bounced: sql<number>`count(*) filter (where ${broadcastSends.status} = 'bounced')`,
      failed: sql<number>`count(*) filter (where ${broadcastSends.status} = 'failed')`,
    })
    .from(broadcastSends)
    .where(eq(broadcastSends.broadcastId, broadcastId));

  if (Number(row.pending) > 0) return;

  const anySuccess = Number(row.sent) > 0;
  await db
    .update(broadcasts)
    .set({
      status: anySuccess ? "sent" : "failed",
      sentAt: anySuccess ? new Date() : null,
      deliveredCount: Number(row.delivered),
      bouncedCount: Number(row.bounced),
      updatedAt: new Date(),
    })
    .where(and(eq(broadcasts.id, broadcastId), eq(broadcasts.status, "sending")));
}
