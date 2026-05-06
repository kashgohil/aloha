"use client";

import { Dialog } from "@base-ui/react/dialog";
import {
  ImagePlus,
  Link2,
  Loader2,
  PenLine,
  Plus,
  Tag,
  X as XIcon,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { createIdeaAction, updateIdeaAction } from "@/app/actions/ideas";
import type { PostMedia } from "@/db/schema";
import { RichEditor } from "@/components/ui/rich-editor";

const MAX_MEDIA = 4;

function splitTags(input: string): string[] {
  return input
    .split(",")
    .map((s) => s.trim().replace(/^#/, ""))
    .filter(Boolean);
}

export type IdeaPanelInitial = {
  id: string;
  body: string;
  title: string | null;
  tags: string[];
  sourceUrl: string | null;
  media: PostMedia[] | null;
};

export function IdeaPanel({
  children,
  idea,
}: {
  children?: React.ReactNode;
  idea?: IdeaPanelInitial;
}) {
  const isEdit = !!idea;
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState(idea?.body ?? "");
  const [title, setTitle] = useState(idea?.title ?? "");
  const [tagList, setTagList] = useState<string[]>(idea?.tags ?? []);
  const [tagDraft, setTagDraft] = useState("");
  const [url, setUrl] = useState(idea?.sourceUrl ?? "");
  const [media, setMedia] = useState<PostMedia[]>(idea?.media ?? []);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const reset = () => {
    setBody(idea?.body ?? "");
    setTitle(idea?.title ?? "");
    setTagList(idea?.tags ?? []);
    setTagDraft("");
    setUrl(idea?.sourceUrl ?? "");
    setMedia(idea?.media ?? []);
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
          const payload = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(payload?.error ?? `Upload failed (${res.status})`);
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
    const finalTags = tagDraft.trim()
      ? [...tagList, ...splitTags(tagDraft)]
      : tagList;
    fd.set("body", body);
    fd.set("title", title);
    fd.set("tags", finalTags.join(", "));
    fd.set("url", url);
    if (media.length > 0) fd.set("media", JSON.stringify(media));
    if (isEdit && idea) fd.set("id", idea.id);
    startSaving(async () => {
      try {
        if (isEdit) {
          await updateIdeaAction(fd);
        } else {
          await createIdeaAction(fd);
        }
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
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-transparent" />
        <Dialog.Popup
          className="fixed right-0 top-0 z-50 h-dvh w-[min(720px,50vw)] max-w-full min-w-[min(100vw,480px)] flex flex-col bg-background-elev border-l border-border shadow-2xl outline-none data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full transition-transform duration-250 ease-out"
          initialFocus={false}
        >
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <header className="flex items-center justify-between gap-3 px-6 py-4 border-b border-border">
              <div className="min-w-0 flex-1">
                <Dialog.Title className="text-[13px] text-ink/55 font-medium">
                  {isEdit ? "Edit idea" : "New idea"}
                </Dialog.Title>
                <input
                  name="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Untitled"
                  className="mt-1 w-full bg-transparent text-[22px] font-semibold text-ink placeholder:text-ink/30 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {isEdit && idea ? (
                  <Link
                    href={`?compose=new&idea=${idea.id}`}
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-border bg-background text-[13px] font-medium text-ink hover:border-ink transition-colors"
                  >
                    <PenLine className="w-3.5 h-3.5" />
                    Draft post
                  </Link>
                ) : null}
                <button
                  type="submit"
                  disabled={isSaving || isUploading || !body.trim()}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : null}
                  {isEdit ? "Save" : "Create"}
                </button>
                <Dialog.Close
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full text-ink/50 hover:text-ink hover:bg-muted/60 transition-colors"
                  aria-label="Close"
                >
                  <XIcon className="w-4 h-4" />
                </Dialog.Close>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-[13px]">
                <span className="inline-flex items-center gap-1.5 text-ink/55 h-9">
                  <Tag className="w-3.5 h-3.5" />
                  Tags
                </span>
                <div className="min-h-9 flex flex-wrap items-center gap-1.5 py-1">
                  {tagList.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 h-6 pl-2 pr-1 rounded-full bg-peach-100 border border-border text-[11.5px] text-ink/75"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() =>
                          setTagList((prev) => prev.filter((x) => x !== t))
                        }
                        aria-label={`Remove ${t}`}
                        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-ink/55 hover:text-ink hover:bg-ink/10 transition-colors"
                      >
                        <XIcon className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagDraft}
                    onChange={(e) => setTagDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        const next = splitTags(tagDraft);
                        if (next.length === 0) return;
                        setTagList((prev) =>
                          Array.from(new Set([...prev, ...next])).slice(0, 8),
                        );
                        setTagDraft("");
                      } else if (
                        e.key === "Backspace" &&
                        tagDraft === "" &&
                        tagList.length > 0
                      ) {
                        setTagList((prev) => prev.slice(0, -1));
                      }
                    }}
                    onBlur={() => {
                      const next = splitTags(tagDraft);
                      if (next.length === 0) return;
                      setTagList((prev) =>
                        Array.from(new Set([...prev, ...next])).slice(0, 8),
                      );
                      setTagDraft("");
                    }}
                    placeholder={
                      tagList.length === 0 ? "Add tag, press Enter" : ""
                    }
                    className="flex-1 min-w-[120px] h-7 bg-transparent text-[13px] text-ink placeholder:text-ink/35 focus:outline-none"
                  />
                </div>
                <span className="inline-flex items-center gap-1.5 text-ink/55 h-9">
                  <Link2 className="w-3.5 h-3.5" />
                  Link
                </span>
                <input
                  name="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://"
                  className="h-9 px-0 bg-transparent text-ink placeholder:text-ink/35 focus:outline-none"
                />
              </div>

              <div className="border-t border-border pt-5">
                <RichEditor
                  value={body}
                  onChange={setBody}
                  placeholder="Start writing. Select text for formatting."
                  autofocus={!isEdit}
                />
              </div>

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
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              hidden
              onChange={(e) => handleFilesSelected(e.target.files)}
            />

            <footer className="flex items-center gap-3 px-6 py-3 border-t border-border bg-background/60">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || media.length >= MAX_MEDIA}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-border-strong bg-background text-[12px] text-ink hover:bg-muted/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              {error ? (
                <p className="text-[12.5px] text-primary-deep ml-auto">
                  {error}
                </p>
              ) : null}
            </footer>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
