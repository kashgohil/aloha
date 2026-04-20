"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

export type FlashEntry = {
  /** Query param name to look for. */
  param: string;
  /** Param value that triggers the toast. If omitted, any non-empty value matches. */
  value?: string;
  type: "success" | "error" | "info";
  message: string;
};

/**
 * Fires a sonner toast when a redirect lands with a matching query param,
 * then strips that param from the URL so a refresh won't re-fire it.
 *
 * Pass one or more entries to map ?foo=bar redirects to toast calls.
 */
export function FlashToast({ entries }: { entries: FlashEntry[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    const hits: string[] = [];
    for (const entry of entries) {
      const current = params.get(entry.param);
      if (current === null) continue;
      if (entry.value !== undefined && current !== entry.value) continue;
      toast[entry.type](entry.message);
      hits.push(entry.param);
    }
    if (hits.length === 0) return;
    fired.current = true;
    const next = new URLSearchParams(params.toString());
    for (const key of hits) next.delete(key);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [entries, params, pathname, router]);

  return null;
}
