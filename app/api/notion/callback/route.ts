// Receives the Notion OAuth redirect, verifies the state cookie, exchanges
// the code for a bot token, persists the connection, and bounces back to
// the Muse settings tab.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { env } from "@/lib/env";
import { exchangeNotionCode, saveNotionConnection } from "@/lib/notion";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/auth/signin", env.APP_URL));
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");
  const storedState = req.cookies.get("notion_oauth_state")?.value;

  const fail = (reason: string) =>
    NextResponse.redirect(
      new URL(`/app/settings/muse?notion=error&reason=${encodeURIComponent(reason)}`, env.APP_URL),
    );

  if (errorParam) return fail(errorParam);
  if (!code || !state) return fail("missing_params");
  if (!storedState || storedState !== state) return fail("state_mismatch");

  try {
    const token = await exchangeNotionCode(
      code,
      `${env.APP_URL}/api/notion/callback`,
    );
    await saveNotionConnection(user.id, token);
  } catch (err) {
    console.error("[notion] callback error", err);
    return fail("exchange_failed");
  }

  const res = NextResponse.redirect(
    new URL("/app/settings/muse?notion=connected", env.APP_URL),
  );
  res.cookies.delete("notion_oauth_state");
  return res;
}
