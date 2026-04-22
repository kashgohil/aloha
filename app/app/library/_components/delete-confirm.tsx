"use client";

import { Trash2 } from "lucide-react";
import { deleteGeneratedAssetAction } from "@/app/actions/assets";
import { ConfirmDeleteForm } from "@/components/ui/confirm-dialog";

export function DeleteAssetButton({ assetId }: { assetId: string }) {
  return (
    <ConfirmDeleteForm
      action={deleteGeneratedAssetAction}
      id={assetId}
      title="Delete this image?"
      description="The file and prompt will be removed."
      confirmText="Delete"
      toastMessages={{
        pending: "Deleting image…",
        success: "Image deleted.",
        error: "Couldn't delete image.",
      }}
      className="inline-flex items-center justify-center w-8 h-8 rounded-full text-ink/40 hover:text-primary-deep hover:bg-peach-100/60 transition-colors"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </ConfirmDeleteForm>
  );
}
