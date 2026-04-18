"use client";

import { Dialog } from "@base-ui/react/dialog";
import {
  ImagePlus,
  Lightbulb,
  Loader2,
  Plus,
  X as XIcon,
} from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { createIdeaAction } from "@/app/actions/ideas";
import type { PostMedia } from "@/db/schema";

const MAX_MEDIA = 4;

export function IdeaDialog({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [url, setUrl] = useState("");
  const [media, setMedia] = useState<PostMedia[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const reset = () => {
    setBody("");
    setTitle("");
    setTags("");
    setUrl("");
    setMedia([]);
    setError(null);
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = MAX_MEDIA - media.length;
    const toUpload = Array.from(files).slice(0, remaining);
    if (toUpload.length === 0) return;
    setError(null);
    setIsUploading(true);
    try {
      const uploaded: PostMedia[] = [];
      for (const file of toUpload) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(body?.error ?? `Upload failed (${res.status})`);
        }
        const json = (await res.json()) as { url: string; mimeType: string };
        uploaded.push({ url: json.url, mimeType: json.mimeType });
      }
      setMedia((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeMedia = (u: string) =>
    setMedia((prev) => prev.filter((m) => m.url !== u));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!body.trim()) {
      setError("Write something first.");
      return;
    }
    const fd = new FormData();
    fd.set("body", body);
    fd.set("title", title);
    fd.set("tags", tags);
    fd.set("url", url);
    if (media.length > 0) fd.set("media", JSON.stringify(media));
    startSaving(async () => {
      try {
        await createIdeaAction(fd);
        reset();
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save.");
      }
    });
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <Dialog.Trigger
        render={
          children ? undefined : (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-ink text-background text-[13.5px] font-medium hover:bg-primary transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add idea
            </button>
          )
        }
      >
        {children}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm data-[starting-style]:opacity-0 transition-opacity duration-200" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-background-elev p-6 shadow-xl outline-none data-[starting-style]:opacity-0 data-[starting-style]:scale-95 transition-[opacity,transform] duration-200">
          <div className="flex items-start gap-3">
            <span className="mt-[2px] w-9 h-9 rounded-full bg-peach-100 border border-peach-300 grid place-items-center shrink-0">
              <Lightbulb className="w-4 h-4 text-ink" />
            </span>
            <div className="flex-1">
              <Dialog.Title className="text-[15px] text-ink font-medium">
                Capture an idea
              </Dialog.Title>
              <Dialog.Description className="mt-0.5 text-[12.5px] text-ink/60 leading-[1.5]">
                A hook, a story, a link, an observation — drop it in raw.
              </Dialog.Description>
            </div>
            <Dialog.Close
              className="inline-flex items-center justify-center w-8 h-8 rounded-full text-ink/50 hover:text-ink hover:bg-muted/60 transition-colors"
              aria-label="Close"
            >
              <XIcon className="w-4 h-4" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
            <textarea
              name="body"
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="The thought. Keep it rough — you can polish in the composer."
              className="w-full min-h-[110px] rounded-2xl border border-border bg-background px-4 py-3 text-[13.5px] text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink resize-y"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                name="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title (optional)"
                className="h-10 px-3.5 rounded-full border border-border bg-background text-[13px] text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink"
              />
              <input
                name="tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Tags, comma-separated"
                className="h-10 px-3.5 rounded-full border border-border bg-background text-[13px] text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink"
              />
            </div>

            <input
              name="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Related URL (optional)"
              className="w-full h-10 px-3.5 rounded-full border border-border bg-background text-[13px] text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink"
            />

            {media.length > 0 ? (
              <ul className="grid grid-cols-4 gap-2">
                {media.map((m) => (
                  <li
                    key={m.url}
                    className="relative aspect-square rounded-xl overflow-hidden border border-border bg-background"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeMedia(m.url)}
                      aria-label="Remove"
                      className="absolute top-1 right-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-ink/75 text-background hover:bg-ink transition-colors"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              hidden
              onChange={(e) => handleFilesSelected(e.target.files)}
            />

            {error ? (
              <p className="text-[12.5px] text-primary-deep">{error}</p>
            ) : null}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || media.length >= MAX_MEDIA}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-border-strong bg-background text-[12.5px] text-ink hover:bg-muted/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ImagePlus className="w-3.5 h-3.5" />
                )}
                {media.length >= MAX_MEDIA
                  ? `Up to ${MAX_MEDIA} images`
                  : "Attach image"}
              </button>

              <div className="ml-auto flex items-center gap-2">
                <Dialog.Close className="inline-flex items-center h-10 px-4 rounded-full text-[13px] text-ink/70 hover:text-ink transition-colors">
                  Cancel
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={isSaving || isUploading || !body.trim()}
                  className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-ink text-background text-[13.5px] font-medium hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Save idea
                </button>
              </div>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
