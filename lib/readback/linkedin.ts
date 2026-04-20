// LinkedIn read-back is gated on Marketing Developer Platform / Community
// Management API approval. Without it, the endpoints that return post
// analytics + historical shares aren't callable with the scopes we hold.
// The approval application kicks off in Phase 0 week 1 (see
// docs/ai-grand-plan.md §4.1); until it lands, the adapter throws a
// ReadbackGatedError and the dispatcher records the pending state.
//
// When MDP clears, replace the body with calls to:
//   GET /rest/posts?q=author&author={urn}  (authored posts)
//   GET /rest/organizationalEntityShareStatistics (page analytics)
// or /rest/memberSnapshotData (personal snapshot) depending on the scope
// granted. Keep the adapter surface identical — dispatcher doesn't change.

import {
  ReadbackGatedError,
  type ReadbackAdapter,
  type ReadbackBatch,
  type ReadbackContext,
} from "./types";

export const linkedinReadbackAdapter: ReadbackAdapter = {
  platform: "linkedin",
  source: { kind: "oauth", oauthProvider: "linkedin" },
  async fetch(_ctx: ReadbackContext): Promise<ReadbackBatch> {
    throw new ReadbackGatedError(
      "linkedin",
      "awaiting Marketing Developer Platform / Community Management API approval",
    );
  },
};
