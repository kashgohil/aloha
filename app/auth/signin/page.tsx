import { signIn } from "@/auth";
import { AlertCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "../_components/auth-shell";
import { ProviderButton } from "../_components/provider-button";

export const metadata: Metadata = {
	title: "Sign in — Aloha",
	description: "Sign in to your Aloha workspace.",
};

const ERROR_MESSAGES: Record<string, string> = {
	OAuthAccountNotLinked:
		"This email is already linked to a different sign-in method. Use the provider you signed up with.",
	AccessDenied: "Access denied. Try again, or use a different account.",
	Verification: "That sign-in link has expired. Request a new one.",
	Configuration:
		"We hit a configuration issue on our end. Please try again in a moment.",
	default: "Something went wrong. Please try again.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (v: string | string[] | undefined) =>
	Array.isArray(v) ? v[0] : v;

export default async function SignInPage({
	searchParams,
}: {
	searchParams: SearchParams;
}) {
	const params = await searchParams;
	const callbackUrl = first(params.callbackUrl);
	const error = first(params.error);

	// Only allow same-origin relative paths. Anything else falls back.
	const redirectTo =
		callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
			? callbackUrl
			: "/app/dashboard";

	const errorMessage = error
		? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.default)
		: null;

	return (
		<AuthShell
			eyebrow="Welcome back"
			title={
				<>
					Sign in to your
					<br />
					<span className="text-primary font-light">workspace.</span>
				</>
			}
			subtitle="Pick the account you signed up with. We don't email you marketing and we don't sell your data."
			footer={
				<p>
					New to Aloha?{" "}
					<Link
						href="/auth/signup"
						className="pencil-link text-ink font-medium"
					>
						Create a workspace
					</Link>
					.
				</p>
			}
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
					<ProviderButton provider="google" variant="primary" />
				</form>

				<div className="flex items-center gap-4 py-1 text-[11px] uppercase tracking-[0.22em] text-ink/45">
					<span className="h-px flex-1 bg-border" />
					or continue with
					<span className="h-px flex-1 bg-border" />
				</div>

				<form
					action={async () => {
						"use server";
						await signIn("linkedin", { redirectTo });
					}}
				>
					<ProviderButton provider="linkedin" />
				</form>

				<form
					action={async () => {
						"use server";
						await signIn("github", { redirectTo });
					}}
				>
					<ProviderButton provider="github" />
				</form>

				<form
					action={async () => {
						"use server";
						await signIn("twitter", { redirectTo });
					}}
				>
					<ProviderButton provider="twitter" />
				</form>

				<p className="pt-4 text-[12px] text-ink/55 leading-[1.55]">
					By continuing you agree to our{" "}
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
