import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { AuthShell } from "../_components/auth-shell";
import { makeMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";

export const metadata = makeMetadata({
  title: "Sign-in problem",
  description: "We ran into a problem signing you in.",
  path: routes.authError,
  noindex: true,
});

type ErrorKind = {
  title: string;
  subtitle: string;
  hint?: string;
};

const ERRORS: Record<string, ErrorKind> = {
  OAuthAccountNotLinked: {
    title: "This email is linked elsewhere.",
    subtitle:
      "The email on that account is already connected to a different sign-in method in Aloha.",
    hint: "Sign in with the provider you used the first time. You can connect additional providers from Settings → Accounts once you're in.",
  },
  AccessDenied: {
    title: "Access was denied.",
    subtitle:
      "Your provider didn't return permission to sign in. This usually means the consent screen was cancelled.",
    hint: "Try again, or pick a different provider on the sign-in page.",
  },
  Verification: {
    title: "That link has expired.",
    subtitle:
      "Sign-in links work once and expire after 24 hours. Request a fresh one to continue.",
  },
  Configuration: {
    title: "Something’s off on our end.",
    subtitle:
      "A configuration check failed while signing you in. Our team has been notified.",
    hint: "Please try again in a moment. If it keeps happening, let us know.",
  },
  default: {
    title: "We couldn't sign you in.",
    subtitle:
      "Something went wrong mid-flow. It's probably temporary — try again.",
  },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const code = first(params.error) ?? "default";
  const kind = ERRORS[code] ?? ERRORS.default;

  return (
    <AuthShell
      eyebrow="Sign-in problem"
      title={<>{kind.title}</>}
      subtitle={kind.subtitle}
      footer={
        <p className="text-[12px] text-ink/55">
          Reference code:{" "}
          <code className="font-mono text-ink/70">{code}</code>
        </p>
      }
    >
      <div className="space-y-5">
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-border-strong bg-peach-100/60 px-4 py-3.5 text-[13.5px] text-ink"
        >
          <AlertTriangle className="w-4 h-4 mt-[2px] text-primary shrink-0" />
          <span className="leading-[1.5]">
            {kind.hint ?? "Head back to sign in and give it another try."}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <Link
            href={routes.signin}
            className="inline-flex items-center justify-center h-12 px-6 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
          >
            Back to sign in
          </Link>
          <Link
            href={routes.company.contact}
            className="inline-flex items-center justify-center h-12 px-6 rounded-full border border-border-strong text-ink text-[14px] font-medium hover:border-ink transition-colors"
          >
            Contact support
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
