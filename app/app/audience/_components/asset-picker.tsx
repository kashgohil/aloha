"use client";

// Reusable asset picker: shows current selection, opens a dialog to choose
// from the library or upload a new file. Used for avatar (square) and
// background (wide) slots on the audience page.

import { Dialog } from "@base-ui/react/dialog";
import {
  Check,
  Images,
  Loader2,
  Trash2,
  Upload,
  UploadCloud,
  X,
} from "lucide-react";
import { useEffect, useState, useTransition, type DragEvent } from "react";
import {
  type LibraryAsset,
  listLibraryAssets,
} from "@/app/actions/assets";
import { cn } from "@/lib/utils";
import { ImageCropModal } from "./image-crop-modal";

export type AssetRef = { id: string; url: string } | null;

export function AssetPicker({
  current,
  onChange,
  shape = "circle",
  label,
  emptyHint,
}: {
  current: AssetRef;
  onChange: (ref: AssetRef) => void | Promise<void>;
  shape?: "circle" | "rect";
  label: string;
  emptyHint?: string;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<LibraryAsset[] | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  // Image pending user crop/straighten. When non-null, the crop modal is
  // shown; the picker dialog stays open behind so the user can cancel back
  // to it.
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setItems(null);
    setLoadErr(null);
    listLibraryAssets()
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch((err) => {
        if (!cancelled)
          setLoadErr(
            err instanceof Error ? err.message : "Couldn't load library.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  function pick(ref: AssetRef) {
    startTransition(() => {
      void onChange(ref);
    });
    setOpen(false);
  }

  async function uploadBlob(blob: Blob, filename: string) {
    setUploading(true);
    setUploadErr(null);
    try {
      const file =
        blob instanceof File
          ? blob
          : new File([blob], filename, { type: blob.type || "image/png" });
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const body = (await res.json().catch(() => null)) as
        | { id?: string; url?: string; error?: string }
        | null;
      if (!res.ok || !body?.id || !body.url) {
        throw new Error(body?.error ?? "Upload failed.");
      }
      pick({ id: body.id, url: body.url });
    } catch (err) {
      setUploadErr(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  // Route any file (upload, drop) through the crop modal first, then upload
  // the cropped PNG. The browser reads the file into a data URL so the
  // cropper can display it without a network round-trip.
  async function stageFileForCrop(file: File) {
    setUploadErr(null);
    if (!file.type.startsWith("image/")) {
      setUploadErr("Only image files are supported.");
      return;
    }
    try {
      const dataUrl = await readAsDataUrl(file);
      setCropSrc(dataUrl);
    } catch {
      setUploadErr("Couldn't read that file.");
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await stageFileForCrop(file);
  }

  function stageUrlForCrop(url: string) {
    setUploadErr(null);
    setCropSrc(url);
  }

  async function handleCropConfirm(blob: Blob) {
    setCropSrc(null);
    await uploadBlob(blob, `crop-${Date.now()}.png`);
  }

  function handleTriggerDragEnter(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer?.types?.includes("Files")) setDragOver(true);
  }
  function handleTriggerDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }
  async function handleTriggerDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) await stageFileForCrop(file);
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {shape === "circle" ? (
        <Dialog.Trigger
          className="relative overflow-hidden border border-border-strong bg-peach-100 text-ink/60 hover:text-ink hover:border-ink transition-colors group w-20 h-20 rounded-full"
          aria-label={`Change ${label.toLowerCase()}`}
        >
          {current ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current.url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center">
              <div className="flex flex-col items-center gap-1">
                <Images className="w-4 h-4" />
                <span className="text-[10px] uppercase tracking-[0.18em]">
                  {label}
                </span>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/20 transition-colors" />
        </Dialog.Trigger>
      ) : (
        <div
          onDragEnter={handleTriggerDragEnter}
          onDragOver={handleTriggerDragEnter}
          onDragLeave={handleTriggerDragLeave}
          onDrop={handleTriggerDrop}
          className="w-full"
        >
          <Dialog.Trigger
            className={cn(
              "relative w-full rounded-2xl border-2 border-dashed bg-background-elev text-ink transition-colors overflow-hidden block text-left",
              dragOver
                ? "border-ink bg-peach-100/50"
                : "border-border-strong hover:border-ink hover:bg-peach-100/30",
            )}
            aria-label={`Change ${label.toLowerCase()}`}
          >
            {current ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={current.url}
                  alt=""
                  className="w-full h-32 object-cover"
                />
                <div className="absolute inset-0 flex items-end justify-between p-3 bg-gradient-to-t from-ink/50 via-transparent to-transparent">
                  <span className="text-[11.5px] font-medium text-background inline-flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    Change image
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-8 px-4 text-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full grid place-items-center transition-colors",
                    dragOver
                      ? "bg-ink text-background"
                      : "bg-peach-100 text-ink/70",
                  )}
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UploadCloud className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="text-[13px] font-medium text-ink">
                    {dragOver
                      ? "Drop to upload"
                      : uploading
                        ? "Uploading…"
                        : "Drag an image or click to upload"}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-ink/55">
                    {emptyHint ??
                      "JPG, PNG, WebP up to 5MB. Or pick from your library."}
                  </p>
                </div>
              </div>
            )}
          </Dialog.Trigger>
        </div>
      )}

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm data-starting-style:opacity-0 transition-opacity duration-200" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(720px,calc(100vw-2rem))] max-h-[min(680px,calc(100vh-2rem))] -translate-x-1/2 -translate-y-1/2 flex flex-col rounded-3xl border border-border bg-background-elev shadow-xl outline-none data-starting-style:opacity-0 data-starting-style:scale-95 transition-[opacity,transform] duration-200">
          <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border">
            <div>
              <Dialog.Title className="text-[15px] text-ink font-medium">
                Choose {label.toLowerCase()}
              </Dialog.Title>
              <Dialog.Description className="mt-0.5 text-[12.5px] text-ink/60">
                {emptyHint ?? "Pick from your library or upload something new."}
              </Dialog.Description>
            </div>
            <Dialog.Close className="p-1.5 rounded-full text-ink/55 hover:text-ink hover:bg-muted/60 transition-colors">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          <div className="flex items-center gap-2 px-6 py-3 border-b border-border bg-muted/30">
            <label className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-border-strong text-[13px] font-medium text-ink hover:border-ink transition-colors cursor-pointer">
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              {uploading ? "Uploading…" : "Upload new"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
            {current ? (
              <button
                type="button"
                onClick={() => pick(null)}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-border-strong text-[13px] font-medium text-ink/70 hover:text-ink hover:border-ink transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove current
              </button>
            ) : null}
            {uploadErr ? (
              <span className="text-[12px] text-primary-deep">{uploadErr}</span>
            ) : null}
          </div>

          <div className="flex-1 overflow-auto p-5">
            {loadErr ? (
              <p className="text-[13px] text-primary-deep">{loadErr}</p>
            ) : items === null ? (
              <div className="grid place-items-center py-12 text-ink/55">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <p className="text-[13px] text-ink/60 text-center py-12">
                Your library is empty. Upload an image to get started.
              </p>
            ) : (
              <ul className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {items
                  .filter((i) => i.mimeType.startsWith("image/"))
                  .map((a) => {
                    const active = current?.id === a.id;
                    return (
                      <li key={a.id}>
                        <button
                          type="button"
                          onClick={() => pick({ id: a.id, url: a.url })}
                          className={cn(
                            "relative block w-full aspect-square rounded-xl overflow-hidden border transition-colors",
                            active
                              ? "border-ink"
                              : "border-border hover:border-border-strong",
                          )}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={a.url}
                            alt={a.alt ?? ""}
                            className="w-full h-full object-cover"
                          />
                          {active ? (
                            <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-ink text-background grid place-items-center">
                              <Check className="w-3 h-3" />
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>

      <ImageCropModal
        open={cropSrc !== null}
        src={cropSrc}
        shape={shape}
        onCancel={() => setCropSrc(null)}
        onConfirm={handleCropConfirm}
      />
    </Dialog.Root>
  );
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("FileReader failed."));
    reader.readAsDataURL(file);
  });
}
