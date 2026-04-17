// Daily re-drive. Picks up scheduled posts whose deliveries are parked in
// `pending_review` and retries them for any channel that has since
// un-gated. Schedule in QStash at a fixed UTC hour (suggest 08:00 UTC,
// after nightly read-back + corpus sync land).
//
// Schedule setup (one-time):
//   POST https://qstash.upstash.io/v2/schedules/{APP_URL}/api/qstash/redrive
//   cron: "0 8 * * *"
//
// Returns 200 on any outcome; per-post failures are captured in the
// response body so QStash doesn't retry the whole batch.

import { Receiver } from "@upstash/qstash";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { redrivePendingReview } from "@/lib/publishers/redrive";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const signature = req.headers.get("upstash-signature");
  if (!signature) {
    return new NextResponse("Missing signature", { status: 401 });
  }

  const receiver = new Receiver({
    currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
    nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
  });

  const body = await req.text();
  const isValid = await receiver.verify({ signature, body }).catch(() => false);
  if (!isValid) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  const startedAt = Date.now();
  const outcomes = await redrivePendingReview();
  const durationMs = Date.now() - startedAt;

  const summary = {
    durationMs,
    total: outcomes.length,
    ok: outcomes.filter((o) => o.status === "ok").length,
    stillGated: outcomes.filter((o) => o.status === "still_gated").length,
    failed: outcomes.filter((o) => o.status === "failed").length,
    anyPublished: outcomes.filter((o) => o.anyPublished).length,
  };
  console.log("[redrive] summary", summary);

  return NextResponse.json({ ok: true, summary, outcomes });
}
