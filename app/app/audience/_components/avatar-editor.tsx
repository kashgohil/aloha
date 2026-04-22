"use client";

import { useOptimistic, useTransition } from "react";
import { setAvatarAsset } from "@/app/actions/audience";
import { AssetPicker, type AssetRef } from "./asset-picker";

export function AvatarEditor({ initial }: { initial: AssetRef }) {
  const [optimistic, setOptimistic] = useOptimistic<AssetRef, AssetRef>(
    initial,
    (_, next) => next,
  );
  const [, startTransition] = useTransition();

  function handleChange(ref: AssetRef) {
    startTransition(() => {
      setOptimistic(ref);
      setAvatarAsset(ref?.id ?? null).catch(() => {
        // Optimistic state resets on next server render; nothing to do.
      });
    });
  }

  return (
    <AssetPicker
      current={optimistic}
      onChange={handleChange}
      shape="circle"
      label="Avatar"
      emptyHint="A square image reads best at small sizes — 400×400 or larger."
    />
  );
}
