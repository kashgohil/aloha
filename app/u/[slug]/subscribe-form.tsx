"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { subscribe } from "@/app/actions/audience";

export default function SubscribeForm({ userId }: { userId: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError(null);
    startTransition(async () => {
      const result = await subscribe({ email, userId });
      if (result.success) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
        setError(result.error ?? "Something went wrong. Please try again.");
      }
    });
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center text-center gap-3 py-2">
        <span className="w-10 h-10 rounded-full bg-ink text-background grid place-items-center">
          <Check className="w-4 h-4" />
        </span>
        <p className="font-display text-[20px] leading-[1.2] tracking-[-0.01em] text-ink">
          You&apos;re on the list.
        </p>
        <p className="text-[12.5px] text-ink/60 leading-[1.5] max-w-[280px]">
          Thanks for subscribing. We&apos;ll only reach out when there&apos;s
          something worth sharing.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5">
      <label htmlFor="subscribe-email" className="sr-only">
        Email
      </label>
      <input
        id="subscribe-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
        autoComplete="email"
        className="w-full h-12 px-4 rounded-full bg-background border border-border-strong text-[14px] text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink transition-colors"
      />
      <button
        type="submit"
        disabled={isPending || !email}
        className="w-full inline-flex items-center justify-center gap-1.5 h-12 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary disabled:opacity-40 disabled:hover:bg-ink transition-colors"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            Subscribe
            <ArrowRight className="w-3.5 h-3.5" />
          </>
        )}
      </button>
      {status === "error" && error ? (
        <p className="text-[12px] text-primary-deep text-center leading-[1.45]">
          {error}
        </p>
      ) : null}
    </form>
  );
}
