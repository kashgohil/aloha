// Nightly read-back cron. Schedule this endpoint in QStash at a fixed UTC
// hour (suggest 06:00 UTC — off-peak for US social platforms). Every run
// iterates every connected (user × platform) with a read-back adapter and
// upserts the results.
//
// Schedule setup (one-time, via QStash dashboard or API):
//   POST https://qstash.upstash.io/v2/schedules/{APP_URL}/api/qstash/readback
//   cron: "0 6 * * *"
//
// Per-account failures are captured in `ai_jobs.lastError`; the response is
// always 200 so QStash doesn't retry the whole batch on a single bad token.

import { Receiver } from "@upstash/qstash";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { runReadbackAllAccounts } from "@/lib/readback";

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
  const outcomes = await runReadbackAllAccounts();
  const durationMs = Date.now() - startedAt;

  const summary = {
    durationMs,
    total: outcomes.length,
    ok: outcomes.filter((o) => o.status === "ok").length,
    gated: outcomes.filter((o) => o.status === "gated").length,
    failed: outcomes.filter((o) => o.status === "failed").length,
    itemsCached: outcomes.reduce((sum, o) => sum + o.itemsCached, 0),
    insightsUpserted: outcomes.reduce((sum, o) => sum + o.insightsUpserted, 0),
  };
  console.log("[readback] summary", summary);

  return NextResponse.json({ ok: true, summary, outcomes });
}
