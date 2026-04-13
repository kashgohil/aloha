import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Download,
  Copy,
  Check,
  X as XIcon,
  Sparkle,
} from "lucide-react";
import { makeMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";

export const metadata = makeMetadata({
  title: "Brand — guidelines for using the Aloha identity",
  description:
    "Aloha's brand guidelines — logo, colour, typography, voice and motion. Documented so partners, press, and customers can use the identity consistently.",
  path: routes.company.brand,
});

// Colour chips — mirror globals.css.
const PALETTE = [
  {
    section: "Surface",
    tokens: [
      { name: "background", hex: "#f6f1e4", note: "Warm cream. The ground state of every page." },
      { name: "background-elev", hex: "#fffdf6", note: "Elevated surfaces — cards on cream." },
      { name: "foreground / ink", hex: "#1a1612", note: "Warm ink. Body text and ink-inverted cards." },
    ],
  },
  {
    section: "Peach (the only accent family)",
    tokens: [
      { name: "peach-100", hex: "#fbe6cf", note: "Softest — page backgrounds, quiet callouts." },
      { name: "peach-200", hex: "#f9d5ae", note: "Cards, hero backgrounds." },
      { name: "peach-300", hex: "#f4bf87", note: "Active states, emphasis." },
      { name: "peach-400", hex: "#ed9f57", note: "Loudest — use rarely, sparingly." },
    ],
  },
  {
    section: "Primary (indigo — CTAs only)",
    tokens: [
      { name: "primary", hex: "#4f46e5", note: "Buttons, links, emphasis italic." },
      { name: "primary-soft", hex: "#ecebfc", note: "Tinted backgrounds, secondary cards." },
      { name: "primary-deep", hex: "#2e2a85", note: "Hover / pressed state for primary." },
    ],
  },
];

const VOICE = [
  {
    tone: "We say",
    tint: "bg-peach-100 border-peach-300/40",
    items: [
      "Post less, say more.",
      "Your voice, eight ways.",
      "We'll tell you to go elsewhere.",
      "The export button is the point.",
    ],
  },
  {
    tone: "We don't say",
    tint: "bg-background border border-border",
    items: [
      "Unlock explosive growth.",
      "Game-changing AI.",
      "Let's 10× your reach.",
      "Transform your business.",
    ],
  },
];

const DONTS = [
  { h: "Don't recolour the wordmark", p: "Ink on cream or peach on ink. Those are the two." },
  { h: "Don't stretch or condense", p: "Fraunces wants the proportions it came with." },
  { h: "Don't add glow or drop shadows", p: "The mark is a warm-ink printed thing, not a neon sign." },
  { h: "Don't place on busy photography", p: "If you need to, use a 12% peach-100 scrim behind it." },
];

export default function BrandPage() {
  return (
    <>
      {/* ─── HERO ────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden hero-bg pb-16 lg:pb-20">
        <span aria-hidden className="absolute top-[14%] left-[5%] font-display text-[28px] text-ink/25 rotate-[-8deg] select-none">✳</span>
        <span aria-hidden className="absolute top-[68%] right-[8%] font-display text-[22px] text-primary/55 rotate-[14deg] select-none">+</span>
        <span aria-hidden className="absolute top-[28%] right-[6%] font-display text-[38px] text-ink/15 rotate-[18deg] select-none">※</span>

        <div className="relative max-w-[1180px] mx-auto px-6 lg:px-10 pt-20 lg:pt-28">
          <div className="grid grid-cols-12 gap-8 lg:gap-12 items-end">
            <div className="col-span-12 lg:col-span-8">
              <div className="inline-flex items-center gap-2 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
                <span className="w-6 h-px bg-ink/40" />
                Brand guidelines
              </div>
              <h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[92px]">
                An identity
                <br />
                <span className="italic text-primary font-light">on purpose.</span>
              </h1>
              <p className="mt-8 max-w-2xl text-[17px] lg:text-[18px] leading-[1.6] text-ink/75">
                These are the rules for how Aloha looks and sounds. Our
                team follows them; partners, press and customers are
                welcome to use the identity as long as they do too.
              </p>
            </div>
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-3">
              <Link
                href={routes.company.press}
                className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors w-fit"
              >
                <Download className="w-4 h-4" />
                Brand kit on /press
              </Link>
              <a
                href="mailto:brand@aloha.social"
                className="pencil-link inline-flex items-center gap-2 text-[14.5px] font-medium text-ink"
              >
                Unsure about something? Write us
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* ─── LOGO ────────────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-12 gap-10 mb-14">
            <div className="col-span-12 lg:col-span-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
                The wordmark
              </p>
              <h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
                Fraunces aloha
                <br />
                <span className="italic text-primary">indigo period.</span>
              </h2>
            </div>
            <p className="col-span-12 lg:col-span-5 text-[15.5px] text-ink/70 leading-[1.55]">
              The period is the brand. A quiet mark at the end of a
              confident word. Do not remove it. Do not shift its colour.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <div className="p-10 rounded-3xl bg-background border border-border flex items-center justify-center min-h-[220px]">
              <div className="flex items-baseline gap-1">
                <span className="font-display text-[68px] leading-none font-semibold tracking-[-0.03em] text-ink">
                  Aloha
                </span>
                <span className="font-display text-primary text-[52px] leading-none">.</span>
              </div>
            </div>
            <div className="p-10 rounded-3xl bg-peach-200 flex items-center justify-center min-h-[220px]">
              <div className="flex items-baseline gap-1">
                <span className="font-display text-[68px] leading-none font-semibold tracking-[-0.03em] text-ink">
                  Aloha
                </span>
                <span className="font-display text-primary text-[52px] leading-none">.</span>
              </div>
            </div>
            <div className="p-10 rounded-3xl bg-ink flex items-center justify-center min-h-[220px]">
              <div className="flex items-baseline gap-1">
                <span className="font-display text-[68px] leading-none font-semibold tracking-[-0.03em] text-peach-200">
                  Aloha
                </span>
                <span className="font-display text-peach-300 text-[52px] leading-none">.</span>
              </div>
            </div>
          </div>

          {/* do / don't */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
            <div className="p-7 rounded-3xl bg-peach-100">
              <div className="flex items-center gap-2 mb-4">
                <Check className="w-4 h-4 text-primary" strokeWidth={2.5} />
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/60">Do</p>
              </div>
              <ul className="space-y-2.5 text-[14px] text-ink/80">
                <li>· Keep the period in the primary indigo, every time.</li>
                <li>· Give it 40px of clear space on all sides at any size.</li>
                <li>· Use on cream or peach backgrounds; use the ink inverse on dark.</li>
              </ul>
            </div>
            <div className="p-7 rounded-3xl bg-ink text-background-elev">
              <div className="flex items-center gap-2 mb-4">
                <XIcon className="w-4 h-4 text-peach-300" strokeWidth={2.5} />
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-peach-200">Don't</p>
              </div>
              <ul className="space-y-2.5 text-[14px] text-background-elev/80">
                {DONTS.map((d) => (
                  <li key={d.h}>
                    · <span className="text-peach-200 font-medium">{d.h}.</span>{" "}
                    <span className="text-background-elev/65">{d.p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── COLOUR ─────────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32 bg-background-elev">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-12 gap-10 mb-14 items-end">
            <div className="col-span-12 lg:col-span-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
                Colour
              </p>
              <h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
                Cream, ink,
                <br />
                <span className="italic text-primary">one warm family.</span>
              </h2>
            </div>
            <p className="col-span-12 lg:col-span-5 text-[15.5px] text-ink/70 leading-[1.55]">
              Warm cream ground, warm ink foreground, a single peach
              family for warmth, indigo for calls to action only. No
              grays, no pure black, no secondary accent colour.
            </p>
          </div>

          <div className="space-y-10">
            {PALETTE.map((g) => (
              <div key={g.section}>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
                  {g.section}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {g.tokens.map((c) => (
                    <article key={c.name} className="rounded-3xl overflow-hidden bg-background border border-border">
                      <div className="h-24" style={{ backgroundColor: c.hex }} />
                      <div className="p-5">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-display text-[17px] text-ink">{c.name}</p>
                          <span className="font-mono text-[11px] text-ink/60 uppercase tracking-[0.12em]">
                            {c.hex}
                          </span>
                        </div>
                        <p className="mt-3 text-[12.5px] text-ink/65 leading-[1.55]">{c.note}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 p-6 rounded-2xl bg-background border border-border flex items-center gap-3 text-[13.5px] text-ink/75">
            <Copy className="w-4 h-4 text-ink/50 shrink-0" />
            Tokens are exported as CSS variables in <code className="font-mono text-[12.5px] bg-muted px-1.5 py-0.5 rounded">app/globals.css</code>{" "}
            and mapped to Tailwind via <code className="font-mono text-[12.5px] bg-muted px-1.5 py-0.5 rounded">@theme inline</code>.
          </div>
        </div>
      </section>

      {/* ─── TYPOGRAPHY ─────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-12 gap-10 mb-14">
            <div className="col-span-12 lg:col-span-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
                Typography
              </p>
              <h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
                Fraunces for voice,
                <br />
                <span className="italic text-primary">Outfit for clarity.</span>
              </h2>
            </div>
            <p className="col-span-12 lg:col-span-5 text-[15.5px] text-ink/70 leading-[1.55]">
              A display serif paired with a clean sans. Fraunces carries
              the editorial personality — headlines, quotes, italics —
              while Outfit handles body, UI, and mono-free data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            <article className="p-10 rounded-3xl bg-peach-100">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-6">
                Fraunces · display
              </p>
              <p className="font-display text-[84px] leading-[0.9] tracking-[-0.03em] text-ink">
                Aa
              </p>
              <p className="mt-8 font-display text-[36px] leading-[1] tracking-[-0.02em]">
                A monday note.
              </p>
              <p className="mt-3 font-display italic text-[32px] leading-[1.05] text-primary">
                a soft afternoon.
              </p>
              <p className="mt-8 text-[12.5px] text-ink/60 font-mono uppercase tracking-[0.14em]">
                400 regular · 500 medium · italic · opsz 36
              </p>
            </article>

            <article className="p-10 rounded-3xl bg-primary-soft">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-6">
                Outfit · sans
              </p>
              <p className="font-sans text-[84px] leading-[0.9] tracking-[-0.025em] text-ink font-semibold">
                Aa
              </p>
              <p className="mt-8 text-[16px] leading-[1.6] text-ink/85">
                Aloha is a social media tool that helps creators and
                small teams schedule posts across eight networks
                without losing their voice to it.
              </p>
              <p className="mt-8 text-[12.5px] text-ink/60 font-mono uppercase tracking-[0.14em]">
                400 regular · 500 medium · 600 semibold
              </p>
            </article>
          </div>

          <p className="mt-8 text-[13px] text-ink/60">
            Both licensed open source — Fraunces via SIL Open Font License,
            Outfit via SIL Open Font License. Self-hosted through{" "}
            <code className="font-mono text-[12.5px] bg-muted px-1.5 py-0.5 rounded">next/font</code>; no external CDNs.
          </p>
        </div>
      </section>

      {/* ─── VOICE ─────────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32 bg-background-elev">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-12 gap-10 mb-14 items-end">
            <div className="col-span-12 lg:col-span-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
                Voice
              </p>
              <h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
                Honest, calm,
                <br />
                <span className="italic text-primary">occasionally funny.</span>
              </h2>
            </div>
            <p className="col-span-12 lg:col-span-5 text-[15.5px] text-ink/70 leading-[1.55]">
              We write like a careful editor, not a growth marketer. No
              exclamations, no emoji in default copy, no &ldquo;game-
              changing&rdquo; anything. A short truth beats a polished
              over-claim.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
            {VOICE.map((v) => (
              <article key={v.tone} className={`p-7 lg:p-9 rounded-3xl ${v.tint}`}>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-5">
                  {v.tone}
                </p>
                <ul className="space-y-3">
                  {v.items.map((l) => (
                    <li key={l} className="font-display italic text-[22px] lg:text-[24px] leading-[1.25] tracking-[-0.005em] text-ink">
                      "{l}"
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MOTION ─────────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-12 gap-10 mb-14">
            <div className="col-span-12 lg:col-span-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
                Motion
              </p>
              <h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
                Gentle,
                <br />
                <span className="italic text-primary">rarely essential.</span>
              </h2>
            </div>
            <p className="col-span-12 lg:col-span-5 text-[15.5px] text-ink/70 leading-[1.55]">
              Animations are confirmations, not entertainment. Short
              durations (150–400ms), eased curves, and a strong bias
              toward CSS-only effects.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            <article className="p-8 rounded-3xl bg-peach-100">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-3">
                Pencil link
              </p>
              <p className="font-display text-[22px] leading-[1.15] tracking-[-0.005em]">
                <a className="pencil-link" href="#">
                  Underline grows on hover
                </a>
              </p>
              <p className="mt-5 font-mono text-[11.5px] text-ink/55 uppercase tracking-[0.14em]">
                350ms · cubic-bezier(0.2, 0.8, 0.2, 1)
              </p>
            </article>

            <article className="p-8 rounded-3xl bg-primary-soft flex flex-col">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-3">
                Float
              </p>
              <div className="relative flex-1 grid place-items-center py-6">
                <span className="animate-[float-soft_6s_ease-in-out_infinite] font-display text-[44px] text-ink">
                  ✳
                </span>
              </div>
              <p className="mt-3 font-mono text-[11.5px] text-ink/55 uppercase tracking-[0.14em]">
                float-soft · 6s ease · hero cards, mock UI panels
              </p>
            </article>

            <article className="p-8 rounded-3xl bg-peach-200">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-3">
                Entrance ping
              </p>
              <div className="relative grid place-items-center py-10">
                <span className="relative flex w-4 h-4">
                  <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
                  <span className="relative w-4 h-4 rounded-full bg-primary" />
                </span>
              </div>
              <p className="mt-3 font-mono text-[11.5px] text-ink/55 uppercase tracking-[0.14em]">
                animate-ping · live indicators only
              </p>
            </article>
          </div>

          <div className="mt-10 p-7 rounded-3xl bg-ink text-background-elev flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <Sparkle className="w-6 h-6 text-peach-300 shrink-0 mt-1" />
              <p className="text-[15.5px] leading-[1.6] max-w-xl">
                Respect{" "}
                <code className="font-mono text-[13px] bg-background-elev/10 px-1.5 py-0.5 rounded">
                  prefers-reduced-motion
                </code>
                . Every animated element in the codebase disables itself
                when the user has the OS setting on.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
          <div className="grid grid-cols-12 gap-10 items-end">
            <div className="col-span-12 lg:col-span-8">
              <h2 className="font-display text-[40px] sm:text-[52px] lg:text-[72px] leading-[0.98] tracking-[-0.025em]">
                One family of marks.
                <br />
                <span className="italic text-primary">Many places they show up.</span>
              </h2>
            </div>
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 lg:items-end">
              <Link
                href={routes.company.press}
                className="inline-flex items-center gap-2 h-14 px-7 rounded-full bg-ink text-background font-medium text-[15px] hover:bg-primary transition-colors"
              >
                <Download className="w-4 h-4" />
                Download the kit
              </Link>
              <a
                href="mailto:brand@aloha.social"
                className="pencil-link inline-flex items-center gap-2 text-[14.5px] font-medium text-ink"
              >
                brand@aloha.social
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
