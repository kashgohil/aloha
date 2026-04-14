"use client";

import { AlertCircle, Mail } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import {
  type AuthFormState,
  signinWithPassword,
  signupWithPassword,
} from "../actions";

const INITIAL: AuthFormState = { error: null, info: null };

type Mode = "signin" | "signup";

export function CredentialsForm({
  mode,
  redirectTo,
}: {
  mode: Mode;
  redirectTo: string;
}) {
  const action = mode === "signin" ? signinWithPassword : signupWithPassword;
  const [state, formAction] = useActionState(action, INITIAL);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      {state.error ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-border-strong bg-peach-100/60 px-4 py-3 text-[13.5px] text-ink"
        >
          <AlertCircle className="w-4 h-4 mt-[2px] text-primary shrink-0" />
          <span className="leading-[1.45]">{state.error}</span>
        </div>
      ) : null}

      {state.info ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-border-strong bg-peach-100/60 px-4 py-3 text-[13.5px] text-ink"
        >
          <Mail className="w-4 h-4 mt-[2px] text-primary shrink-0" />
          <span className="leading-[1.45]">{state.info}</span>
        </div>
      ) : null}

      {mode === "signup" ? (
        <Field
          label="Name"
          name="name"
          type="text"
          autoComplete="name"
          required
        />
      ) : null}

      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
      />

      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete={mode === "signin" ? "current-password" : "new-password"}
        minLength={mode === "signup" ? 8 : undefined}
        required
        hint={mode === "signup" ? "At least 8 characters." : undefined}
      />

      <SubmitButton mode={mode} />
    </form>
  );
}

function Field({
  label,
  name,
  type,
  autoComplete,
  required,
  minLength,
  hint,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  hint?: string;
}) {
  const id = `cred-${name}`;
  return (
    <div>
      <label
        htmlFor={id}
        className="block mb-1.5 text-[12px] font-medium uppercase tracking-[0.14em] text-ink/65"
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        className="w-full h-11 px-4 rounded-xl bg-background border border-border-strong text-[14px] text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink transition-colors"
      />
      {hint ? (
        <p className="mt-1.5 text-[12px] text-ink/55">{hint}</p>
      ) : null}
    </div>
  );
}

function SubmitButton({ mode }: { mode: Mode }) {
  const { pending } = useFormStatus();
  const label =
    mode === "signin"
      ? pending
        ? "Signing in…"
        : "Sign in"
      : pending
        ? "Creating workspace…"
        : "Create workspace";

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "w-full h-12 px-5 inline-flex items-center justify-center rounded-full text-[14px] font-medium transition-colors",
        "bg-ink text-background hover:bg-primary",
        pending && "opacity-70 cursor-not-allowed",
      )}
    >
      {label}
    </button>
  );
}
