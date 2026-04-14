import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Lock,
  ShieldCheck,
  Globe,
  KeyRound,
  FileText,
  Sparkle,
  AlertTriangle,
  Mail,
  CalendarClock,
} from "lucide-react";
import { makeMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";

export const metadata = makeMetadata({
  title: "Trust center — security, privacy, and the promises behind them",
  description:
    "Aloha's security posture, compliance status, subprocessor list, and vulnerability disclosure programme — in one place, kept current.",
  path: routes.trust,
});

// ──────────────────────────────────────────────────────────────────────
const SNAPSHOT = [
  {
    icon: Lock,
    label: "Encryption",
    value: "TLS 1.3 · AES-256",
    sub: "In transit + at rest · customer-managed keys on Enterprise",
  },
  {
    icon: ShieldCheck,
    label: "SOC 2",
    value: "Type II",
    sub: "Current · report under NDA on request",
  },
  {
    icon: Globe,
    label: "Data residency",
    value: "US · EU",
    sub: "AWS us-east-1 or eu-west-1, your choice",
  },
  {
    icon: KeyRound,
    label: "Access",
    value: "MFA + audit log",
    sub: "Hardware keys for admin access · least-privilege role model",
  },
];

const COMPLIANCE = [
  { name: "SOC 2 Type II", status: "Current", tone: "bg-primary-soft" },
  { name: "GDPR + UK GDPR", status: "Covered", tone: "bg-peach-100" },
  { name: "CCPA", status: "Covered", tone: "bg-peach-100" },
  { name: "ISO 27001", status: "In progress · Q4 2026", tone: "bg-peach-200" },
  { name: "HIPAA", status: "Not offered", tone: "bg-muted" },
];

const SUBPROCESSORS = [
  { name: "Amazon Web Services", purpose: "Hosting, compute, storage", region: "US, EU" },
  { name: "Cloudflare", purpose: "CDN, DDoS, image processing", region: "Global edge" },
  { name: "Stripe", purpose: "Payment processing", region: "US, EU" },
  { name: "Postmark", purpose: "Transactional email", region: "US" },
  { name: "Upstash (QStash)", purpose: "Scheduled job delivery", region: "US, EU" },
  { name: "OpenAI", purpose: "Voice model inference fallback (zero-retention)", region: "US" },
];

const CONTACTS = [
  { role: "Security", email: "security@usealoha.app", note: "Vulnerabilities, incident reports" },
  { role: "Compliance", email: "compliance@usealoha.app", note: "Audits, SOC 2, questionnaires" },
  { role: "Privacy / DPO", email: "privacy@usealoha.app", note: "Data access, deletion, GDPR requests" },
  { role: "AI", email: "ai@usealoha.app", note: "Responsible-AI policy questions" },
];

export default function TrustPage() {
  return (
    <>
      {/* ─── HERO ────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden bg-peach-200 pb-20 lg:pb-24">
        <span aria-hidden className="absolute top-[14%] left-[5%] font-display text-[28px] text-ink/25 rotate-[-8deg] select-none">✳</span>
        <span aria-hidden className="absolute top-[68%] right-[8%] font-display text-[22px] text-primary/55 rotate-[14deg] select-none">+</span>
        <span aria-hidden className="absolute top-[28%] right-[6%] font-display text-[38px] text-ink/15 rotate-[18deg] select-none">※</span>

        <div className="relative max-w-[1180px] mx-auto px-6 lg:px-10 pt-20 lg:pt-28">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-3 mb-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
                <span className="w-6 h-px bg-ink/35" />
                Trust center
                <span className="px-2 py-0.5 bg-background-elev border border-border rounded-full text-ink/65 text-[10px] font-mono normal-case tracking-normal inline-flex items-center gap-1.5">
                  <CalendarClock className="w-3 h-3" />
                  last audited Apr 2026
                </span>
              </div>
              <h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[92px]">
                The promises
                <br />
                <span className="italic text-primary font-light">behind the product.</span>
              </h1>
              <p className="mt-8 max-w-2xl text-[17px] lg:text-[18px] leading-[1.6] text-ink/75">
                Everything security, privacy, and compliance — in one
                page, kept current. If you're doing a vendor review, this
                is the first stop; the deeper docs are linked throughout.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="mailto:security@usealoha.app"
                className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                Report a vulnerability
              </a>
              <Link
                href={routes.legal.security}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-background-elev border border-border-strong text-[13px] font-medium hover:bg-muted transition-colors"
              >
                Read the full security doc
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ─── SNAPSHOT ────────────────────────────────────────────────── */}
      <section className="py-12 lg:py-16">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
            {SNAPSHOT.map((s) => (
              <div key={s.label} className="p-7 rounded-3xl bg-background-elev border border-border">
                <s.icon className="w-6 h-6 text-primary" />
                <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
                  {s.label}
                </p>
                <p className="mt-2 font-display text-[26px] leading-[1.05] tracking-[-0.015em]">
                  {s.value}
                </p>
                <p className="mt-3 text-[12.5px] text-ink/65 leading-[1.5]">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMPLIANCE ──────────────────────────────────────────────── */}
      <section className="py-20 lg:py-24">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 mb-10 items-end">
            <div className="col-span-12 lg:col-span-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
                Compliance
              </p>
              <h2 className="font-display text-[36px] lg:text-[48px] leading-[1.02] tracking-[-0.02em]">
                Certifications
                <span className="italic text-primary"> kept current.</span>
              </h2>
            </div>
            <p className="col-span-12 lg:col-span-5 text-[15px] text-ink/70 leading-[1.55]">
              We publish statuses truthfully. If something's in progress,
              we'll say so — and name the quarter we expect it to land.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {COMPLIANCE.map((c) => (
              <div key={c.name} className={`p-6 rounded-2xl ${c.tone} flex flex-col justify-between min-h-[140px]`}>
                <p className="font-display text-[20px] leading-[1.1] tracking-[-0.01em]">
                  {c.name}
                </p>
                <p className="mt-4 text-[12px] font-mono uppercase tracking-[0.14em] text-ink/65">
                  {c.status}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-8 text-[13px] text-ink/60">
            SOC 2 Type II report available under NDA —{" "}
            <a href="mailto:compliance@usealoha.app" className="pencil-link text-ink">
              compliance@usealoha.app
            </a>
            .
          </p>
        </div>
      </section>

      {/* ─── SUBPROCESSORS ───────────────────────────────────────────── */}
      <section className="py-20 lg:py-24 bg-background-elev" id="subprocessors">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 mb-10 items-end">
            <div className="col-span-12 lg:col-span-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
                Subprocessors
              </p>
              <h2 className="font-display text-[36px] lg:text-[48px] leading-[1.02] tracking-[-0.02em]">
                Every third party
                <br />
                <span className="italic text-primary">that touches your data.</span>
              </h2>
            </div>
            <p className="col-span-12 lg:col-span-5 text-[15px] text-ink/70 leading-[1.55]">
              We give 30 days' notice before adding a new one. Paid-plan
              customers can subscribe to the subprocessor mailing list
              from Settings → Legal.
            </p>
          </div>

          <div className="rounded-3xl border border-border overflow-hidden bg-background">
            <div className="grid grid-cols-12 border-b border-border bg-muted/40 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/55">
              <div className="col-span-5 px-6 py-4">Subprocessor</div>
              <div className="col-span-5 px-6 py-4 border-l border-border">Purpose</div>
              <div className="col-span-2 px-6 py-4 border-l border-border">Region</div>
            </div>
            {SUBPROCESSORS.map((s, i) => (
              <div
                key={s.name}
                className={`grid grid-cols-12 border-b border-border last:border-b-0 ${
                  i % 2 === 1 ? "bg-muted/15" : ""
                }`}
              >
                <div className="col-span-5 px-6 py-4 font-medium text-ink text-[14.5px]">
                  {s.name}
                </div>
                <div className="col-span-5 px-6 py-4 border-l border-border text-[13.5px] text-ink/75">
                  {s.purpose}
                </div>
                <div className="col-span-2 px-6 py-4 border-l border-border text-[12px] font-mono text-ink/60">
                  {s.region}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DATA RESIDENCY ──────────────────────────────────────────── */}
      <section className="py-20 lg:py-24">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-16 items-center">
          <div className="col-span-12 lg:col-span-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
              Data residency
            </p>
            <h2 className="font-display text-[36px] lg:text-[48px] leading-[1.02] tracking-[-0.02em]">
              You choose
              <br />
              <span className="italic text-primary">where it lives.</span>
            </h2>
            <p className="mt-6 text-[16px] text-ink/75 leading-[1.6] max-w-lg">
              EU customers' data stays in the EU (AWS eu-west-1). US
              customers' data stays in the US (AWS us-east-1). The
              boundary is explicit — nothing crosses it without an SCC
              in place.
            </p>

            <ul className="mt-8 space-y-3 text-[14.5px] text-ink/85">
              {[
                "Primary region chosen at workspace creation; changeable on request.",
                "EU Standard Contractual Clauses + UK IDTA for cross-border transfers.",
                "Backups stored in the same region, in a separate AWS account.",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <Check className="w-4 h-4 mt-[3px] text-primary shrink-0" strokeWidth={2.5} />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-12 lg:col-span-6">
            {/* schematic world map — two anchored regions */}
            <div className="relative rounded-3xl bg-peach-100 p-8 lg:p-10 border border-peach-300/40 overflow-hidden">
              <svg
                aria-hidden
                viewBox="0 0 600 300"
                className="w-full h-auto"
              >
                {/* dotted grid */}
                <defs>
                  <pattern id="trust-dots" width="12" height="12" patternUnits="userSpaceOnUse">
                    <circle cx="1" cy="1" r="1" fill="rgba(23,20,18,0.14)" />
                  </pattern>
                </defs>
                <rect width="600" height="300" fill="url(#trust-dots)" />

                {/* US blob */}
                <g>
                  <circle cx="165" cy="145" r="54" fill="var(--peach-300)" opacity="0.55" />
                  <circle cx="165" cy="145" r="8" fill="var(--ink)" />
                  <text x="165" y="220" textAnchor="middle" className="font-display" fontSize="18" fill="var(--ink)">
                    US · us-east-1
                  </text>
                </g>

                {/* EU blob */}
                <g>
                  <circle cx="335" cy="125" r="46" fill="var(--primary-soft)" opacity="0.85" />
                  <circle cx="335" cy="125" r="8" fill="var(--primary)" />
                  <text x="335" y="200" textAnchor="middle" className="font-display" fontSize="18" fill="var(--ink)">
                    EU · eu-west-1
                  </text>
                </g>

                {/* subtle connector */}
                <path
                  d="M165 145 Q 250 60 335 125"
                  stroke="var(--ink)"
                  strokeOpacity="0.2"
                  strokeDasharray="4 4"
                  fill="none"
                  strokeWidth="1.5"
                />
              </svg>
              <div className="mt-6 flex items-center gap-6 text-[12px] text-ink/65">
                <span className="inline-flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-ink" />
                  Primary region
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  Primary region
                </span>
                <span className="inline-flex items-center gap-2 text-ink/45">
                  <span className="w-6 h-px bg-ink/30" />
                  SCC-covered transfers
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATUS + AI + LEGAL CARDS ───────────────────────────────── */}
      <section className="py-20 lg:py-24 bg-background-elev">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="mb-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
              Go deeper
            </p>
            <h2 className="font-display text-[36px] lg:text-[48px] leading-[1.02] tracking-[-0.02em]">
              The commitments,
              <span className="italic text-primary"> in full.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* status */}
            <Link
              href={routes.resources.status}
              className="group p-8 rounded-3xl bg-background border border-border hover:bg-muted/30 transition-colors flex flex-col min-h-[240px]"
            >
              <div className="flex items-center gap-2 mb-6">
                <span className="relative flex w-2.5 h-2.5">
                  <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
                  <span className="relative w-2.5 h-2.5 rounded-full bg-primary" />
                </span>
                <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-ink/55">
                  Live status
                </span>
              </div>
              <h3 className="font-display text-[24px] leading-[1.15] tracking-[-0.01em]">
                All systems normal.
              </h3>
              <p className="mt-3 text-[13.5px] text-ink/65 leading-[1.55]">
                99.9% target (99.95% Enterprise). Incident history kept
                live for 90 days; public post-mortems published for
                everything material.
              </p>
              <span className="mt-auto pt-6 pencil-link text-[13px] text-ink font-medium inline-flex items-center gap-2">
                Open the status page
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            {/* AI */}
            <Link
              href={routes.legal.responsibleAi}
              className="group p-8 rounded-3xl bg-primary-soft hover:bg-primary-soft/80 transition-colors flex flex-col min-h-[240px]"
            >
              <Sparkle className="w-6 h-6 text-primary mb-4" />
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink/55">
                Responsible AI
              </p>
              <h3 className="mt-3 font-display text-[24px] leading-[1.15] tracking-[-0.01em]">
                Your voice never trains a public model.
              </h3>
              <p className="mt-3 text-[13.5px] text-ink/70 leading-[1.55]">
                Voice models are workspace-scoped. Fallback inference is
                zero-retention. Every automated send waits for a human
                thumb.
              </p>
              <span className="mt-auto pt-6 pencil-link text-[13px] text-ink font-medium inline-flex items-center gap-2">
                Read the AI policy
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            {/* legal grid */}
            <div className="p-8 rounded-3xl bg-peach-100 flex flex-col min-h-[240px]">
              <FileText className="w-6 h-6 text-ink mb-4" />
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink/55">
                Legal docs
              </p>
              <ul className="mt-3 space-y-2.5 flex-1">
                {[
                  { h: routes.legal.privacy, l: "Privacy policy" },
                  { h: routes.legal.terms, l: "Terms of service" },
                  { h: routes.legal.dpa, l: "Data Processing Addendum" },
                  { h: routes.legal.security, l: "Security & compliance" },
                  { h: routes.legal.cookies, l: "Cookie policy" },
                  { h: routes.legal.responsibleAi, l: "Responsible AI" },
                ].map((l) => (
                  <li key={l.h}>
                    <Link
                      href={l.h}
                      className="group inline-flex items-center gap-1.5 text-[13.5px] text-ink pencil-link"
                    >
                      {l.l}
                      <ArrowUpRight className="w-3 h-3 text-ink/40 group-hover:text-primary transition-colors" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── VULNERABILITY DISCLOSURE ───────────────────────────────── */}
      <section className="py-20 lg:py-24">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="rounded-3xl bg-ink text-background-elev overflow-hidden relative">
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(var(--peach-300)_1px,transparent_1px)] [background-size:28px_28px]"
            />
            <div className="relative p-10 lg:p-14 grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 items-start">
              <div className="col-span-12 lg:col-span-5">
                <AlertTriangle className="w-8 h-8 text-peach-300 mb-6" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-peach-200 mb-4">
                  Vulnerability disclosure
                </p>
                <h2 className="font-display text-[36px] lg:text-[44px] leading-[1.05] tracking-[-0.015em]">
                  Found a hole?
                  <br />
                  <span className="italic text-peach-300">We'll thank you.</span>
                </h2>
                <p className="mt-6 text-[15.5px] text-background-elev/75 leading-[1.6] max-w-md">
                  We run a coordinated disclosure programme. Good-faith
                  researchers who stay within scope get thanked in
                  writing and paid for qualifying reports.
                </p>
              </div>

              <div className="col-span-12 lg:col-span-7 grid grid-cols-2 gap-5">
                {[
                  {
                    h: "Acknowledge in 24h",
                    p: "Every submission gets a human reply within a day.",
                  },
                  {
                    h: "Bounty $250 – $10,000",
                    p: "Based on severity and exploitability.",
                  },
                  {
                    h: "Safe-harbour for research",
                    p: "Good-faith research stays within legal scope. No surprises.",
                  },
                  {
                    h: "PGP for sensitive reports",
                    p: "Key at /.well-known/security.pgp.",
                  },
                ].map((x) => (
                  <div key={x.h} className="p-5 rounded-2xl bg-background-elev/5 border border-peach-200/10">
                    <p className="font-display text-[17px] text-peach-200 leading-[1.2]">{x.h}</p>
                    <p className="mt-2 text-[12.5px] text-background-elev/65 leading-[1.5]">
                      {x.p}
                    </p>
                  </div>
                ))}

                <div className="col-span-2 flex flex-wrap gap-3 mt-2">
                  <a
                    href="mailto:security@usealoha.app"
                    className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-peach-300 text-ink text-[13px] font-medium hover:bg-peach-400 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    security@usealoha.app
                  </a>
                  <Link
                    href={routes.legal.security}
                    className="inline-flex items-center gap-2 h-11 px-5 rounded-full border border-peach-200/20 text-peach-200 text-[13px] font-medium hover:bg-background-elev/10 transition-colors"
                  >
                    Full security doc
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CONTACTS ───────────────────────────────────────────────── */}
      <section className="py-20 lg:py-24 bg-background-elev">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="mb-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
              Who to write to
            </p>
            <h2 className="font-display text-[36px] lg:text-[48px] leading-[1.02] tracking-[-0.02em]">
              Real humans,
              <span className="italic text-primary"> real inboxes.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
            {CONTACTS.map((c) => (
              <a
                key={c.email}
                href={`mailto:${c.email}`}
                className="group p-7 rounded-3xl bg-background border border-border hover:bg-muted/30 transition-colors flex flex-col justify-between min-h-[180px]"
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
                    {c.role}
                  </p>
                  <p className="mt-4 font-display text-[19px] text-ink leading-[1.2] tracking-[-0.005em] break-all">
                    {c.email}
                  </p>
                </div>
                <p className="mt-4 text-[12.5px] text-ink/60 leading-[1.55]">{c.note}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
          <div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 items-end">
            <div className="col-span-12 lg:col-span-8">
              <h2 className="font-display text-[40px] sm:text-[52px] lg:text-[72px] leading-[0.98] tracking-[-0.025em]">
                We don't ask for trust.
                <br />
                <span className="italic text-primary">We document it.</span>
              </h2>
            </div>
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 lg:items-end">
              <Link
                href={routes.signin}
                className="inline-flex items-center gap-2 h-14 px-7 rounded-full bg-ink text-background font-medium text-[15px] hover:bg-primary transition-colors"
              >
                Start on a plan
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={routes.company.contact}
                className="pencil-link inline-flex items-center gap-2 text-[14.5px] font-medium text-ink"
              >
                Procurement questionnaire? Talk to us
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
