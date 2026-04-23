// Shared shapes for the nightly read-back layer. Each platform implements a
// `ReadbackAdapter`; the dispatcher (see ./index.ts) calls it, then upserts
// the returned batch into `platform_content_cache` and `platform_insights`.

import type { PostMedia } from "@/db/schema";
import type { ProviderAccount } from "@/lib/publishers/tokens";

// How an adapter discovers the credentials it needs:
//   - "oauth": read accounts table using `oauthProvider` (may differ from
//     the platform key — Threads reuses the Facebook OAuth token).
//   - "bluesky_creds": read blueskyCredentials table (app-password flow).
export type ReadbackSource =
  | { kind: "oauth"; oauthProvider: string }
  | { kind: "bluesky_creds" };

export type ReadbackItem = {
  remotePostId: string;
  content: string;
  media: PostMedia[];
  platformData: Record<string, unknown>;
  platformPostedAt: Date | null;
  // null when the platform doesn't return metrics in the same call (e.g.
  // LinkedIn analytics requires MDP access). Dispatcher skips the insights
  // upsert rather than writing zeros.
  metrics: Record<string, number | null> | null;
};

export type ReadbackBatch = {
  items: ReadbackItem[];
};

export type BlueskyCreds = {
  handle: string;
  appPassword: string;
  did: string | null;
};

export type ReadbackContext = {
  workspaceId: string;
  // Present when the adapter declares `source.kind === "oauth"`.
  account?: ProviderAccount;
  // Present when the adapter declares `source.kind === "bluesky_creds"`.
  blueskyCreds?: BlueskyCreds;
  // Optional: only fetch items newer than this cursor. The dispatcher doesn't
  // require it — adapters that can honor it save rate-limit budget.
  since?: Date;
};

export interface ReadbackAdapter {
  platform: string;
  source: ReadbackSource;
  fetch(ctx: ReadbackContext): Promise<ReadbackBatch>;
}

export class ReadbackGatedError extends Error {
  constructor(platform: string, reason: string) {
    super(`${platform} read-back gated: ${reason}`);
    this.name = "ReadbackGatedError";
  }
}
