import Link from "next/link";
import { Mail, ArrowUpRight, Clock } from "lucide-react";
import { makeMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { AuthShell } from "../_components/auth-shell";

export const metadata = makeMetadata({
  title: "Check your email",
  description: "We sent you a sign-in link. Open it on this device.",
  path: routes.verifyRequest,
  noindex: true,
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

const MAIL_DEEP_LINKS = [
  { label: "Gmail", href: "https://mail.google.com" },
  { label: "Outlook", href: "https://outlook.live.com/mail" },
  { label: "Fastmail", href: "https://app.fastmail.com" },
  { label: "Yahoo", href: "https://mail.yahoo.com" },
];

export default async function VerifyRequestPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const email = first(params.email);

  return (
    <AuthShell
      eyebrow="One more step"
      title={
        <>
          Check your
          <br />
          <span className="text-primary font-light italic">inbox.</span>
        </>
      }
      subtitle={
        email ? (
          <>
            We sent a sign-in link to{" "}
            <span className="text-ink font-medium">{email}</span>. Open it on
            this device to continue — the link works once and expires in 24
            hours.
          </>
        ) : (
          "We sent you a sign-in link. Open it on this device to continue — the link works once and expires in 24 hours."
        )
      }
      footer={
        <p>
          Didn&apos;t get it?{" "}
          <Link
            href="/auth/signin"
            className="pencil-link text-ink font-medium"
          >
            Try a different method
          </Link>
          .
        </p>
      }
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-border-strong bg-background-elev px-5 py-5 flex items-start gap-4">
          <div className="mt-[2px] w-10 h-10 rounded-full bg-peach-100 border border-border grid place-items-center shrink-0">
            <Mail className="w-4 h-4 text-ink" />
          </div>
          <div className="flex-1">
            <p className="text-[14.5px] text-ink font-medium">Sign-in link sent</p>
            <p className="mt-1 text-[13px] text-ink/65 leading-[1.55]">
              Can&apos;t find it? Check Promotions and Spam. The sender is
              hey@usealoha.app.
            </p>
            <p className="mt-3 inline-flex items-center gap-2 text-[12px] text-ink/55">
              <Clock className="w-3.5 h-3.5" />
              Expires in 24 hours
            </p>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-3">
            Jump to your inbox
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {MAIL_DEEP_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noreferrer noopener"
                className="group h-11 px-4 inline-flex items-center justify-between rounded-full border border-border-strong text-[13.5px] text-ink hover:border-ink transition-colors"
              >
                {l.label}
                <ArrowUpRight className="w-3.5 h-3.5 text-ink/50 group-hover:text-ink transition-colors" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
