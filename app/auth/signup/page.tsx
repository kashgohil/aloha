import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { signIn } from "@/auth";
import { makeMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { AuthShell } from "../_components/auth-shell";
import { ProviderButton } from "../_components/provider-button";

export const metadata = makeMetadata({
  title: "Create your workspace",
  description:
    "Start a free Aloha workspace. Three channels, ten posts per channel per month, no card.",
  path: routes.signup,
  noindex: true,
});

const ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked:
    "Looks like you've been here before. Sign in with the provider you used the first time.",
  AccessDenied: "We couldn't create an account with that provider. Try another.",
  Configuration:
    "We hit a configuration issue on our end. Please try again in a moment.",
  default: "Something went wrong. Please try again.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const callbackUrl = first(params.callbackUrl);
  const error = first(params.error);

  const redirectTo =
    callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : "/app/dashboard";

  const errorMessage = error
    ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.default)
    : null;

  return (
    <AuthShell
      eyebrow="Start free"
      title={
        <>
          Your quiet home for
          <br />
          <span className="text-primary font-light italic">
            showing up online.
          </span>
        </>
      }
      subtitle="Three channels, ten scheduled posts per channel per month — free forever. No credit card."
      footer={
        <p>
          Already have a workspace?{" "}
          <Link href="/auth/signin" className="pencil-link text-ink font-medium">
            Sign in
          </Link>
          .
        </p>
      }
      narrative={<SignupNarrative />}
    >
      <div className="space-y-3">
        {errorMessage ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-border-strong bg-peach-100/60 px-4 py-3 text-[13.5px] text-ink"
          >
            <AlertCircle className="w-4 h-4 mt-[2px] text-primary shrink-0" />
            <span className="leading-[1.45]">{errorMessage}</span>
          </div>
        ) : null}

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo });
          }}
        >
          <ProviderButton provider="google" variant="primary">
            Sign up with Google
          </ProviderButton>
        </form>

        <div className="flex items-center gap-4 py-1 text-[11px] uppercase tracking-[0.22em] text-ink/45">
          <span className="h-px flex-1 bg-border" />
          or sign up with
          <span className="h-px flex-1 bg-border" />
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("linkedin", { redirectTo });
          }}
        >
          <ProviderButton provider="linkedin">
            Sign up with LinkedIn
          </ProviderButton>
        </form>

        <form
          action={async () => {
            "use server";
            await signIn("github", { redirectTo });
          }}
        >
          <ProviderButton provider="github">Sign up with GitHub</ProviderButton>
        </form>

        <form
          action={async () => {
            "use server";
            await signIn("twitter", { redirectTo });
          }}
        >
          <ProviderButton provider="twitter">Sign up with X</ProviderButton>
        </form>

        <p className="pt-4 text-[12px] text-ink/55 leading-[1.55]">
          By creating an account you agree to our{" "}
          <Link href="/legal/terms" className="pencil-link text-ink">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/legal/privacy" className="pencil-link text-ink">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </AuthShell>
  );
}

function SignupNarrative() {
  const bullets = [
    "Compose once, publish to nine networks",
    "A calendar that actually breathes",
    "Logic Matrix replies to new followers while you sleep",
    "Your content, your analytics, fully exportable",
  ];

  return (
    <div className="relative max-w-[520px]">
      <p className="font-display text-[40px] xl:text-[52px] leading-[1.05] tracking-[-0.025em] text-ink font-normal">
        The calm
        <br />
        <span className="text-primary font-light italic">social media OS.</span>
      </p>
      <p className="mt-8 text-[15px] text-ink/75 leading-[1.6] max-w-[420px]">
        Built for creators, founders, and small teams who&apos;d rather be
        making the work than managing the posting of it. Set it up in five
        minutes.
      </p>

      <ul className="mt-10 space-y-3.5 text-[14px] text-ink/85">
        {bullets.map((t) => (
          <li key={t} className="flex items-start gap-3">
            <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            <span className="leading-[1.5]">{t}</span>
          </li>
        ))}
      </ul>

      <div className="mt-12 pt-8 border-t border-ink/10">
        <p className="font-display text-[18px] leading-[1.35] text-ink italic">
          &ldquo;The first tool that respects the fact I&apos;d rather write
          than schedule.&rdquo;
        </p>
        <p className="mt-3 text-[12px] uppercase tracking-[0.18em] text-ink/55">
          Maya Okonkwo — founder, Longhand
        </p>
      </div>
    </div>
  );
}
