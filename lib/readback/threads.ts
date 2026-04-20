// Threads read-back is gated on Meta App Review. Threads Insights (via
// graph.threads.net) and Instagram Insights (via graph.facebook.com) both
// require advanced permissions that only clear with a full Meta app review
// — the same gate `PLATFORM_GATING` already tracks for Meta channels.
//
// The publisher (lib/publishers/threads.ts) works in dev because Meta lets
// the app-owner publish to their own connected account without the extra
// permission. Read-back of historical metrics does not get that exception.
//
// When approval lands, replace the body with:
//   GET /{threads-user-id}/threads?fields=id,text,timestamp
//   GET /{thread-id}/insights?metric=views,likes,replies,reposts,quotes
// and reuse `getFreshToken(userId, "facebook")` via the "oauth" source.
//
// Keeping a registered adapter — even when gated — means the dispatcher
// records the pending state each night instead of silently skipping.

import {
  ReadbackGatedError,
  type ReadbackAdapter,
  type ReadbackBatch,
  type ReadbackContext,
} from "./types";

export const threadsReadbackAdapter: ReadbackAdapter = {
  platform: "threads",
  source: { kind: "oauth", oauthProvider: "facebook" },
  async fetch(_ctx: ReadbackContext): Promise<ReadbackBatch> {
    throw new ReadbackGatedError(
      "threads",
      "awaiting Meta App Review for Threads/Instagram insights permissions",
    );
  },
};
