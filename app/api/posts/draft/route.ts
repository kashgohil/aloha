// Draft-saving endpoint for the Chrome extension. Thin HTTP wrapper over
// the existing `saveDraft` server action so the extension popup can
// create posts without going through Next.js's RSC machinery.
//
// In-app code keeps using `saveDraft` directly. This route only exists
// to keep the extension's API surface clean (one POST per saved draft).

import { NextResponse, type NextRequest } from "next/server";
import { saveDraft, type ComposerPayload } from "@/app/actions/posts";
import type { ChannelOverride, PostMedia } from "@/db/schema";

export const dynamic = "force-dynamic";

type Body = {
  content?: unknown;
  platforms?: unknown;
  media?: unknown;
  channelContent?: unknown;
  sourceIdeaId?: unknown;
  draftMeta?: unknown;
};

function parseBody(body: Body): ComposerPayload | { error: string } {
  if (typeof body.content !== "string" || body.content.trim().length === 0) {
    return { error: "content is required" };
  }
  if (
    !Array.isArray(body.platforms) ||
    body.platforms.length === 0 ||
    !body.platforms.every((p) => typeof p === "string")
  ) {
    return { error: "platforms must be a non-empty string array" };
  }

  const payload: ComposerPayload = {
    content: body.content,
    platforms: body.platforms,
  };

  if (Array.isArray(body.media)) {
    payload.media = body.media as PostMedia[];
  }
  if (body.channelContent && typeof body.channelContent === "object") {
    payload.channelContent = body.channelContent as Record<
      string,
      ChannelOverride
    >;
  }
  if (typeof body.sourceIdeaId === "string") {
    payload.sourceIdeaId = body.sourceIdeaId;
  }
  if (body.draftMeta && typeof body.draftMeta === "object") {
    payload.draftMeta = body.draftMeta as ComposerPayload["draftMeta"];
  }

  return payload;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseBody(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const result = await saveDraft(parsed);
    return NextResponse.json({ ok: true, postId: result.postId });
  } catch (err) {
    // saveDraft already logs internally; surface a friendly message and
    // a 401/403 distinction when assertRole throws.
    const message =
      err instanceof Error ? err.message : "Couldn't save draft.";
    if (/Unauthorized|Sign in/i.test(message)) {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    if (/Forbidden|role|workspace/i.test(message)) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
