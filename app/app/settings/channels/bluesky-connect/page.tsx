"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { connectBluesky } from "../../actions";
import { BlueskyIcon } from "@/app/auth/_components/provider-icons";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-ink text-background font-medium text-[14px] hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Connecting...
        </>
      ) : (
        "Connect Bluesky"
      )}
    </button>
  );
}

export default function BlueskyConnectPage() {
  const [state, formAction] = useActionState(connectBluesky, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-8">
        <Link
          href="/app/settings/channels"
          className="inline-flex items-center gap-1.5 text-[13px] text-ink/60 hover:text-ink transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to channels
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-primary-soft border border-primary/20 grid place-items-center">
            <BlueskyIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display text-[26px] leading-[1.1] tracking-[-0.02em] text-ink">
              Connect Bluesky
            </h1>
            <p className="text-[13px] text-ink/60 mt-0.5">
              Enter your Bluesky credentials
            </p>
          </div>
        </div>
      </div>

      <form action={formAction} className="space-y-5">
        {state?.error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[13.5px] font-medium text-red-800">
                {state.error}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor="handle"
            className="block text-[13px] font-medium text-ink"
          >
            Bluesky handle
          </label>
          <input
            id="handle"
            name="handle"
            type="text"
            autoComplete="username"
            placeholder="yourname.bsky.social"
            required
            className="w-full h-11 px-4 rounded-xl border border-border bg-background text-[14px] text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
          <p className="text-[11.5px] text-ink/50">
            Usually <code className="text-[11px]">yourname.bsky.social</code>
          </p>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="appPassword"
            className="block text-[13px] font-medium text-ink"
          >
            App password
          </label>
          <div className="relative">
            <input
              id="appPassword"
              name="appPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="xxxx-xxxx-xxxx-xxxx"
              required
              className="w-full h-11 px-4 pr-12 rounded-xl border border-border bg-background text-[14px] text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-[11.5px] text-ink/50">
            Generate one at{" "}
            <a
              href="https://bsky.app/settings/app-passwords"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              bsky.app/settings/app-passwords
            </a>
          </p>
        </div>

        <div className="pt-2">
          <SubmitButton />
        </div>
      </form>

      <div className="mt-8 p-4 rounded-xl border border-dashed border-border-strong">
        <h3 className="text-[13px] font-medium text-ink mb-2">
          Why do I need an app password?
        </h3>
        <p className="text-[12.5px] text-ink/60 leading-relaxed">
          Bluesky uses app passwords instead of OAuth for third-party apps. These
          are one-time passwords you generate in your Bluesky settings. You can
          revoke them anytime without affecting your main password.
        </p>
      </div>
    </div>
  );
}
