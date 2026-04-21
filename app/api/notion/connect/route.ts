// Starts the Notion OAuth flow. Generates a CSRF state, stashes it in a
// short-lived signed cookie, and redirects the user to Notion's authorize
// screen. Callback verifies the state before exchanging the code.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { env } from "@/lib/env";
import { notionAuthorizeUrl } from "@/lib/notion";
import { hasMuseInviteEntitlement } from "@/lib/billing/muse";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/auth/signin", env.APP_URL));
  }
  if (!(await hasMuseInviteEntitlement(user.id))) {
    return NextResponse.redirect(new URL("/app/settings/muse", env.APP_URL));
  }
  if (!env.NOTION_OAUTH_CLIENT_ID) {
    return new NextResponse("Notion integration not configured", {
      status: 501,
    });
  }

  const state = crypto.randomUUID();
  const redirectUri = `${env.APP_URL}/api/notion/callback`;
  const authorize = notionAuthorizeUrl(state, redirectUri);

  const res = NextResponse.redirect(authorize);
  res.cookies.set("notion_oauth_state", state, {
    httpOnly: true,
    secure: env.APP_URL.startsWith("https"),
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
