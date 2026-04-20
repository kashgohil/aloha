import { Receiver } from "@upstash/qstash";
import { db } from "@/db";
import { captureException } from "@/lib/logger";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { publishPost } from "@/lib/publishers";

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
  const isValid = await receiver.verify({
    signature,
    body,
  });

  if (!isValid) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  const parsedBody = JSON.parse(body);
  const { postId, intendedScheduledAt } = parsedBody as {
    postId?: string;
    intendedScheduledAt?: string;
  };

  if (!postId) {
    return new NextResponse("Post ID is required", { status: 400 });
  }

  try {
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
    });

    if (!post) {
      return new NextResponse("Post not found", { status: 404 });
    }

    if (post.status !== "scheduled") {
      return new NextResponse("Post is not in scheduled state", { status: 400 });
    }

    // Stale-message guard: when a user reschedules or cancels, the old
    // queued QStash message still fires at the original time. Compare the
    // intended publish time from the body with the post's current
    // scheduledAt — a mismatch means this message is from a stale
    // schedule, and the newer one is still in flight (or the post is a
    // fresh draft). No-op rather than double-publish.
    if (intendedScheduledAt && post.scheduledAt) {
      const intended = new Date(intendedScheduledAt).getTime();
      const current = post.scheduledAt.getTime();
      if (Math.abs(intended - current) > 5000) {
        return NextResponse.json({
          success: true,
          skipped: "stale-schedule",
        });
      }
    }

    console.log(`[QStash] Publishing post: ${postId}`);
    const summary = await publishPost(postId);
    // Surface a 5xx only when nothing published and every failure is
    // retryable (rate-limited / transient). QStash will retry with backoff.
    // Any success, or any terminal failure (needs_reauth / forbidden /
    // invalid_content), returns 200 so we don't double-post or loop forever.
    if (summary.retryable) {
      return new NextResponse("Retryable publish failure", { status: 503 });
    }
    return NextResponse.json({ success: true, summary });
  } catch (error) {
    await captureException(error, {
      tags: { source: "qstash.publish" },
      extra: { postId },
    });
    console.error("[QStash] Error publishing post:", error);
    // publishPost handles per-platform failure; only whole-dispatcher
    // crashes land here — treat as unrecoverable for this run.
    await db.update(posts)
      .set({ status: "failed" })
      .where(eq(posts.id, postId));

    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
