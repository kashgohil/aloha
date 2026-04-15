"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CalendarClock,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  Plug,
  RotateCcw,
  Send,
  Sparkles,
  X as XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { refineContent } from "@/app/actions/ai";
import { saveDraft, schedulePost } from "@/app/actions/posts";
import type { ChannelOverride, PostMedia } from "@/db/schema";
import {
  BlueskyIcon,
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  TikTokIcon,
  ThreadsIcon,
  XIcon as XBrandIcon,
} from "@/app/auth/_components/provider-icons";
import { PreviewCard } from "./preview-card";

const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  twitter: XBrandIcon,
  linkedin: LinkedInIcon,
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  tiktok: TikTokIcon,
  threads: ThreadsIcon,
  bluesky: BlueskyIcon,
};

const MAX_MEDIA = 4;

type Author = {
  name: string;
  email: string;
  image: string | null;
  workspaceName: string | null;
  timezone: string;
};

export type Platform = {
  id: string;
  name: string;
  handle: string;
  limit: number;
  accent: string;
};

const PLATFORMS: Platform[] = [
  { id: "twitter", name: "X", handle: "@handle", limit: 280, accent: "bg-ink text-background" },
  { id: "linkedin", name: "LinkedIn", handle: "in/handle", limit: 3000, accent: "bg-[#0a66c2] text-white" },
  { id: "instagram", name: "Instagram", handle: "@handle", limit: 2200, accent: "bg-gradient-to-tr from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white" },
  { id: "facebook", name: "Facebook", handle: "/handle", limit: 5000, accent: "bg-[#1877f2] text-white" },
  { id: "tiktok", name: "TikTok", handle: "@handle", limit: 2200, accent: "bg-ink text-background" },
  { id: "threads", name: "Threads", handle: "@handle", limit: 500, accent: "bg-ink text-background" },
  { id: "bluesky", name: "Bluesky", handle: "@handle", limit: 300, accent: "bg-[#0085ff] text-white" },
];

type TabId = "all" | string;

export function Composer({
  author,
  connectedProviders,
}: {
  author: Author;
  connectedProviders: string[];
}) {
  const router = useRouter();
  const [baseContent, setBaseContent] = useState("");
  const [baseMedia, setBaseMedia] = useState<PostMedia[]>([]);
  const [overrides, setOverrides] = useState<Record<string, ChannelOverride>>({});
  const [selected, setSelected] = useState<string[]>(
    connectedProviders.length > 0 ? [connectedProviders[0]] : ["twitter"],
  );
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [scheduledAt, setScheduledAt] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRefining, startRefining] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const [isPublishing, startPublishing] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // If the active tab's platform gets deselected, fall back to "all".
  useEffect(() => {
    if (activeTab !== "all" && !selected.includes(activeTab)) {
      setActiveTab("all");
    }
  }, [activeTab, selected]);

  const selectedPlatforms = PLATFORMS.filter((p) => selected.includes(p.id));
  const activePlatform =
    activeTab === "all" ? null : PLATFORMS.find((p) => p.id === activeTab) ?? null;

  const effectiveContent = (platformId: string): string =>
    overrides[platformId]?.content ?? baseContent;

  const isOverridden = (platformId: string): boolean =>
    typeof overrides[platformId]?.content === "string";

  const editorValue =
    activeTab === "all" ? baseContent : effectiveContent(activeTab);

  const activeLimit = activePlatform
    ? activePlatform.limit
    : selectedPlatforms.length > 0
      ? Math.min(...selectedPlatforms.map((p) => p.limit))
      : Number.POSITIVE_INFINITY;

  // Validate every selected channel's effective content — a too-long override
  // on a background tab still blocks publish.
  const perPlatformOverflow = selectedPlatforms
    .map((p) => ({ platform: p, over: effectiveContent(p.id).length > p.limit }))
    .filter((x) => x.over);

  const overLimit = perPlatformOverflow.length > 0;
  const hasBody =
    baseContent.trim().length > 0 ||
    baseMedia.length > 0 ||
    selectedPlatforms.some(
      (p) => (overrides[p.id]?.content ?? "").trim().length > 0,
    );
  const canSubmit =
    hasBody && selected.length > 0 && !overLimit && !isUploading;

  const handleEditorChange = (value: string) => {
    if (activeTab === "all") {
      setBaseContent(value);
    } else {
      setOverrides((prev) => ({
        ...prev,
        [activeTab]: { ...prev[activeTab], content: value },
      }));
    }
  };

  const handleResetOverride = (platformId: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      const entry = { ...next[platformId] };
      delete entry.content;
      if (entry.media === undefined) {
        delete next[platformId];
      } else {
        next[platformId] = entry;
      }
      return next;
    });
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = MAX_MEDIA - baseMedia.length;
    const toUpload = Array.from(files).slice(0, remaining);
    if (toUpload.length === 0) return;
    setFormError(null);
    setIsUploading(true);
    try {
      const uploaded: PostMedia[] = [];
      for (const file of toUpload) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(body?.error ?? `Upload failed (${res.status})`);
        }
        const json = (await res.json()) as { url: string; mimeType: string };
        uploaded.push({ url: json.url, mimeType: json.mimeType });
      }
      setBaseMedia((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeMedia = (url: string) =>
    setBaseMedia((prev) => prev.filter((m) => m.url !== url));

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );

  const handleRefine = () => {
    if (!editorValue.trim()) return;
    setFormError(null);
    startRefining(async () => {
      try {
        const context = activePlatform?.id ?? selected[0] ?? "general";
        const refined = await refineContent(editorValue, context);
        handleEditorChange(refined);
      } catch {
        setFormError("Refine failed. Try again in a moment.");
      }
    });
  };

  const buildPayload = () => ({
    content: baseContent,
    platforms: selected,
    media: baseMedia,
    channelContent: overrides,
  });

  const handleSaveDraft = () => {
    if (!canSubmit) return;
    setFormError(null);
    startSaving(async () => {
      try {
        await saveDraft(buildPayload());
        router.push("/app/dashboard");
      } catch {
        setFormError("Couldn't save draft. Please try again.");
      }
    });
  };

  const handleSchedule = () => {
    if (!canSubmit || !scheduledAt) return;
    setFormError(null);
    startPublishing(async () => {
      try {
        await schedulePost({
          ...buildPayload(),
          scheduledAt: new Date(scheduledAt),
        });
        router.push("/app/dashboard");
      } catch {
        setFormError("Couldn't schedule. Check the time and try again.");
      }
    });
  };

  const handlePublishNow = () => {
    if (!canSubmit) return;
    setFormError(null);
    startPublishing(async () => {
      try {
        await schedulePost({ ...buildPayload(), scheduledAt: new Date() });
        router.push("/app/dashboard");
      } catch {
        setFormError("Couldn't publish. Please try again.");
      }
    });
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            New post · {author.workspaceName ?? "Workspace"}
          </p>
          <h1 className="mt-3 font-display text-[44px] lg:text-[52px] leading-[1.02] tracking-[-0.03em] text-ink font-normal">
            Compose
            <span className="text-primary font-light italic"> your next one.</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={!canSubmit || isSaving}
            className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full border border-border-strong text-[14px] font-medium text-ink hover:border-ink disabled:opacity-40 disabled:hover:border-border-strong transition-colors"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
            Save draft
          </button>

          <SchedulePopover
            scheduledAt={scheduledAt}
            setScheduledAt={setScheduledAt}
            open={showSchedule}
            setOpen={setShowSchedule}
            onConfirm={handleSchedule}
            disabled={!canSubmit || isPublishing}
            busy={isPublishing && scheduledAt !== ""}
            timezone={author.timezone}
          />

          <button
            type="button"
            onClick={handlePublishNow}
            disabled={!canSubmit || isPublishing}
            className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary disabled:opacity-40 disabled:hover:bg-ink transition-colors"
          >
            {isPublishing && !scheduledAt ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Publish
          </button>
        </div>
      </header>

      {formError ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-border-strong bg-peach-100/60 px-4 py-3 text-[13.5px] text-ink"
        >
          <AlertCircle className="w-4 h-4 mt-[2px] text-primary shrink-0" />
          <span className="leading-[1.5]">{formError}</span>
        </div>
      ) : null}

      {/* Channel chips */}
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-3">
          Publish to
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PLATFORMS.map((p) => {
            const isSelected = selected.includes(p.id);
            const Icon = PLATFORM_ICONS[p.id];
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p.id)}
                aria-pressed={isSelected}
                className={cn(
                  "inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full border text-[12px] font-medium transition-colors",
                  isSelected
                    ? "bg-peach-100 text-ink border-border"
                    : "bg-background-elev text-ink/70 border-border-strong hover:border-ink hover:text-ink",
                )}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {p.name}
              </button>
            );
          })}
        </div>
        {connectedProviders.length === 0 ? (
          <p className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-ink/55">
            <Plug className="w-3.5 h-3.5" />
            No channels connected yet. You can still draft and schedule —
            connect from Settings to go live.
          </p>
        ) : null}
      </section>

      {/* Main grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Editor */}
        <div className="lg:col-span-7">
          {/* Tab strip */}
          <div
            role="tablist"
            aria-label="Content scope"
            className="flex flex-wrap items-center gap-1 mb-3"
          >
            <TabButton
              active={activeTab === "all"}
              onClick={() => setActiveTab("all")}
            >
              All channels
            </TabButton>
            {selectedPlatforms.map((p) => {
              const Icon = PLATFORM_ICONS[p.id];
              const over = effectiveContent(p.id).length > p.limit;
              return (
                <TabButton
                  key={p.id}
                  active={activeTab === p.id}
                  onClick={() => setActiveTab(p.id)}
                  dot={isOverridden(p.id)}
                  warn={over}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  {p.name}
                </TabButton>
              );
            })}
          </div>

          <div className="rounded-3xl border border-border bg-background-elev overflow-hidden">
            {activePlatform ? (
              <div className="flex items-center justify-between gap-3 px-5 pt-4 text-[12px] text-ink/60">
                <span>
                  {isOverridden(activePlatform.id)
                    ? `Customized for ${activePlatform.name}.`
                    : `Inheriting from all channels. Edit to customize for ${activePlatform.name}.`}
                </span>
                {isOverridden(activePlatform.id) ? (
                  <button
                    type="button"
                    onClick={() => handleResetOverride(activePlatform.id)}
                    className="inline-flex items-center gap-1 text-[12px] text-ink/70 hover:text-ink transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset to base
                  </button>
                ) : null}
              </div>
            ) : null}

            <textarea
              value={editorValue}
              onChange={(e) => handleEditorChange(e.target.value)}
              placeholder={
                activePlatform
                  ? `Write a version tailored for ${activePlatform.name}…`
                  : "Write something worth showing up for…"
              }
              className="w-full min-h-[340px] p-7 lg:p-8 bg-transparent focus:outline-none resize-none text-[17px] leading-[1.6] text-ink placeholder:text-ink/35 font-sans"
              aria-label="Post content"
            />

            {baseMedia.length > 0 ? (
              <div className="px-5 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {baseMedia.map((m) => (
                  <div
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
                      aria-label="Remove image"
                      className="absolute top-1.5 right-1.5 w-6 h-6 inline-flex items-center justify-center rounded-full bg-ink/80 text-background hover:bg-ink transition-colors"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-4 px-5 py-3 border-t border-border">
              <div className="flex items-center gap-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  hidden
                  onChange={(e) => handleFilesSelected(e.target.files)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || baseMedia.length >= MAX_MEDIA}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full text-ink/60 hover:text-ink hover:bg-muted/60 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                  aria-label="Attach image"
                  title={
                    baseMedia.length >= MAX_MEDIA
                      ? `Up to ${MAX_MEDIA} images`
                      : "Attach image"
                  }
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ImageIcon className="w-4 h-4" />
                  )}
                </button>
                <div className="w-px h-5 bg-border mx-2" />
                <CharCounter
                  length={editorValue.length}
                  limit={activeLimit}
                  tightestPlatforms={
                    activePlatform
                      ? editorValue.length > activeLimit
                        ? [activePlatform.name]
                        : []
                      : perPlatformOverflow.map((x) => x.platform.name)
                  }
                />
              </div>
              <button
                type="button"
                onClick={handleRefine}
                disabled={isRefining || !editorValue.trim()}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-border-strong text-[12.5px] font-medium text-ink hover:border-ink disabled:opacity-40 disabled:hover:border-border-strong transition-colors"
              >
                {isRefining ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                )}
                Refine
              </button>
            </div>
          </div>

          <p className="mt-4 text-[12px] text-ink/50 leading-[1.5]">
            {activePlatform
              ? "Changes here only affect this channel. Switch to All channels to edit the shared copy."
              : "Tip: write once for everyone, then open a channel tab to fine-tune the version that ships there."}
          </p>
        </div>

        {/* Preview */}
        <aside className="lg:col-span-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-3">
            Live preview
          </p>
          {selectedPlatforms.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border-strong bg-background-elev px-6 py-10 text-center text-[13px] text-ink/55">
              Pick a channel to see the preview.
            </div>
          ) : activePlatform ? (
            <PreviewCard
              platform={activePlatform}
              author={author}
              content={effectiveContent(activePlatform.id)}
            />
          ) : (
            <div className="space-y-4">
              {selectedPlatforms.map((p) => (
                <PreviewCard
                  key={p.id}
                  platform={p}
                  author={author}
                  content={effectiveContent(p.id)}
                />
              ))}
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
  dot,
  warn,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  dot?: boolean;
  warn?: boolean;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center gap-1.5 h-8 px-3 rounded-full border text-[12.5px] font-medium transition-colors",
        active
          ? "bg-ink text-background border-ink"
          : "bg-background-elev text-ink/70 border-border-strong hover:border-ink hover:text-ink",
      )}
    >
      {children}
      {warn ? (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full bg-primary-deep"
          aria-label="Over limit"
        />
      ) : dot ? (
        <span
          className={cn(
            "inline-block w-1.5 h-1.5 rounded-full",
            active ? "bg-background" : "bg-primary",
          )}
          aria-label="Customized"
        />
      ) : null}
    </button>
  );
}

function CharCounter({
  length,
  limit,
  tightestPlatforms,
}: {
  length: number;
  limit: number;
  tightestPlatforms: string[];
}) {
  const over = length > limit;
  const hasFiniteLimit = Number.isFinite(limit);
  return (
    <div className="flex items-center gap-2 text-[12px]">
      <span
        className={cn(
          "tabular-nums font-medium",
          over ? "text-primary-deep" : "text-ink/60",
        )}
      >
        {length}
        {hasFiniteLimit ? ` / ${limit}` : ""}
      </span>
      {tightestPlatforms.length > 0 ? (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary-deep">
          <AlertCircle className="w-3 h-3" />
          Too long for {tightestPlatforms.join(", ")}
        </span>
      ) : null}
    </div>
  );
}

function SchedulePopover({
  scheduledAt,
  setScheduledAt,
  open,
  setOpen,
  onConfirm,
  disabled,
  busy,
  timezone,
}: {
  scheduledAt: string;
  setScheduledAt: (v: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  onConfirm: () => void;
  disabled: boolean;
  busy: boolean;
  timezone: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  const preview = scheduledAt
    ? new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(scheduledAt))
    : "Schedule";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex items-center gap-1.5 h-11 px-5 rounded-full border text-[14px] font-medium transition-colors",
          scheduledAt
            ? "bg-peach-100 border-ink/20 text-ink"
            : "bg-background-elev border-border-strong text-ink hover:border-ink",
        )}
      >
        <CalendarClock className="w-4 h-4" />
        {preview}
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-[320px] rounded-2xl border border-border-strong bg-background-elev shadow-[0_18px_48px_-24px_rgba(26,22,18,0.25)] p-5 z-50">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            Schedule
          </p>
          <p className="mt-1 text-[12.5px] text-ink/60 leading-[1.5]">
            Your timezone: <span className="text-ink">{timezone}</span>
          </p>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
            className="mt-4 w-full h-11 px-3.5 rounded-xl bg-background border border-border-strong text-[14px] text-ink focus:outline-none focus:border-ink transition-colors"
          />
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setScheduledAt("");
                setOpen(false);
              }}
              className="flex-1 h-10 rounded-full text-[13px] text-ink/70 hover:text-ink transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={disabled || !scheduledAt}
              className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary disabled:opacity-40 disabled:hover:bg-ink transition-colors"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Schedule
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
