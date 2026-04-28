// Browser bookmarklet endpoint. The bookmarklet runs on the user's
// current page and POSTs `{ url, title, selection }` here. We auth via
// the NextAuth session cookie — the user is logged into Aloha in another
// tab, so cookies travel with the cross-origin fetch when the
// bookmarklet uses `credentials: "include"`.
//
// Accept GET as well so a one-line redirect from the bookmarklet works
// for browsers that block cross-origin POST in javascript: schemes.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { ideas } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

const MAX_TITLE = 240;
const MAX_BODY = 50_000;
const MAX_URL = 2048;

function clip(value: string | null | undefined, max: number): string {
  return (value ?? "").slice(0, max);
}

async function readPayload(req: NextRequest): Promise<{
  url: string | null;
  title: string | null;
  selection: string | null;
}> {
  if (req.method === "GET") {
    const sp = req.nextUrl.searchParams;
    return {
      url: clip(sp.get("url"), MAX_URL).trim() || null,
      title: clip(sp.get("title"), MAX_TITLE).trim() || null,
      selection: clip(sp.get("selection"), MAX_BODY).trim() || null,
    };
  }
  // POST — try JSON first, fall back to form-encoded.
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    return {
      url: typeof body.url === "string" ? clip(body.url, MAX_URL).trim() || null : null,
      title:
        typeof body.title === "string"
          ? clip(body.title, MAX_TITLE).trim() || null
          : null,
      selection:
        typeof body.selection === "string"
          ? clip(body.selection, MAX_BODY).trim() || null
          : null,
    };
  }
  const form = await req.formData().catch(() => null);
  if (form) {
    return {
      url: clip(String(form.get("url") ?? ""), MAX_URL).trim() || null,
      title: clip(String(form.get("title") ?? ""), MAX_TITLE).trim() || null,
      selection: clip(String(form.get("selection") ?? ""), MAX_BODY).trim() || null,
    };
  }
  return { url: null, title: null, selection: null };
}

async function handle(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    // Redirect to sign-in with a return-to so the next click on the
    // bookmarklet works once the user is logged in.
    return NextResponse.redirect(new URL("/auth/sign-in", req.url));
  }

  const workspaceId = user.activeWorkspaceId;
  if (!workspaceId) {
    return new Response(
      "No active workspace — finish onboarding first.",
      { status: 409 },
    );
  }

  const { url, title, selection } = await readPayload(req);
  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  // Body content prefers the selection (the user actively highlighted
  // something) and falls back to the page URL alone — the title carries
  // the descriptor in that case.
  const bodyText = selection || url;
  const finalTitle = title || hostnameOf(url) || "Clipped page";

  const [row] = await db
    .insert(ideas)
    .values({
      createdByUserId: user.id,
      workspaceId,
      source: "url_clip",
      sourceId: null,
      sourceUrl: url,
      title: finalTitle,
      body: bodyText,
      media: null,
      tags: [],
      channelFit: [],
      status: "new",
    })
    .returning({ id: ideas.id });

  // GET requests are friendly to redirect into the app so the user lands
  // on the new idea. POST requests get JSON so the bookmarklet can
  // toast/close without a navigation.
  if (req.method === "GET") {
    return NextResponse.redirect(new URL(`/app/ideas?clipped=${row.id}`, req.url));
  }
  return NextResponse.json({ ok: true, ideaId: row.id });
}

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export const POST = handle;
export const GET = handle;
