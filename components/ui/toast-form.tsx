"use client";

import type { ReactNode } from "react";
import { toast } from "sonner";

type Props<T> = {
  action: (formData: FormData) => Promise<T>;
  // Static fallback message. If the action's result is an object with a
  // `message` string (e.g. `{ message: "Page created." }`), that wins —
  // lets the server pick the message without passing a non-serializable
  // closure through the RSC boundary.
  success: string;
  className?: string;
  children: ReactNode;
};

export function ToastForm<T>({ action, success, className, children }: Props<T>) {
  async function handle(formData: FormData) {
    try {
      const result = await action(formData);
      const fromResult =
        result && typeof result === "object" && "message" in result
          ? (result as { message?: unknown }).message
          : undefined;
      toast.success(typeof fromResult === "string" ? fromResult : success);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <form action={handle} className={className}>
      {children}
    </form>
  );
}
