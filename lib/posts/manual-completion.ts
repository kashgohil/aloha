import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { postDeliveries, posts } from "@/db/schema";

// Shared core for "the user told us this delivery is published." Lives
// behind two surfaces:
//
//   1. PATCH /api/posts/[id]/deliveries/[platform]/complete — called
//      by the Chrome extension's content script after it observes the
//      user clicking submit on a third-party platform.
//   2. The "I posted this" button in Aloha web on a post detail page —
//      called as a server action when the user explicitly tells us.
//
// Both flow through here so there's exactly one place that handles the
// flip from `manual_assist` → `published` and the cascading post-level
// status update. `deliveredVia` distinguishes the source for analytics.

export type ManualCompletionResult =
  | {
      ok: true;
      alreadyPublished?: boolean;
      postStatusFlipped?: boolean;
    }
  | {
      ok: false;
      kind: "post-not-found" | "delivery-not-found" | "wrong-state";
      message: string;
    };

export type ManualCompletionSource = "extension" | "manual_web";

export async function markDeliveryAsManuallyPublished(args: {
  workspaceId: string;
  postId: string;
  platform: string;
  source: ManualCompletionSource;
  extensionVersion?: string;
}): Promise<ManualCompletionResult> {
  const platformKey = args.platform.toLowerCase();

  const [post] = await db
    .select({
      id: posts.id,
      workspaceId: posts.workspaceId,
      status: posts.status,
    })
    .from(posts)
    .where(and(eq(posts.id, args.postId), eq(posts.workspaceId, args.workspaceId)))
    .limit(1);
  if (!post) {
    return {
      ok: false,
      kind: "post-not-found",
      message: "Post not found.",
    };
  }

  const [delivery] = await db
    .select({
      id: postDeliveries.id,
      status: postDeliveries.status,
      metadata: postDeliveries.metadata,
    })
    .from(postDeliveries)
    .where(
      and(
        eq(postDeliveries.postId, args.postId),
        eq(postDeliveries.platform, platformKey),
      ),
    )
    .limit(1);
  if (!delivery) {
    return {
      ok: false,
      kind: "delivery-not-found",
      message: "We don't have a record of this channel for this post.",
    };
  }

  // Idempotency: re-clicks (extension retries, double-click on the
  // web button) succeed silently with `alreadyPublished: true`.
  if (delivery.status === "published") {
    return { ok: true, alreadyPublished: true };
  }

  // Only flip from `manual_assist`. Other states need their own
  // resolution paths — overwriting `failed` would mask a real error,
  // overwriting `pending_review` would skip the gating workflow.
  if (delivery.status !== "manual_assist") {
    return {
      ok: false,
      kind: "wrong-state",
      message: `Delivery is in '${delivery.status}', not 'manual_assist'.`,
    };
  }

  const now = new Date();
  await db
    .update(postDeliveries)
    .set({
      status: "published",
      publishedAt: now,
      metadata: {
        ...(delivery.metadata ?? {}),
        deliveredVia: args.source,
        ...(args.extensionVersion
          ? { extensionVersion: args.extensionVersion }
          : {}),
      },
      updatedAt: now,
    })
    .where(eq(postDeliveries.id, delivery.id));

  // Cascade: if every delivery for this post is now `published`, flip
  // the post-level status too. We don't touch other terminal states
  // (failed / pending_review / needs_reauth) — partial completion
  // stays as scheduled until the rest land.
  const all = await db
    .select({ status: postDeliveries.status })
    .from(postDeliveries)
    .where(eq(postDeliveries.postId, args.postId));

  const everythingShipped =
    all.length > 0 && all.every((d) => d.status === "published");

  if (everythingShipped && post.status !== "published") {
    await db
      .update(posts)
      .set({ status: "published", publishedAt: now, updatedAt: now })
      .where(eq(posts.id, args.postId));
  }

  return { ok: true, postStatusFlipped: everythingShipped };
}
