// Lists posts whose delivery for a specific platform is in `manual_assist`
// state — i.e., the user told Aloha to remind them and they'd publish
// themselves. The Chrome extension reads this to populate its publish
// popup when the user lands on a known compose surface.
//
// Per-platform content resolution mirrors the publisher dispatcher in
// `lib/publishers/index.ts:253-265`: an override on `channelContent` for
// the platform wins over the base `content` / `media`. PDFs are stripped
// for non-LinkedIn platforms so the popup never offers a doc that won't
// upload there.

import { and, asc, eq, inArray } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import {
  postDeliveries,
  posts,
  type ChannelOverride,
  type PostMedia,
} from "@/db/schema";
import { getCurrentContext } from "@/lib/current-context";

export const dynamic = "force-dynamic";

const MAX_RESULTS = 25;

export async function GET(req: NextRequest) {
  const ctx = await getCurrentContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const platform = (req.nextUrl.searchParams.get("platform") ?? "")
    .trim()
    .toLowerCase();
  if (!platform) {
    return NextResponse.json(
      { error: "platform is required" },
      { status: 400 },
    );
  }

  // Pull all manual_assist deliveries for this workspace + platform, then
  // join the parent posts. Filter to in-flight statuses — posts already
  // marked `published`/`failed`/`deleted` aren't actionable here.
  const deliveryRows = await db
    .select({
      deliveryId: postDeliveries.id,
      postId: postDeliveries.postId,
      platform: postDeliveries.platform,
    })
    .from(postDeliveries)
    .where(
      and(
        eq(postDeliveries.platform, platform),
        eq(postDeliveries.status, "manual_assist"),
      ),
    )
    .limit(MAX_RESULTS * 4);

  if (deliveryRows.length === 0) {
    return NextResponse.json({ drafts: [] });
  }

  const postIds = Array.from(new Set(deliveryRows.map((r) => r.postId)));

  const postRows = await db
    .select({
      id: posts.id,
      workspaceId: posts.workspaceId,
      status: posts.status,
      content: posts.content,
      media: posts.media,
      channelContent: posts.channelContent,
      scheduledAt: posts.scheduledAt,
    })
    .from(posts)
    .where(
      and(
        eq(posts.workspaceId, ctx.workspace.id),
        inArray(posts.id, postIds),
        inArray(posts.status, ["approved", "scheduled"]),
      ),
    )
    .orderBy(asc(posts.scheduledAt));

  const byId = new Map(postRows.map((p) => [p.id, p]));

  const drafts = deliveryRows
    .map((d) => {
      const post = byId.get(d.postId);
      if (!post) return null;
      const override = (
        post.channelContent as Record<string, ChannelOverride> | null
      )?.[platform];
      const baseMedia = (post.media as PostMedia[]) ?? [];
      const rawMedia = override?.media ?? baseMedia;
      // Strip PDFs unless the user is going to LinkedIn. Same posture as
      // the publisher dispatcher; keeps the popup honest about what can
      // actually be pasted onto each surface.
      const media =
        platform === "linkedin"
          ? rawMedia
          : rawMedia.filter((m) => m.mimeType !== "application/pdf");
      return {
        postId: post.id,
        deliveryId: d.deliveryId,
        platform,
        content: override?.content ?? post.content,
        media,
        scheduledAt: post.scheduledAt?.toISOString() ?? null,
        status: post.status as "approved" | "scheduled",
      };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null)
    .slice(0, MAX_RESULTS);

  return NextResponse.json({ drafts });
}
