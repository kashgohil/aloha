"use client";

import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  pendingLabel?: string;
  children: ReactNode;
};

/**
 * Submit button that auto-disables and shows a spinner while the parent
 * <form>'s server action is pending. Use inside a server-action <form>.
 */
export function PendingSubmitButton({
  className,
  pendingLabel,
  disabled,
  children,
  ...rest
}: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={cn("disabled:opacity-60", className)}
      {...rest}
    >
      {pending ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          {pendingLabel ?? "Saving…"}
        </>
      ) : (
        children
      )}
    </button>
  );
}
