"use client";

import type { ReactNode } from "react";
import { toast } from "sonner";

type Props<T> = {
  action: (formData: FormData) => Promise<T>;
  success: string | ((result: T) => string);
  className?: string;
  children: ReactNode;
};

export function ToastForm<T>({ action, success, className, children }: Props<T>) {
  async function handle(formData: FormData) {
    try {
      const result = await action(formData);
      toast.success(typeof success === "function" ? success(result) : success);
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
