import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Code2,
  KeyRound,
  Webhook,
  Terminal,
  Book,
  Sparkle,
} from "lucide-react";
import { makeMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";

export const metadata = makeMetadata({
  title: "API & docs — the REST API, webhooks and SDKs",
  description:
    "Aloha's public API. Schedule posts, read analytics, trigger matrices from code. OAuth, webhooks, and first-party SDKs in TypeScript and Python.",
  path: routes.resources.apiDocs,
});

const SECTIONS = [
  {
    icon: Book,
    h: "Getting started",
    p: "Create an API key, authenticate, ship your first scheduled post in five minutes.",
    anchor: "#getting-started",
  },
  {
    icon: KeyRound,
    h: "Authentication",
    p: "API keys, OAuth 2.0 for partner apps, rotating keys, scoping by workspace.",
    anchor: "#auth",
  },
  {
    icon: Code2,
    h: "REST endpoints",
    p: "Posts, schedules, analytics, inbox, voice models. Read and write.",
    anchor: "#rest",
  },
  {
    icon: Webhook,
    h: "Webhooks",
    p: "Subscribe to events — post.published, post.failed, reply.received.",
    anchor: "#webhooks",
  },
  {
    icon: Terminal,
    h: "SDKs",
    p: "First-party SDKs for TypeScript and Python. cURL examples on every endpoint.",
    anchor: "#sdks",
  },
  {
    icon: Sparkle,
    h: "Rate limits",
    p: "Per-workspace limits, back-off strategy, what happens at 429.",
    anchor: "#limits",
  },
];

export default function ApiDocsPage() {
  return (
    <>
      {/* ─── HERO ────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden bg-peach-200 pb-16 lg:pb-20">
        <span aria-hidden className="absolute top-[14%] left-[5%] font-display text-[28px] text-ink/25 rotate-[-8deg] select-none">✳</span>
        <span aria-hidden className="absolute top-[68%] right-[10%] font-display text-[22px] text-primary/55 rotate-[14deg] select-none">+</span>

        <div className="relative max-w-[1180px] mx-auto px-6 lg:px-10 pt-20 lg:pt-28">
          <div className="grid grid-cols-12 gap-x-0 gap-y-8 lg:gap-12 items-end">
            <div className="col-span-12 lg:col-span-8">
              <div className="inline-flex items-center gap-3 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
                <Link href={routes.resources.index} className="pencil-link">
                  Resources
                </Link>
                <span className="text-ink/25">·</span>
                <span>API &amp; docs</span>
                <span className="px-2 py-0.5 bg-background-elev border border-border rounded-full text-ink/65 text-[10px] font-mono normal-case tracking-normal inline-flex items-center gap-1.5">
                  v1 · stable
                </span>
              </div>
              <h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[92px]">
                The API,
                <br />
                <span className="italic text-primary font-light">in plain English.</span>
              </h1>
              <p className="mt-8 max-w-2xl text-[17px] lg:text-[18px] leading-[1.6] text-ink/75">
                Schedule posts, read analytics, trigger matrices from
                code. REST first, OAuth for partner apps, webhooks for
                the things you'd otherwise poll. Authenticated by API
                key; rate-limited honestly.
              </p>
            </div>
            <div className="col-span-12 lg:col-span-4 space-y-3">
              <a
                href="#getting-started"
                className="block p-5 rounded-2xl bg-ink text-background-elev hover:bg-primary transition-colors"
              >
                <p className="text-[10.5px] font-mono uppercase tracking-[0.22em] text-peach-200 mb-2">
                  Ship the first request
                </p>
                <p className="font-display text-[20px] leading-[1.15]">
                  Five-minute quickstart
                </p>
              </a>
              <a
                href="https://github.com/aloha"
                className="group block p-5 rounded-2xl bg-background-elev border border-border hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10.5px] font-mono uppercase tracking-[0.22em] text-ink/55 mb-1">
                      SDKs on GitHub
                    </p>
                    <p className="font-display text-[17px] tracking-[-0.005em]">
                      aloha / node · python
                    </p>
                  </div>
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-ink/40 group-hover:text-primary transition-colors" fill="currentColor">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                </div>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* ─── SECTIONS GRID ──────────────────────────────────────────── */}
      <section className="py-16 lg:py-20">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {SECTIONS.map((s) => (
              <a
                key={s.h}
                href={s.anchor}
                className="group p-7 rounded-3xl bg-background-elev border border-border hover:bg-muted/40 transition-colors flex flex-col min-h-[180px]"
              >
                <s.icon className="w-5 h-5 text-primary" />
                <h3 className="mt-6 font-display text-[22px] leading-[1.15] tracking-[-0.005em]">
                  {s.h}
                </h3>
                <p className="mt-2 text-[13.5px] text-ink/70 leading-[1.6] flex-1">{s.p}</p>
                <span className="mt-4 pencil-link text-[12.5px] text-ink inline-flex items-center gap-1.5 self-start">
                  Jump to section
                  <ArrowRight className="w-3 h-3" />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BODY (two-col docs layout) ─────────────────────────────── */}
      <section className="py-12 lg:py-16 border-t border-border bg-background-elev">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-12 items-start">
            {/* sidebar */}
            <aside className="hidden lg:block lg:col-span-3">
              <nav className="sticky top-[96px]">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
                  On this page
                </p>
                <ul className="space-y-2.5 border-l border-border-strong/50 pl-4 text-[13px]">
                  {SECTIONS.map((s) => (
                    <li key={s.anchor}>
                      <a
                        href={s.anchor}
                        className="text-ink/60 hover:text-ink transition-colors"
                      >
                        {s.h}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>

            {/* content */}
            <article className="col-span-12 lg:col-span-9 space-y-16 text-[15.5px] leading-[1.7] text-ink/85">
              {/* getting-started */}
              <section id="getting-started" className="scroll-mt-24">
                <h2 className="font-display text-[32px] lg:text-[40px] leading-[1.1] tracking-[-0.015em] text-ink mb-4">
                  Getting started
                </h2>
                <p>
                  Generate an API key from Settings → Developer. Keys
                  scope to one workspace by default. Include the key as
                  a <code className="font-mono text-[14px] bg-muted px-1.5 py-0.5 rounded">Authorization: Bearer</code>{" "}
                  header on every request. TLS is enforced; HTTP is rejected.
                </p>

                <pre className="mt-5 p-5 rounded-2xl bg-ink text-background-elev text-[12.5px] font-mono leading-[1.6] overflow-auto">
{`curl https://api.usealoha.app/v1/posts \\
  -H "Authorization: Bearer alo_live_xxxxxxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "content": "a monday note.",
    "channels": ["instagram", "linkedin"],
    "scheduledAt": "2026-04-15T09:30:00Z"
  }'`}
                </pre>

                <p className="mt-5">
                  The response carries the created post's ID and its
                  per-channel status. You can read it back at{" "}
                  <code className="font-mono text-[14px] bg-muted px-1.5 py-0.5 rounded">GET /v1/posts/:id</code>.
                </p>
              </section>

              {/* auth */}
              <section id="auth" className="scroll-mt-24">
                <h2 className="font-display text-[32px] lg:text-[40px] leading-[1.1] tracking-[-0.015em] text-ink mb-4">
                  Authentication
                </h2>
                <p>
                  Two authentication modes: API keys for first-party use,
                  OAuth 2.0 (authorization code + PKCE) for partner apps.
                  Rotate keys any time; we honour the old key for 24 hours
                  for graceful deploys.
                </p>
                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-background border border-border">
                    <p className="font-display text-[18px] text-ink">API keys</p>
                    <p className="mt-2 text-[13px] text-ink/65 leading-[1.55]">
                      <code className="font-mono text-[12.5px] bg-muted px-1 py-0.5 rounded">alo_live_*</code> and{" "}
                      <code className="font-mono text-[12.5px] bg-muted px-1 py-0.5 rounded">alo_test_*</code>. Workspace-scoped.
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl bg-background border border-border">
                    <p className="font-display text-[18px] text-ink">OAuth 2.0</p>
                    <p className="mt-2 text-[13px] text-ink/65 leading-[1.55]">
                      Partner apps. PKCE required. Scopes: read, write,
                      webhook:admin.
                    </p>
                  </div>
                </div>
              </section>

              {/* rest */}
              <section id="rest" className="scroll-mt-24">
                <h2 className="font-display text-[32px] lg:text-[40px] leading-[1.1] tracking-[-0.015em] text-ink mb-4">
                  REST endpoints
                </h2>
                <div className="space-y-2">
                  {[
                    { m: "POST", p: "/v1/posts", d: "Create a scheduled or drafted post." },
                    { m: "GET", p: "/v1/posts/:id", d: "Read a post and its per-channel status." },
                    { m: "GET", p: "/v1/posts", d: "List posts with filters by channel, status, date." },
                    { m: "POST", p: "/v1/analytics/export", d: "Kick off an analytics export (CSV / JSON)." },
                    { m: "GET", p: "/v1/inbox/threads", d: "List unified inbox threads." },
                    // { m: "POST", p: "/v1/matrix/:id/run", d: "Trigger a matrix run manually." },  // hidden in production
                    { m: "POST", p: "/v1/voice/train", d: "Submit training set for the voice model." },
                  ].map((e) => (
                    <div
                      key={e.p}
                      className="grid grid-cols-12 gap-x-0 gap-y-4 lg:gap-4 items-center px-5 py-3 rounded-xl bg-background border border-border"
                    >
                      <span className={`col-span-2 font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-1 rounded-md inline-block w-fit ${e.m === "GET" ? "bg-primary-soft text-primary" : "bg-peach-200 text-ink"}`}>
                        {e.m}
                      </span>
                      <code className="col-span-12 md:col-span-4 font-mono text-[13px] text-ink">
                        {e.p}
                      </code>
                      <span className="col-span-12 md:col-span-6 text-[13px] text-ink/70">
                        {e.d}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* webhooks */}
              <section id="webhooks" className="scroll-mt-24">
                <h2 className="font-display text-[32px] lg:text-[40px] leading-[1.1] tracking-[-0.015em] text-ink mb-4">
                  Webhooks
                </h2>
                <p>
                  Subscribe to event types in Settings → Webhooks. Every
                  payload is signed with HMAC-SHA256 under a secret you
                  control. We retry failed deliveries 6 times with
                  exponential backoff (1m, 5m, 25m, 2h, 12h, 24h).
                </p>
                <pre className="mt-5 p-5 rounded-2xl bg-ink text-background-elev text-[12.5px] font-mono leading-[1.6] overflow-auto">
{`POST /your-endpoint
X-Aloha-Signature: sha256=<hmac>
X-Aloha-Event: post.published

{
  "id": "evt_01HZ...",
  "event": "post.published",
  "created": 1712620800,
  "data": { "postId": "post_01HY...", "channel": "instagram" }
}`}
                </pre>
                <p className="mt-5">
                  Events currently shipped:{" "}
                  <code className="font-mono text-[14px] bg-muted px-1.5 py-0.5 rounded">post.scheduled</code>,{" "}
                  <code className="font-mono text-[14px] bg-muted px-1.5 py-0.5 rounded">post.published</code>,{" "}
                  <code className="font-mono text-[14px] bg-muted px-1.5 py-0.5 rounded">post.failed</code>,{" "}
                  <code className="font-mono text-[14px] bg-muted px-1.5 py-0.5 rounded">reply.received</code>.
                </p>
              </section>

              {/* sdks */}
              <section id="sdks" className="scroll-mt-24">
                <h2 className="font-display text-[32px] lg:text-[40px] leading-[1.1] tracking-[-0.015em] text-ink mb-4">
                  SDKs
                </h2>
                <p>
                  First-party SDKs for TypeScript and Python, both open
                  source on <a href="https://github.com/aloha">GitHub</a>.
                  The SDK is a thin wrapper — you can always drop down
                  to raw HTTP.
                </p>
                <pre className="mt-5 p-5 rounded-2xl bg-ink text-background-elev text-[12.5px] font-mono leading-[1.6] overflow-auto">
{`// TypeScript
import { Aloha } from "@aloha/sdk";

const client = new Aloha({ apiKey: process.env.ALOHA_KEY });
await client.posts.create({
  content: "a monday note.",
  channels: ["instagram"],
  scheduledAt: new Date("2026-04-15T09:30:00Z"),
});`}
                </pre>
              </section>

              {/* limits */}
              <section id="limits" className="scroll-mt-24">
                <h2 className="font-display text-[32px] lg:text-[40px] leading-[1.1] tracking-[-0.015em] text-ink mb-4">
                  Rate limits
                </h2>
                <p>
                  Every plan gets different generous-but-honest limits.
                  Free: 60 req/min. Working Team: 600 req/min. Agency:
                  3,000 req/min. Each response carries{" "}
                  <code className="font-mono text-[14px] bg-muted px-1.5 py-0.5 rounded">X-RateLimit-*</code>{" "}
                  headers so you never have to guess.
                </p>
                <p className="mt-4">
                  If you hit a 429, back off by the value of the{" "}
                  <code className="font-mono text-[14px] bg-muted px-1.5 py-0.5 rounded">Retry-After</code>{" "}
                  header. We don't shadow-throttle; a 429 is a 429.
                </p>
              </section>
            </article>
          </div>
        </div>
      </section>

      {/* ─── STATUS + SUPPORT ──────────────────────────────────────── */}
      <section className="py-16 lg:py-20">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { h: "Live API status", p: "All green right now? Check before paging.", href: routes.resources.status },
              { h: "Changelog", p: "Breaking changes get 60 days' notice.", href: routes.product.whatsNew },
              { h: "Developer support", p: "Email hello@usealoha.app — a real engineer answers.", href: "mailto:hello@usealoha.app" },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="group p-6 rounded-2xl bg-background border border-border hover:bg-muted/30 transition-colors"
              >
                <p className="font-display text-[19px] leading-[1.2] tracking-[-0.005em]">
                  {l.h}
                </p>
                <p className="mt-2 text-[12.5px] text-ink/60">{l.p}</p>
                <ArrowUpRight className="mt-4 w-3.5 h-3.5 text-ink/40 group-hover:text-primary transition-colors" />
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
