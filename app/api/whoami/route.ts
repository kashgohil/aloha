import { NextResponse } from "next/server";
import { getCurrentContext } from "@/lib/current-context";

// Tiny auth probe used by the Chrome extension to decide whether to show
// the sign-in prompt or the regular popup. Returns the minimum identity
// needed to render "Hello, $name" without leaking workspace internals.
//
// 401 when there's no session — the extension reads that as "open
// sign-in tab." 200 otherwise.

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await getCurrentContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    user: {
      id: ctx.user.id,
      name: ctx.user.name,
      email: ctx.user.email,
      image: ctx.user.image,
    },
    workspace: {
      id: ctx.workspace.id,
      name: ctx.workspace.name,
    },
    role: ctx.role,
  });
}
