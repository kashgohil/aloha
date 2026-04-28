// Marks a `manual_assist` delivery as completed by the user — typically
// fired by the Chrome extension after it observes the user clicking
// submit on a third-party platform's compose UI. We never claim to have
// posted anything ourselves; this just records that the user did, so
// the post moves out of "waiting for you to publish" state and
// analytics know it shipped.
//
// Idempotent: hitting this on a delivery already in `published` is a
// no-op so the extension can retry without duplicating side effects.
//
// All the actual logic lives in `lib/posts/manual-completion.ts` so the
// "I posted this" web button (a server action) and this HTTP endpoint
// (the extension's caller) share one source of truth.

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentContext } from "@/lib/current-context";
import { markDeliveryAsManuallyPublished } from "@/lib/posts/manual-completion";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ postId: string; platform: string }> };

export async function PATCH(req: NextRequest, ctxArg: RouteContext) {
  const auth = await getCurrentContext();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId, platform } = await ctxArg.params;
  const extensionVersion =
    req.headers.get("x-aloha-extension-version") ?? undefined;

  const result = await markDeliveryAsManuallyPublished({
    workspaceId: auth.workspace.id,
    postId,
    platform,
    source: "extension",
    extensionVersion,
  });

  if (!result.ok) {
    const status =
      result.kind === "post-not-found" || result.kind === "delivery-not-found"
        ? 404
        : 409;
    return NextResponse.json({ error: result.message }, { status });
  }

  return NextResponse.json({
    ok: true,
    alreadyPublished: result.alreadyPublished ?? false,
    postStatusFlipped: result.postStatusFlipped ?? false,
  });
}
