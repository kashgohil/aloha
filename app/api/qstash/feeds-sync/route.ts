// Daily feed refresh. Schedule in QStash at a fixed UTC hour; morning for
// the creator's timezone is fine since items show up with their own
// publishedAt.
//
// Schedule setup:
//   POST https://qstash.upstash.io/v2/schedules/{APP_URL}/api/qstash/feeds-sync
//   cron: "0 5 * * *"
//
// Per-feed failures are captured in the response; the endpoint always
// returns 200 so QStash doesn't retry the whole batch.

import { Receiver } from "@upstash/qstash";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { syncAllFeeds } from "@/lib/feeds";

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
  const outcomes = await syncAllFeeds();
  const durationMs = Date.now() - startedAt;

  const summary = {
    durationMs,
    total: outcomes.length,
    ok: outcomes.filter((o) => o.status === "ok").length,
    unchanged: outcomes.filter((o) => o.status === "unchanged").length,
    failed: outcomes.filter((o) => o.status === "failed").length,
    itemsAdded: outcomes.reduce((s, o) => s + (o.itemsAdded ?? 0), 0),
  };
  console.log("[feeds-sync] summary", summary);
  return NextResponse.json({ ok: true, summary, outcomes });
}
