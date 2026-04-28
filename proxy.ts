import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import authConfig from "./auth.config";

// Two responsibilities, both kept tight against Vercel Edge invocations:
//
// 1. Auth gate for `/app/*` and `/auth/signin` — unauthenticated users
//    bounce to sign-in; signed-in users hitting the sign-in page are
//    sent to the dashboard. Original behavior, untouched.
//
// 2. CORS allowance for the Aloha Chrome extension on a small set of
//    API routes. The extension lives at `chrome-extension://<id>` and
//    needs explicit `Access-Control-Allow-Origin` + Credentials to
//    call our API. Same-origin web traffic is unaffected because the
//    CORS branch only fires when origin starts with `chrome-extension://`.
//
// The matcher scopes this proxy strictly: `/app/*`, the sign-in page,
// and the seven extension-allowed API routes. No other API route runs
// the proxy — keeps Edge invocations down per the prior optimization
// in 274903f.
//
// File convention: Next.js 16 renamed `middleware.ts` → `proxy.ts`.

const { auth } = NextAuth(authConfig);

const EXT_ROUTE_PATTERNS: RegExp[] = [
  /^\/api\/whoami$/,
  /^\/api\/ai\/import$/,
  /^\/api\/ideas\/clip$/,
  /^\/api\/upload$/,
  /^\/api\/posts\/draft$/,
  /^\/api\/posts\/manual-assist$/,
  /^\/api\/posts\/[^/]+\/deliveries\/[^/]+\/complete$/,
];

function isExtensionApiRoute(path: string): boolean {
  return EXT_ROUTE_PATTERNS.some((rx) => rx.test(path));
}

function isExtensionOrigin(origin: string): boolean {
  return origin.startsWith("chrome-extension://");
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Aloha-Extension",
    Vary: "Origin",
  };
}

// CORS branch — runs when the proxy fires on an extension-allowed API
// route. Returns null when the request isn't from an extension origin
// so the rest of the proxy keeps doing its thing (in practice nothing,
// since auth logic doesn't apply to `/api/*` paths). Returns a Response
// when CORS handling owns the response.
function handleExtensionCors(req: NextRequest): NextResponse | null {
  const origin = req.headers.get("origin") ?? "";
  if (!isExtensionOrigin(origin)) return null;

  // Preflight: short-circuit with 204 + CORS headers. Browsers reject
  // the actual request if this doesn't return correct headers fast.
  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(origin),
    });
  }

  // For real methods, let the route handler run and tag the response
  // with CORS headers on the way back.
  const res = NextResponse.next();
  for (const [k, v] of Object.entries(corsHeaders(origin))) {
    res.headers.set(k, v);
  }
  return res;
}

export default auth((req) => {
  const { nextUrl } = req;
  const path = nextUrl.pathname;

  // Extension CORS routes branch first — these are `/api/*` paths and
  // never need auth-redirect behavior from the proxy. Auth checks for
  // those routes happen inside each route handler via getCurrentContext.
  if (isExtensionApiRoute(path)) {
    const cors = handleExtensionCors(req);
    if (cors) return cors;
    // Same-origin (web app) requests fall through to plain passthrough —
    // route handler still runs, no headers added.
    return NextResponse.next();
  }

  // Auth-route logic for `/app/*` and `/auth/signin`. Original behavior
  // from before the extension shipped — unauthenticated users hitting
  // `/app/*` bounce to sign-in; authenticated users on `/auth/signin`
  // bounce into the app.
  const isLoggedIn = !!req.auth;
  const isAuthRoute = path === "/auth/signin";

  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/app/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  // /app/* — only protected surface beyond the auth routes.
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/signin", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Tight matcher: only the routes that actually need proxy behavior.
  // Every other request (including most `/api/*`) skips the proxy
  // entirely, keeping Vercel Edge Function invocations minimal.
  matcher: [
    "/app/:path*",
    "/auth/signin",
    "/api/whoami",
    "/api/ai/import",
    "/api/ideas/clip",
    "/api/upload",
    "/api/posts/draft",
    "/api/posts/manual-assist",
    "/api/posts/:postId/deliveries/:platform/complete",
  ],
};
