"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { joinWishlist } from "@/app/actions/wishlist";

export function WishlistForm() {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await joinWishlist(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setDone(true);
      }
    });
  };

  if (done) {
    return (
      <div className="flex items-center gap-3 text-[14.5px] text-ink/80">
        <span className="inline-grid place-items-center w-8 h-8 rounded-full bg-primary/15">
          <Check className="w-4 h-4 text-primary" strokeWidth={2.5} />
        </span>
        You're on the list. We'll reach out when beta spots open.
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          name="name"
          type="text"
          required
          placeholder="Your name"
          className="h-11 px-4 rounded-xl bg-background border border-border-strong text-[14px] text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink transition-colors"
        />
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="h-11 px-4 rounded-xl bg-background border border-border-strong text-[14px] text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink transition-colors"
        />
      </div>
      <textarea
        name="message"
        placeholder="What are you building? How many channels? (optional)"
        rows={3}
        className="w-full px-4 py-3 rounded-xl bg-background border border-border-strong text-[14px] text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink resize-none transition-colors"
      />
      {error ? (
        <p className="text-[13px] text-primary-deep">{error}</p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-ink text-background text-[13.5px] font-medium hover:bg-primary disabled:opacity-40 transition-colors"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ArrowRight className="w-4 h-4" />
        )}
        Join the wishlist
      </button>
    </form>
  );
}
